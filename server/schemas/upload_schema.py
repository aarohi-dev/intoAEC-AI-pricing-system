# pyrefly: ignore [missing-import]
from pydantic import BaseModel

class UploadResponse(BaseModel):
    documentId: str
    status: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "documentId": "550e8400-e29b-41d4-a716-446655440000",
                "status": "Processing"
            }
        }
    }
