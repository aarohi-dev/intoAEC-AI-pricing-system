import logging
import json
import asyncio
from typing import List, Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
import google.generativeai as genai
from services.ocr import get_gemini_api_key
from schemas.result_schema import Section, EstimateItem

logger = logging.getLogger(__name__)

class ParsedEstimate(BaseModel):
    sections: List[Section] = Field(description="Logical sections of the construction estimate containing BOQ items.")

def resolve_refs(schema: dict, defs: dict = None) -> dict:
    """
    Recursively resolves $ref references in a JSON schema dictionary.
    """
    if defs is None:
        defs = schema.get("$defs", schema.get("definitions", {}))
        
    if isinstance(schema, dict):
        if "$ref" in schema:
            ref_path = schema["$ref"]
            ref_name = ref_path.split("/")[-1]
            if ref_name in defs:
                resolved = resolve_refs(defs[ref_name], defs)
                # Merge other fields
                for k, v in schema.items():
                    if k != "$ref":
                        resolved[k] = v
                return resolved
        return {k: resolve_refs(v, defs) for k, v in schema.items()}
    elif isinstance(schema, list):
        return [resolve_refs(item, defs) for item in schema]
    return schema

def clean_schema(schema_dict: dict) -> dict:
    """
    Recursively cleans up a dictionary schema so it only contains fields 
    supported by google.generativeai.protos.Schema.
    """
    allowed_keys = {
        'type', 'format', 'description', 'nullable', 'enum', 
        'items', 'max_items', 'min_items', 'properties', 'required'
    }
    
    cleaned = {}
    
    # Handle anyOf for nullable / union types (common in Pydantic schemas)
    if 'anyOf' in schema_dict:
        types = [item.get('type') for item in schema_dict['anyOf'] if 'type' in item]
        if 'null' in types:
            cleaned['nullable'] = True
        actual_types = [t for t in types if t != 'null']
        if actual_types:
            cleaned['type'] = actual_types[0]
            # Recursively copy properties/items from the non-null type schema if present
            for item in schema_dict['anyOf']:
                if item.get('type') != 'null':
                    for k in ['properties', 'required', 'items']:
                        if k in item:
                            cleaned[k] = item[k]
                            
    for k, v in schema_dict.items():
        if k in allowed_keys:
            if k == 'properties' and isinstance(v, dict):
                cleaned[k] = {prop_name: clean_schema(prop_val) for prop_name, prop_val in v.items()}
            elif k == 'items' and isinstance(v, dict):
                cleaned[k] = clean_schema(v)
            else:
                cleaned[k] = v
                
    # Map lowercase type strings to uppercase proto Type enum keys
    if 'type' in cleaned and isinstance(cleaned['type'], str):
        type_str = cleaned['type'].lower()
        type_map = {
            'string': 'STRING',
            'number': 'NUMBER',
            'integer': 'INTEGER',
            'boolean': 'BOOLEAN',
            'array': 'ARRAY',
            'object': 'OBJECT',
        }
        if type_str in type_map:
            cleaned['type'] = type_map[type_str]
            
    return cleaned

def get_gemini_schema(pydantic_model) -> dict:
    """
    Generates a Gemini-compatible schema dictionary from a Pydantic model.
    """
    raw_schema = pydantic_model.model_json_schema()
    resolved = resolve_refs(raw_schema)
    return clean_schema(resolved)

class ParserService:
    """
    Service responsible for parsing extracted OCR text/tables into a clean,
    structured list of line items (e.g. materials, descriptions, quantities).
    """

    def __init__(self):
        self.api_key = get_gemini_api_key()
        self.model_name = "gemini-2.5-flash"

    async def parse(self, ocr_response: dict) -> dict:
        """
        Parses OCR markdown or raw text output into structured estimation items.

        Args:
            ocr_response (dict): Output from the OCR service.

        Returns:
            dict: The structured parse results:
                {
                    "sections": list[dict]
                }
        """
        if not self.api_key:
            logger.warning("Gemini API key is missing. Cannot perform parsing.")
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. "
                "Please set this key to use the Gemini parser."
            )

        raw_text = ocr_response.get("raw_text", "")
        if not raw_text.strip():
            logger.warning("Empty OCR response raw_text. Returning empty sections list.")
            return {"sections": []}

        logger.info("Parsing OCR text using Gemini structured JSON generation...")
        
        try:
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)

            prompt = f"""
            You are an expert construction estimate parsing and pricing assistant.
            Analyze the following OCR text and tables from a construction estimate or bill of quantities (BOQ) document:
            
            --- BEGIN DOCUMENT TEXT ---
            {raw_text}
            --- END DOCUMENT TEXT ---
            
            Perform the following operations:
            1. **Estimate Structure Reconstruction**: Reconstruct the estimate, grouping items into logical sections (e.g., 'Civil Works', 'Earthworks', 'Concrete Works', or whatever sections are specified in the document. If no sections are found, use 'General').
            2. **Line Item Extraction**: For each item in each section, extract the item serial number (itemNumber), raw description, quantity, unit, rate, and amount from the document.
            3. **Semantic Normalization**:
               - Normalize descriptions to standard/clear construction terminology (e.g. 'C.C. M20', 'P.C.C. M20' -> 'Concrete M20'). Set as `normalizedDescription`.
               - Normalize units to standard unit abbreviations (e.g. 'Sq.M', 'sqm', 'm2', 'Square Meter' -> 'sqm'; 'Cu.M', 'cum', 'm3', 'Cubic Meter' -> 'm3'; 'Tons', 't' -> 'tons'; 'Rft', 'lft', 'Running Meter' -> 'm').
            4. **Categorization**: Classify each item into one of the following categories: 'Concrete', 'Steel', 'Electrical', 'Plumbing', 'Flooring', 'Painting', 'Roofing', 'Masonry', 'Earthworks', 'Demolition', or 'General'.
            5. **AI Pricing Recommendation**: Suggest an approximate, reasonable market rate in local currency for the item based on its description and unit, and assign a confidence score (0.0 to 1.0) for your rate suggestion. Write these to `aiSuggestedRate` and `confidence` fields.
            6. **Validation Engine**: Perform automatic validation checks:
               - `duplicate`: Set to true if the item appears to be duplicate in the document.
               - `amountValid`: Set to true if quantity * rate equals amount (within a 1% margin). If quantity, rate, or amount is missing, set to true.
               - `unitValid`: Set to true if the unit is successfully recognized or normalized.

            Ensure the output JSON strictly matches the schema structure.
            """

            # Retrieve clean schema compatible with Gemini SDK
            gemini_schema = get_gemini_schema(ParsedEstimate)

            # Run in a thread pool to avoid blocking the event loop
            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=gemini_schema
                )
            )

            # Parse JSON response
            parsed_json = json.loads(response.text)
            logger.info("Gemini parsing and enrichment completed successfully.")
            return parsed_json

        except Exception as e:
            logger.error(f"Error during ParserService.parse: {str(e)}", exc_info=True)
            raise e
