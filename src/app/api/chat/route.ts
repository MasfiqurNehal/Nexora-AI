import { NextResponse } from "next/server";

import {
  ChatMessage,
  NexoraMode,
  authHeaders,
  createSystemPrompt,
  getOpenWebUIConfig,
  resolveModel,
  safeResponseText
} from "@/lib/openwebui";

export const runtime = "nodejs";

const MAX_UPLOAD_MB = 25;
const MAX_HISTORY_MESSAGES = 18;
const MAX_EXTRACTED_CHARS = 80_000;

function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));
}

function parseMode(value: FormDataEntryValue | null): NexoraMode {
  return value === "research" || value === "creative" ? value : "chat";
}

function extractAnswer(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as Record<string, unknown>;
  const choices = Array.isArray(obj.choices) ? obj.choices : [];
  const first = choices[0] as Record<string, unknown> | undefined;
  const msg = first?.message as Record<string, unknown> | undefined;
  const content = msg?.content ?? first?.text ?? obj.response ?? obj.content;
  return typeof content === "string" ? content : "";
}

async function extractFileText(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();
  const mime = file.type;

  // PDF
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    try {
      // Use the internal module path to avoid pdf-parse's test runner code
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await pdfParse(buffer);
      return result.text?.trim() || null;
    } catch {
      return null;
    }
  }

  // DOCX / DOC
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() || null;
    } catch {
      return null;
    }
  }

  // Plain-text formats
  const textMimes = [
    "text/plain", "text/markdown", "text/csv", "text/html",
    "application/json", "application/xml", "text/xml"
  ];
  const textExts = /\.(txt|md|csv|json|xml|yaml|yml|log|py|js|ts|tsx|jsx|html|css|sh)$/i;
  if (textMimes.includes(mime) || textExts.test(name)) {
    try {
      return (await file.text()).trim() || null;
    } catch {
      return null;
    }
  }

  return null;
}

type MessagePart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function buildLastUserContent(
  files: File[],
  text: string
): Promise<string | MessagePart[]> {
  const extractedBlocks: string[] = [];
  const imageParts: MessagePart[] = [];

  await Promise.all(
    files.map(async (file) => {
      if (file.type.startsWith("image/") && file.size <= 6 * 1024 * 1024) {
        const buf = Buffer.from(await file.arrayBuffer());
        imageParts.push({
          type: "image_url",
          image_url: { url: `data:${file.type};base64,${buf.toString("base64")}` }
        });
      } else {
        const extracted = await extractFileText(file);
        if (extracted) {
          const truncated =
            extracted.length > MAX_EXTRACTED_CHARS
              ? extracted.slice(0, MAX_EXTRACTED_CHARS) + "\n[…truncated]"
              : extracted;
          extractedBlocks.push(
            `--- ${file.name} ---\n${truncated}\n--- end of ${file.name} ---`
          );
        }
      }
    })
  );

  const fullText =
    extractedBlocks.length > 0
      ? `${text}\n\n${extractedBlocks.join("\n\n")}`
      : text;

  if (imageParts.length === 0) return fullText;
  return [{ type: "text", text: fullText }, ...imageParts];
}

export async function POST(request: Request) {
  try {
    const config = getOpenWebUIConfig();
    const formData = await request.formData();
    const mode = parseMode(formData.get("mode"));
    const requestedModel =
      typeof formData.get("model") === "string" ? String(formData.get("model")) : "";
    const userMessages = parseJsonField<ChatMessage[]>(formData.get("messages"), []);
    const uploadFiles = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (userMessages.length === 0) {
      return NextResponse.json({ error: "No chat messages were provided." }, { status: 400 });
    }

    for (const file of uploadFiles) {
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `${file.name} is larger than ${MAX_UPLOAD_MB} MB.` },
          { status: 400 }
        );
      }
    }

    const messages = sanitizeMessages(userMessages);
    const last = messages[messages.length - 1];

    if (last?.role === "user" && uploadFiles.length > 0) {
      last.content = await buildLastUserContent(
        uploadFiles,
        typeof last.content === "string" ? last.content : ""
      );
    }

    const model = await resolveModel(config, requestedModel);
    const body: Record<string, unknown> = {
      model,
      stream: false,
      messages: [
        { role: "system", content: createSystemPrompt(mode, []) },
        ...messages
      ]
    };

    if (config.toolIds.length > 0) {
      body.tool_ids = config.toolIds;
    }

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { ...authHeaders(config), "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const msg = await safeResponseText(response);
      return NextResponse.json(
        { error: `The AI provider returned ${response.status}: ${msg}` },
        { status: response.status }
      );
    }

    const providerPayload = await response.json();
    const answer = extractAnswer(providerPayload);

    return NextResponse.json({
      answer: answer || "Nexora received an empty response from the selected model.",
      model,
      files: []
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nexora could not complete the request." },
      { status: 500 }
    );
  }
}
