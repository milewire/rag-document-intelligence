# RAG Document Intelligence

A Retrieval-Augmented Generation (RAG) API that lets you upload documents and query them using AI. Documents are chunked, embedded, and stored in MongoDB Atlas. Queries are answered by Claude (Anthropic) using the most relevant retrieved chunks.

## Features

- **Backend:** FastAPI REST API; upload documents (PDF, DOCX, XLSX, PPTX), list/delete by filename, query via natural language.
- **Ingest:** Text extraction (PyMuPDF, python-docx, openpyxl, python-pptx), chunking (500 words, 50 overlap), embedding with `sentence-transformers` (`all-MiniLM-L6-v2`), storage in MongoDB Atlas.
- **Search:** Vector similarity over stored chunks, then Claude Sonnet 4.5 (Anthropic) to generate answers. All errors return JSON.
- **Frontend (Next.js):** Dashboard (stats, backend status, quick links), Search (knowledge base + “what’s indexed”), Documents (upload, list, delete), Runbooks (your uploaded documents as runbooks). Dark mode toggle in header.
- Interactive API docs at `/docs` (Swagger UI).

## Project Structure

```text
rag-document-intelligence/
├── backend/
│   ├── src/
│   │   ├── main.py           # FastAPI app and routes
│   │   ├── db.py              # MongoDB connection (DB_NAME, COLLECTION_NAME from env)
│   │   ├── ingest.py          # Text extraction and chunking
│   │   ├── embed.py           # Embedding and MongoDB storage
│   │   ├── retrieve.py        # Vector search and Claude response
│   │   ├── api/, services/, models/, schemas/
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                   # Git-ignored; copy from .env.example
├── frontend/
│   ├── app/(app)/             # Next.js App Router
│   │   ├── page.tsx           # Redirects to /dashboard
│   │   ├── dashboard/         # Stats, backend status, quick actions, KB list
│   │   ├── search/            # Query knowledge base; shows indexed docs
│   │   ├── documents/         # Upload, list, delete documents
│   │   └── runbooks/          # Your uploaded documents as runbooks
│   ├── components/
│   ├── lib/                   # api.ts (backend client), utils, data types
│   └── package.json
├── infrastructure/
│   ├── nginx/
│   └── scripts/
├── docs/
│   ├── architecture.md
│   └── audit-mongodb.md       # Page-by-page MongoDB usage audit
└── README.md
```

## Setup

### 1. Clone and create a virtual environment

```bash
git clone <your-repo-url>
cd rag-document-intelligence
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux
```

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

Backend uses pinned versions for sentence-transformers/PyTorch 2.1 compatibility.

### 3. Configure environment variables

Create `backend/.env` (e.g. copy from `backend/.env.example`, or copy your existing root `.env` into `backend/.env`):

```env
MONGODB_URI=your_mongodb_atlas_connection_string
ANTHROPIC_API_KEY=your_anthropic_api_key
DB_NAME=rag_intelligence
COLLECTION_NAME=documents
```

Optional (Windows TLS): if you see MongoDB SSL handshake errors, add:

```env
OPENSSL_CONF=openssl.cnf
```

If using `OPENSSL_CONF`, place `openssl.cnf` in the **backend** directory or set the path in `.env` relative to the backend folder.

### 4. MongoDB Atlas Network Access

Your app must connect from an IP that Atlas allows. In [MongoDB Atlas](https://cloud.mongodb.com) → **Network Access** → **Add IP Address**:

- **Local development:** Add your current IP (or “Add Current IP Address”), or **Allow Access from Anywhere** (`0.0.0.0/0`) for dev only.
- **Production (e.g. VPS):** Add the server’s public IP (e.g. `curl ifconfig.me` on the server).

### 5. Run the server

From the **backend** directory (so `src` resolves correctly):

```bash
cd backend
uvicorn src.main:app --reload
```

- **API root:** <http://localhost:8000/> (JSON)
- **Health:** <http://localhost:8000/health>
- **API docs:** <http://localhost:8000/docs>

The `backend/uploads/` directory is created automatically on first run.

### 6. Run the frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. The app expects the backend at <http://localhost:8000> (see `frontend/lib/api.ts`). Root (`/`) redirects to **Dashboard**; use **Documents** to upload files, then **Search** to query them. **Runbooks** lists your uploaded documents so you can open one and jump to Search.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/` | API info (JSON) |
| GET | `/health` | Health check |
| POST | `/upload` | Upload and ingest a document |
| POST | `/query` | Query documents using natural language |
| GET | `/documents` | List documents with chunk counts |
| DELETE | `/documents/{filename}` | Remove all chunks for a document |
| GET | `/docs` | Swagger UI (interactive API docs) |

- **GET /documents** returns `{ "documents": [{ "filename": "...", "chunk_count": N }, ...], "count": N }`.
- **POST /upload** and **DELETE /documents/{filename}** always respond with JSON (including errors).

### Upload a document

```bash
curl -X POST "http://localhost:8000/upload" -F "file=@your_document.pdf"
```

### Query documents

```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the key findings?", "top_k": 5}'
```

### Delete a document

```bash
curl -X DELETE "http://localhost:8000/documents/your_document.pdf"
```

Use URL-encoding for filenames with spaces or special characters (e.g. `My%20file.pdf`).

## How It Works

1. **Ingest** — `ingest.py` extracts raw text from uploaded files using PyMuPDF, python-docx, openpyxl, and python-pptx.
2. **Embed** — `embed.py` splits text into overlapping chunks (500 words, 50-word overlap) and generates vector embeddings using `all-MiniLM-L6-v2` from `sentence-transformers`. Chunks and embeddings are stored in MongoDB Atlas (TLS via certifi).
3. **Retrieve** — `retrieve.py` embeds the user’s query, computes cosine similarity against stored chunks, and passes the top-k results to Claude as context.
4. **Generate** — Claude Sonnet 4.5 synthesises a grounded answer from the retrieved document chunks.

## Deployment (e.g. VPS)

1. Push code to GitHub and pull on the server.
2. **Backend:** Create `backend/.env`, install dependencies in `backend/`, run from `backend/`: `uvicorn src.main:app --host 0.0.0.0 --port 8000` (or use a process manager).
3. **Frontend:** In `frontend/`, set the API base URL (e.g. in `lib/api.ts` or via env) to your backend URL, then build and serve (e.g. `npm run build` and a static/server host).
4. In MongoDB Atlas **Network Access**, add the server’s public IP.

## Tech Stack

- **Backend:** FastAPI, sentence-transformers (`all-MiniLM-L6-v2`), MongoDB Atlas (vector store), Anthropic Claude Sonnet 4.5, PyMuPDF / python-docx / openpyxl / python-pptx, certifi (TLS).
- **Frontend:** Next.js (App Router), React, Tailwind CSS.

For architecture details see [docs/architecture.md](docs/architecture.md). For which pages use MongoDB see [docs/audit-mongodb.md](docs/audit-mongodb.md).
