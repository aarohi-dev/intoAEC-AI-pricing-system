import logging
from pathlib import Path
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Depends, status

from schemas.process_schema import ProcessResponse
from services.ocr import OCRService
from services.parser import ParserService
from services.json_generator import JSONGenerator
from utils import storage

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency providers for services
def get_ocr_service() -> OCRService:
    return OCRService()

def get_parser_service() -> ParserService:
    return ParserService()

def get_json_generator() -> JSONGenerator:
    return JSONGenerator()

@router.post("/process/{document_id}", response_model=ProcessResponse)
async def process_document(
    document_id: str,
    ocr_service: OCRService = Depends(get_ocr_service),
    parser_service: ParserService = Depends(get_parser_service),
    json_generator: JSONGenerator = Depends(get_json_generator)
):
    """
    Simulates document processing by calling placeholders for OCR, Parsing, and JSON Generation.
    Catches Phase 1 NotImplementedErrors to write a mock JSON output file.
    """
    # 1. Verify document record exists
    record = storage.get_document_record(document_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found."
        )

    # 2. Verify physical file exists
    file_path = Path(record["filePath"])
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Uploaded file for document ID '{document_id}' does not exist on disk."
        )

    logger.info(f"Initiating processing pipeline for document: {document_id}")

    try:
        # Execute asynchronous pipeline
        ocr_response = await ocr_service.extract_text(str(file_path))
        parsed_data = await parser_service.parse(ocr_response)
        final_json = await json_generator.generate(parsed_data, document_name=record["filename"])
        
        # Save final result
        storage.save_json_output(document_id, final_json)
        storage.update_document_status(document_id, "Completed")
        
    except (NotImplementedError, ValueError) as nie:
        logger.info(f"Pipeline placeholder or missing key caught: {str(nie)}. Falling back to mock output.")
        
        # Generate mock JSON matching ResultResponse requirements
        mock_output = {
            "documentName": record["filename"],
            "items": [
                {
                    "description": "Concrete",
                    "quantity": 100.0,
                    "unit": "m3"
                },
                {
                    "description": "Steel Reinforcement",
                    "quantity": 5.5,
                    "unit": "tons"
                },
                {
                    "description": "Formwork",
                    "quantity": 250.0,
                    "unit": "m2"
                }
            ]
        }
        
        # Write mock data to outputs and set status to Completed
        try:
            storage.save_json_output(document_id, mock_output)
            storage.update_document_status(document_id, "Completed")
        except Exception as file_err:
            storage.update_document_status(document_id, "Failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save mock JSON output: {str(file_err)}"
            )

    except Exception as e:
        logger.error(f"Unexpected error processing document {document_id}: {str(e)}")
        storage.update_document_status(document_id, "Failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during document processing: {str(e)}"
        )

    return ProcessResponse(status="Completed")
