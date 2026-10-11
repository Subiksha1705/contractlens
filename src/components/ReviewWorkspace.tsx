"use client";

import React, { useState, useMemo } from "react";
import { Finding } from "@/lib/db/schema";
import { FindingCard } from "./FindingCard";
import { DeadlineList } from "./DeadlineList";
import { DocumentViewer } from "./DocumentViewer";
import {
  Filter,
  AlertCircle,
  FileText,
  Calendar,
  Columns2,
  ListFilter,
  BookOpen,
} from "lucide-react";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";

interface ReviewWorkspaceProps {
  initialFindings: Finding[];
  rawText?: string;
  fileName?: string | null;
  sourceKind?: string;
  contractTitle?: string;
  contractId?: string;
}

export function ReviewWorkspace({
  initialFindings,
  rawText = "",
  fileName,
  sourceKind = "pdf",
}: ReviewWorkspaceProps) {
  const { toast } = useToast();
  const [findingsList, setFindingsList] = useState<Finding[]>(initialFindings);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [certaintyFilter, setCertaintyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Active view tab: "findings" | "deadlines"
  const [activeTab, setActiveTab] = useState<"findings" | "deadlines">("findings");

  // Pane layout: "split" | "document" | "findings"
  const [paneMode, setPaneMode] = useState<"split" | "document" | "findings">("split");

  // Active highlighted evidence quote in document
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  const handleFindingUpdated = (updated: Finding) => {
    setFindingsList((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
  };

  // Distinct clause types
  const availableTypes = useMemo(() => {
    const set = new Set(findingsList.map((f) => f.type));
    return Array.from(set).sort();
  }, [findingsList]);

  // Reusable Dropdown items for Clause Type filter
  const typeDropdownItems: DropdownItem[] = useMemo(
    () => [
      { id: "all", label: `All Types (${availableTypes.length})` },
      ...availableTypes.map((t) => ({
        id: t,
        label: t.toUpperCase(),
        badge: String(findingsList.filter((f) => f.type === t).length),
        badgeColor: "blue" as const,
      })),
    ],
    [availableTypes, findingsList]
  );


  // Metric counts
  const counts = useMemo(() => {
    const total = findingsList.length;
    const approved = findingsList.filter((f) => f.reviewStatus === "approved").length;
    const pending = findingsList.filter((f) => f.reviewStatus === "pending").length;
    const rejected = findingsList.filter((f) => f.reviewStatus === "rejected").length;
    const stale = findingsList.filter((f) => f.reviewStatus === "potentially_stale").length;
    const uncertain = findingsList.filter((f) => f.certainty === "uncertain").length;
    const percentApproved = total > 0 ? Math.round((approved / total) * 100) : 0;
    const deadlinesCount = findingsList.filter(
      (f) => f.deadlineDate || f.deadlineSpec || f.deadlineFlag
    ).length;

    return {
      total,
      approved,
      pending,
      rejected,
      stale,
      uncertain,
      percentApproved,
      deadlinesCount,
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

  const hasDocument = Boolean(rawText && rawText.trim().length > 0);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">
      {/* Top Workspace Toolbar (DocuSign Style) */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Progress & Stat Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#005CB9] animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              Review Progress:
            </span>
            <span className="text-xs font-mono font-bold text-[#005CB9]">
              {counts.approved}/{counts.total} ({counts.percentApproved}%)
            </span>
          </div>

          <div className="hidden sm:block w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-[#005CB9] rounded-full transition-all duration-300"
              style={{ width: `${counts.percentApproved}%` }}
            />
          </div>

          {counts.stale > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-600" /> {counts.stale} Stale
            </span>
          )}
        </div>

        {/* View Mode & Tabs */}
        <div className="flex items-center gap-2">
          {/* Main Tab Switcher: Findings vs Deadlines */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("findings")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                activeTab === "findings"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-[#005CB9]" />
              Clauses ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("deadlines")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                activeTab === "deadlines"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Deadlines ({counts.deadlinesCount})
            </button>
          </div>

          {/* Dual-Pane View Switcher (when document exists) */}
          {hasDocument && (
            <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaneMode("split")}
                title="Split document and review cards"
                className={`p-1.5 rounded-lg transition ${
                  paneMode === "split"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPaneMode("document")}
                title="Document only"
                className={`p-1.5 rounded-lg transition ${
                  paneMode === "document"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPaneMode("findings")}
                title="Findings only"
                className={`p-1.5 rounded-lg transition ${
                  paneMode === "findings"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Dual-Pane Workspace with Independent Internal Scrolling */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left Pane: Document Canvas (Paper View) */}
        {hasDocument && (paneMode === "split" || paneMode === "document") && (
          <div
            className={`h-full overflow-hidden transition-all duration-200 ${
              paneMode === "document" ? "w-full" : "w-full lg:w-1/2"
            }`}
          >
            <DocumentViewer
              rawText={rawText}
              fileName={fileName}
              sourceKind={sourceKind}
              highlightQuote={selectedQuote}
              onClearHighlight={() => setSelectedQuote(null)}
            />
          </div>
        )}

        {/* Right Pane: Review & Obligations Drawer */}
        {(paneMode === "split" || paneMode === "findings" || !hasDocument) && (
          <div
            className={`h-full flex flex-col overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs transition-all duration-200 ${
              paneMode === "findings" || !hasDocument
                ? "w-full"
                : "w-full lg:w-1/2"
            }`}
          >
            {/* Drawer Internal Header: Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-2.5 shrink-0">
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-[#005CB9]" /> Status:
                </span>
                {[
                  { id: "all", label: `All (${counts.total})` },
                  { id: "pending", label: `Pending (${counts.pending})` },
                  { id: "approved", label: `Approved (${counts.approved})` },
                  { id: "potentially_stale", label: `Stale (${counts.stale})` },
                  { id: "rejected", label: `Rejected (${counts.rejected})` },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setStatusFilter(btn.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === btn.id
                        ? "bg-[#005CB9] text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Sub-Filters: Certainty & Type */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Certainty:</span>
                  <button
                    type="button"
                    onClick={() => setCertaintyFilter(certaintyFilter === "uncertain" ? "all" : "uncertain")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      certaintyFilter === "uncertain"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Uncertain ({counts.uncertain})
                  </button>
                </div>

                {availableTypes.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Dropdown
                      label={typeFilter === "all" ? "All Types" : typeFilter.toUpperCase()}
                      items={typeDropdownItems}
                      selectedId={typeFilter}
                      onSelect={(item) => setTypeFilter(item.id)}
                      buttonVariant="subtle"
                      align="right"
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Internal Scrolling Body for Findings or Deadlines */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
              {activeTab === "deadlines" ? (
                <DeadlineList findings={findingsList} />
              ) : (
                <>
                  {/* Stale Warning Banner */}
                  {counts.stale > 0 && statusFilter !== "potentially_stale" && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-amber-900 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{counts.stale} approved finding(s) may be stale from version differences.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("potentially_stale")}
                        className="text-xs font-bold text-amber-800 hover:underline shrink-0"
                      >
                        Review Stale
                      </button>
                    </div>
                  )}

                  {/* Finding Cards */}
                  {filteredFindings.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-sm text-slate-600">No findings match current filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setCertaintyFilter("all");
                          setTypeFilter("all");
                          toast.info("Filters Reset", "Showing all extracted clauses.");
                        }}
                        className="mt-2 text-xs font-bold text-[#005CB9] hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredFindings.map((finding) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        onUpdate={handleFindingUpdated}
                        onSelectEvidence={(quote) => setSelectedQuote(quote)}
                        isHighlighted={selectedQuote === finding.evidenceQuote}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
