# Nexora AI

A fast, private AI workspace for chat, document analysis, image reasoning, and structured research — built with Next.js 15 and React 19.

**Live demo:** [https://www.masfiqurnehal.com/](https://www.masfiqurnehal.com/)

---

## Features

- **Chat / Research / Creative modes** — switch to match the task
- **File uploads** — PDF, DOCX, TXT, CSV, JSON, images (up to 25 MB each)
- **Image reasoning** — send screenshots or photos inline
- **Multi-model** — pick any model exposed by your OpenAI-compatible backend
- **Private by design** — API keys live server-side; the browser never sees them
- **Animated landing page** — gradient hero, capability cards, "How it works" section

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Lucide icons, react-markdown |
| Styling | Plain CSS (no Tailwind) |
| PDF parsing | pdf-parse |
| DOCX parsing | mammoth |
| AI backend | Any OpenAI-compatible API |

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
NEXORA_OPENWEBUI_URL=https://your-openai-compatible-api.com
NEXORA_OPENWEBUI_API_KEY=your-key-here
NEXORA_MODEL=                    # optional — auto-selects first model if empty
NEXORA_OPENWEBUI_TOOL_IDS=       # optional — comma-separated tool IDs
```

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Full landing page + chat UI
│   ├── layout.tsx            # Root layout & metadata
│   ├── globals.css           # All styles
│   └── api/
│       ├── chat/route.ts     # POST /api/chat — file extraction + LLM call
│       └── models/route.ts   # GET /api/models — model list
└── lib/
    └── openwebui.ts          # Config, auth helpers, prompt builder
```

---

## Author

**Md. Masfiqur Rahman Nehal**
[masfiqurnehal.com](https://www.masfiqurnehal.com/)
