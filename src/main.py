import os
import shutil
import traceback
from pathlib import Path
from dotenv import load_dotenv

# Load .env first so OPENSSL_CONF is set before any SSL connections are made
load_dotenv()
if "OPENSSL_CONF" in os.environ:
    _conf = Path(os.environ["OPENSSL_CONF"])
    if not _conf.is_absolute():
        os.environ["OPENSSL_CONF"] = str(Path(__file__).parent.parent / _conf)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from src.embed import embed_and_store, list_documents, delete_document
from src.retrieve import query_documents

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

STATIC_DIR = Path(__file__).parent / "static"

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

@app.get("/", response_class=FileResponse)
def root():
    return str(STATIC_DIR / "index.html")

@app.get("/health")
def health():
    return {"message": "RAG Document Intelligence API", "status": "running"}

# Mount static assets (CSS/JS/images if any) — after all routes
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        if not file.filename:
            return JSONResponse(
                status_code=400,
                content={"detail": "No filename provided."}
            )
        allowed_extensions = [".pdf", ".docx", ".xlsx", ".pptx"]
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Unsupported file type '{ext}'. Allowed: {allowed_extensions}"}
            )
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        result = embed_and_store(file_path, file.filename)
        return {"message": f"Successfully ingested {file.filename}", "chunks_stored": result["chunks_stored"]}
    except ValueError as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

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

@app.delete("/documents/{filename}")
def delete_doc(filename: str):
    """Remove all chunks for the given document. Filename may be URL-encoded (e.g. spaces as %20)."""
    from urllib.parse import unquote
    file_name = unquote(filename).strip()
    if not file_name or ".." in file_name:
        return JSONResponse(status_code=400, content={"detail": "Invalid filename."})
    try:
        deleted = delete_document(file_name)
        return {"message": f"Deleted {file_name}", "chunks_deleted": deleted}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
