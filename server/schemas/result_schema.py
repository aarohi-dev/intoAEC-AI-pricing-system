from pydantic import BaseModel, Field
from typing import List, Optional

class ValidationInfo(BaseModel):
    duplicate: bool = Field(default=False, description="Whether the item is detected as a duplicate in the document.")
    amountValid: bool = Field(default=True, description="Whether quantity * rate equals amount (if both are present).")
    unitValid: bool = Field(default=True, description="Whether the unit of measurement is standard/valid.")

class EstimateItem(BaseModel):
    itemNumber: int = Field(description="The index/serial number of the item.")
    description: str = Field(description="The raw description text extracted from the document.")
    normalizedDescription: str = Field(description="The normalized description (e.g. Concrete M20).")
    category: str = Field(description="The category of the item (e.g. Concrete, Steel, Electrical).")
    quantity: Optional[float] = Field(default=None, description="The quantity extracted.")
    unit: Optional[str] = Field(default=None, description="The unit of measurement.")
    rate: Optional[float] = Field(default=None, description="The unit rate if present in the document.")
    amount: Optional[float] = Field(default=None, description="The total amount if present in the document.")
    aiSuggestedRate: Optional[float] = Field(default=None, description="The suggested unit rate from the AI pricing engine.")
    confidence: Optional[float] = Field(default=None, description="Confidence score for the extraction (0.0 to 1.0).")
    validation: ValidationInfo = Field(default_factory=ValidationInfo, description="Automatic validation results.")

class Section(BaseModel):
    name: str = Field(description="The section or heading name under which these items belong.")
    items: List[EstimateItem] = Field(default_factory=list, description="List of items in this section.")

class DocumentMetadata(BaseModel):
    documentId: str = Field(description="The unique identifier of the document.")
    documentType: str = Field(default="BOQ", description="The type of document (e.g. BOQ, Estimate).")
    pages: int = Field(default=1, description="Number of pages in the document.")

class ResultResponse(BaseModel):
    metadata: DocumentMetadata = Field(description="Document metadata.")
    sections: List[Section] = Field(default_factory=list, description="Sections containing estimate items.")
