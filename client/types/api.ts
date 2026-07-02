export interface UploadResponse {
  documentId: string;
  status: string;
}

export interface ProcessResponse {
  status: string;
}

export interface ValidationInfo {
  duplicate: boolean;
  amountValid: boolean;
  unitValid: boolean;
}

export interface EstimateItem {
  itemNumber: number;
  description: string;
  normalizedDescription: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  rate: number | null;
  amount: number | null;
  aiSuggestedRate: number | null;
  confidence: number | null;
  validation: ValidationInfo;
}

export interface Section {
  name: string;
  items: EstimateItem[];
}

export interface DocumentMetadata {
  documentId: string;
  documentType: string;
  pages: number;
}

export interface ResultResponse {
  metadata: DocumentMetadata;
  sections: Section[];
}
