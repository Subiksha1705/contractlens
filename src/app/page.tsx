import Link from "next/link";
import { ShieldCheck, Zap, FileText, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-6 sm:px-12 max-w-6xl mx-auto">
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
          href="/api/health"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          Check System Health <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="text-xs text-slate-500 font-mono bg-white px-3 py-2 rounded-md border border-slate-200">
          Run: <code className="text-indigo-600 font-semibold">pnpm ai:test</code>
        </div>
      </div>

      {/* Key Guarantees Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
            1
          </div>
          <h2 className="font-semibold text-slate-900 text-base">One Upload = One AI Call</h2>
          <p className="mt-2 text-sm text-slate-600">
            Extraction, ambiguity detection, clarification questions, and policy checks are packed into a single structured call. Zero wasteful round-trips.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 text-base">Evidence-Verified Quotes</h2>
          <p className="mt-2 text-sm text-slate-600">
            Every finding carries a verbatim quote verified against the document text by deterministic code. Unverified findings are flagged as uncertain.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 text-base">Deterministic Deadlines</h2>
          <p className="mt-2 text-sm text-slate-600">
            Notice periods, renewals, and payment terms are calculated with clear mathematical bases. AI never guesses a deadline.
          </p>
        </div>
      </div>
    </div>
  );
}
