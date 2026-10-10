import React from "react";
import Link from "next/link";
import { UploadForm } from "@/components/UploadForm";
import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";

export default function NewContractPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Zap className="w-3 h-3 text-emerald-600" /> Exactly 1 AI Call
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" /> Evidence Verification
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Upload Contract for Review
        </h1>
        <p className="mt-2 text-slate-600 text-sm">
          Upload a contract document (PDF, DOCX) or paste text. A single structured AI call extracts all parties, dates, clauses, ambiguities, and policy mismatches.
        </p>
      </div>

      <UploadForm endpoint="/api/contracts" redirectOnSuccess={true} />
    </div>
  );
}
