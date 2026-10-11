import { describe, it, expect } from "vitest";
import { ingestContract } from "@/lib/services/ingest";
import { updateFindingReview } from "@/lib/services/review";
import { MockProvider } from "@/lib/ai/mock";
import { getDb } from "@/lib/db/client";
import { findings, auditEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import * as fs from "fs";
import * as path from "path";

describe("Phase 4: Review Workspace Service (Zero AI Usage on Review)", () => {
  const sampleContract = fs.readFileSync(
    path.join(process.cwd(), "samples/synthetic-contract-v1.txt"),
    "utf8"
  );

  async function setupTestContractAndFindings() {
    const ingestRes = await ingestContract(
      { text: sampleContract },
      { contractTitle: "Review Service Test", providerOverride: new MockProvider() }
    );
    const db = getDb();
    const rows = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, ingestRes.versionId));

    return { contractId: ingestRes.contractId, versionId: ingestRes.versionId, findingsList: rows };
  }

  it("approves a verified finding and sets reviewed_at timestamp", async () => {
    const { findingsList } = await setupTestContractAndFindings();
    const verifiedItem = findingsList.find((f) => f.evidenceStatus === "verified");
    expect(verifiedItem).toBeDefined();

    const { finding: updated, previousStatus } = await updateFindingReview(
      verifiedItem!.id,
      { action: "approve" }
    );

    expect(previousStatus).toBe("pending");
    expect(updated.reviewStatus).toBe("approved");
    expect(updated.reviewedAt).not.toBeNull();

    // Verify audit event
    const db = getDb();
    const audits = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.findingId, verifiedItem!.id));
    const approveAudit = audits.find((a) => a.type === "approve");
    expect(approveAudit).toBeDefined();
  });

  it("rejects a finding and updates reviewStatus without deleting record", async () => {
    const { findingsList } = await setupTestContractAndFindings();
    const targetItem = findingsList[0];

    const { finding: updated } = await updateFindingReview(targetItem.id, {
      action: "reject",
    });

    expect(updated.reviewStatus).toBe("rejected");
    expect(updated.reviewedAt).not.toBeNull();
  });

  it("preserves immutable ai_value when user edits finding", async () => {
    const { findingsList } = await setupTestContractAndFindings();
    const targetItem = findingsList[0];
    const originalAiValue = targetItem.aiValue;
    const originalAiParty = targetItem.aiResponsibleParty;

    const { finding: edited } = await updateFindingReview(targetItem.id, {
      action: "edit",
      correctedValue: "User-corrected customized obligation value",
      correctedResponsibleParty: "New Assigned Party",
    });

    // AI FIELDS MUST REMAIN IMMUTABLE
    expect(edited.aiValue).toBe(originalAiValue);
    expect(edited.aiResponsibleParty).toBe(originalAiParty);

    // Corrected fields updated
    expect(edited.correctedValue).toBe("User-corrected customized obligation value");
    expect(edited.correctedResponsibleParty).toBe("New Assigned Party");

    // Resetting to AI value clears corrected fields
    const { finding: reset } = await updateFindingReview(targetItem.id, {
      action: "reset",
    });

    expect(reset.correctedValue).toBeNull();
    expect(reset.correctedResponsibleParty).toBeNull();
    expect(reset.aiValue).toBe(originalAiValue);
  });

  it("blocks approving unverified findings without explicit confirmation", async () => {
    const { findingsList } = await setupTestContractAndFindings();
    const db = getDb();

    // Insert an unverified finding artificially to test safety gate
    const [unverifiedFinding] = await db
      .insert(findings)
      .values({
        versionId: findingsList[0].versionId,
        type: "obligation",
        title: "Unverified Safety Test Finding",
        aiValue: "Sample value",
        evidenceQuote: "Hallucinated quote",
        evidenceStatus: "unverified",
        certainty: "uncertain",
        reviewStatus: "pending",
      })
      .returning();

    // Trying to approve without confirmedUnverified should throw error
    await expect(
      updateFindingReview(unverifiedFinding.id, { action: "approve" })
    ).rejects.toThrow("Explicit confirmation is required before approval");

    // Approving WITH confirmedUnverified succeeds
    const { finding: approved } = await updateFindingReview(unverifiedFinding.id, {
      action: "approve",
      confirmedUnverified: true,
    });

    expect(approved.reviewStatus).toBe("approved");
  });
});
