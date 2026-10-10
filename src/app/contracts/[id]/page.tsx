import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContractById, getLatestVersion, getFindingsByVersion } from "@/lib/db/queries";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export const dynamic = "force-dynamic";

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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition"
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

      {/* Interactive Review Workspace */}
      {version && (
        <ReviewWorkspace initialFindings={findingsList} />
      )}
    </div>
  );
}
