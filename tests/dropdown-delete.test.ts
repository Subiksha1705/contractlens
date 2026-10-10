import { describe, it, expect } from "vitest";
import { getDb } from "@/lib/db/client";
import { contracts, contractVersions, findings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Enhanced UI: Delete Contract & Reusable Dropdowns", () => {
  it("deletes a contract and cascade deletes associated versions and findings", async () => {
    const db = getDb();

    // Create a temporary contract for deletion test
    const insertedContract = await db
      .insert(contracts)
      .values({
        title: "Temporary Contract For Deletion Test",
      })
      .returning();
    const contractId = insertedContract[0].id;

    // Create a version under this contract
    const insertedVersion = await db
      .insert(contractVersions)
      .values({
        contractId,
        versionNumber: 1,
        sourceKind: "text",
        fullText: "Test contract text for delete testing.",
        aiProvider: "mock",
        aiModel: "mock-v1",
        extractionStatus: "ok",
      })
      .returning();
    const versionId = insertedVersion[0].id;

    // Create a finding under this version
    await db.insert(findings).values({
      versionId,
      type: "obligation",
      title: "Temporary Finding",
      aiValue: "Sample obligation to delete",
      certainty: "confirmed",
      evidenceQuote: "Test contract text for delete testing.",
      evidenceStatus: "verified",
    });

    // Verify finding exists
    const beforeFindings = await db.select().from(findings).where(eq(findings.versionId, versionId));
    expect(beforeFindings.length).toBe(1);

    // Now delete the contract directly (testing foreign key cascade)
    await db.delete(contracts).where(eq(contracts.id, contractId));

    // Verify contract is gone
    const checkContract = await db.select().from(contracts).where(eq(contracts.id, contractId));
    expect(checkContract.length).toBe(0);

    // Verify versions are cascade deleted
    const checkVersions = await db.select().from(contractVersions).where(eq(contractVersions.contractId, contractId));
    expect(checkVersions.length).toBe(0);

    // Verify findings are cascade deleted
    const checkFindings = await db.select().from(findings).where(eq(findings.versionId, versionId));
    expect(checkFindings.length).toBe(0);
  });
});
