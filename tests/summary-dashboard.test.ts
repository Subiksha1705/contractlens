import { describe, it, expect } from "vitest";
import { ingestContract } from "@/lib/services/ingest";
import { updateFindingReview } from "@/lib/services/review";
import { buildContractSummary, LEGAL_DISCLAIMER } from "@/lib/summary/build";
import { getContractDashboardStats, getContractById, getLatestVersion } from "@/lib/db/queries";
import { MockProvider } from "@/lib/ai/mock";
import { getDb } from "@/lib/db/client";
import { findings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Phase 7: Summary & Dashboard (Zero AI Usage)", () => {
  const sampleContract = `
MASTER SERVICES AGREEMENT
This Master Services Agreement ("Agreement") is made between Acme Corporation ("Client") and Nexus Solutions LLC ("Provider").
The Effective Date of this Agreement shall be January 1, 2025.
This Agreement shall commence on the Effective Date and continue for an initial term of one (1) year.
The Agreement shall automatically renew for successive terms of one (1) year unless either party gives written notice.
written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.
Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice.
Client shall pay all undisputed invoice amounts within thirty (30) days of receipt.
Provider may adjust maintenance schedules upon providing reasonable notice.
All legal notices under Section 11 must be delivered in writing with forty-five (45) days advance notification.
  `.trim();

  async function setupTestContract() {
    const ingestRes = await ingestContract(
      { text: sampleContract },
      { contractTitle: "Phase 7 Summary Test", providerOverride: new MockProvider() }
    );
    const contract = await getContractById(ingestRes.contractId);
    const version = await getLatestVersion(ingestRes.contractId);
    const db = getDb();
    const rows = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, ingestRes.versionId));

    return { contract: contract!, version: version!, findingsList: rows };
  }

  it("builds a reviewed summary clearly separating approved vs attention items", async () => {
    const { contract, version, findingsList } = await setupTestContract();

    // 1. Approve initial term and client party
    const party = findingsList.find((f) => f.type === "party");
    const term = findingsList.find((f) => f.type === "expiry");
    const notice = findingsList.find((f) => f.type === "notice");

    expect(party).toBeDefined();
    expect(term).toBeDefined();
    expect(notice).toBeDefined();

    await updateFindingReview(party!.id, { action: "approve", confirmedUnverified: true });
    await updateFindingReview(term!.id, { action: "approve", confirmedUnverified: true });
    await updateFindingReview(notice!.id, { action: "reject" });

    // Refetch updated findings
    const db = getDb();
    const refreshedFindings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, version.id));

    const summary = buildContractSummary(contract, version, refreshedFindings);

    // Group 1: Parties
    const approvedParty = summary.parties.find((p) => p.isApproved);
    expect(approvedParty).toBeDefined();
    expect(approvedParty!.name).not.toContain("Pending review");

    // Group 2: Term & Governance contains approved term
    const termInSummary = summary.governanceAndTerms.find((g) => g.id === term!.id);
    expect(termInSummary).toBeDefined();
    expect(termInSummary!.title).toBe("Initial Term Expiration");

    // Group 4: Attention items contains items that are still pending or uncertain
    expect(summary.attentionItems.length).toBeGreaterThan(0);
    for (const item of summary.attentionItems) {
      expect(["pending", "potentially_stale", "uncertain"]).toContain(
        item.reviewStatus === "potentially_stale"
          ? "potentially_stale"
          : item.certainty === "uncertain"
          ? "uncertain"
          : item.reviewStatus
      );
    }

    // Group 5: Rejected count
    expect(summary.rejectedCount).toBe(1);

    // Disclaimer
    expect(summary.disclaimer).toBe(LEGAL_DISCLAIMER);
  });

  it("calculates dashboard stats matching database records accurately", async () => {
    const { contract, version, findingsList } = await setupTestContract();

    // Approve one, reject one
    const first = findingsList[0];
    const second = findingsList[1];
    await updateFindingReview(first.id, { action: "approve", confirmedUnverified: true });
    await updateFindingReview(second.id, { action: "reject" });

    // Fixed date for deterministic deadline window testing: Jan 1 2025
    const today = new Date("2025-01-01T00:00:00.000Z");
    const stats = await getContractDashboardStats(contract.id, version.id, today);

    expect(stats).not.toBeNull();
    expect(stats!.contractId).toBe(contract.id);
    expect(stats!.totalFindings).toBe(findingsList.length);
    expect(stats!.approvedCount).toBe(1);
    expect(stats!.rejectedCount).toBe(1);
    expect(stats!.pendingCount).toBe(findingsList.length - 2);

    // Verify status chart data totals match totalFindings
    const chartTotal = stats!.byStatus.reduce((sum, item) => sum + item.count, 0);
    expect(chartTotal).toBe(stats!.totalFindings);

    // Verify clause types distribution
    const typeTotal = stats!.byType.reduce((sum, item) => sum + item.count, 0);
    expect(typeTotal).toBe(stats!.totalFindings);

    // Verify deadline windows format
    expect(stats!.deadlinesByWindow.length).toBe(6);
    expect(stats!.deadlinesByWindow.map((w) => w.window)).toEqual([
      "Overdue",
      "≤ 7 Days",
      "≤ 30 Days",
      "≤ 90 Days",
      "> 90 Days",
      "Needs Human Date",
    ]);
  });
});
