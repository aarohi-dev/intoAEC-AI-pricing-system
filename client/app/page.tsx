"use client";

import React from "react";
import { UploadCard } from "../components/UploadCard";
import { PDFViewer } from "../components/PDFViewer";
import { JSONViewer } from "../components/JSONViewer";
import { useUpload } from "../hooks/useUpload";
import { FileText, Cpu, CheckCircle } from "lucide-react";

export default function Home() {
  const {
    selectedFile,
    uploadStatus,
    processingStatus,
    jsonResult,
    loading,
    selectFile,
    startUploadAndProcess,
    reset,
  } = useUpload();

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col">
      {/* Header Bar */}
      <header className="w-full bg-white border-b border-zinc-200 py-5 px-6 sticky top-0 z-40 shadow-sm shadow-zinc-100/50">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/25">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-zinc-950 tracking-tight">
                intoAEC Estimate OCR Platform
              </h1>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">
                Gemini Backend Integration Console
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Online</span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Row 1: Document Upload Panel */}
        <section className="max-w-[800px] mx-auto w-full">
          <UploadCard
            selectedFile={selectedFile}
            uploadStatus={uploadStatus}
            processingStatus={processingStatus}
            loading={loading}
            onFileSelect={selectFile}
            onFileRemove={() => selectFile(null)}
            onUpload={startUploadAndProcess}
            onReset={reset}
            hasResult={!!jsonResult}
          />
        </section>

        {/* Row 2: Grid view for PDF preview and parsed outputs */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Panel: Preview of File */}
          <article className="bg-white rounded-3xl border border-zinc-200 p-4 md:p-6 shadow-md">
            <h2 className="text-base md:text-lg font-bold text-zinc-800 mb-3 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Original Document Preview</span>
            </h2>
            <PDFViewer file={selectedFile} />
          </article>

          {/* Right Panel: Extraction Output JSON */}
          <article className="bg-white rounded-3xl border border-zinc-200 p-4 md:p-6 shadow-md">
            <h2 className="text-base md:text-lg font-bold text-zinc-800 mb-3 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>Extracted Pricing Output (JSON)</span>
            </h2>
            <JSONViewer
              data={jsonResult}
              loading={uploadStatus === "success" && processingStatus === "processing"}
            />
          </article>
        </section>

      </main>

      {/* Footer Details */}
      <footer className="w-full bg-white border-t border-zinc-200 py-6 px-6 mt-12 text-center text-xs text-zinc-500 font-medium">
        <div className="max-w-[1200px] mx-auto">
          <p>© {new Date().getFullYear()} intoAEC-AI-pricing-system. Powered by Gemini Multimodal OCR extraction.</p>
        </div>
      </footer>
    </div>
  );
}
