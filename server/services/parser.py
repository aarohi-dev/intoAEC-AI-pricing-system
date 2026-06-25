import logging

logger = logging.getLogger(__name__)

class ParserService:
    """
    Service responsible for parsing extracted OCR text/tables into a clean,
    structured list of line items (e.g. materials, descriptions, quantities).
    """

    async def parse(self, ocr_response: dict) -> dict:
        """
        Parses OCR markdown or raw text output into structured estimation items.

        Args:
            ocr_response (dict): Output from the OCR service.

        Returns:
            dict: The structured parse results:
                {
                    "items": list[dict]
                }

        Raises:
            NotImplementedError: Raised in Phase 1 as parsing logic is not yet implemented.
        """
        # TODO: Parse OCR results in Phase 2
        # Future Workflow:
        # 1. Take OCR raw text and tables.
        # 2. Extract item details (e.g., Concrete, steel, formwork) using regex patterns, 
        #    semantic analysis, or structured LLM calls (e.g., using Mistral Chat completion).
        # 3. Handle data clean-up (unit standardization, quantity float parsing, etc.).
        #
        # Expected response structure:
        # return {
        #     "items": [
        #         {"description": "Concrete", "quantity": 100.0, "unit": "m3"},
        #         {"description": "Steel reinforcement", "quantity": 5.2, "unit": "tons"}
        #     ]
        # }
        
        logger.warning("ParserService.parse called. Raising NotImplementedError.")
        raise NotImplementedError("ParserService.parse is not implemented in Phase 1.")
