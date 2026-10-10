import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  FileText,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  FileCheck2,
  Calendar,
  Layers,
} from "lucide-react";
import { listContracts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const contractsList = await listContracts();

  return (
    <div className="py-12 px-6 sm:px-12 max-w-6xl mx-auto text-slate-900">
      {/* Hero Badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          Strict 1 AI Call Budget Architecture
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Verified Evidence Quotes
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
        Contract<span className="text-indigo-600">Lens</span>
      </h1>
      <p className="mt-4 text-xl sm:text-2xl text-slate-600 font-medium max-w-2xl leading-relaxed">
        Evidence-first, one-hit contract intelligence.
      </p>
      <p className="mt-3 text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed">
        Turn contracts into traceable, reviewable, deadline-ready obligations with exactly <strong>one AI call per upload</strong>.
        Dates, summaries, version diffs, and verification run deterministically in code at 0 API cost.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm"
        >
          <FileText className="w-4 h-4" /> Upload & Extract Contract
        </Link>
        <Link
          href="/debug/parse"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition shadow-sm"
        >
          Parse Only (Debug)
        </Link>
        <Link
          href="/api/health"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition shadow-sm"
        >
          System Health <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Contracts Section (PRD §8.5: Multi-contract totals appear only as a simple contracts list) */}
      <div className="mt-16 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Uploaded Contracts ({contractsList.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any agreement to review evidence, manage deadlines, or export print-ready summaries.
            </p>
          </div>
          <Link
            href="/contracts/new"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            + New Contract
          </Link>
        </div>

        {contractsList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {contractsList.map((c) => (
              <div
                key={c.id}
                className="py-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 px-3 rounded-xl transition"
              >
                <div>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                  >
                    {c.title}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Uploaded on {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/contracts/${c.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Review Workspace
                  </Link>
                  <Link
                    href={`/contracts/${c.id}/dashboard`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                  <Link
                    href={`/contracts/${c.id}/summary`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" /> Summary
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No contracts uploaded yet. Click{" "}
            <Link href="/contracts/new" className="text-indigo-600 font-semibold underline">
              Upload & Extract Contract
            </Link>{" "}
            to begin.
          </div>
        )}
      </div>

      {/* Key Guarantees Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
            1
          </div>
          <h3 className="font-semibold text-slate-900 text-base">One Upload = One AI Call</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Extraction, ambiguity detection, clarification questions, and policy checks are packed into a single structured call. Zero wasteful round-trips.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base">Evidence-Verified Quotes</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Every finding carries a verbatim quote verified against the document text by deterministic code. Unverified findings are flagged as uncertain.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base">Deterministic Deadlines</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Notice periods, renewals, and payment terms are calculated with clear mathematical bases. AI never guesses a deadline.
          </p>
        </div>
      </div>
    </div>
  );
}
