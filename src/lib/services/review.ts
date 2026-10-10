import { getDb } from "../db/client";
import { findings, auditEvents, contractVersions, Finding } from "../db/schema";
import { eq } from "drizzle-orm";

export interface ReviewActionInput {
  action: "approve" | "reject" | "edit" | "reset";
  correctedValue?: string | null;
  correctedResponsibleParty?: string | null;
  correctedDeadlineDate?: string | null; // YYYY-MM-DD
  confirmedUnverified?: boolean;
}

export interface ReviewActionResult {
  finding: Finding;
  previousStatus: string;
}

export async function updateFindingReview(
  findingId: string,
  input: ReviewActionInput
): Promise<ReviewActionResult> {
  const db = getDb();

  // 1. Fetch current finding
  const rows = await db.select().from(findings).where(eq(findings.id, findingId)).limit(1);
  const current = rows[0];

  if (!current) {
    throw new Error(`Finding with ID ${findingId} not found.`);
  }

  // Fetch parent contract ID via version
  const versionRows = await db
    .select({ contractId: contractVersions.contractId })
    .from(contractVersions)
    .where(eq(contractVersions.id, current.versionId))
    .limit(1);

  const contractId = versionRows[0]?.contractId;
  if (!contractId) {
    throw new Error(`Parent contract for version ${current.versionId} not found.`);
  }

  const previousStatus = current.reviewStatus;
  const now = new Date();

  // 2. Process Action
  if (input.action === "approve") {
    // Unverified safety rule: Must explicitly confirm
    if (current.evidenceStatus === "unverified" && !input.confirmedUnverified) {
      throw new Error(
        "This finding has an unverified quote. Explicit confirmation is required before approval."
      );
    }

    const [updated] = await db
      .update(findings)
      .set({
        reviewStatus: "approved",
        reviewedAt: now,
      })
      .where(eq(findings.id, findingId))
      .returning();

    // Audit Event
    await db.insert(auditEvents).values({
      contractId,
      versionId: current.versionId,
      findingId: current.id,
      type: "approve",
      detail: {
        action: "approve",
        previousStatus,
        evidenceStatus: current.evidenceStatus,
        confirmedUnverified: !!input.confirmedUnverified,
        timestamp: now.toISOString(),
      },
    });

    return { finding: updated, previousStatus };
  }

  if (input.action === "reject") {
    const [updated] = await db
      .update(findings)
      .set({
        reviewStatus: "rejected",
        reviewedAt: now,
      })
      .where(eq(findings.id, findingId))
      .returning();

    // Audit Event
    await db.insert(auditEvents).values({
      contractId,
      versionId: current.versionId,
      findingId: current.id,
      type: "reject",
      detail: {
        action: "reject",
        previousStatus,
        timestamp: now.toISOString(),
      },
    });

    return { finding: updated, previousStatus };
  }

  if (input.action === "reset") {
    // Reset to immutable AI values
    const [updated] = await db
      .update(findings)
      .set({
        correctedValue: null,
        correctedResponsibleParty: null,
        correctedDeadlineDate: null,
      })
      .where(eq(findings.id, findingId))
      .returning();

    await db.insert(auditEvents).values({
      contractId,
      versionId: current.versionId,
      findingId: current.id,
      type: "edit",
      detail: {
        action: "reset_to_ai",
        aiValue: current.aiValue,
        timestamp: now.toISOString(),
      },
    });

    return { finding: updated, previousStatus };
  }

  if (input.action === "edit") {
    const updates: Partial<typeof findings.$inferInsert> = {};

    if (input.correctedValue !== undefined) {
      updates.correctedValue = input.correctedValue;
    }
    if (input.correctedResponsibleParty !== undefined) {
      updates.correctedResponsibleParty = input.correctedResponsibleParty;
    }
    if (input.correctedDeadlineDate !== undefined) {
      updates.correctedDeadlineDate = input.correctedDeadlineDate;
    }

    const [updated] = await db
      .update(findings)
      .set(updates)
      .where(eq(findings.id, findingId))
      .returning();

    await db.insert(auditEvents).values({
      contractId,
      versionId: current.versionId,
      findingId: current.id,
      type: "edit",
      detail: {
        action: "edit",
        previous: {
          correctedValue: current.correctedValue,
          correctedResponsibleParty: current.correctedResponsibleParty,
          correctedDeadlineDate: current.correctedDeadlineDate,
        },
        updated: updates,
        timestamp: now.toISOString(),
      },
    });

    return { finding: updated, previousStatus };
  }

  throw new Error(`Unsupported review action: ${String(input.action)}`);
}
