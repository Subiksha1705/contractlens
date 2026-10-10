import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContractById,
  listVersionsByContract,
  getContractDashboardStats,
  listContracts,
} from "@/lib/db/queries";
import { StatCards } from "@/components/dashboard/StatCards";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { TypeChart } from "@/components/dashboard/TypeChart";
import { DeadlineWindowChart } from "@/components/dashboard/DeadlineWindowChart";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import {
  ArrowLeft,
  BarChart3,
  FileCheck2,
  GitCompare,
  FileText,
  Sparkles,
  Layers,
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

  // Fetch contract, all versions, and full contracts list concurrently for maximum speed
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

  if (!version) {
    notFound();
  }

  // Fast SQL aggregate queries
  const stats = await getContractDashboardStats(id, version.id);

  if (!stats) {
    notFound();
  }

  // Contract switcher dropdown items (instant redirection across contracts)
  const contractDropdownItems: DropdownItem[] = allContracts.map((c) => ({
    id: c.id,
    label: c.title,
    sublabel: `Uploaded ${new Date(c.createdAt).toLocaleDateString()}`,
    href: `/contracts/${c.id}/dashboard`,
  }));

  // Version switcher dropdown items (instant redirection across versions)
  const versionDropdownItems: DropdownItem[] = allVersions.map((v) => ({
    id: v.id,
    label: `Version ${v.versionNumber}`,
    sublabel: `Source: ${v.sourceKind.toUpperCase()} • ${v.aiModel}`,
    badge: v.id === version.id ? "Current" : undefined,
    badgeColor: "blue",
    href: `/contracts/${id}/dashboard?versionId=${v.id}`,
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-5 sm:px-8 text-slate-900">
      {/* Top Navigation & Direct Redirection Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          href={`/contracts/${id}${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Review Studio
        </Link>

        {/* Dropdowns for Fast 1-Click Navigation (Less Clicks) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reusable Contract Switcher Dropdown with Redirection */}
          {allContracts.length > 1 && (
            <Dropdown
              label="Switch Contract"
              icon={<Layers className="w-3.5 h-3.5 text-[#005CB9]" />}
              items={contractDropdownItems}
              selectedId={id}
              buttonVariant="subtle"
            />
          )}

          {/* Reusable Version Switcher Dropdown with Redirection */}
          {allVersions.length > 1 && (
            <Dropdown
              label={`v${version.versionNumber}`}
              icon={<GitCompare className="w-3.5 h-3.5 text-slate-500" />}
              items={versionDropdownItems}
              selectedId={version.id}
              buttonVariant="subtle"
            />
          )}

          {/* Direct Actions */}
          <Link
            href={`/contracts/${id}${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#005CB9] hover:bg-[#004890] text-white text-xs font-semibold shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5" /> Review Studio
          </Link>

          <Link
            href={`/contracts/${id}/summary${selectedVersionId ? `?versionId=${selectedVersionId}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Printable Summary
          </Link>
        </div>
      </div>

      {/* Contract & Dashboard Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-[#005CB9]" />
              <span className="uppercase text-[11px] font-bold tracking-wider text-[#005CB9]">
                Contract Analytics & SQL Metrics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.contractTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live deterministic metrics for Version {stats.currentVersionNumber} &bull; Generated directly via Postgres aggregates at 0 AI token usage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              100% Deterministic (0 AI Cost)
            </span>
          </div>
        </div>
      </div>

      {/* 1. Stat Cards Row */}
      <StatCards
        totalFindings={stats.totalFindings}
        approvedCount={stats.approvedCount}
        pendingCount={stats.pendingCount}
        staleCount={stats.staleCount}
        uncertainCount={stats.uncertainCount}
        unverifiedCount={stats.unverifiedCount}
        totalVersions={stats.totalVersions}
      />

      {/* 2. Visual Charts Row (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Status Breakdown (Donut Chart) */}
        <StatusChart data={stats.byStatus} />

        {/* Clause Types Distribution (Bar Chart) */}
        <TypeChart data={stats.byType} />
      </div>

      {/* 3. Upcoming Obligations Time Horizon (Full Width) */}
      <div className="mt-8">
        <DeadlineWindowChart data={stats.deadlinesByWindow} />
      </div>
    </div>
  );
}

