from sentence_transformers import SentenceTransformer
import anthropic
import numpy as np
import os
from dotenv import load_dotenv
from pathlib import Path

from src.db import collection

_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")

model = SentenceTransformer('all-MiniLM-L6-v2')

def _get_anthropic_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_anthropic_api_key":
        raise ValueError("ANTHROPIC_API_KEY is not set or invalid in .env")
    return anthropic.Anthropic(api_key=api_key)

def find_relevant_chunks(query, top_k=5):
    query_vec = np.array(model.encode(query).tolist())
    all_docs = list(collection.find({}, {"content": 1, "file_name": 1, "embedding": 1, "chunk_index": 1}))
    if not all_docs:
        return []
    scored = []
    for doc in all_docs:
        emb = doc.get("embedding")
        if emb is None:
            continue
        doc_vec = np.array(emb)
        sim = np.dot(query_vec, doc_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(doc_vec))
        scored.append({"content": doc["content"], "file_name": doc["file_name"], "chunk_index": doc["chunk_index"], "score": float(sim)})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]

def _get_message_text(message):
    """Get text from Anthropic message content (handles different block types)."""
    for block in message.content:
        if hasattr(block, "text"):
            return block.text
    return ""

def query_documents(query, top_k=5):
    chunks = find_relevant_chunks(query, top_k)
    if not chunks:
        return {"query": query, "response": "No documents found.", "sources": []}
    context = "\n\n".join([f"Source: {c['file_name']} (chunk {c['chunk_index']})\n{c['content']}" for c in chunks])
    client = _get_anthropic_client()
    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": f"Answer this question using the documents below.\n\nDOCUMENTS:\n{context}\n\nQUESTION: {query}"}]
    )
    response_text = _get_message_text(message)
    return {"query": query, "response": response_text, "sources": [{"file_name": c["file_name"], "score": round(c["score"], 3)} for c in chunks]}
