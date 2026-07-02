"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function FileDropzone({ onFileAccepted, disabled }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAcceptFile = useCallback((file: File) => {
    // Validate file type
    const fileType = file.type;
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    
    const isValidType = ALLOWED_TYPES.includes(fileType) || ALLOWED_EXTENSIONS.includes(extension);
    
    if (!isValidType) {
      const errorMsg = `Unsupported file format. Supported formats: ${ALLOWED_EXTENSIONS.join(", ")}`;
      toast.error(errorMsg);
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      const errorMsg = `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 25 MB.`;
      toast.error(errorMsg);
      return;
    }

    onFileAccepted(file);
  }, [onFileAccepted]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAcceptFile(e.dataTransfer.files[0]);
    }
  }, [disabled, validateAndAcceptFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndAcceptFile(e.target.files[0]);
    }
  }, [validateAndAcceptFile]);

  const onButtonClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`relative w-full py-10 px-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
          : "border-zinc-300 hover:border-blue-400 bg-zinc-50/50 hover:bg-zinc-50"
      } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={false}
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div className="p-4 rounded-full bg-blue-50 text-blue-600 mb-4 transition-transform duration-300 group-hover:scale-110">
        <UploadCloud className="w-8 h-8" />
      </div>

      <p className="text-zinc-700 font-semibold text-center mb-1">
        Drag & drop estimate document here
      </p>
      
      <p className="text-zinc-500 text-sm text-center mb-3">
        or click to browse your local files
      </p>

      <span className="inline-block text-xs bg-zinc-200/80 text-zinc-600 px-3 py-1.5 rounded-full font-medium">
        PDF, PNG, JPG, JPEG (Max 25MB)
      </span>
    </div>
  );
}
export default FileDropzone;
