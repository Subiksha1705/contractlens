import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContractById, getLatestVersion, getFindingsByVersion } from "@/lib/db/queries";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  Building,
} from "lucide-react";

export default async function ContractReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  const version = await getLatestVersion(id);
  const findingsList = version ? await getFindingsByVersion(version.id) : [];

  const isMock = version?.aiProvider === "mock";
  const isFailed = version?.extractionStatus === "failed";
  const isPartial = version?.extractionStatus === "partial";

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 sm:px-8">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          {isMock && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              Sample output (mock provider)
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
            v{version?.versionNumber ?? 1} &bull; {version?.aiModel}
          </span>
        </div>
      </div>

      {/* Contract Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {contract.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Uploaded on {new Date(contract.createdAt).toLocaleDateString()} &bull; Source: {version?.sourceKind.toUpperCase()}
            </p>
          </div>
          {isFailed && (
            <form action={`/api/contracts/${id}/rerun`} method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-run Extraction
              </button>
            </form>
          )}
        </div>

        {/* Truncation Notice */}
        {version?.truncated && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Document Truncated:</strong> Input exceeded character limit and was truncated at a paragraph boundary.
            </span>
          </div>
        )}

        {/* Status Notice */}
        {isPartial && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Partial Extraction:</strong> Some items could not be parsed and were safely salvaged.
            </span>
          </div>
        )}

        {isFailed && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
            <p className="font-semibold">Extraction Failed</p>
            <p className="text-xs mt-1 text-rose-700">
              {version?.extractionError || "AI model output was malformed."}
            </p>
          </div>
        )}
      </div>

      {/* Findings List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Extracted Findings ({findingsList.length})
          </h2>
          <span className="text-xs text-slate-500">
            Exactly 1 AI call executed for this version
          </span>
        </div>

        {findingsList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <p className="font-medium text-sm">No findings extracted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {findingsList.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-sm transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {f.type}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Certainty Badge */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        f.certainty === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {f.certainty === "confirmed" ? "Confirmed" : "Uncertain"}
                    </span>
                    {/* Evidence Status Badge */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        f.evidenceStatus === "verified"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {f.evidenceStatus === "verified" ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Quote Not Found
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Display Value */}
                <p className="text-sm text-slate-800 font-medium mt-2">{f.aiValue}</p>

                {/* Responsible Party if any */}
                {f.aiResponsibleParty && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" /> Responsible:{" "}
                    <span className="font-semibold text-slate-700">{f.aiResponsibleParty}</span>
                  </p>
                )}

                {/* Uncertainty Reason & Clarification Question */}
                {f.certainty === "uncertain" && (
                  <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs space-y-1">
                    {f.uncertaintyReason && (
                      <p className="text-amber-900">
                        <strong>Reason:</strong> {f.uncertaintyReason}
                      </p>
                    )}
                    {f.clarificationQuestion && (
                      <p className="text-amber-800 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <strong>Clarification Needed:</strong> {f.clarificationQuestion}
                      </p>
                    )}
                  </div>
                )}

                {/* Evidence Quote Box */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 bg-slate-50/60 p-3 rounded-lg text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-semibold text-slate-700">Verified Quote Evidence:</span>
                    <span>
                      {f.page !== null ? `Page ${f.page}` : "Page unavailable"} &bull;{" "}
                      {f.section ? f.section : "Section unavailable"}
                    </span>
                  </div>
                  <blockquote className="font-mono text-slate-700 italic border-l-2 border-indigo-400 pl-2">
                    &ldquo;{f.evidenceQuote}&rdquo;
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
