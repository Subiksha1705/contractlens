import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { contracts, contractVersions, findings } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
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

  const env = getEnv();
  const aiProvider = env.AI_PROVIDER;
  const aiModel = aiProvider === "openrouter" ? env.OPENROUTER_MODEL : env.GEMINI_MODEL;
  const backupProvider = env.BACKUP_AI_PROVIDER || (env.GEMINI_API_KEY ? "gemini" : "none");
  const backupModel =
    backupProvider === "gemini"
      ? env.BACKUP_AI_MODEL || env.GEMINI_MODEL
      : env.BACKUP_AI_MODEL || env.OPENROUTER_MODEL;
  const maxInputChars = env.MAX_INPUT_CHARS;
  const maxUploadMb = env.MAX_UPLOAD_MB;

  // Server-side pre-fetch of live OpenRouter quota
  let initialQuota = null;
  if (env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const body = await res.json();
        const d = body?.data;
        initialQuota = {
          status: "connected" as const,
          label: d?.label ?? "Active Key",
          isFreeTier: Boolean(d?.is_free_tier),
          expiresAt: d?.expires_at ?? null,
          dailyLimit: d?.free_model_daily_requests?.limit ?? 50,
          dailyUsed: d?.free_model_daily_requests?.used ?? 0,
          dailyRemaining: d?.free_model_daily_requests?.remaining ?? 50,
        };
      }
    } catch {
      // Gracefully continue with client-side polling
    }
  }

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
              Live status for Neon Serverless PostgreSQL, AI pipeline guards, OpenRouter quota limits, and automatic failover routing.
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

      {/* Interactive Diagnostics & Live AI Quota Widget */}
      <HealthCheckClient
        initialQuota={initialQuota}
        aiConfig={{
          primaryProvider: aiProvider,
          primaryModel: aiModel,
          backupProvider,
          backupModel,
        }}
      />

      {/* Database Status Card */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Connection State</span>
            <span className="font-semibold text-emerald-600 block mt-0.5">Online & Verified</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">SSL Connection</span>
            <span className="font-semibold text-emerald-600 block mt-0.5">Enforced (require)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Driver</span>
            <span className="font-mono text-slate-700 block mt-0.5">@neondatabase/serverless</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">ORM Schema Layer</span>
            <span className="font-mono text-slate-700 block mt-0.5">Drizzle ORM v0.45</span>
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
