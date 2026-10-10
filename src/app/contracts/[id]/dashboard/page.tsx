import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContractById,
  listVersionsByContract,
  getContractDashboardStats,
} from "@/lib/db/queries";
import { StatCards } from "@/components/dashboard/StatCards";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { TypeChart } from "@/components/dashboard/TypeChart";
import { DeadlineWindowChart } from "@/components/dashboard/DeadlineWindowChart";
import {
  ArrowLeft,
  BarChart3,
  FileCheck2,
  Layers,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContractDashboardPage({
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

  const stats = await getContractDashboardStats(id, version.id);

  if (!stats) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 sm:px-8 text-slate-900">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <Link
          href={`/contracts/${id}${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Review Workspace
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {/* Version Switcher */}
          {allVersions.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
              <span className="text-[11px] font-semibold text-slate-500 px-2">Version:</span>
              {allVersions.map((v) => (
                <Link
                  key={v.id}
                  href={`/contracts/${id}/dashboard?versionId=${v.id}`}
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-medium transition ${
                    v.id === version.id
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  v{v.versionNumber}
                </Link>
              ))}
            </div>
          )}

          <Link
            href={`/contracts/${id}/summary${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Printable Summary
          </Link>
          <Link
            href={`/contracts/${id}/versions`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition"
          >
            <Layers className="w-3.5 h-3.5" /> Versions & Diff ({allVersions.length})
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="uppercase text-[11px] font-bold tracking-wider text-indigo-700">
                SQL Aggregates Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.contractTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic metrics for Version {stats.currentVersionNumber} &bull; Generated from live database queries at 0 AI token usage.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Live SQL Aggregates
          </div>
        </div>
      </div>

      {/* StatCards */}
      <StatCards
        totalFindings={stats.totalFindings}
        approvedCount={stats.approvedCount}
        pendingCount={stats.pendingCount}
        staleCount={stats.staleCount}
        uncertainCount={stats.uncertainCount}
        unverifiedCount={stats.unverifiedCount}
        totalVersions={stats.totalVersions}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart 1: Review Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Review Status Breakdown</h2>
            <p className="text-xs text-slate-400 mb-4">
              Approval and stale progress for current version
            </p>
          </div>
          <StatusChart data={stats.byStatus} />
        </div>

        {/* Chart 2: Finding Types */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Clause Categories</h2>
            <p className="text-xs text-slate-400 mb-4">
              Distribution across legal finding types
            </p>
          </div>
          <TypeChart data={stats.byType} />
        </div>

        {/* Chart 3: Deadline Windows */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Upcoming Deadline Windows</h2>
            <p className="text-xs text-slate-400 mb-4">
              Bucketed deterministic time horizons
            </p>
          </div>
          <DeadlineWindowChart data={stats.deadlinesByWindow} />
        </div>
      </div>
    </div>
  );
}
