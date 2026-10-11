import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContractById,
  getFindingsByVersion,
  listVersionsByContract,
  listContracts,
} from "@/lib/db/queries";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  FileCheck2,
  GitCompare,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContractReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ versionId?: string; error?: string; status?: string; certainty?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};

  // Concurrent queries for fast loading
  const [contract, allVersions, allContracts] = await Promise.all([
    getContractById(id),
    listVersionsByContract(id),
    listContracts(),
  ]);

  if (!contract) {
    notFound();
  }

  const selectedVersionId = sParams.versionId;
  const version = selectedVersionId
    ? allVersions.find((v) => v.id === selectedVersionId) ?? allVersions[0]
    : allVersions[0];

  const findingsList = version ? await getFindingsByVersion(version.id) : [];

  const isMock = version?.aiProvider === "mock";
  const isFailed = version?.extractionStatus === "failed";
  const isPartial = version?.extractionStatus === "partial";

  // Reusable dropdown items
  const contractDropdownItems: DropdownItem[] = allContracts.map((c) => ({
    id: c.id,
    label: c.title,
    sublabel: `Uploaded ${new Date(c.createdAt).toLocaleDateString()}`,
    href: `/contracts/${c.id}`,
  }));

  const versionDropdownItems: DropdownItem[] = allVersions.map((v) => ({
    id: v.id,
    label: `v${v.versionNumber}`,
    sublabel: `${v.sourceKind.toUpperCase()} • ${v.aiModel}`,
    badge: v.id === version?.id ? "Active" : undefined,
    badgeColor: "blue",
    href: `/contracts/${id}?versionId=${v.id}`,
  }));

  return (
    <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 flex flex-col min-h-screen text-slate-900">
      {/* DocuSign Studio Top Bar with Reusable Dropdowns */}
      <header className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
            title="Back to Contracts Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {contract.title}
              </h1>
              {isMock && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Mock Provider
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Uploaded {new Date(contract.createdAt).toLocaleDateString()} &bull; Source: {version?.sourceKind.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Dropdowns (Less Clicks) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch Contract Dropdown */}
          {allContracts.length > 1 && (
            <Dropdown
              label="Switch Contract"
              icon={<Layers className="w-3.5 h-3.5 text-[#005CB9]" />}
              items={contractDropdownItems}
              selectedId={id}
              buttonVariant="subtle"
            />
          )}

          {/* Version Switcher Dropdown */}
          {allVersions.length > 1 && (
            <Dropdown
              label={`v${version?.versionNumber ?? 1}`}
              icon={<GitCompare className="w-3.5 h-3.5 text-slate-500" />}
              items={versionDropdownItems}
              selectedId={version?.id}
              buttonVariant="subtle"
            />
          )}

          {/* Quick Sub-navigation */}
          <Link
            href={`/contracts/${id}/dashboard${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#005CB9]" /> Dashboard
          </Link>

          <Link
            href={`/contracts/${id}/summary${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Summary (PDF)
          </Link>

          <Link
            href={`/contracts/${id}/versions`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-600" /> Diff ({allVersions.length})
          </Link>

          {isFailed && (
            <form action={`/api/contracts/${id}/rerun`} method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-run
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Notices */}
      {version?.truncated && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Document Truncated:</strong> Input exceeded character limit and was truncated safely at a paragraph boundary.
          </span>
        </div>
      )}

      {isPartial && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Partial Extraction:</strong> Some items could not be parsed and were safely salvaged.
          </span>
        </div>
      )}

      {isFailed && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Extraction Failed:</strong> {version?.extractionError || "AI model output was malformed."}
          </span>
        </div>
      )}

      {/* Interactive Review Workspace Studio with Internal Scrolling */}
      {version && (
        <ReviewWorkspace
          initialFindings={findingsList}
          rawText={version.fullText}
          fileName={version.fileName}
          sourceKind={version.sourceKind}
          contractTitle={contract.title}
          contractId={contract.id}
          initialStatus={sParams.status}
          initialCertainty={sParams.certainty}
        />
      )}
    </div>
  );
}
