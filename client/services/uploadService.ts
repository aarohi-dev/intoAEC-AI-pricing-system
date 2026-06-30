import { apiClient } from "../lib/api";
import { UploadResponse, ProcessResponse, ResultResponse } from "../types/api";

export const uploadService = {
  /**
   * Uploads a construction estimate document (PDF or image).
   * Uses multipart/form-data.
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadResponse>("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Triggers the OCR and parsing processing sequence for a given documentId.
   */
  async processDocument(documentId: string): Promise<ProcessResponse> {
    const response = await apiClient.post<ProcessResponse>(`/api/process/${documentId}`);
    return response.data;
  },

  /**
   * Retrieves the structured JSON results parsed from the document.
   */
  async getResult(documentId: string): Promise<ResultResponse> {
    const response = await apiClient.get<ResultResponse>(`/api/result/${documentId}`);
    return response.data;
  },
};
