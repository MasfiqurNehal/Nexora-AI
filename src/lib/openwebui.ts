export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

export type OpenWebUIFileRef = {
  type: "file" | "collection";
  id: string;
  name?: string;
  status?: string;
  mime?: string;
};

export type NexoraMode = "chat" | "research" | "creative";

export type NexoraConfig = {
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
  toolIds: string[];
};

export function getOpenWebUIConfig(): NexoraConfig {
  const baseUrl = process.env.NEXORA_OPENWEBUI_URL?.replace(/\/+$/, "") ?? "";
  const apiKey = process.env.NEXORA_OPENWEBUI_API_KEY ?? "";
  const defaultModel = process.env.NEXORA_MODEL?.trim() || undefined;
  const toolIds =
    process.env.NEXORA_OPENWEBUI_TOOL_IDS?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];

  if (!baseUrl || !apiKey) {
    throw new Error("Nexora AI is missing NEXORA_OPENWEBUI_URL or NEXORA_OPENWEBUI_API_KEY.");
  }

  return { baseUrl, apiKey, defaultModel, toolIds };
}

export function authHeaders(config: NexoraConfig) {
  return {
    Authorization: `Bearer ${config.apiKey}`
  };
}

export function createSystemPrompt(mode: NexoraMode, attachedFiles: OpenWebUIFileRef[]) {
  const fileNames = attachedFiles
    .map((file) => file.name)
    .filter(Boolean)
    .join(", ");

  const shared =
    "You are Nexora AI, a polished and practical AI workspace for chat, document analysis, image reasoning, and research. Be direct, warm, and helpful. When files are attached, ground the answer in the attached sources and clearly call out uncertainty.";

  const sourceLine = fileNames
    ? `Attached sources for this conversation: ${fileNames}.`
    : "No files are currently attached.";

  if (mode === "research") {
    return `${shared} ${sourceLine} Use a research-first style: clarify the answer, compare evidence, list assumptions, and provide concise next steps. If the user asks for a report, include headings and cite attached filenames when relevant.`;
  }

  if (mode === "creative") {
    return `${shared} ${sourceLine} Keep the work imaginative but usable. Offer strong drafts, alternatives, and refinements without becoming verbose.`;
  }

  return `${shared} ${sourceLine} Answer naturally, organize complex responses, and keep routine answers compact.`;
}

export function normalizeModelList(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const maybeData =
    "data" in payload
      ? (payload as { data?: unknown }).data
      : "models" in payload
        ? (payload as { models?: unknown }).models
        : payload;
  const models = Array.isArray(maybeData) ? maybeData : [];

  return models
    .map((model) => {
      if (!model || typeof model !== "object") {
        return null;
      }

      const item = model as Record<string, unknown>;
      const id = typeof item.id === "string" ? item.id : undefined;
      const name =
        typeof item.name === "string"
          ? item.name
          : typeof item.model === "string"
            ? item.model
            : id;

      if (!id) {
        return null;
      }

      return {
        id,
        name: name ?? id,
        ownedBy:
        typeof item.owned_by === "string"
          ? item.owned_by
          : typeof item.provider === "string"
            ? item.provider
            : undefined
      };
    })
    .filter(Boolean);
}

export async function fetchOpenWebUIModels(config: NexoraConfig) {
  const response = await fetch(`${config.baseUrl}/v1/models`, {
    headers: authHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await safeResponseText(response);
    throw new Error(`Unable to load models (${response.status}): ${message}`);
  }

  return normalizeModelList(await response.json());
}

export async function resolveModel(config: NexoraConfig, requestedModel?: string) {
  if (requestedModel?.trim()) {
    return requestedModel.trim();
  }

  if (config.defaultModel) {
    return config.defaultModel;
  }

  const models = await fetchOpenWebUIModels(config);
  const first = models[0] as { id?: string } | undefined;

  if (!first?.id) {
    throw new Error("No model was selected and no Open WebUI models were returned.");
  }

  return first.id;
}

export async function safeResponseText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 1200) || response.statusText;
  } catch {
    return response.statusText;
  }
}
