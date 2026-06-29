"use client";

import {
  ArrowRight,
  BarChart2,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Menu,
  Mic,
  PanelRightOpen,
  Paperclip,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap
} from "lucide-react";
import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Mode = "chat" | "research" | "creative";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
};

type ModelOption = {
  id: string;
  name: string;
  ownedBy?: string;
};

type KnowledgeFile = {
  type: "file" | "collection";
  id: string;
  name?: string;
  status?: string;
  mime?: string;
};

const starterPrompts = [
  "Summarize this PDF for a decision meeting.",
  "Compare these documents and find contradictions.",
  "Turn my rough idea into a polished launch plan.",
  "Analyze this image and explain what matters."
];

const modes: Array<{ id: Mode; label: string; icon: React.ElementType }> = [
  { id: "chat", label: "Chat", icon: Bot },
  { id: "research", label: "Research", icon: Search },
  { id: "creative", label: "Creative", icon: Sparkles }
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let frame = 0;
    let animationId = 0;
    let pointerX = 0.52;
    let pointerY = 0.4;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.offsetWidth * ratio);
      canvas.height = Math.floor(canvas.offsetHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const handlePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width;
      pointerY = (event.clientY - rect.top) / rect.height;
    };

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      frame += 0.008;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#08090d";
      context.fillRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(62, 211, 170, 0.24)");
      gradient.addColorStop(0.42, "rgba(247, 201, 72, 0.14)");
      gradient.addColorStop(0.7, "rgba(255, 107, 87, 0.15)");
      gradient.addColorStop(1, "rgba(77, 139, 255, 0.16)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(255, 255, 255, 0.08)";
      context.lineWidth = 1;
      const gap = Math.max(54, width / 18);
      for (let x = -gap; x < width + gap; x += gap) {
        context.beginPath();
        context.moveTo(x + Math.sin(frame + x * 0.01) * 10, 0);
        context.lineTo(x + Math.cos(frame + x * 0.01) * 18, height);
        context.stroke();
      }
      for (let y = -gap; y < height + gap; y += gap) {
        context.beginPath();
        context.moveTo(0, y + Math.cos(frame + y * 0.01) * 12);
        context.lineTo(width, y + Math.sin(frame + y * 0.01) * 18);
        context.stroke();
      }

      const lanes = 7;
      for (let lane = 0; lane < lanes; lane += 1) {
        const y = height * (0.18 + lane * 0.105);
        const phase = frame * (1 + lane * 0.12) + lane;
        context.beginPath();
        for (let x = -40; x <= width + 40; x += 18) {
          const influence = 1 - Math.min(1, Math.abs(pointerX * width - x) / width);
          const wave =
            Math.sin(x * 0.008 + phase) * (22 + lane * 2) +
            Math.cos(x * 0.014 - phase) * 10 +
            (pointerY - 0.5) * 42 * influence;
          if (x === -40) {
            context.moveTo(x, y + wave);
          } else {
            context.lineTo(x, y + wave);
          }
        }
        context.strokeStyle =
          lane % 3 === 0
            ? "rgba(62, 211, 170, 0.42)"
            : lane % 3 === 1
              ? "rgba(247, 201, 72, 0.28)"
              : "rgba(255, 107, 87, 0.3)";
        context.lineWidth = lane % 2 === 0 ? 1.6 : 1;
        context.stroke();
      }

      context.fillStyle = "rgba(255, 255, 255, 0.78)";
      for (let i = 0; i < 50; i += 1) {
        const x = ((i * 97 + frame * 280) % (width + 120)) - 60;
        const y = height * (0.12 + ((i * 37) % 76) / 100);
        const size = 1 + ((i * 13) % 3);
        context.globalAlpha = 0.22 + ((i * 17) % 40) / 100;
        context.fillRect(x, y, size, size);
      }
      context.globalAlpha = 1;

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", handlePointer);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-field" aria-hidden="true" />;
}

function AttachmentIcon({ file }: { file: File | KnowledgeFile }) {
  const isLocalFile = "size" in file;
  const name = file.name ?? "";
  const mime = isLocalFile ? file.type : file.mime ?? "";
  const isImage = mime.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);

  if (isImage) {
    return <ImageIcon size={16} />;
  }

  return <FileText size={16} />;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I am Nexora AI. Bring a question, a document, or an image and I will help you work through it."
    }
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [mode, setMode] = useState<Mode>("research");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activeMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch("/api/models");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load models.");
        }

        setModels(payload.models ?? []);
        setSelectedModel(payload.defaultModel ?? payload.models?.[0]?.id ?? "");
      } catch (modelError) {
        setError(modelError instanceof Error ? modelError.message : "Unable to load models.");
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const addFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    setAttachments((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}`));
      const fresh = nextFiles.filter((file) => !existing.has(`${file.name}-${file.size}`));
      return [...current, ...fresh].slice(0, 8);
    });
  };

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, prompt?: string) => {
    event?.preventDefault();
    const content = (prompt ?? input).trim();

    if (!content || isSending) {
      return;
    }

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content,
      attachments: attachments.map((file) => file.name)
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsSending(true);

    const filesForRequest = attachments;
    setAttachments([]);

    try {
      const formData = new FormData();
      formData.append(
        "messages",
        JSON.stringify(nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })))
      );
      formData.append("mode", mode);
      formData.append("model", selectedModel);
      formData.append("fileReferences", JSON.stringify(knowledgeFiles));
      filesForRequest.forEach((file) => formData.append("files", file, file.name));

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Nexora could not answer right now.");
      }

      setKnowledgeFiles(payload.files ?? knowledgeFiles);
      setSelectedModel(payload.model ?? selectedModel);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: payload.answer
        }
      ]);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Something went wrong.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: `I could not complete that request: ${message}`
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: createId(),
        role: "assistant",
        content: "Fresh workspace ready. What should we explore next?"
      }
    ]);
    setKnowledgeFiles([]);
    setAttachments([]);
    setError("");
  };

  return (
    <main className="site-shell">
      <section className="hero" id="top">
        <SignalField />
        <header className="nav">
          <a href="#top" className="brand" aria-label="Nexora AI home">
            <span className="brand-mark">
              <BrainCircuit size={20} />
            </span>
            <span>Nexora AI</span>
          </a>

          <button
            className="icon-button mobile-menu"
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>

          <nav className={isMenuOpen ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
            <a href="#workspace">Workspace</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#security">Security</a>
          </nav>

          <div className="nav-actions">
            <div className="model-select">
              <Zap size={15} />
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                aria-label="Select AI model"
              >
                {selectedModel && models.length === 0 ? (
                  <option value={selectedModel}>{selectedModel}</option>
                ) : null}
                {models.length === 0 ? <option value="">Auto model</option> : null}
                {models.map((model) => (
                  <option value={model.id} key={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <a className="nav-cta" href="#workspace">
              Launch <ArrowRight size={15} />
            </a>
          </div>
        </header>

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-pulse" />
              <Sparkles size={14} />
              Private AI workspace — Chat · Research · Creative
            </div>
            <h1 className="hero-title">Nexora AI</h1>
            <p>
              A fast, private assistant for chat, documents, images, and structured research — all in one workspace.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#workspace">
                Start exploring <ArrowRight size={18} />
              </a>
              <button
                className="secondary-link"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload file <Upload size={18} />
              </button>
            </div>
            <div className="hero-metrics" aria-label="Nexora highlights">
              <span>
                <strong>PDF</strong>
                ready
              </span>
              <span>
                <strong>DOC</strong>
                ready
              </span>
              <span>
                <strong>Image</strong>
                aware
              </span>
            </div>
          </div>

          <section className="chat-preview" id="workspace" aria-label="Nexora AI workspace">
            <div className="workspace-topbar">
              <div>
                <p className="label">Live workspace</p>
                <h2>{activeMode.label} with Nexora</h2>
              </div>
              <button className="icon-button" type="button" onClick={resetChat} aria-label="Reset chat">
                <RefreshCcw size={18} />
              </button>
            </div>

            <div className="mode-switch" role="tablist" aria-label="Nexora mode">
              {modes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={mode === item.id ? "mode-pill active" : "mode-pill"}
                    onClick={() => setMode(item.id)}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div
              className="conversation"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                addFiles(event.dataTransfer.files);
              }}
            >
              {isDragging ? (
                <div className="drop-layer">
                  <Upload size={26} />
                  <span>Drop files for Nexora</span>
                </div>
              ) : null}

              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-avatar">
                    {message.role === "assistant" ? <BrainCircuit size={17} /> : <span>You</span>}
                  </div>
                  <div className="message-body">
                    {message.attachments?.length ? (
                      <div className="message-files">
                        {message.attachments.map((name) => (
                          <span key={name}>
                            <Paperclip size={13} />
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                </article>
              ))}

              {isSending ? (
                <article className="message assistant">
                  <div className="message-avatar">
                    <BrainCircuit size={17} />
                  </div>
                  <div className="message-body typing">
                    <Loader2 size={16} />
                    Nexora is thinking
                  </div>
                </article>
              ) : null}
              <div ref={chatEndRef} />
            </div>

            {error ? <p className="error-line">{error}</p> : null}

            <div className="starter-row">
              {starterPrompts.map((prompt) => (
                <button type="button" key={prompt} onClick={() => sendMessage(undefined, prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <form className="composer" onSubmit={sendMessage}>
              <input
                ref={fileInputRef}
                className="file-input"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.ppt,.pptx,.xls,.xlsx,image/*"
                onChange={(event) => {
                  if (event.target.files) {
                    addFiles(event.target.files);
                  }
                  event.currentTarget.value = "";
                }}
              />

              {attachments.length > 0 ? (
                <div className="attachment-row">
                  {attachments.map((file) => (
                    <span className="attachment-chip" key={`${file.name}-${file.size}`}>
                      <AttachmentIcon file={file} />
                      <span>{file.name}</span>
                      <em>{formatBytes(file.size)}</em>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((current) => current.filter((item) => item !== file))
                        }
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="composer-main">
                <button
                  type="button"
                  className="composer-tool"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach files"
                >
                  <Paperclip size={20} />
                </button>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask Nexora anything..."
                  rows={1}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button type="button" className="composer-tool muted" aria-label="Voice input">
                  <Mic size={20} />
                </button>
                <button className="send-button" type="submit" disabled={isSending || !input.trim()}>
                  {isSending ? <Loader2 size={19} /> : <Send size={19} />}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      <section className="capability-band" id="capabilities">
        <div className="section-intro">
          <p className="label">One workspace</p>
          <h2>Everything you need, nothing you don't</h2>
          <p className="section-sub">Chat, analyze, compare, and create without switching tools.</p>
        </div>
        <div className="capability-grid">
          <article>
            <div className="feature-icon"><FileText size={22} /></div>
            <h3>Document research</h3>
            <p>Upload PDFs, DOCX files, spreadsheets, and notes for grounded, cited answers.</p>
          </article>
          <article>
            <div className="feature-icon"><ImageIcon size={22} /></div>
            <h3>Image reasoning</h3>
            <p>Bring screenshots, diagrams, charts, and photos into the conversation for visual analysis.</p>
          </article>
          <article>
            <div className="feature-icon"><PanelRightOpen size={22} /></div>
            <h3>Adaptive modes</h3>
            <p>Switch between Chat, Research, and Creative modes to match the task at hand.</p>
          </article>
          <article>
            <div className="feature-icon"><BarChart2 size={22} /></div>
            <h3>Data & spreadsheets</h3>
            <p>Feed CSV, XLSX, and JSON files to surface trends, summaries, and patterns instantly.</p>
          </article>
          <article>
            <div className="feature-icon"><Zap size={22} /></div>
            <h3>Multi-model choice</h3>
            <p>Pick the right AI for the job — fast answers, deep reasoning, or creative generation.</p>
          </article>
          <article>
            <div className="feature-icon"><ShieldCheck size={22} /></div>
            <h3>Private by design</h3>
            <p>API keys stay server-side. Your files and conversations never leave the workspace.</p>
          </article>
        </div>
      </section>

      <section className="how-it-works">
        <div className="how-inner">
          <p className="label">Simple by design</p>
          <h2>Three steps to smarter answers</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <Upload size={26} className="step-icon" />
              <h3>Upload your files</h3>
              <p>Drop in PDFs, DOCX, images, or spreadsheets. Nexora extracts and understands the content instantly.</p>
            </div>
            <div className="step-arrow" aria-hidden="true">
              <ChevronRight size={28} />
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <Sparkles size={26} className="step-icon" />
              <h3>Choose your mode</h3>
              <p>Switch between Chat for quick answers, Research for deep dives, or Creative for drafts and ideas.</p>
            </div>
            <div className="step-arrow" aria-hidden="true">
              <ChevronRight size={28} />
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <BrainCircuit size={26} className="step-icon" />
              <h3>Get grounded answers</h3>
              <p>Nexora reads your documents and responds with answers grounded in the files you uploaded.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="research-dock" id="security">
        <div className="dock-copy">
          <p className="label">Connected to Betopia AI</p>
          <h2>Server-side keys, file-aware prompts, and model choice built in.</h2>
          <p>
            Nexora keeps provider credentials on the server while the browser talks only to local
            API routes.
          </p>
        </div>
        <div className="source-panel">
          <div className="source-head">
            <ShieldCheck size={20} />
            <span>Workspace sources</span>
          </div>
          {knowledgeFiles.length > 0 ? (
            <div className="source-list">
              {knowledgeFiles.map((file) => (
                <div className="source-item" key={file.id}>
                  <AttachmentIcon file={file} />
                  <span>{file.name ?? file.id}</span>
                  <em>{file.status ?? "ready"}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-sources">
              <Plus size={18} />
              <span>Sources appear here after upload.</span>
            </div>
          )}
          <div className="source-checks">
            <span><Check size={15} />API key hidden</span>
            <span><Check size={15} />Files extracted server-side</span>
            <span><Check size={15} />Model list synced</span>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-inner">
          <p className="label">Get started today</p>
          <h2>Ready to work smarter?</h2>
          <p>Bring your questions, documents, and ideas. Nexora does the heavy lifting.</p>
          <a className="primary-link" href="#workspace">
            Launch workspace <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-glow" aria-hidden="true" />
        <div className="footer-inner">
          <div className="footer-brand">
            <a href="#top" className="brand" aria-label="Nexora AI home">
              <span className="brand-mark"><BrainCircuit size={20} /></span>
              <span>Nexora AI</span>
            </a>
            <p>A fast, private AI workspace for chat, document analysis, image reasoning, and structured research.</p>
            <div className="footer-badges">
              <span><ShieldCheck size={13} /> Private</span>
              <span><Zap size={13} /> Fast</span>
              <span><BrainCircuit size={13} /> Multimodal</span>
            </div>
          </div>

          <div className="footer-links-col">
            <strong>Navigate</strong>
            <a href="#workspace">Workspace</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#security">Security</a>
            <a href="#top">Back to top</a>
          </div>

          <div className="footer-creator-col">
            <strong>Made by</strong>
            <a
              href="https://www.masfiqurnehal.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="creator-card"
            >
              <div className="creator-avatar"><BrainCircuit size={22} /></div>
              <div className="creator-info">
                <span className="creator-name">Md. Masfiqur Rahman Nehal</span>
                <em>Full-stack Developer</em>
              </div>
              <ExternalLink size={15} className="creator-ext" />
            </a>
            <a
              href="https://www.masfiqurnehal.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="portfolio-btn"
            >
              View Portfolio <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Nexora AI. All rights reserved.</span>
          <span className="footer-sep" aria-hidden="true">·</span>
          <span>
            Crafted with care by{" "}
            <a
              href="https://www.masfiqurnehal.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="creator-link"
            >
              Md. Masfiqur Rahman Nehal
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
