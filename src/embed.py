from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from datetime import datetime, timezone
import os
import certifi
from dotenv import load_dotenv
from src.ingest import extract_text, chunk_text

load_dotenv()

# Initialize embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Connect to MongoDB
client = MongoClient(os.getenv("MONGODB_URI"), tlsCAFile=certifi.where())
db = client[os.getenv("DB_NAME")]
collection = db[os.getenv("COLLECTION_NAME")]

def embed_and_store(file_path: str, file_name: str) -> dict:
    """Extract, chunk, embed, and store a document in MongoDB Atlas."""
    
    print(f"Extracting text from {file_name}...")
    text = extract_text(file_path)
    
    if not text:
        raise ValueError(f"No text extracted from {file_name}")
    
    print(f"Chunking text...")
    chunks = chunk_text(text)
    
    print(f"Embedding {len(chunks)} chunks...")
    stored = []
    
    for i, chunk in enumerate(chunks):
        embedding = model.encode(chunk).tolist()
        
        document = {
            "file_name": file_name,
            "chunk_index": i,
            "total_chunks": len(chunks),
            "content": chunk,
            "embedding": embedding,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = collection.insert_one(document)
        stored.append(str(result.inserted_id))
        print(f"Stored chunk {i+1}/{len(chunks)}")
    
    return {
        "file_name": file_name,
        "chunks_stored": len(stored),
        "ids": stored
    }

def list_documents() -> list:
    """List all documents with chunk counts: [{ filename, chunk_count }, ...]."""
    pipeline = [
        {"$group": {"_id": "$file_name", "chunk_count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    cursor = collection.aggregate(pipeline)
    return [{"filename": doc["_id"], "chunk_count": doc["chunk_count"]} for doc in cursor]

def delete_document(file_name: str) -> int:
    """Remove all chunks for the given file. Returns number of chunks deleted."""
    result = collection.delete_many({"file_name": file_name})
    return result.deleted_count