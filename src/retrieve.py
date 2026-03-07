from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import anthropic
import numpy as np
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

model = SentenceTransformer('all-MiniLM-L6-v2')
client = MongoClient(os.getenv("MONGODB_URI"), tlsCAFile=certifi.where())
db = client[os.getenv("DB_NAME")]
collection = db[os.getenv("COLLECTION_NAME")]
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def find_relevant_chunks(query, top_k=5):
    query_vec = np.array(model.encode(query).tolist())
    all_docs = list(collection.find({}, {"content": 1, "file_name": 1, "embedding": 1, "chunk_index": 1}))
    if not all_docs:
        return []
    scored = []
    for doc in all_docs:
        doc_vec = np.array(doc["embedding"])
        sim = np.dot(query_vec, doc_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(doc_vec))
        scored.append({"content": doc["content"], "file_name": doc["file_name"], "chunk_index": doc["chunk_index"], "score": float(sim)})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]

def query_documents(query, top_k=5):
    chunks = find_relevant_chunks(query, top_k)
    if not chunks:
        return {"query": query, "response": "No documents found.", "sources": []}
    context = "\n\n".join([f"Source: {c['file_name']} (chunk {c['chunk_index']})\n{c['content']}" for c in chunks])
    message = anthropic_client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": f"Answer this question using the documents below.\n\nDOCUMENTS:\n{context}\n\nQUESTION: {query}"}]
    )
    return {"query": query, "response": message.content[0].text, "sources": [{"file_name": c["file_name"], "score": round(c["score"], 3)} for c in chunks]}