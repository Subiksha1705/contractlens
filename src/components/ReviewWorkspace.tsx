"use client";

import React, { useState, useMemo } from "react";
import { Finding } from "@/lib/db/schema";
import { FindingCard } from "./FindingCard";
import { DeadlineList } from "./DeadlineList";
import { Filter, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";

interface ReviewWorkspaceProps {
  initialFindings: Finding[];
}

export function ReviewWorkspace({
  initialFindings,
}: ReviewWorkspaceProps) {
  const [findingsList, setFindingsList] = useState<Finding[]>(initialFindings);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [certaintyFilter, setCertaintyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const handleFindingUpdated = (updated: Finding) => {
    setFindingsList((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
  };

  // Distinct types present in findings
  const availableTypes = useMemo(() => {
    const set = new Set(findingsList.map((f) => f.type));
    return Array.from(set).sort();
  }, [findingsList]);

  // Counts for filter chips
  const counts = useMemo(() => {
    return {
      total: findingsList.length,
      pending: findingsList.filter((f) => f.reviewStatus === "pending").length,
      approved: findingsList.filter((f) => f.reviewStatus === "approved").length,
      rejected: findingsList.filter((f) => f.reviewStatus === "rejected").length,
      stale: findingsList.filter((f) => f.reviewStatus === "potentially_stale").length,
      uncertain: findingsList.filter((f) => f.certainty === "uncertain").length,
      unverified: findingsList.filter((f) => f.evidenceStatus === "unverified").length,
    };
  }, [findingsList]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return findingsList.filter((f) => {
      if (statusFilter !== "all" && f.reviewStatus !== statusFilter) return false;
      if (certaintyFilter !== "all" && f.certainty !== certaintyFilter) return false;
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      return true;
    });
  }, [findingsList, statusFilter, certaintyFilter, typeFilter]);

  return (
    <div>
      {/* Top Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Findings</p>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.total}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </p>
          <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{counts.approved}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending
          </p>
          <p className="text-xl font-extrabold text-slate-700 mt-0.5">{counts.pending}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Stale / Uncertain
          </p>
          <p className="text-xl font-extrabold text-amber-700 mt-0.5">
            {counts.stale} stale &bull; {counts.uncertain} unc.
          </p>
        </div>
      </div>

      {/* Stale Findings Alert Banner */}
      {counts.stale > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {counts.stale} previously approved {counts.stale === 1 ? "item" : "items"} may be outdated — please re-review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Values or evidence changed between contract versions. Review each flagged item to confirm or update.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("potentially_stale")}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition shrink-0"
          >
            Filter Stale Items ({counts.stale})
          </button>
        </div>
      )}

      {/* Upcoming Deadlines Section */}
      <DeadlineList findings={findingsList} />

      {/* Filter Chips Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-indigo-600" /> Filter Findings
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Status:</span>
          {[
            { id: "all", label: `All (${counts.total})` },
            { id: "pending", label: `Pending (${counts.pending})` },
            { id: "approved", label: `Approved (${counts.approved})` },
            { id: "potentially_stale", label: `Potentially Stale (${counts.stale})` },
            { id: "rejected", label: `Rejected (${counts.rejected})` },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setStatusFilter(btn.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === btn.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Certainty Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Certainty:</span>
          {[
            { id: "all", label: "All" },
            { id: "confirmed", label: "Confirmed Only" },
            { id: "uncertain", label: `Uncertain (${counts.uncertain})` },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setCertaintyFilter(btn.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                certaintyFilter === btn.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        {availableTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium mr-1">Type:</span>
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                typeFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Types
            </button>
            {availableTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase transition ${
                  typeFilter === t
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm">No findings match the selected filters.</p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setCertaintyFilter("all");
                setTypeFilter("all");
              }}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onUpdate={handleFindingUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}
