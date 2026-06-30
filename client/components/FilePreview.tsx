"use client";

import React from "react";
import { FileText, FileImage, Trash2 } from "lucide-react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

export function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const fileExtension = file.name.split(".").pop()?.toUpperCase() || "UNKNOWN";
  const isImage = ["PNG", "JPG", "JPEG"].includes(fileExtension);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className={`p-3 rounded-xl ${isImage ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
          {isImage ? (
            <FileImage className="w-6 h-6 flex-shrink-0" />
          ) : (
            <FileText className="w-6 h-6 flex-shrink-0" />
          )}
        </div>
        <div className="overflow-hidden">
          <p className="text-zinc-800 font-semibold truncate pr-2 text-sm md:text-base" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center space-x-2 text-xs md:text-sm text-zinc-500 font-medium mt-0.5">
            <span>{formatFileSize(file.size)}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
            <span className="bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
              {fileExtension}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Remove file"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
export default FilePreview;
