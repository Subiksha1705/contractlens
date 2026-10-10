"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  FileCheck,
} from "lucide-react";

interface DocumentViewerProps {
  rawText: string;
  fileName?: string | null;
  sourceKind?: string;
  highlightQuote?: string | null;
  onClearHighlight?: () => void;
  className?: string;
}

export function DocumentViewer({
  rawText,
  fileName,
  sourceKind = "pdf",
  highlightQuote,
  onClearHighlight,
  className = "",
}: DocumentViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLElement>(null);

  // Active search query derived from either typed input or clicked finding quote
  const activeQuery = (searchTerm || highlightQuote || "").trim();

  // Scroll to highlighted quote when it changes
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeQuery]);


  // Split into clean paragraphs
  const paragraphs = useMemo(() => {
    return rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [rawText]);

  // Helper to render text with highlighted snippets
  const renderParagraph = (text: string, index: number) => {
    if (!activeQuery) {
      return <span>{text}</span>;
    }


    // Try finding exact quote or words
    const lowerText = text.toLowerCase();
    const lowerQuery = activeQuery.toLowerCase().slice(0, 100); // truncate for regex safety
    const matchPos = lowerText.indexOf(lowerQuery);

    if (matchPos === -1) {
      return <span>{text}</span>;
    }

    const before = text.slice(0, matchPos);
    const match = text.slice(matchPos, matchPos + lowerQuery.length);
    const after = text.slice(matchPos + lowerQuery.length);

    return (
      <span>
        {before}
        <mark
          ref={index === 0 || highlightQuote ? highlightRef : undefined}
          className="bg-amber-200 text-amber-950 font-semibold px-1 py-0.5 rounded shadow-xs border border-amber-300 highlight-evidence"
        >
          {match}
        </mark>
        {after}
      </span>
    );
  };

  const fontSizeClass =
    fontSize === "sm" ? "text-xs leading-5" : fontSize === "lg" ? "text-sm leading-7" : "text-[13px] leading-6";

  return (
    <div
      className={`flex flex-col h-full bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden shadow-xs ${className} ${
        isExpanded ? "fixed inset-4 z-50 bg-white" : ""
      }`}
    >
      {/* Top Document Header Bar (DocuSign Style) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#005CB9]/10 text-[#005CB9] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {fileName || "Contract Source Document"}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Source: {sourceKind.toUpperCase()} &bull; {paragraphs.length} Sections
            </p>
          </div>
        </div>

        {/* Viewer Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Font sizing */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setFontSize("sm")}
              title="Small text"
              className={`p-1.5 rounded text-xs transition ${
                fontSize === "sm" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setFontSize("base")}
              title="Standard text"
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                fontSize === "base" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize("lg")}
              title="Large text"
              className={`p-1.5 rounded text-xs transition ${
                fontSize === "lg" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Exit full view" : "Expand document view"}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* In-Document Search & Active Filter Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm || (highlightQuote ?? "")}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search text or clause quote in contract..."
            className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#005CB9]"
          />
          {(searchTerm || highlightQuote) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                if (onClearHighlight) onClearHighlight();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

        {highlightQuote && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 shrink-0">
            <FileCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Finding Quote Located</span>
            <button
              type="button"
              onClick={onClearHighlight}
              className="ml-1 text-amber-600 hover:text-amber-900"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Internal Scrolling Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {paragraphs.map((para, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl document-sheet border border-slate-200/80 transition ${fontSizeClass}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-mono text-slate-400 select-none pt-0.5 shrink-0 w-6 text-right">
                  {i + 1}
                </span>
                <div className="text-slate-800 font-serif leading-relaxed flex-1 whitespace-pre-wrap">
                  {renderParagraph(para, i)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
