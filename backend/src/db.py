from pymongo import MongoClient
from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

# Get Mongo URI
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI not found in .env")

# On Windows, SSL handshake to Atlas often fails with tlsCAFile=certifi.
# Use system CA store instead when OPENSSL_CONF wasn't set before process start.
_use_system_ca = sys.platform == "win32"
if _use_system_ca:
    client = MongoClient(
        MONGODB_URI,
        tls=True,
        serverSelectionTimeoutMS=10000,
    )
else:
    import certifi
    client = MongoClient(
        MONGODB_URI,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,
    )

# Select database and collection (from .env or defaults)
_db_name = os.getenv("DB_NAME", "rag_intelligence")
_coll_name = os.getenv("COLLECTION_NAME", "documents")
db = client[_db_name]
collection = db[_coll_name]