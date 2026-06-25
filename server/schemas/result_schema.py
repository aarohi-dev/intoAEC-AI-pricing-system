from pydantic import BaseModel
from typing import List, Optional

class EstimateItem(BaseModel):
    description: str
    quantity: Optional[float] = None
    unit: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "description": "Concrete",
                "quantity": 100.0,
                "unit": "m3"
            }
        }
    }

class ResultResponse(BaseModel):
    documentName: str
    items: List[EstimateItem]

    model_config = {
        "json_schema_extra": {
            "example": {
                "documentName": "estimate.pdf",
                "items": [
                    {
                        "description": "Concrete",
                        "quantity": 100.0,
                        "unit": "m3"
                    }
                ]
            }
        }
    }
