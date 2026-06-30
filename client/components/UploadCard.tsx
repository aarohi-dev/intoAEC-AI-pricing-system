"use client";

import React from "react";
import { FileDropzone } from "./FileDropzone";
import { FilePreview } from "./FilePreview";
import { UploadButton } from "./UploadButton";
import { ProcessingStatus } from "./ProcessingStatus";
import { UploadStatus, ProcessingStatus as ProcessStatusType } from "../hooks/useUpload";
import { RefreshCw } from "lucide-react";

interface UploadCardProps {
  selectedFile: File | null;
  uploadStatus: UploadStatus;
  processingStatus: ProcessStatusType;
  loading: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onUpload: () => void;
  onReset: () => void;
  hasResult: boolean;
}

export function UploadCard({
  selectedFile,
  uploadStatus,
  processingStatus,
  loading,
  onFileSelect,
  onFileRemove,
  onUpload,
  onReset,
  hasResult,
}: UploadCardProps) {
  return (
    <div className="w-full bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-100 p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900">
            Import Construction Estimate
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Upload estimate documents to parse item descriptions, quantities, and units.
          </p>
        </div>
        
        {hasResult && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            title="Reset and upload another file"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Workspace</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Step 1: Selection Dropzone */}
        {!selectedFile && (
          <FileDropzone onFileAccepted={onFileSelect} disabled={loading} />
        )}

        {/* Step 2: Selected File Preview */}
        {selectedFile && (
          <FilePreview
            file={selectedFile}
            onRemove={onFileRemove}
            disabled={loading}
          />
        )}

        {/* Step 3: Processing Timeline Progress */}
        {(uploadStatus !== "idle" || processingStatus !== "idle") && (
          <ProcessingStatus
            uploadStatus={uploadStatus}
            processingStatus={processingStatus}
          />
        )}

        {/* Step 4: Submission Action Button */}
        {selectedFile && uploadStatus === "idle" && (
          <UploadButton
            onClick={onUpload}
            disabled={!selectedFile}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
export default UploadCard;
