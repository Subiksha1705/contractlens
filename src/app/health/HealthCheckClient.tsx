"use client";

import React, { useState } from "react";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ShieldCheck,
  Sparkles,
  Key,
  Clock,
  Layers,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface OpenRouterQuotaData {
  status: "connected" | "error" | "none";
  isFreeTier?: boolean;
  dailyLimit?: number | null;
  dailyUsed?: number | null;
  dailyRemaining?: number | null;
  label?: string;
  expiresAt?: string | null;
  error?: string;
}

export interface AiConfigData {
  primaryProvider: string;
  primaryModel: string;
  backupProvider: string;
  backupModel: string;
}

interface HealthCheckClientProps {
  initialDbLatency?: number;
  initialQuota?: OpenRouterQuotaData | null;
  aiConfig: AiConfigData;
}

export function HealthCheckClient({
  initialDbLatency = 0,
  initialQuota = null,
  aiConfig,
}: HealthCheckClientProps) {
  const { toast } = useToast();
  const [latency, setLatency] = useState<number | null>(
    initialDbLatency > 0 ? initialDbLatency : null
  );
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>("Ready");
  const [dbStatus, setDbStatus] = useState<"ok" | "error">("ok");
  const [quota, setQuota] = useState<OpenRouterQuotaData | null>(initialQuota);

  const runCheck = async () => {
    setChecking(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      const elapsed = Date.now() - start;

      if (res.ok && data.status === "ok") {
        setLatency(elapsed);
        setDbStatus("ok");
        if (data.ai?.openrouterQuota) {
          setQuota(data.ai.openrouterQuota);
        }
        toast.success(
          "Diagnostics Refreshed",
          `Database latency: ${elapsed} ms. Live OpenRouter quota updated.`
        );
      } else {
        setDbStatus("error");
        toast.error("Health Check Degraded", data.dbError || "Database returned an unexpected response.");
      }
      setLastCheck(new Date().toLocaleTimeString());
    } catch {
      setDbStatus("error");
      toast.error("Health Check Failed", "Could not reach diagnostics endpoint.");
    } finally {
      setChecking(false);
    }
  };

  // Calculate percentages and progress styles for OpenRouter free daily quota
  const dailyLimit = quota?.dailyLimit ?? 50;
  const dailyUsed = quota?.dailyUsed ?? 0;
  const dailyRemaining = quota?.dailyRemaining ?? (dailyLimit - dailyUsed);
  const percentRemaining = Math.max(
    0,
    Math.min(100, Math.round((dailyRemaining / (dailyLimit || 1)) * 100))
  );

  const progressColor =
    percentRemaining > 25
      ? "bg-emerald-500"
      : percentRemaining > 0
      ? "bg-amber-500"
      : "bg-rose-500";

  const progressBadge =
    percentRemaining > 25 ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Normal Capacity
      </span>
    ) : percentRemaining > 0 ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3 h-3 text-amber-600" /> Approaching Limit
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3 h-3 text-rose-600" /> Quota Exhausted
      </span>
    );

  const formattedExpiresAt = quota?.expiresAt
    ? new Date(quota.expiresAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Active (No Expiry)";

  return (
    <div className="space-y-6">
      {/* 1. Quick Telemetry & Connection Re-test Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Live Neon DB Ping:
              </span>
              <span className="font-mono text-xs font-extrabold text-[#005CB9]">
                {latency !== null ? `${latency} ms` : "Click to test"}
              </span>
              {dbStatus === "ok" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Last Verified: {lastCheck} &bull; OpenRouter telemetry live-synced
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runCheck}
          disabled={checking}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${checking ? "animate-spin text-amber-300" : ""}`}
          />
          {checking ? "Checking Live..." : "Refresh Diagnostics & Quota"}
        </button>
      </div>

      {/* 2. OpenRouter Live AI Quota & Limits Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  OpenRouter AI Quota & Rate Limits
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#005CB9] border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005CB9] animate-pulse" />
                  Live API Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time usage allowance, model tier, and account limits fetched from OpenRouter
              </p>
            </div>
          </div>

          <div className="shrink-0">{progressBadge}</div>
        </div>

        {/* Quota Gauge & Usage Progress Bar */}
        <div className="mt-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Daily Free Model Allowance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {dailyRemaining}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / {dailyLimit} requests remaining today
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-xs font-mono font-bold text-slate-700">
                {percentRemaining}% Available
              </span>
              <span className="text-[10px] text-slate-400 block">
                {dailyUsed} used of {dailyLimit} limit
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
              style={{ width: `${percentRemaining}%` }}
            />
          </div>

          {/* Metric Pills */}
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Used Today</p>
              <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">{dailyUsed}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Remaining</p>
              <p className="text-sm font-mono font-bold text-emerald-600 mt-0.5">{dailyRemaining}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Daily Reset</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">Every 24h</p>
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-[11px]">Account Tier</span>
            </div>
            <p className="font-bold text-slate-900 mt-0.5">
              {quota?.isFreeTier ? "Free Open-Weight Tier" : "Pay-As-You-Go"}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Includes free open models (:free)
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold text-[11px]">Active Primary Model</span>
            </div>
            <p className="font-mono font-bold text-[#005CB9] truncate mt-0.5" title={aiConfig.primaryModel}>
              {aiConfig.primaryModel}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Configured in OPENROUTER_MODEL
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-[11px]">Key Label</span>
            </div>
            <p className="font-mono text-slate-800 font-semibold truncate mt-0.5" title={quota?.label || "OpenRouter Key"}>
              {quota?.label || "Active Key"}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              Verified & Connected
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-[11px]">Key Expiration</span>
            </div>
            <p className="font-bold text-slate-900 mt-0.5">
              {formattedExpiresAt}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Managed on OpenRouter
            </span>
          </div>
        </div>

        {/* Automatic Backup Guard Notification */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/70 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#005CB9] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">
              Automatic Failover Guard Active
            </span>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              If OpenRouter reaches the <strong>50/50 daily limit</strong> or encounters a temporary{" "}
              <strong>HTTP 429 rate limit / provider overload</strong>, ContractLens will automatically switch to your backup provider (
              <span className="font-mono font-semibold text-[#005CB9]">
                {aiConfig.backupProvider} &bull; {aiConfig.backupModel}
              </span>
              ) without interrupting your contract upload.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Provider Failover Architecture Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Provider Architecture & Failover Route
              </h3>
              <p className="text-[11px] text-slate-400">
                Zero-downtime routing with deterministic fallback
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Armed & Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Model */}
          <div className="p-4 rounded-2xl border-2 border-[#005CB9]/20 bg-blue-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#005CB9] text-white">
                Primary Engine
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Preferred
              </span>
            </div>
            <p className="font-mono font-bold text-sm text-slate-900">
              {aiConfig.primaryProvider.toUpperCase()}
            </p>
            <p className="font-mono text-xs text-[#005CB9] mt-0.5 truncate" title={aiConfig.primaryModel}>
              {aiConfig.primaryModel}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Default provider for contract ingestion and clause extraction.
            </p>
          </div>

          {/* Backup Model */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Backup Failover Engine
              </span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Automatic On Limit
              </span>
            </div>
            <p className="font-mono font-bold text-sm text-slate-900">
              {aiConfig.backupProvider.toUpperCase()}
            </p>
            <p className="font-mono text-xs text-slate-700 mt-0.5 truncate" title={aiConfig.backupModel}>
              {aiConfig.backupModel}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Seamlessly invoked if primary encounters HTTP 429 / quota exhaustion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
