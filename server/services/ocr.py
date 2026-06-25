import os
import logging
from pathlib import Path
# pyrefly: ignore [missing-import]
from mistralai.client import Mistral

logger = logging.getLogger(__name__)

class OCRService:
    """
    Service responsible for extracting text and tabular structures from PDF or image files.
    Integrates with the Mistral OCR API using the 'mistral-ocr-latest' model.
    """

    def __init__(self):
        self.api_key = os.environ.get("MISTRAL_API_KEY")
        self.model = "mistral-ocr-latest"

    async def extract_text(self, file_path: str) -> dict:
        """
        Uploads the file to Mistral AI and processes it using Mistral OCR.

        Args:
            file_path (str): The physical path to the uploaded PDF or image file.

        Returns:
            dict: The OCR output structure:
                {
                    "raw_text": str,
                    "tables": list[dict]
                }

        Raises:
            ValueError: If MISTRAL_API_KEY environment variable is not configured.
            Exception: Any network or API level exceptions from the Mistral SDK.
        """
        if not self.api_key:
            logger.warning("Mistral API key is missing. Cannot perform OCR.")
            raise ValueError(
                "MISTRAL_API_KEY environment variable is not set. "
                "Please set this key to use the Mistral OCR API."
            )

        logger.info(f"Uploading file '{file_path}' to Mistral Files API...")
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Initialize the Mistral client
        # In mistralai 2.5.0+, the Mistral client manages resource cleanup
        client = Mistral(api_key=self.api_key)

        try:
            # 1. Read file bytes and upload to Mistral
            with open(path, "rb") as f:
                file_bytes = f.read()

            uploaded_file = await client.files.upload_async(
                file={
                    "file_name": path.name,
                    "content": file_bytes,
                },
                purpose="ocr"
            )
            logger.info(f"File uploaded successfully. Mistral File ID: {uploaded_file.id}")

            # 2. Trigger OCR processing
            logger.info(f"Triggering Mistral OCR with model '{self.model}'...")
            res = await client.ocr.process_async(
                model=self.model,
                document={
                    "type": "file_id",
                    "file_id": uploaded_file.id
                }
            )
            logger.info(f"Mistral OCR process completed successfully for {file_path}.")

            # 3. Extract text/markdown from pages
            raw_text_parts = []
            for page in res.pages:
                if hasattr(page, 'markdown') and page.markdown:
                    raw_text_parts.append(page.markdown)
                elif hasattr(page, 'text') and page.text:
                    raw_text_parts.append(page.text)
            
            raw_text = "\n\n".join(raw_text_parts)

            # In Mistral OCR, tables are represented inside markdown as markdown tables.
            # We will return the raw markdown text and set tables as empty or placeholders
            # for subsequent parser logic.
            return {
                "raw_text": raw_text,
                "tables": []
            }

        except Exception as e:
            logger.error(f"Error during Mistral OCR invocation: {str(e)}", exc_info=True)
            raise e
