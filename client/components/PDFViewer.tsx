"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Monitor } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// Import styling for react-pdf layers to match modern aesthetics
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the PDF worker via CDN for absolute reliability in Next.js/React 19 environments
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File | null;
}

export function PDFViewer({ file }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      setIsPdf(false);
      setNumPages(null);
      setPageNumber(1);
      setUseFallback(false);
      return;
    }

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    const ext = file.name.split(".").pop()?.toLowerCase();
    setIsPdf(ext === "pdf");

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("react-pdf loading failed:", error);
    setUseFallback(true);
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  if (!file || !fileUrl) {
    return (
      <div className="w-full h-[600px] border border-zinc-200 bg-zinc-50 rounded-2xl flex flex-col items-center justify-center text-zinc-400 p-4">
        <FileText className="w-12 h-12 mb-3 stroke-[1.5]" />
        <p className="font-semibold text-zinc-500">Document Preview</p>
        <p className="text-sm text-zinc-400 text-center max-w-[280px] mt-1">
          Select and upload an estimate file to view the original content here.
        </p>
      </div>
    );
  }

  // Render Image Preview
  if (!isPdf) {
    return (
      <div className="w-full border border-zinc-200 bg-zinc-100 rounded-2xl p-4 flex flex-col h-[600px]">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
          <h3 className="font-bold text-zinc-800 text-sm">Image Preview</h3>
          <span className="text-xs bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded uppercase font-semibold">
            {file.name.split(".").pop()}
          </span>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-white rounded-xl border border-zinc-200 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      </div>
    );
  }

  // Render PDF Preview with fallback
  return (
    <div className="w-full border border-zinc-200 bg-zinc-100 rounded-2xl p-4 flex flex-col h-[600px] animate-in fade-in duration-300">
      {/* Viewer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-zinc-800 text-sm">Document Preview</h3>
          {numPages && !useFallback && (
            <span className="text-xs text-zinc-500 font-medium">
              Page {pageNumber} of {numPages}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isPdf && !useFallback && (
            <div className="flex items-center space-x-1 border-r border-zinc-300 pr-2 mr-2">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-zinc-200 rounded text-zinc-600 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-zinc-200 rounded text-zinc-600 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <button
            onClick={() => setUseFallback(!useFallback)}
            className={`p-1 flex items-center space-x-1.5 text-xs rounded px-2.5 py-1 transition-colors cursor-pointer ${
              useFallback
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
            }`}
            title={useFallback ? "Switch to Interactive Viewer" : "Switch to Browser Viewer"}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{useFallback ? "Interactive" : "Browser Viewer"}</span>
          </button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto bg-white border border-zinc-200 rounded-xl flex flex-col items-center relative">
        {useFallback ? (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 rounded-xl"
            title="PDF Native Viewer"
          />
        ) : (
          <div className="flex-1 overflow-auto w-full p-4 flex justify-center items-start">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span>Loading PDF...</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={true}
                className="shadow-md rounded border border-zinc-200"
              />
            </Document>
          </div>
        )}
      </div>

      {/* Footer Controls for react-pdf */}
      {isPdf && !useFallback && numPages && numPages > 1 && (
        <div className="flex items-center justify-between mt-3 flex-shrink-0 bg-white border border-zinc-200 rounded-xl p-2">
          <button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            className="flex items-center space-x-1 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <span className="text-zinc-600 font-semibold text-sm">
            {pageNumber} / {numPages}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
            className="flex items-center space-x-1 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
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

export default PDFViewer;
