import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContractById, listVersionsByContract, getFindingsByVersion } from "@/lib/db/queries";
import { Finding } from "@/lib/db/schema";
import {
  ArrowLeft,
  Upload,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContractVersionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  const allVersions = await listVersionsByContract(id);
  // Sort versions ascending by versionNumber
  const versionsAsc = [...allVersions].sort((a, b) => a.versionNumber - b.versionNumber);
  const latestVersion = versionsAsc[versionsAsc.length - 1];

  // Fetch findings for all versions to calculate counts and diffs
  const versionFindingsMap = new Map();
  for (const v of allVersions) {
    const fList = await getFindingsByVersion(v.id);
    versionFindingsMap.set(v.id, fList);
  }

  // Find changed or stale items in latest version
  const latestFindings = latestVersion ? versionFindingsMap.get(latestVersion.id) || [] : [];
  const staleOrChangedFindings = latestFindings.filter(
    (f: Finding) => f.reviewStatus === "potentially_stale" || f.staleReason !== null
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 sm:px-8">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/contracts/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Review Workspace
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Total Versions: {allVersions.length}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Version History & Stale Detection
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Contract: <strong>{contract.title}</strong> &bull; Tracking evolution and preserving all human review decisions across versions.
            </p>
          </div>
        </div>

        {sParams.error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {sParams.error}
          </div>
        )}
      </div>

      {/* Upload New Version Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-8">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Upload className="w-4 h-4 text-indigo-600" /> Upload Version {allVersions.length + 1}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Upload an amended draft or addendum. Unchanged approvals are carried forward automatically; modified clauses are flagged as potentially stale for re-review (consumes exactly 1 AI extraction call).
        </p>

        <form
          action={`/api/contracts/${id}/versions`}
          method="POST"
          encType="multipart/form-data"
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contract File (PDF, DOCX, TXT)
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf,.docx,.txt"
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Or Paste Amended Contract Text
            </label>
            <textarea
              name="text"
              rows={4}
              placeholder="Paste the new version contract text here if no file is available..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition inline-flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" /> Ingest & Compare Version {allVersions.length + 1}
          </button>
        </form>
      </div>

      {/* Side-by-Side Diff of Stale / Changed Items */}
      {staleOrChangedFindings.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-300 rounded-2xl p-6 shadow-xs mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-amber-950">
              Changed Clauses Flagged for Re-Review ({staleOrChangedFindings.length})
            </h2>
          </div>
          <p className="text-xs text-amber-800 mb-5">
            The following findings were detected as modified or outdated in the latest version (v{latestVersion?.versionNumber}). Compare the values below to verify.
          </p>

          <div className="space-y-4">
            {staleOrChangedFindings.map((f: Finding) => (
              <div
                key={f.id}
                className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {f.type}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Potentially Stale
                  </span>
                </div>

                {f.staleReason && (
                  <p className="text-xs text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                    <strong>Version Diff:</strong> {f.staleReason}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-semibold text-slate-500 text-[11px] mb-1">
                      Current Extracted Value (v{latestVersion?.versionNumber})
                    </p>
                    <p className="text-slate-800 font-medium">{f.correctedValue ?? f.aiValue}</p>
                  </div>
                  <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
                    <p className="font-semibold text-indigo-700 text-[11px] mb-1">
                      Evidence Quote in New Version
                    </p>
                    <blockquote className="italic text-slate-700">
                      &ldquo;{f.evidenceQuote}&rdquo;
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version History List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" /> All Ingested Versions
        </h2>

        <div className="space-y-4">
          {versionsAsc.map((v) => {
            const fList = versionFindingsMap.get(v.id) || [];
            const approvedCount = fList.filter((f: Finding) => f.reviewStatus === "approved").length;
            const pendingCount = fList.filter((f: Finding) => f.reviewStatus === "pending").length;
            const staleCount = fList.filter((f: Finding) => f.reviewStatus === "potentially_stale").length;

            return (
              <div
                key={v.id}
                className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Version {v.versionNumber}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {v.sourceKind}
                    </span>
                    {v.id === latestVersion?.id && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Uploaded on {new Date(v.createdAt).toLocaleString()} &bull; Model: {v.aiModel}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                    <span className="text-slate-600">Total Findings: <strong>{fList.length}</strong></span>
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {approvedCount} Approved
                    </span>
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {pendingCount} Pending
                    </span>
                    {staleCount > 0 && (
                      <span className="text-amber-700 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> {staleCount} Stale
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/contracts/${id}?versionId=${v.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition text-center shrink-0"
                >
                  Open in Workspace &rarr;
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
