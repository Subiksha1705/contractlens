import React from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export type FindingReviewStatus = "pending" | "approved" | "rejected" | "potentially_stale";

interface StatusBadgeProps {
  status: FindingReviewStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
        </span>
      );
    case "potentially_stale":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Potentially Stale
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-500" /> Pending Review
        </span>
      );
  }
}
