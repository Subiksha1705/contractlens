import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface EvidenceQuoteProps {
  quote: string;
  status: "verified" | "unverified";
  page?: number | null;
  section?: string | null;
}

export function EvidenceQuote({ quote, status, page, section }: EvidenceQuoteProps) {
  const isVerified = status === "verified";

  return (
    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/70 p-3.5 rounded-xl text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Verbatim Evidence:</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
              isVerified
                ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
                : "bg-rose-100/70 text-rose-800 border border-rose-200"
            }`}
          >
            {isVerified ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Match
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-600" /> Quote Not Found in Document
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
            {page !== null && page !== undefined ? `Page ${page}` : "Page unavailable"}
          </span>
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[200px]" title={section ?? undefined}>
            {section ? section : "Section unavailable"}
          </span>
        </div>
      </div>

      <blockquote className="font-mono text-slate-800 italic border-l-2 border-indigo-400 pl-2.5 py-0.5 bg-white/60 rounded-r">
        &ldquo;{quote}&rdquo;
      </blockquote>
    </div>
  );
}
