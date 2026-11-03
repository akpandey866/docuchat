# DocuChat — Chat With Your Documents

Upload PDFs, Markdown or text files and ask questions in plain English. DocuChat answers **only from your documents** and shows **numbered citations down to the page or section**, so every answer can be checked.

**Live demo:** _coming soon_ · **Built by:** [TechGenisys](https://techgenisys.com)

<!-- Add a screenshot or GIF here: ![DocuChat demo](docs/demo.gif) -->

## Features

- **Grounded answers with citations** — every claim links to the exact page (PDF) or section (Markdown) it came from; click a citation to see the source text and match score.
- **PDF, Markdown and TXT** — parsed page by page, split into overlapping chunks, embedded and stored in Postgres + pgvector.
- **Honest "I don't know"** — if the documents don't contain the answer, it says so instead of guessing. Prompt-injection text inside documents is ignored.
- **Streaming responses** with the Vercel AI SDK and Google Gemini.
- **Embeddable website widget** — add a chat bubble to any site with one `<script>` tag.
- **Try it instantly** — a sample company handbook is preloaded with suggested questions.
- **Safe public demo** — private per-visitor workspaces that auto-expire, plus per-IP daily limits for uploads and questions to keep API costs bounded.
- **Zero-step database setup** — tables and the vector index are created automatically on first run.

## How it works

```mermaid
flowchart LR
    subgraph Ingestion
      A[Upload PDF / MD / TXT] --> B[Extract text per page or section]
      B --> C[Chunk ~1000 chars with overlap]
      C --> D[Gemini embeddings<br/>768-dim]
      D --> E[(Postgres + pgvector<br/>HNSW index)]
    end
    subgraph Question answering
      Q[User question] --> QE[Embed question]
      QE --> S[Top-k cosine search<br/>scoped to workspace]
      E --> S
      S --> P[Prompt with numbered sources]
      P --> G[Gemini streams answer<br/>with citations]
    end
```

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| AI | Vercel AI SDK v7 · Google Gemini (chat + `gemini-embedding-001`) |
| Vector store | PostgreSQL + pgvector (HNSW, cosine distance) |
| PDF parsing | unpdf (serverless-friendly PDF.js) |
| Infra | Vercel + Neon, Docker Compose for local Postgres, GitHub Actions CI |

## Quick start

**Requirements:** Node.js 20.9+, a [Google AI Studio API key](https://aistudio.google.com/apikey), and Postgres with pgvector (Docker or a free [Neon](https://neon.tech) database).

```bash
git clone https://github.com/<your-username>/docuchat.git
cd docuchat
npm install

cp .env.example .env.local      # then fill in the two required values

# Option A — local Postgres with pgvector
docker compose up -d
# DATABASE_URL=postgres://docuchat:docuchat@localhost:5432/docuchat

# Option B — Neon: create a project and paste its connection string as DATABASE_URL

npm run dev
```

Open http://localhost:3000. On first request DocuChat creates its tables and indexes the sample handbook.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add a Postgres database: **Storage → Neon** (the free tier is enough), or paste any pgvector-enabled `DATABASE_URL`.
3. Add `GOOGLE_GENERATIVE_AI_API_KEY` in **Settings → Environment Variables**.
4. Deploy. Set a budget or spending alert on your Google AI Studio project before sharing the link publicly.

## Embed the chat widget on any website

```html
<script
  src="https://your-docuchat-domain.com/widget.js"
  data-kb="KNOWLEDGE_BASE_ID"
  data-title="Ask Acme Support"
  data-color="#f97316"
  defer
></script>
```

`data-kb` is the workspace id whose documents the widget should answer from (returned by `GET /api/documents`). Omit it to use the sample handbook.

> In this demo, knowledge base ids act as unguessable public keys. For production, add per-tenant API keys and an allowed-origins list — see the roadmap.

## Configuration

All settings are environment variables — see [`.env.example`](.env.example).

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_CHAT_MODEL` | `gemini-flash-latest` | Model used for answers |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Embedding model (stored at 768 dimensions) |
| `RETRIEVAL_TOP_K` | `6` | Chunks retrieved per question |
| `MAX_FILE_MB` / `MAX_PDF_PAGES` | `4` / `60` | Upload limits |
| `UPLOADS_PER_IP_PER_DAY` / `QUESTIONS_PER_IP_PER_DAY` | `10` / `40` | Demo cost guardrails |
| `WORKSPACE_TTL_HOURS` | `24` | When visitor uploads are deleted |

## Project structure

```
src/
  app/
    page.tsx                 # Main app: documents panel + chat
    embed/page.tsx           # Chat-only page used by the widget iframe
    api/chat/route.ts        # Retrieval + streaming answer with citations
    api/documents/...        # Upload, list and delete documents
  components/                # Chat, DocumentsPanel, MessageText
  lib/
    ingest.ts                # Parse → chunk → embed → store
    retrieve.ts              # Vector search with pgvector
    chunk.ts                 # Page/section-aware chunking
    db.ts                    # Postgres client + auto-created schema
    limits.ts, workspace.ts  # Demo guardrails and visitor workspaces
public/widget.js             # Embeddable chat bubble
```

## Roadmap

- OCR for scanned PDFs
- Hybrid search (keyword + vector) and re-ranking
- Accounts, team workspaces and per-tenant API keys for the widget
- Answer-quality evaluation suite
- Connectors: Google Drive, Notion, Confluence, websites

## Need this for your business?

I build production RAG assistants and AI agents — trained on your documents, integrated into your website, app or internal tools.

**Ankit Pandey** · [TechGenisys](https://techgenisys.com) · [LinkedIn](https://www.linkedin.com/in/ankitpandeydev) · contact@techgenisys.com

## License

[MIT](LICENSE)
