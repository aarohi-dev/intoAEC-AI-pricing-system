import os
import json
import threading
from pathlib import Path
from typing import Dict, Any, Optional

# Constants for paths
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "output"
METADATA_FILE = UPLOADS_DIR / "metadata.json"

# Thread-safety lock
_lock = threading.Lock()

def initialize_directories():
    """Initializes uploads/ and output/ directories if they don't exist."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Initialize metadata.json if not exists
    with _lock:
        if not METADATA_FILE.exists():
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump({}, f)

def get_metadata() -> Dict[str, Dict[str, Any]]:
    """Reads and returns metadata of all uploaded documents."""
    if not METADATA_FILE.exists():
        return {}
    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}

def save_metadata(metadata: Dict[str, Dict[str, Any]]):
    """Saves the complete metadata dictionary back to file."""
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)

def create_document_record(document_id: str, filename: str, content_type: str) -> Dict[str, Any]:
    """Creates a new record for an uploaded document and sets status to 'Processing'."""
    initialize_directories()
    with _lock:
        meta = get_metadata()
        # Determine the extension based on file type or keep original extension
        # The storage rules specify naming convention uploads/{documentId}.pdf
        # We will save PDF/images using their appropriate suffix to avoid corruption,
        # but defaulting to .pdf as per naming convention if needed.
        suffix = Path(filename).suffix.lower()
        if not suffix:
            suffix = ".pdf"
            
        file_path = UPLOADS_DIR / f"{document_id}{suffix}"
        
        record = {
            "documentId": document_id,
            "filename": filename,
            "contentType": content_type,
            "filePath": str(file_path),
            "status": "Processing",
            "outputPath": str(OUTPUT_DIR / f"{document_id}.json")
        }
        
        meta[document_id] = record
        save_metadata(meta)
        return record

def update_document_status(document_id: str, status: str) -> Optional[Dict[str, Any]]:
    """Updates the status of a document (e.g. Processing -> Completed)."""
    with _lock:
        meta = get_metadata()
        if document_id in meta:
            meta[document_id]["status"] = status
            save_metadata(meta)
            return meta[document_id]
        return None

def get_document_record(document_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves metadata record for a document_id."""
    with _lock:
        meta = get_metadata()
        return meta.get(document_id)

def save_uploaded_file(file_path_str: str, content: bytes):
    """Writes the raw bytes of the uploaded file to disk."""
    path = Path(file_path_str)
    # Ensure parent exists just in case
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(content)

def save_json_output(document_id: str, data: Dict[str, Any]):
    """Saves generated JSON output for a document."""
    initialize_directories()
    out_path = OUTPUT_DIR / f"{document_id}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def load_json_output(document_id: str) -> Optional[Dict[str, Any]]:
    """Loads and returns the generated JSON file content if it exists."""
    out_path = OUTPUT_DIR / f"{document_id}.json"
    if out_path.exists():
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    return None
