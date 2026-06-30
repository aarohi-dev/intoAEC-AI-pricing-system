import os
import logging
import asyncio
from pathlib import Path
from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None

import google.generativeai as genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

# Setup Tesseract Path if on Windows (fallback path)
if os.name == 'nt' and pytesseract:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def get_gemini_api_key() -> str:
    """
    Retrieve Gemini API Key from environment or fallback to parsing .env file directly.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Robust lookup in common locations
        for env_path in [Path(".env"), Path("../.env"), Path(__file__).resolve().parent.parent / ".env"]:
            if env_path.exists():
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            if line.strip().startswith("GEMINI_API_KEY"):
                                api_key = line.strip().split("=", 1)[1].strip(" '\"")
                                break
                    if api_key:
                        break
                except Exception as e:
                    logger.warning(f"Failed to read {env_path} for GEMINI_API_KEY: {e}")
    return api_key or ""

class OCRService:
    """
    Service responsible for extracting text and tabular structures from PDF or image files.
    Integrates with the Gemini Multimodal API using the 'gemini-2.5-flash' model.
    """

    def __init__(self):
        self.api_key = get_gemini_api_key()
        self.model_name = "gemini-2.5-flash"

    async def extract_text(self, file_path: str) -> dict:
        """
        Processes the file (PDF or image) using the Gemini API.

        Args:
            file_path (str): The physical path to the uploaded PDF or image file.

        Returns:
            dict: The OCR output structure:
                {
                    "raw_text": str,
                    "tables": list[dict]
                }

        Raises:
            ValueError: If GEMINI_API_KEY environment variable is not configured.
            Exception: Any network or API level exceptions from the Gemini SDK.
        """
        if not self.api_key:
            logger.warning("Gemini API key is missing. Cannot perform OCR.")
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. "
                "Please set this key to use the Gemini API."
            )

        logger.info(f"Processing file '{file_path}' with Gemini Multimodal API...")
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            # Configure Gemini Client
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)

            prompt = """
            You are an expert OCR engine specializing in construction estimates and bills of quantities.
            Extract all text, headers, numbers, and layout elements from this document.
            If there are any tables, you MUST format them as markdown tables.
            Do not skip any section, column, row, or details. Do not summarize.
            Extract the text exactly as it appears.
            """

            suffix = path.suffix.lower()
            if suffix == ".pdf":
                # For PDF, use the Gemini File API (via genai.upload_file)
                logger.info(f"Uploading PDF to Gemini File API: {path.name}")
                uploaded_file = await asyncio.to_thread(genai.upload_file, path)
                logger.info(f"PDF uploaded. Name: {uploaded_file.name}, URI: {uploaded_file.uri}")

                try:
                    response = await asyncio.to_thread(
                        model.generate_content,
                        [prompt, uploaded_file]
                    )
                finally:
                    # Clean up the file from Google servers
                    logger.info(f"Cleaning up uploaded file: {uploaded_file.name}")
                    await asyncio.to_thread(uploaded_file.delete)
            else:
                # For images, open using PIL to pass directly to generate_content
                logger.info(f"Loading image using PIL: {path.name}")
                img_payload = await asyncio.to_thread(Image.open, path)
                response = await asyncio.to_thread(
                    model.generate_content,
                    [prompt, img_payload]
                )

            raw_text = response.text
            logger.info(f"OCR successfully completed for {file_path}.")

            return {
                "raw_text": raw_text,
                "tables": []
            }

        except Exception as e:
            logger.error(f"Error during Gemini OCR invocation: {str(e)}", exc_info=True)
            raise e
