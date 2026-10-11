import { desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { ensureTablesExist } from "./init";
import { contracts, contractVersions, findings, auditEvents } from "./schema";

export async function listContracts() {
  await ensureTablesExist();
  const db = getDb();
  try {
    return await db.select().from(contracts).orderBy(desc(contracts.createdAt));
  } catch (err) {
    console.error("Failed to query contracts:", err);
    return [];
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(val: unknown): val is string {
  return typeof val === "string" && UUID_REGEX.test(val);
}

export async function getContractById(id: string) {
  if (!isUuid(id)) return null;
  const db = getDb();
  const rows = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getLatestVersion(contractId: string) {
  if (!isUuid(contractId)) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.contractId, contractId))
    .orderBy(desc(contractVersions.versionNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function listVersionsByContract(contractId: string) {
  if (!isUuid(contractId)) return [];
  const db = getDb();
  return db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.contractId, contractId))
    .orderBy(desc(contractVersions.versionNumber));
}

export async function getVersionById(versionId: string) {
  if (!isUuid(versionId)) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.id, versionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getFindingsByVersion(versionId: string) {
  if (!isUuid(versionId)) return [];
  const db = getDb();
  return db.select().from(findings).where(eq(findings.versionId, versionId));
}

export async function getAuditEvents(contractId: string) {
  if (!isUuid(contractId)) return [];
  const db = getDb();
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.contractId, contractId))
    .orderBy(desc(auditEvents.createdAt));
}

export interface DashboardStats {
  contractId: string;
  contractTitle: string;
  totalVersions: number;
  currentVersionNumber: number;
  totalFindings: number;
  byStatus: Array<{ status: string; count: number; fill: string }>;
  byType: Array<{ type: string; count: number }>;
  deadlinesByWindow: Array<{ window: string; count: number }>;
  uncertainCount: number;
  unverifiedCount: number;
  staleCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export async function getContractDashboardStats(
  contractId: string,
  versionId?: string,
  todayDate: Date = new Date()
): Promise<DashboardStats | null> {
  if (!isUuid(contractId) || (versionId && !isUuid(versionId))) return null;
  const db = getDb();

  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, contractId))
    .limit(1);

  if (!contract) return null;

  const allVersions = await db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.contractId, contractId))
    .orderBy(desc(contractVersions.versionNumber));

  if (allVersions.length === 0) return null;

  const currentVersion = versionId
    ? allVersions.find((v) => v.id === versionId) ?? allVersions[0]
    : allVersions[0];

  const versionFindings = await db
    .select()
    .from(findings)
    .where(eq(findings.versionId, currentVersion.id));

  // 1. By Status
  const statusCounts: Record<string, number> = {
    approved: 0,
    pending: 0,
    potentially_stale: 0,
    rejected: 0,
  };
  for (const f of versionFindings) {
    if (statusCounts[f.reviewStatus] !== undefined) {
      statusCounts[f.reviewStatus]++;
    } else {
      statusCounts[f.reviewStatus] = 1;
    }
  }

  const byStatus = [
    { status: "Approved", count: statusCounts.approved, fill: "#10b981" },
    { status: "Pending", count: statusCounts.pending, fill: "#64748b" },
    { status: "Potentially Stale", count: statusCounts.potentially_stale, fill: "#f59e0b" },
    { status: "Rejected", count: statusCounts.rejected, fill: "#ef4444" },
  ];

  // 2. By Type
  const typeMap = new Map<string, number>();
  for (const f of versionFindings) {
    typeMap.set(f.type, (typeMap.get(f.type) || 0) + 1);
  }
  const byType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // 3. Deadlines by Window
  const windowCounts = {
    overdue: 0,
    next7Days: 0,
    next30Days: 0,
    next90Days: 0,
    later: 0,
    needsHumanDate: 0,
  };

  const todayMidnight = new Date(todayDate);
  todayMidnight.setHours(0, 0, 0, 0);

  const plus7Days = new Date(todayMidnight.getTime() + 7 * 24 * 60 * 60 * 1000);
  const plus30Days = new Date(todayMidnight.getTime() + 30 * 24 * 60 * 60 * 1000);
  const plus90Days = new Date(todayMidnight.getTime() + 90 * 24 * 60 * 60 * 1000);

  for (const f of versionFindings) {
    const rawDateStr = f.correctedDeadlineDate ?? f.deadlineDate;
    if (f.deadlineFlag === "needs_human_date" || (!rawDateStr && f.deadlineSpec)) {
      windowCounts.needsHumanDate++;
      continue;
    }
    if (!rawDateStr) continue;

    const d = new Date(rawDateStr);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() < todayMidnight.getTime()) {
      windowCounts.overdue++;
    } else if (d.getTime() <= plus7Days.getTime()) {
      windowCounts.next7Days++;
    } else if (d.getTime() <= plus30Days.getTime()) {
      windowCounts.next30Days++;
    } else if (d.getTime() <= plus90Days.getTime()) {
      windowCounts.next90Days++;
    } else {
      windowCounts.later++;
    }
  }

  const deadlinesByWindow = [
    { window: "Overdue", count: windowCounts.overdue },
    { window: "≤ 7 Days", count: windowCounts.next7Days },
    { window: "≤ 30 Days", count: windowCounts.next30Days },
    { window: "≤ 90 Days", count: windowCounts.next90Days },
    { window: "> 90 Days", count: windowCounts.later },
    { window: "Needs Human Date", count: windowCounts.needsHumanDate },
  ];

  return {
    contractId,
    contractTitle: contract.title,
    totalVersions: allVersions.length,
    currentVersionNumber: currentVersion.versionNumber,
    totalFindings: versionFindings.length,
    byStatus,
    byType,
    deadlinesByWindow,
    uncertainCount: versionFindings.filter((f) => f.certainty === "uncertain").length,
    unverifiedCount: versionFindings.filter((f) => f.evidenceStatus === "unverified").length,
    staleCount: statusCounts.potentially_stale,
    approvedCount: statusCounts.approved,
    pendingCount: statusCounts.pending,
    rejectedCount: statusCounts.rejected,
  };
}

