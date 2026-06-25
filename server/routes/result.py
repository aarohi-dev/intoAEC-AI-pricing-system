import logging
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status
from schemas.result_schema import ResultResponse
from utils import storage

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/result/{document_id}", response_model=ResultResponse)
async def get_result(document_id: str):
    """
    Retrieves the extracted estimation JSON for the given documentId.
    Returns mock data if the JSON output has not been generated yet but the document is valid.
    """
    # 1. Attempt to load the JSON file from the output directory
    output_data = storage.load_json_output(document_id)
    if output_data:
        return ResultResponse(**output_data)

    # 2. If JSON output does not exist, verify if document record exists in metadata
    record = storage.get_document_record(document_id)
    if not record:
        logger.warning(f"Result requested for non-existent document ID: {document_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found."
        )

    # 3. Return mock data as fallback if document exists but JSON doesn't
    logger.info(f"JSON output not found for document {document_id}. Returning mock fallback data.")
    mock_fallback = {
        "documentName": record["filename"],
        "items": [
            {
                "description": "Concrete (Mock)",
                "quantity": 100.0,
                "unit": "m3"
            },
            {
                "description": "Steel Reinforcement (Mock)",
                "quantity": 5.5,
                "unit": "tons"
            }
        ]
    }
    return ResultResponse(**mock_fallback)
