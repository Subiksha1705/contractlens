import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContractById,
  getFindingsByVersion,
  listVersionsByContract,
} from "@/lib/db/queries";
import { buildContractSummary } from "@/lib/summary/build";
import { PrintButton } from "@/components/PrintButton";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building,
  HelpCircle,
  FileCheck2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContractSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ versionId?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  const allVersions = await listVersionsByContract(id);
  const selectedVersionId = sParams.versionId;
  const version = selectedVersionId
    ? allVersions.find((v) => v.id === selectedVersionId) ?? allVersions[0]
    : allVersions[0];

  if (!version) {
    notFound();
  }

  const allFindings = await getFindingsByVersion(version.id);
  const summary = buildContractSummary(contract, version, allFindings);

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-8 print:py-2 print:px-2 print:max-w-none text-slate-900">
      {/* Navigation & Print Controls */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href={`/contracts/${id}${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Review Workspace
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-500">
            Version {summary.versionNumber} of {allVersions.length}
          </span>
          <PrintButton />
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileCheck2 className="w-5 h-5 text-indigo-600 print:text-black" />
                <span className="uppercase text-[11px] font-bold tracking-wider text-indigo-700">
                  Reviewed Contract Summary
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.contractTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Version {summary.versionNumber} &bull; Generated on {new Date(summary.generatedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {summary.approvedCount} Approved
              </div>
              {summary.staleCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {summary.staleCount} Stale
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Parties & Effective Date */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4">
            1. Parties & Effective Date
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.parties.length > 0 ? (
              summary.parties.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {p.role}
                  </p>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-400" /> {p.name}
                  </p>
                  {!p.isApproved && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      Pending Confirmation
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No parties extracted.</p>
            )}

            {summary.effectiveDate && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Effective Date
                </p>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> {summary.effectiveDate.value}
                </p>
                {!summary.effectiveDate.isApproved && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    Pending Confirmation
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Key Governance & Terms (Approved) */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4">
            2. Term, Renewal & Termination Provisions (Approved)
          </h2>
          {summary.governanceAndTerms.length > 0 ? (
            <div className="space-y-3">
              {summary.governanceAndTerms.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">{item.value}</p>
                  {item.deadlineBasis && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <strong>Basis:</strong> {item.deadlineBasis}
                    </p>
                  )}
                  <blockquote className="text-[11px] italic text-slate-500 border-l-2 border-slate-300 pl-2.5">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 italic">
              No approved term, renewal, or termination clauses yet. Items in review appear below.
            </div>
          )}
        </section>

        {/* Section 3: Obligations & Deadlines (Approved) */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4">
            3. Obligations & Upcoming Deadlines (Approved)
          </h2>
          {summary.obligationsAndDeadlines.length > 0 ? (
            <div className="space-y-3">
              {summary.obligationsAndDeadlines.map((ob) => (
                <div
                  key={ob.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{ob.title}</h3>
                    {ob.deadlineDate && (
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs">
                        Due: {new Date(ob.deadlineDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">{ob.value}</p>
                  {ob.responsibleParty && (
                    <p className="text-slate-600 font-semibold text-[11px]">
                      Responsible: {ob.responsibleParty}
                    </p>
                  )}
                  {ob.deadlineBasis && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <strong>Date Logic:</strong> {ob.deadlineBasis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 italic">
              No approved obligations or dated items.
            </div>
          )}
        </section>

        {/* Section 4: Pending / Uncertain / Stale Items */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-amber-900 uppercase tracking-wider text-xs border-b border-amber-200 pb-2 mb-4">
            4. Items Requiring Human Attention & Confirmation ({summary.attentionItems.length})
          </h2>
          {summary.attentionItems.length > 0 ? (
            <div className="space-y-3">
              {summary.attentionItems.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {att.type}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{att.title}</h3>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      {att.reviewStatus === "potentially_stale"
                        ? "Potentially Stale"
                        : att.certainty === "uncertain"
                        ? "Uncertain"
                        : "Pending Review"}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium">{att.value}</p>

                  {att.staleReason && (
                    <p className="text-amber-900 bg-amber-100/70 p-2 rounded-lg font-medium">
                      <strong>Outdated Warning:</strong> {att.staleReason}
                    </p>
                  )}

                  {att.uncertaintyReason && (
                    <p className="text-amber-900">
                      <strong>Uncertainty Basis:</strong> {att.uncertaintyReason}
                    </p>
                  )}

                  {att.clarificationQuestion && (
                    <p className="text-amber-800 font-medium flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <strong>Question for Legal / Business Team:</strong> {att.clarificationQuestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              All items in this version have been reviewed and approved.
            </div>
          )}
        </section>

        {/* Section 5: Review Metadata & Rejected Items */}
        <section className="mb-10 text-xs text-slate-500 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            Total Clauses Extracted: <strong>{summary.totalFindingsCount}</strong> &bull; Approved:{" "}
            <strong className="text-emerald-700">{summary.approvedCount}</strong> &bull; Pending:{" "}
            <strong>{summary.pendingCount}</strong> &bull; Rejected: <strong>{summary.rejectedCount}</strong>
          </div>
          <div className="font-mono text-[11px]">Source: {summary.sourceKind.toUpperCase()}</div>
        </section>

        {/* Mandatory Legal Disclaimer */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-700 mb-1">Disclaimer</p>
          <p>{summary.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
