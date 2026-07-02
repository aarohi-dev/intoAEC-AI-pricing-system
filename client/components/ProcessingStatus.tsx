"use client";

import React from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { UploadStatus, ProcessingStatus as ProcessStatusType } from "../hooks/useUpload";

interface ProcessingStatusProps {
  uploadStatus: UploadStatus;
  processingStatus: ProcessStatusType;
}

export function ProcessingStatus({ uploadStatus, processingStatus }: ProcessingStatusProps) {
  if (uploadStatus === "idle" && processingStatus === "idle") {
    return null;
  }

  // Helper to determine status icon and class
  const getStepState = (
    currentStatus: UploadStatus | ProcessStatusType,
    activeCondition: boolean
  ) => {
    if (currentStatus === "success") {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
        textClass: "text-zinc-800 font-semibold",
        subClass: "text-zinc-500",
      };
    }
    if (currentStatus === "error") {
      return {
        icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
        textClass: "text-red-700 font-semibold",
        subClass: "text-red-500",
      };
    }
    if (activeCondition) {
      return {
        icon: <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />,
        textClass: "text-blue-700 font-semibold",
        subClass: "text-blue-500",
      };
    }
    return {
      icon: <Circle className="w-5 h-5 text-zinc-300 flex-shrink-0" />,
      textClass: "text-zinc-400 font-medium",
      subClass: "text-zinc-400",
    };
  };

  const uploadStep = getStepState(uploadStatus, uploadStatus === "uploading");
  const processStep = getStepState(
    processingStatus,
    uploadStatus === "success" && processingStatus === "processing"
  );
  
  // Completed step: success when processingStatus is success
  const completedStatus = processingStatus === "success" ? "success" : "idle";
  const completedStep = getStepState(completedStatus, false);

  return (
    <div className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h3 className="text-zinc-800 font-bold text-sm uppercase tracking-wider mb-2">
        Processing Pipeline Status
      </h3>
      
      <div className="flex flex-col space-y-4">
        {/* Step 1: Uploading */}
        <div className="flex items-start space-x-3">
          <div className="mt-0.5">{uploadStep.icon}</div>
          <div>
            <p className={`text-sm ${uploadStep.textClass}`}>
              {uploadStatus === "uploading" ? "Uploading Document..." : uploadStatus === "success" ? "Document Uploaded" : uploadStatus === "error" ? "Upload Failed" : "Pending Upload"}
            </p>
            <p className={`text-xs ${uploadStep.subClass}`}>
              Saving original estimate file to uploads storage.
            </p>
          </div>
        </div>

        {/* Step 2: Processing */}
        <div className="flex items-start space-x-3">
          <div className="mt-0.5">{processStep.icon}</div>
          <div>
            <p className={`text-sm ${processStep.textClass}`}>
              {processingStatus === "processing" ? "Running OCR Analysis..." : processingStatus === "success" ? "Estimate Parsed" : processingStatus === "error" ? "Processing Failed" : "Pending Analysis"}
            </p>
            <p className={`text-xs ${processStep.subClass}`}>
              Gemini Multimodal OCR, layout parsing, and JSON generation.
            </p>
          </div>
        </div>

        {/* Step 3: Completed */}
        <div className="flex items-start space-x-3">
          <div className="mt-0.5">{completedStep.icon}</div>
          <div>
            <p className={`text-sm ${completedStep.textClass}`}>
              {processingStatus === "success" ? "Completed" : "Retrieving Results"}
            </p>
            <p className={`text-xs ${completedStep.subClass}`}>
              Pretty print final structured JSON estimate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProcessingStatus;
