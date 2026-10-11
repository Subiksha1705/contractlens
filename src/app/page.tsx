import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  Search,
  Calendar,
} from "lucide-react";

import { listContracts } from "@/lib/db/queries";
import { ContractListCard } from "@/components/ContractListCard";


export const dynamic = "force-dynamic";

export default async function Home() {
  let contractsList: Awaited<ReturnType<typeof listContracts>> = [];
  try {
    contractsList = await listContracts();
  } catch (err) {
    console.error("Home page DB query error:", err);
    contractsList = [];
  }

  return (
    <div className="py-10 px-6 sm:px-10 max-w-6xl mx-auto text-slate-900">
      {/* Top Navigation Bar / Brand Header */}
      <div className="flex items-center justify-between pb-8 mb-8 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#005CB9] text-white flex items-center justify-center font-black text-lg shadow-sm">
            C
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              Contract<span className="text-[#005CB9]">Lens</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#005CB9] border border-blue-200">
              One-Hit AI Review
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#005CB9] hover:bg-[#004890] text-white text-xs font-semibold shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5" /> + New Contract
          </Link>
        </div>
      </div>

      {/* Hero Badge */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          Strict 1 AI Call Budget Architecture
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#005CB9] border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-[#005CB9]" />
          Verified Evidence Quotes
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
        Evidence-First, One-Hit Contract Intelligence
      </h1>
      <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
        Turn complex agreements into traceable, reviewable, deadline-ready obligations with exactly <strong>one AI call per upload</strong>.
        Dates, summaries, version diffs, and verification run deterministically in code at 0 API cost.
      </p>

      {/* Quick Action Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/contracts/new"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#005CB9] shadow-xs hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005CB9] flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            Upload Contract
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#005CB9]" />
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Upload PDF or DOCX to extract obligations and evidence quotes in a single pass.
          </p>
        </Link>

        <Link
          href="/dashboard"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            Analytics Dashboard
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700" />
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Real-time deterministic metrics, review status breakdown, and obligation time horizons.
          </p>
        </Link>

        <Link
          href="/health"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition group"
        >

          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            System Health
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Verify Neon PostgreSQL connectivity and active AI provider configuration.
          </p>
        </Link>
      </div>

      {/* Contracts Workspace Section with Internal Scroll & Delete */}
      <div className="mt-12">
        <ContractListCard initialContracts={contractsList} />
      </div>


      {/* Core Architectural Guarantees */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#005CB9] flex items-center justify-center font-bold text-sm mb-3">
            1
          </div>
          <h3 className="font-bold text-slate-900 text-sm">One Upload = One AI Call</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Extraction, ambiguity detection, clarification questions, and policy checks are packed into a single structured call. Zero wasteful round-trips.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Evidence-Verified Quotes</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Every finding carries a verbatim quote verified against the document text by deterministic code. Unverified findings are flagged as uncertain.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-3">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Mathematical Deadlines</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            All renewal, notice, and payment dates are computed deterministically with arithmetic formulas and reminder schedules. AI never guesses dates.
          </p>
        </div>
      </div>
    </div>
  );
}
