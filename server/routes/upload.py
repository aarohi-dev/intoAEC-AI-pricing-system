import uuid
from pathlib import Path
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from schemas.upload_schema import UploadResponse
from utils import storage

router = APIRouter()

# Allowed file extensions
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """
    Accepts and validates estimate documents (PDF or images),
    saves them to local storage, and returns a documentId for status tracking.
    """
    # Extract file suffix
    filename = file.filename
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename."
        )

    suffix = Path(filename).suffix.lower()
    
    # Validate extension
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{suffix}'. Supported formats are: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Validate content-type (optional extra layer of protection)
    # Common content types for PDF and images
    allowed_content_types = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg"
    }
    
    # Generate unique document ID
    document_id = str(uuid.uuid4())
    
    try:
        # Create storage entry and record (sets status to Processing)
        record = storage.create_document_record(
            document_id=document_id,
            filename=filename,
            content_type=file.content_type or "application/octet-stream"
        )
        
        # Read file content and save
        content = await file.read()
        storage.save_uploaded_file(record["filePath"], content)
        
    except Exception as e:
        # Update metadata or clean up if possible
        storage.update_document_status(document_id, "Failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while saving the file: {str(e)}"
        )
        
    return UploadResponse(
        documentId=document_id,
        status=record["status"]
    )
