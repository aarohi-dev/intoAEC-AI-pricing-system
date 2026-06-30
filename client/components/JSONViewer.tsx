"use client";

import React, { useState } from "react";
import { Code2, Copy, Check, Terminal } from "lucide-react";
import { ResultResponse } from "../types/api";
import { toast } from "sonner";

interface JSONViewerProps {
  data: ResultResponse | null;
  loading: boolean;
}

export function JSONViewer({ data, loading }: JSONViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      toast.success("JSON copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy JSON.");
    }
  };

  return (
    <div className="w-full border border-zinc-200 bg-zinc-900 rounded-2xl p-4 flex flex-col h-[600px] shadow-lg animate-in fade-in duration-300">
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2 text-zinc-300">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-sm">Extracted JSON Schema Output</h3>
        </div>
        
        {data && (
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 overflow-auto bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs md:text-sm text-blue-300 relative flex flex-col select-text">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-10 select-none">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
            <span className="text-sm font-medium">Parsing estimate structure...</span>
          </div>
        ) : data ? (
          <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-2 leading-relaxed text-zinc-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-10 text-center px-4 select-none">
            <Code2 className="w-12 h-12 mb-3 text-zinc-600 stroke-[1.5]" />
            <p className="font-semibold text-zinc-400 text-sm">JSON Extraction Result</p>
            <p className="text-xs text-zinc-500 max-w-[280px] mt-1.5 leading-relaxed">
              Waiting for OCR... Once analysis completes, structured items will be rendered here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline fallback loader helper
function Loader2({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default JSONViewer;
