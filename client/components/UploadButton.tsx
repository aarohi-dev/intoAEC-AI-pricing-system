"use client";

import React from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

interface UploadButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export function UploadButton({ onClick, disabled, loading }: UploadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full h-12 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-600/35 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:bg-zinc-300 disabled:shadow-none disabled:pointer-events-none cursor-pointer`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing Estimate...</span>
        </>
      ) : (
        <>
          <span>Analyze Document</span>
          <ArrowUpRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </>
      )}
    </button>
  );
}
export default UploadButton;
