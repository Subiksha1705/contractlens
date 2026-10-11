"use client";

import React, { useState } from "react";
import { Finding } from "@/lib/db/schema";
import { EvidenceQuote } from "./EvidenceQuote";
import { StatusBadge } from "./StatusBadge";
import {
  Check,
  X,
  Edit2,
  RotateCcw,
  Building,
  HelpCircle,
  AlertTriangle,
  Loader2,
  FileSearch,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface FindingCardProps {
  finding: Finding;
  onUpdate?: (updated: Finding) => void;
  onSelectEvidence?: (quote: string) => void;
  isHighlighted?: boolean;
}

export function FindingCard({
  finding: initialFinding,
  onUpdate,
  onSelectEvidence,
  isHighlighted = false,
}: FindingCardProps) {
  const { toast } = useToast();
  const [finding, setFinding] = useState<Finding>(initialFinding);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(finding.correctedValue ?? finding.aiValue);
  const [editParty, setEditParty] = useState(finding.correctedResponsibleParty ?? finding.aiResponsibleParty ?? "");
  const [editDate, setEditDate] = useState(finding.correctedDeadlineDate ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayValue = finding.correctedValue ?? finding.aiValue;
  const displayParty = finding.correctedResponsibleParty ?? finding.aiResponsibleParty;
  const isEdited = finding.correctedValue !== null || finding.correctedResponsibleParty !== null || finding.correctedDeadlineDate !== null;

  const handleAction = async (
    action: "approve" | "reject" | "reset" | "edit",
    extraBody: Record<string, unknown> = {}
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/findings/${finding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update finding.");
      }

      setFinding(data.finding);
      if (onUpdate) onUpdate(data.finding);
      setIsEditing(false);
      setShowConfirmModal(false);

      if (action === "approve") {
        toast.success("Clause Approved", `Approved "${finding.title}"`);
      } else if (action === "reject") {
        toast.info("Clause Rejected", `Marked "${finding.title}" as rejected`);
      } else if (action === "edit") {
        toast.success("Corrections Saved", `Updated details for "${finding.title}"`);
      } else if (action === "reset") {
        toast.info("Reset to AI Value", `Reverted "${finding.title}" back to extracted value`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error("Action Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveClick = () => {
    if (finding.evidenceStatus === "unverified") {
      toast.warning("Unverified Quote", "Review unverified quote before approving.");
      setShowConfirmModal(true);
    } else {
      handleAction("approve");
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction("edit", {
      correctedValue: editValue.trim(),
      correctedResponsibleParty: editParty.trim() || null,
      correctedDeadlineDate: editDate ? editDate : null,
    });
  };

  const handleResetToAi = () => {
    handleAction("reset");
    setEditValue(finding.aiValue);
    setEditParty(finding.aiResponsibleParty ?? "");
    setEditDate("");
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-5 sm:p-6 transition ${
        isHighlighted
          ? "border-[#005CB9] ring-2 ring-[#005CB9]/30 shadow-md bg-blue-50/10"
          : "border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="uppercase text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
            {finding.type}
          </span>
          <h3 className="text-base font-bold text-slate-900">{finding.title}</h3>
          {isEdited && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              User-corrected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <StatusBadge status={finding.reviewStatus} />

          {/* Certainty Badge */}
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              finding.certainty === "confirmed"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {finding.certainty === "confirmed" ? "Confirmed" : "Uncertain"}
          </span>
        </div>
      </div>

      {/* Main Content / Edit Mode */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corrected Finding Value
            </label>
            <textarea
              rows={3}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsible Party
              </label>
              <input
                type="text"
                value={editParty}
                onChange={(e) => setEditParty(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corrected Deadline Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Save Corrections
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="my-2">
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {displayValue}
          </p>
          {displayParty && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Responsible:{" "}
              <span className="font-semibold text-slate-700">{displayParty}</span>
            </p>
          )}
        </div>
      )}

      {/* Stale Warning & Version Diff Banner */}
      {(finding.reviewStatus === "potentially_stale" || finding.staleReason) && (
        <div className="my-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Potentially Stale / Outdated Finding</span>
          </div>
          {finding.staleReason && (
            <p className="text-amber-800 text-xs">
              <strong>Version Diff:</strong> {finding.staleReason}
            </p>
          )}
          <p className="text-[11px] text-amber-700 italic">
            This finding differed or evidence changed from the previous version. Please review before approving.
          </p>
        </div>
      )}

      {/* Uncertainty Notice */}
      {finding.certainty === "uncertain" && (
        <div className="my-3 p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs space-y-1">
          {finding.uncertaintyReason && (
            <p className="text-amber-900">
              <strong>Uncertainty Basis:</strong> {finding.uncertaintyReason}
            </p>
          )}
          {finding.clarificationQuestion && (
            <p className="text-amber-800 flex items-center gap-1.5 font-medium">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <strong>Clarification Question:</strong> {finding.clarificationQuestion}
            </p>
          )}
        </div>
      )}

      {/* Evidence Quote Component */}
      <EvidenceQuote
        quote={finding.evidenceQuote}
        status={finding.evidenceStatus}
        page={finding.page}
        section={finding.section}
      />

      {/* Error Banner */}
      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApproveClick}
            disabled={isSubmitting || finding.reviewStatus === "approved"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approve
          </button>
          <button
            type="button"
            onClick={() => handleAction("reject")}
            disabled={isSubmitting || finding.reviewStatus === "rejected"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {onSelectEvidence && finding.evidenceQuote && (
            <button
              type="button"
              onClick={() => onSelectEvidence(finding.evidenceQuote)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005CB9] text-xs font-semibold border border-blue-200 transition"
              title="Locate and highlight this clause in contract document"
            >
              <FileSearch className="w-3.5 h-3.5" /> Locate in Doc
            </button>
          )}
          {isEdited && !isEditing && (
            <button
              type="button"
              onClick={handleResetToAi}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-medium transition"
              title="Revert corrections back to immutable AI value"
            >
              <RotateCcw className="w-3 h-3" /> Reset to AI value
            </button>
          )}
        </div>

        {/* Reviewed Timestamp */}
        {finding.reviewedAt && (
          <span suppressHydrationWarning className="text-[11px] text-slate-600 font-mono">
            Reviewed: {new Date(finding.reviewedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Unverified Confirmation Safety Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Confirm Unverified Quote
            </h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              This finding&#39;s quote was not found in the original contract text and is flagged as unverified. Per ContractLens USP safety protocol, approving it requires explicit human verification.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("approve", { confirmedUnverified: true })}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Confirm & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
