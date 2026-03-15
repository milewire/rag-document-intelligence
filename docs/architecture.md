# RAG Document Intelligence — Architecture

## Overview

RAG Document Intelligence is a retrieval-augmented generation (RAG) application that ingests documents (PDF, DOCX, XLSX, PPTX), chunks and embeds them, stores vectors in MongoDB Atlas, and answers natural-language questions using Claude with retrieved context.

## High-Level Flow

```
┌─────────────┐     upload      ┌──────────────┐     ingest      ┌─────────────┐
│   Frontend  │ ───────────────► │   Backend    │ ───────────────►│  Ingest     │
│  (browser)  │                  │  (FastAPI)   │                 │  (extract,  │
└─────────────┘                  └──────────────┘                 │   chunk)    │
       │                                  │                        └──────┬──────┘
       │ query                            │                               │
       ▼                                  ▼                        ┌──────▼──────┐
┌─────────────┐                  ┌──────────────┐                  │   Embed     │
│   /query    │ ◄────────────────│  Retrieve    │ ◄────────────────│ (sentence-  │
│   (Claude)  │   top-k chunks   │  (cosine     │   chunks +       │  transformers│
└─────────────┘                  │   similarity)│   embeddings     │  + MongoDB)  │
                                 └──────┬──────┘                  └─────────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ MongoDB Atlas│
                                 │ (chunks +    │
                                 │  vectors)    │
                                 └──────────────┘
```

## Components

### Backend (`backend/`)

- **FastAPI** app in `backend/src/main.py`: serves API routes only; GET `/` returns API info (JSON).
- **Ingest** (`ingest.py`): text extraction (PyMuPDF, python-docx, openpyxl, python-pptx) and chunking (configurable size/overlap).
- **Embed** (`embed.py`): sentence-transformers (`all-MiniLM-L6-v2`), MongoDB connection (TLS via certifi), store/list/delete documents.
- **Retrieve** (`retrieve.py`): embed query, cosine similarity over stored vectors, call Anthropic Claude Sonnet 4.5 with top-k context.

Optional future structure: `api/` (routes), `services/` (business logic), `models/`, `schemas/` are present as placeholders.

### Frontend (`frontend/`)

- **Next.js** App Router app: run with `npm run dev` in `frontend/`; use the API client (`frontend/lib/api.ts`) with base URL `http://localhost:8000` to talk to the backend.

### Infrastructure (`infrastructure/`)

- **nginx/**: reverse proxy / static config (placeholder).
- **scripts/**: deployment or utility scripts (placeholder).

### Data

- **MongoDB Atlas**: one collection; each document has `file_name`, `chunk_index`, `content`, `embedding` (list of floats), `created_at`.
- **Uploads**: files saved under `backend/uploads/` during ingest (git-ignored).

## Security and Configuration

- Secrets in `backend/.env` (MONGODB_URI, ANTHROPIC_API_KEY, DB_NAME, COLLECTION_NAME); optional OPENSSL_CONF for Windows TLS.
- CORS is permissive for development; tighten for production.
- MongoDB Atlas Network Access must allow the app’s IP (dev machine or VPS).

## Running

- **Backend:** From `backend/`, run `uvicorn src.main:app --reload` (port 8000). GET `/` returns JSON; use `/docs` for Swagger.
- **Frontend:** From `frontend/`, run `npm run dev` (e.g. port 3000); configure API base URL to `http://localhost:8000` if needed.

See [README.md](../README.md) for setup and API details.
