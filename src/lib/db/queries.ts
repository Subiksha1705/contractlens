import { desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { contracts, contractVersions, findings, auditEvents } from "./schema";

export async function listContracts() {
  const db = getDb();
  return db.select().from(contracts).orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: string) {
  const db = getDb();
  const rows = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getLatestVersion(contractId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.contractId, contractId))
    .orderBy(desc(contractVersions.versionNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function getFindingsByVersion(versionId: string) {
  const db = getDb();
  return db.select().from(findings).where(eq(findings.versionId, versionId));
}

export async function getAuditEvents(contractId: string) {
  const db = getDb();
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.contractId, contractId))
    .orderBy(desc(auditEvents.createdAt));
}
