"use client";

import React, { useState } from "react";
import { Activity, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface HealthCheckClientProps {
  initialDbLatency?: number;
}

export function HealthCheckClient({ initialDbLatency = 0 }: HealthCheckClientProps) {
  const { toast } = useToast();
  const [latency, setLatency] = useState<number | null>(initialDbLatency > 0 ? initialDbLatency : null);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>("Ready");
  const [status, setStatus] = useState<"ok" | "error">("ok");

  const runCheck = async () => {
    setChecking(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      const elapsed = Date.now() - start;
      if (res.ok && data.status === "ok") {
        setLatency(elapsed);
        setStatus("ok");
        toast.success("Health Check Passed", `Neon database ping verified in ${elapsed} ms.`);
      } else {
        setStatus("error");
        toast.error("Health Check Degraded", "Database returned an unexpected response.");
      }
      setLastCheck(new Date().toLocaleTimeString());
    } catch {
      setStatus("error");
      toast.error("Health Check Failed", "Could not reach database endpoint.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            Live Ping:{" "}
            <span className="font-mono text-[#005CB9]">
              {latency !== null ? `${latency} ms` : "Click to test"}
            </span>
            {status === "ok" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            )}
          </p>
          <p className="text-[10px] text-slate-400">Last Verified: {lastCheck}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={runCheck}
        disabled={checking}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin text-[#005CB9]" : ""}`} />
        {checking ? "Pinging..." : "Re-test Connection"}
      </button>
    </div>
  );
}
