"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/security/sanitize";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error in development
    console.error("Application error captured by boundary:", sanitizeErrorMessage(error.message));
  }, [error]);

  const displayMessage = sanitizeErrorMessage(error.message || "An unexpected error occurred while loading this page.");

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-100 shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
          Something went wrong
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Unable to Load Workspace
        </h1>
        <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
          {displayMessage}
        </p>

        {error.digest && (
          <p className="text-[11px] font-mono text-slate-400 mt-2">
            Error Reference ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#005CB9] hover:bg-[#004890] text-white text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
