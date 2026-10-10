import React from "react";
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from "lucide-react";

interface StatCardsProps {
  totalFindings: number;
  approvedCount: number;
  pendingCount: number;
  staleCount: number;
  uncertainCount: number;
  unverifiedCount: number;
  totalVersions: number;
}

export function StatCards({
  totalFindings,
  approvedCount,
  pendingCount,
  staleCount,
  uncertainCount,
  unverifiedCount,
  totalVersions,
}: StatCardsProps) {
  const approvedPct = totalFindings > 0 ? Math.round((approvedCount / totalFindings) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
      {/* Total */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs font-semibold text-slate-500 flex items-center justify-between">
          Total Clauses
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {totalVersions} {totalVersions === 1 ? "version" : "versions"}
          </span>
        </p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalFindings}</p>
        <p className="text-[11px] text-slate-400 mt-1">Extracted in 1 AI call</p>
      </div>

      {/* Approved */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs font-semibold text-emerald-600 flex items-center justify-between">
          Approved
          <CheckCircle2 className="w-3.5 h-3.5" />
        </p>
        <p className="text-2xl font-extrabold text-emerald-700 mt-1">{approvedCount}</p>
        <p className="text-[11px] text-emerald-600 font-medium mt-1">{approvedPct}% confirmed</p>
      </div>

      {/* Pending */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs font-semibold text-slate-600 flex items-center justify-between">
          Pending
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        </p>
        <p className="text-2xl font-extrabold text-slate-700 mt-1">{pendingCount}</p>
        <p className="text-[11px] text-slate-400 mt-1">Awaiting reviewer</p>
      </div>

      {/* Stale */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs font-semibold text-amber-600 flex items-center justify-between">
          Potentially Stale
          <AlertTriangle className="w-3.5 h-3.5" />
        </p>
        <p className="text-2xl font-extrabold text-amber-700 mt-1">{staleCount}</p>
        <p className="text-[11px] text-amber-600 font-medium mt-1">Version diff alerts</p>
      </div>

      {/* Uncertain */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
        <p className="text-xs font-semibold text-rose-600 flex items-center justify-between">
          Uncertain / Unverified
          <HelpCircle className="w-3.5 h-3.5" />
        </p>
        <p className="text-2xl font-extrabold text-rose-700 mt-1">
          {uncertainCount} <span className="text-sm font-semibold text-slate-400">/ {unverifiedCount}</span>
        </p>
        <p className="text-[11px] text-rose-600 font-medium mt-1">Requires clarification</p>
      </div>
    </div>
  );
}
