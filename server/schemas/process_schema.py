# pyrefly: ignore [missing-import]
from pydantic import BaseModel

class ProcessResponse(BaseModel):
    status: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "Completed"
            }
        }
    }
