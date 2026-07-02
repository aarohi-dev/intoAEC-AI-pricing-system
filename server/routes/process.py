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
        ocr_response = await ocr_service.extract_text(str(file_path))
        parsed_data = await parser_service.parse(ocr_response)
        final_json = await json_generator.generate(
            parsed_data,
            document_name=record["filename"],
            document_id=document_id,
            file_path=str(file_path)
        )
        
        # Save final result
        storage.save_json_output(document_id, final_json)
        storage.update_document_status(document_id, "Completed")
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}", exc_info=True)
        storage.update_document_status(document_id, "Failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during document processing: {str(e)}"
        )

    return ProcessResponse(status="Completed")
