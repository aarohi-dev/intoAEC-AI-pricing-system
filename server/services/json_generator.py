import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class JSONGenerator:
    """
    Service responsible for converting parsed estimation items and metadata
    into the final structured Estimate JSON matching ResultResponse schema requirements.
    """

    async def generate(self, parsed_data: dict, document_name: str = "estimate.pdf", document_id: str = "", file_path: str = "") -> dict:
        """
        Generates the final structured Estimate JSON.

        Args:
            parsed_data (dict): The parsed items output from ParserService.
            document_name (str): The name of the processed document.
            document_id (str): The unique document identifier.
            file_path (str): The path to the uploaded file.

        Returns:
            dict: The final structured estimate dict matching the ResultResponse schema.
        """
        logger.info(f"Generating final structured JSON for document: {document_name}")
        
        # Calculate page count if PDF
        pages = 1
        if file_path:
            path = Path(file_path)
            if path.exists() and path.suffix.lower() == ".pdf":
                try:
                    # pyrefly: ignore [missing-import]
                    import pypdf
                    with open(path, "rb") as f:
                        reader = pypdf.PdfReader(f)
                        pages = len(reader.pages)
                    logger.info(f"Counted {pages} pages for PDF document.")
                except Exception as e:
                    logger.warning(f"Could not read PDF page count: {e}. Defaulting to 1.")
        
        # Determine documentType
        doc_type = "BOQ"
        if document_name:
            suffix = Path(document_name).suffix.lower()
            if suffix in [".png", ".jpg", ".jpeg"]:
                doc_type = "Image"
            elif suffix in [".xls", ".xlsx"]:
                doc_type = "Excel"
            elif suffix == ".csv":
                doc_type = "CSV"
        
        # Structure the final output conforming to ResultResponse schema
        final_output = {
            "metadata": {
                "documentId": document_id,
                "documentType": doc_type,
                "pages": pages
            },
            "sections": parsed_data.get("sections", [])
        }
        
        logger.info(f"Successfully generated estimate JSON with {len(final_output['sections'])} sections.")
        return final_output
