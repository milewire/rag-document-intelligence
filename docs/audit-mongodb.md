# Site audit: pages and MongoDB functionality

## Backend ↔ MongoDB

| Backend route | Uses MongoDB? | Collection/operation |
| ------------- | ------------- | ------------------- |
| `GET /` | No | — |
| `GET /health` | No | — |
| `POST /upload` | Yes | `documents`: `insert_one` per chunk (via `embed_and_store`) |
| `POST /query` | Yes | `documents`: `find` + cosine similarity, then Anthropic |
| `GET /documents` | Yes | `documents`: aggregation `$group` by `file_name` |
| `DELETE /documents/{filename}` | Yes | `documents`: `delete_many({ "file_name": filename })` |

Database and collection names come from env: `DB_NAME` (default `rag_intelligence`), `COLLECTION_NAME` (default `documents`). See `backend/src/db.py`.

---

## Frontend pages

### 1. Root `/` → redirects to `/dashboard`

- **MongoDB:** N/A (redirect only).

---

### 2. Dashboard `/dashboard`

- **Backend:** `GET /health`, `GET /documents`.
- **MongoDB:** Yes. Document count and list come from `documents` collection.
- **Status:** Wired; shows stats, backend status, quick actions, and knowledge base list.

---

### 3. Search `/search`

- **Backend:** `POST /query` (query + top_k).
- **MongoDB:** Yes. Backend reads from `documents` (vector search over `embedding`), then returns AI answer + sources.
- **Status:** Wired; works when backend is up and `ANTHROPIC_API_KEY` is set. Shows “Search failed. Backend unavailable.” on network/backend errors.

---

### 4. Documents `/documents`

- **Backend:** `GET /documents`, `POST /upload`, `DELETE /documents/{filename}`.
- **MongoDB:** Yes. List and delete use the same `documents` collection; upload writes new chunks (and embeddings) into it.
- **Status:** Wired; list/upload/delete all go to the API. Errors surfaced via `getFriendlyErrorMessage` (e.g. connection, 4xx/5xx).

---

### 5. Runbooks `/runbooks`

- **Backend:** `GET /documents`.
- **MongoDB:** Yes. Lists uploaded documents from `documents` collection; click a doc to open a panel with “Search this runbook” link.
- **Status:** Wired; shows your uploaded documents only (no mock data).

---

## Summary

| Page | Uses backend | Uses MongoDB | Notes |
| ---- | ------------ | ------------ | ----- |
| `/` | No | No | Redirect to dashboard |
| `/dashboard` | Yes | Yes | Stats, health, document list |
| `/search` | Yes | Yes | RAG query + sources |
| `/documents` | Yes | Yes | List, upload, delete |
| `/runbooks` | Yes | Yes | List of uploaded docs, link to Search |

**Dashboard, Search, Documents, and Runbooks** all use the backend and MongoDB. Incidents and Services pages have been removed.

---

## Config used for MongoDB

- **Connection:** `MONGODB_URI` in `backend/.env` (required).
- **Database:** `DB_NAME` (default `rag_intelligence`).
- **Collection:** `COLLECTION_NAME` (default `documents`).
- **Document shape:** `file_name`, `chunk_index`, `total_chunks`, `content`, `embedding`, `created_at`.
