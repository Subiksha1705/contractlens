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

  it("bulk deletes multiple contracts and cascade deletes their records", async () => {
    const db = getDb();
    const c1 = await db.insert(contracts).values({ title: "Bulk Delete Test 1" }).returning();
    const c2 = await db.insert(contracts).values({ title: "Bulk Delete Test 2" }).returning();
    const ids = [c1[0].id, c2[0].id];

    await db.insert(contractVersions).values([
      {
        contractId: ids[0],
        versionNumber: 1,
        sourceKind: "text",
        fullText: "Contract 1 text",
        aiProvider: "mock",
        aiModel: "mock-v1",
        extractionStatus: "ok",
      },
      {
        contractId: ids[1],
        versionNumber: 1,
        sourceKind: "text",
        fullText: "Contract 2 text",
        aiProvider: "mock",
        aiModel: "mock-v1",
        extractionStatus: "ok",
      },
    ]);

    const { inArray } = await import("drizzle-orm");
    const deleted = await db
      .delete(contracts)
      .where(inArray(contracts.id, ids))
      .returning({ id: contracts.id });
    expect(deleted.length).toBe(2);

    const remaining = await db.select().from(contracts).where(inArray(contracts.id, ids));
    expect(remaining.length).toBe(0);

    const remainingVersions = await db
      .select()
      .from(contractVersions)
      .where(inArray(contractVersions.contractId, ids));
    expect(remainingVersions.length).toBe(0);
  });
});
