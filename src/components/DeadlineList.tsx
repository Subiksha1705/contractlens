"use client";

import React from "react";
import { Finding } from "@/lib/db/schema";
import { calculateUpcomingReminders } from "@/lib/deadlines/reminders";
import { parseISO, differenceInCalendarDays, format } from "date-fns";
import { Calendar, AlertCircle, Bell } from "lucide-react";

interface DeadlineListProps {
  findings: Finding[];
}

export function DeadlineList({ findings }: DeadlineListProps) {
  // Filter for findings that have a deadlineDate, deadlineSpec, or deadlineFlag
  const deadlineFindings = findings.filter(
    (f) => f.deadlineDate || f.deadlineSpec || f.deadlineFlag
  );

  // Sort: dated items ascending, then unanchored items
  const sorted = [...deadlineFindings].sort((a, b) => {
    if (a.deadlineDate && b.deadlineDate) {
      return a.deadlineDate.localeCompare(b.deadlineDate);
    }
    if (a.deadlineDate && !b.deadlineDate) return -1;
    if (!a.deadlineDate && b.deadlineDate) return 1;
    return 0;
  });

  const today = new Date();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Upcoming Deadlines & Obligations ({sorted.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic dates calculated with mathematical bases. AI never guesses a deadline.
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs font-medium">
          No dated items or deadline specifications found in this contract.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 mt-2">
          {sorted.map((item) => {
            const hasDate = Boolean(item.deadlineDate);
            const dateObj = hasDate ? parseISO(item.deadlineDate!) : null;
            const diffDays = dateObj ? differenceInCalendarDays(dateObj, today) : null;
            const reminders = dateObj ? calculateUpcomingReminders(dateObj, today) : [];

            return (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="uppercase text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {item.type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    {item.deadlineFlag === "assumed_calendar_days" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Assumed Calendar Days
                      </span>
                    )}
                    {item.deadlineFlag === "needs_human_date" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Needs Human Date
                      </span>
                    )}
                  </div>

                  {/* Calculation Basis */}
                  {item.deadlineBasis && (
                    <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Basis:</strong> {item.deadlineBasis}
                    </p>
                  )}

                  {/* Reminders schedule preview */}
                  {reminders.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                      <Bell className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Next Alert: {format(reminders[0].reminderDate, "yyyy-MM-dd")} ({reminders[0].daysBefore}d before)</span>
                    </div>
                  )}
                </div>

                {/* Date Display Pill */}
                <div className="shrink-0 text-left sm:text-right">
                  {hasDate ? (
                    <div>
                      <div className="font-mono text-sm font-extrabold text-slate-900">
                        {item.deadlineDate}
                      </div>
                      <div
                        className={`text-xs font-semibold mt-0.5 ${
                          diffDays !== null && diffDays < 0
                            ? "text-rose-600"
                            : diffDays !== null && diffDays <= 14
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {diffDays !== null && diffDays < 0
                          ? `Past due by ${Math.abs(diffDays)}d`
                          : diffDays === 0
                          ? "Due Today"
                          : `In ${diffDays} days`}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      Date Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
