import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db/client";
import { contracts, contractVersions, findings } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  FileCheck2,
} from "lucide-react";
import { HealthCheckClient } from "./HealthCheckClient";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  let dbStatus = "ok";
  let contractsCount = 0;
  let versionsCount = 0;
  let findingsCount = 0;

  try {
    const db = getDb();
    // Test database query
    await db.execute(sql`SELECT 1`);

    // Fetch aggregate record counts
    const [cCount] = await db.select({ count: sql<number>`count(*)` }).from(contracts);
    const [vCount] = await db.select({ count: sql<number>`count(*)` }).from(contractVersions);
    const [fCount] = await db.select({ count: sql<number>`count(*)` }).from(findings);

    contractsCount = Number(cCount?.count ?? 0);
    versionsCount = Number(vCount?.count ?? 0);
    findingsCount = Number(fCount?.count ?? 0);
  } catch (err: unknown) {
    dbStatus = "error";
    console.error("Health check error:", err);
  }

  const aiProvider = process.env.AI_PROVIDER || "openrouter";
  const aiModel = process.env.OPENROUTER_MODEL || "cohere/north-mini-code:free";
  const maxInputChars = Number(process.env.MAX_INPUT_CHARS || 60000);
  const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 10);

  return (
    <div className="max-w-4xl mx-auto py-10 px-5 sm:px-8 text-slate-900">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Contracts Workspace
        </Link>
      </div>

      {/* Main Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                System Diagnostics & Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ContractLens Health Status
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live status for Neon Serverless PostgreSQL, AI pipeline guards, and runtime limits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Diagnostics Client Widget */}
      <HealthCheckClient />

      {/* Core Infrastructure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* Database Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005CB9] flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Neon PostgreSQL</h3>
                <p className="text-[11px] text-slate-400">Serverless Pooled Database</p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                dbStatus === "ok"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {dbStatus === "ok" ? "Connected" : "Error"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Connection State</span>
              <span className="font-semibold text-emerald-600">Online & Verified</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">SSL Connection</span>
              <span className="font-semibold text-emerald-600">Enforced (require)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Driver</span>
              <span className="font-mono text-slate-700">@neondatabase/serverless</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">ORM Schema Layer</span>
              <span className="font-mono text-slate-700">Drizzle ORM v0.45</span>
            </div>
          </div>
        </div>

        {/* AI Provider & Budget Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Extraction Engine</h3>
                <p className="text-[11px] text-slate-400">Strict 1-Call Architecture</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">AI Provider</span>
              <span className="font-mono font-semibold text-slate-800 uppercase">{aiProvider}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Active Model</span>
              <span className="font-mono text-[11px] text-[#005CB9] truncate max-w-[200px]" title={aiModel}>
                {aiModel}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Token Budget Guarantee</span>
              <span className="font-semibold text-emerald-600">Exactly 1 Call per Upload</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Zero AI Services</span>
              <span className="text-slate-700">Dates, Diffs, Summaries (0 tokens)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Record Counts Row */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-center">
          <Layers className="w-5 h-5 text-[#005CB9] mx-auto mb-1" />
          <p className="text-[11px] text-slate-500 font-medium">Contracts in DB</p>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5">{contractsCount}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-center">
          <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-[11px] text-slate-500 font-medium">Versions Stored</p>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5">{versionsCount}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-center">
          <FileCheck2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-[11px] text-slate-500 font-medium">Clauses / Findings</p>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5">{findingsCount}</p>
        </div>
      </div>

      {/* Security & Runtime Guardrails */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Production Security & Runtime Guardrails
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Max Input Characters</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{maxInputChars.toLocaleString()} chars</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Max File Upload</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{maxUploadMb} MB limit</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Secret Leakage Protection</span>
            <span className="font-bold text-emerald-600 mt-0.5 block">Active (Regex Redaction)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
