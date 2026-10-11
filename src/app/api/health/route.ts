import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  let dbStatus = "ok";
  let dbError: string | null = null;

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
  } catch (error: unknown) {
    dbStatus = "error";
    dbError = error instanceof Error ? error.message : "Database connection failed";
  }

  // Live OpenRouter key telemetry
  let openrouterQuota: {
    status: "connected" | "error" | "none";
    isFreeTier?: boolean;
    dailyLimit?: number | null;
    dailyUsed?: number | null;
    dailyRemaining?: number | null;
    label?: string;
    expiresAt?: string | null;
    error?: string;
  } = { status: "none" };

  const openrouterKey = env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const body = await res.json();
        const d = body?.data;
        openrouterQuota = {
          status: "connected",
          label: d?.label ?? "Active Key",
          isFreeTier: Boolean(d?.is_free_tier),
          expiresAt: d?.expires_at ?? null,
          dailyLimit: d?.free_model_daily_requests?.limit ?? 50,
          dailyUsed: d?.free_model_daily_requests?.used ?? 0,
          dailyRemaining: d?.free_model_daily_requests?.remaining ?? 50,
        };
      } else {
        const errText = await res.text().catch(() => "");
        openrouterQuota = {
          status: "error",
          error: `OpenRouter returned status ${res.status}: ${errText.slice(0, 150)}`,
        };
      }
    } catch (err: unknown) {
      openrouterQuota = {
        status: "error",
        error: err instanceof Error ? err.message : "Failed to connect to OpenRouter API",
      };
    }
  }

  const primaryProvider = env.AI_PROVIDER;
  const primaryModel =
    primaryProvider === "openrouter" ? env.OPENROUTER_MODEL : env.GEMINI_MODEL;
  const backupProvider =
    env.BACKUP_AI_PROVIDER || (env.GEMINI_API_KEY ? "gemini" : "none");
  const backupModel =
    backupProvider === "gemini"
      ? env.BACKUP_AI_MODEL || env.GEMINI_MODEL
      : env.BACKUP_AI_MODEL || env.OPENROUTER_MODEL;

  return NextResponse.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    db: dbStatus,
    dbError,
    ai: {
      primaryProvider,
      primaryModel,
      backupProvider,
      backupModel,
      openrouterQuota,
    },
    timestamp: new Date().toISOString(),
  });
}
