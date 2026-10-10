"use client";

import React from "react";
import { sanitizeErrorMessage } from "@/lib/security/sanitize";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const safeMessage = sanitizeErrorMessage(error.message);

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <h1 className="text-xl font-extrabold text-slate-900">Application Error</h1>
          <p className="text-xs text-slate-500 mt-2">{safeMessage}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 px-4 py-2 bg-[#005CB9] text-white rounded-xl text-xs font-semibold hover:bg-[#004890] transition"
          >
            Reload ContractLens
          </button>
        </div>
      </body>
    </html>
  );
}
