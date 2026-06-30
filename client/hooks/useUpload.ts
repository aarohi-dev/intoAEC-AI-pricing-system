import { useState, useCallback } from "react";
import { uploadService } from "../services/uploadService";
import { ResultResponse } from "../types/api";
import { toast } from "sonner";

export type UploadStatus = "idle" | "uploading" | "success" | "error";
export type ProcessingStatus = "idle" | "processing" | "success" | "error";

export function useUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle");
  const [jsonResult, setJsonResult] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback((file: File | null) => {
    setSelectedFile(file);
    // Reset other states when file changes
    setDocumentId(null);
    setUploadStatus("idle");
    setProcessingStatus("idle");
    setJsonResult(null);
    setError(null);
  }, []);

  const startUploadAndProcess = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadStatus("uploading");
    setProcessingStatus("idle");
    setJsonResult(null);

    let docId = "";

    try {
      // 1. Upload File
      toast.info("Uploading file to server...");
      const uploadResp = await uploadService.uploadFile(selectedFile);
      docId = uploadResp.documentId;
      setDocumentId(docId);
      setUploadStatus("success");
      toast.success("File uploaded successfully.");

      // 2. Process Document
      setProcessingStatus("processing");
      toast.info("Running OCR and estimate analysis pipeline...");
      await uploadService.processDocument(docId);
      setProcessingStatus("success");
      toast.success("Document processing completed!");

      // 3. Fetch Result
      toast.info("Fetching structured JSON results...");
      const resultResp = await uploadService.getResult(docId);
      setJsonResult(resultResp);
      toast.success("Estimate data retrieved successfully!");
      
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "An unexpected error occurred.";
      setError(errMsg);
      toast.error(`Operation failed: ${errMsg}`);
      
      // Determine which phase failed to update status flags
      if (uploadStatus === "uploading") {
        setUploadStatus("error");
      } else {
        setProcessingStatus("error");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedFile, uploadStatus]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setDocumentId(null);
    setUploadStatus("idle");
    setProcessingStatus("idle");
    setJsonResult(null);
    setLoading(false);
    setError(null);
    toast.info("Upload workspace reset.");
  }, []);

  return {
    selectedFile,
    documentId,
    uploadStatus,
    processingStatus,
    jsonResult,
    loading,
    error,
    selectFile,
    startUploadAndProcess,
    reset,
  };
}
export type UseUploadReturn = ReturnType<typeof useUpload>;
