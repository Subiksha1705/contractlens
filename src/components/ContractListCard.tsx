"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Contract } from "@/lib/db/schema";
import {
  Layers,
  Search,
  Trash2,
  BarChart3,
  FileCheck2,
  Calendar,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ContractListCardProps {
  initialContracts: Contract[];
}

export function ContractListCard({ initialContracts }: ContractListCardProps) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredContracts = contracts.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete contract");
      }
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting contract");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
      {/* Header with Title and Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#005CB9]" /> Contracts Workspace ({contracts.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any agreement to review evidence, manage deadlines, or export print-ready summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#005CB9] transition"
            />
          </div>

          <Link
            href="/contracts/new"
            className="text-xs font-bold text-[#005CB9] hover:underline shrink-0"
          >
            + Upload New
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Internal Scrollable Contracts Container */}
      <div className="max-h-[460px] overflow-y-auto scrollbar-thin border border-slate-100 rounded-2xl divide-y divide-slate-100 bg-white">
        {filteredContracts.length > 0 ? (
          filteredContracts.map((c) => (
            <div
              key={c.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition group"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/contracts/${c.id}`}
                  className="text-sm font-bold text-slate-900 hover:text-[#005CB9] transition flex items-center gap-1.5 truncate"
                >
                  <span className="truncate">{c.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                </Link>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Uploaded on {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Direct Action Buttons - Less Clicks */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/contracts/${c.id}`}
                  className="px-3 py-1.5 rounded-lg bg-[#005CB9] hover:bg-[#004890] text-white text-xs font-semibold shadow-xs transition"
                >
                  Review Studio
                </Link>
                <Link
                  href={`/contracts/${c.id}/dashboard`}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                  title="View Contract Dashboard"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#005CB9]" /> Dashboard
                </Link>
                <Link
                  href={`/contracts/${c.id}/summary`}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center gap-1"
                  title="Print / Save Summary PDF"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Summary
                </Link>

                {/* Delete Button */}
                {confirmDeleteId === c.id ? (
                  <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                    <span className="text-[11px] font-bold text-rose-700 px-1">Delete?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Yes"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete contract and all associated versions"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            {searchQuery
              ? `No contracts match "${searchQuery}".`
              : "No contracts uploaded yet."}
          </div>
        )}
      </div>
    </div>
  );
}
