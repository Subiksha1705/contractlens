import React from "react";
import Link from "next/link";
import { UploadForm } from "@/components/UploadForm";
import { ArrowLeft } from "lucide-react";

export default function DebugParsePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Document Ingestion Debugger
        </h1>
        <p className="mt-2 text-slate-600 text-sm">
          Test unpdf page offsets, mammoth docx text extraction, and plain text normalization without firing any AI requests.
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
