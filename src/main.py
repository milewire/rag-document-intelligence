import os
import shutil
import traceback

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from src.embed import embed_and_store, list_documents
from src.retrieve import query_documents

load_dotenv()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="RAG Document Intelligence",
    description="Upload documents and query them using AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="src/static", html=True), name="static")

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

@app.get("/")
def root():
    return {"message": "RAG Document Intelligence API", "status": "running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    allowed_extensions = [".pdf", ".docx", ".xlsx", ".pptx"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {allowed_extensions}"
        )
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    result = embed_and_store(file_path, file.filename)
    return {"message": f"Successfully ingested {file.filename}", "chunks_stored": result["chunks_stored"]}

@app.post("/query")
def query(request: QueryRequest):
    try:
        result = query_documents(request.query, request.top_k)
        return result
    except Exception as e:
        print("QUERY ERROR:", str(e))
        traceback.print_exc()
        raise

@app.get("/documents")
def get_documents():
    docs = list_documents()
    return {"documents": docs, "count": len(docs)}
