import { describe, it, expect } from "vitest";
import { ingestContract } from "@/lib/services/ingest";
import { updateFindingReview } from "@/lib/services/review";
import { compareVersions, tokenJaccardSimilarity } from "@/lib/versions/compare";
import { MockProvider } from "@/lib/ai/mock";
import { ExtractionInput, ExtractionOutput } from "@/lib/ai/adapter";
import { getDb } from "@/lib/db/client";
import { findings, auditEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Phase 6: Versions & Stale Detection", () => {
  const v1Text = `
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

  const v2Text = `
MASTER SERVICES AGREEMENT (AMENDED V2)
This Master Services Agreement ("Agreement") is made between Acme Corporation ("Client") and Nexus Solutions LLC ("Provider").
The Effective Date of this Agreement shall be January 1, 2025.
This Agreement shall commence on the Effective Date and continue for an initial term of one (1) year.
The Agreement shall automatically renew for successive terms of one (1) year unless either party gives written notice.
written notice of non-renewal at least ninety (90) days prior to the expiration of the then-current term.
Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice.
Client shall pay all undisputed invoice amounts within thirty (30) days of receipt.
Provider may adjust maintenance schedules upon providing reasonable notice.
All legal notices under Section 11 must be delivered in writing with forty-five (45) days advance notification.
  `.trim();

  it("calculates token Jaccard similarity accurately", () => {
    const s1 = "written notice of non-renewal at least sixty (60) days prior to expiry";
    const s2 = "written notice of non-renewal at least sixty (60) days prior to expiry";
    const s3 = "written notice of non-renewal at least ninety (90) days prior to expiry";
    const s4 = "unrelated governing law delaware clause";

    expect(tokenJaccardSimilarity(s1, s2)).toBe(1);
    expect(tokenJaccardSimilarity(s1, s3)).toBeGreaterThan(0.7);
    expect(tokenJaccardSimilarity(s1, s4)).toBeLessThan(0.2);
  });

  it("carries forward unchanged approved findings from v1 to v2", async () => {
    const db = getDb();

    // 1. Ingest v1
    const v1Res = await ingestContract(
      { text: v1Text },
      { contractTitle: "Version Carry Forward Test", providerOverride: new MockProvider() }
    );

    // 2. Approve initial term finding in v1
    const v1Findings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, v1Res.versionId));

    const initialTerm = v1Findings.find((f) => f.type === "expiry");
    expect(initialTerm).toBeDefined();

    await updateFindingReview(initialTerm!.id, { action: "approve", confirmedUnverified: true });

    // 3. Ingest v2 for the same contract
    const v2Res = await ingestContract(
      { text: v2Text },
      { contractId: v1Res.contractId, providerOverride: new MockProvider() }
    );

    // 4. Run version compare
    const compareRes = await compareVersions(v1Res.versionId, v2Res.versionId);

    expect(compareRes.carriedForwardCount).toBeGreaterThanOrEqual(1);

    // 5. Verify v2 finding is approved and carried from v1
    const v2Findings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, v2Res.versionId));

    const v2InitialTerm = v2Findings.find((f) => f.type === "expiry");
    expect(v2InitialTerm).toBeDefined();
    expect(v2InitialTerm!.reviewStatus).toBe("approved");
    expect(v2InitialTerm!.carriedFromFindingId).toBe(initialTerm!.id);
  });

  it("flags changed values as potentially_stale with version diff reasons", async () => {
    const db = getDb();

    // 1. Ingest v1
    const v1Res = await ingestContract(
      { text: v1Text },
      { contractTitle: "Stale Flag Test", providerOverride: new MockProvider() }
    );

    // 2. Find and approve renewal finding in v1
    const v1Findings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, v1Res.versionId));

    const noticeV1 = v1Findings.find((f) => f.type === "notice");
    expect(noticeV1).toBeDefined();

    await updateFindingReview(noticeV1!.id, { action: "approve", confirmedUnverified: true });

    // 3. Custom provider for v2 that returns modified 90-day notice value
    class V2NoticeProvider extends MockProvider {
      override async extract(input?: ExtractionInput): Promise<ExtractionOutput> {
        const base = await super.extract(input);
        const json = JSON.parse(base.rawJson);
        const noticeItem = json.findings.find(
          (f: { type: string; value: string; quote: string }) => f.type === "notice"
        );
        if (noticeItem) {
          noticeItem.value = "Written notice of non-renewal must be provided at least ninety (90) days prior to expiration.";
          noticeItem.quote = "written notice of non-renewal at least ninety (90) days prior to the expiration of the then-current term.";
        }
        return {
          rawJson: JSON.stringify(json),
          usage: base.usage,
          latencyMs: 10,
        };
      }
    }

    // 4. Ingest v2
    const v2Res = await ingestContract(
      { text: v2Text },
      { contractId: v1Res.contractId, providerOverride: new V2NoticeProvider() }
    );

    // 5. Compare versions
    const compareRes = await compareVersions(v1Res.versionId, v2Res.versionId);
    expect(compareRes.staleFlaggedCount).toBeGreaterThanOrEqual(1);

    // 6. Check that v2 finding is marked potentially_stale
    const v2Findings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, v2Res.versionId));

    const noticeV2 = v2Findings.find((f) => f.type === "notice");
    expect(noticeV2).toBeDefined();
    expect(noticeV2!.reviewStatus).toBe("potentially_stale");
    expect(noticeV2!.staleReason).toContain("Value changed from version");

    // 7. Verify stale_flag audit event was created
    const audits = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.versionId, v2Res.versionId));

    const staleAudit = audits.find((a) => a.type === "stale_flag");
    expect(staleAudit).toBeDefined();
  });

  it("flags removed clauses as potentially_stale when evidence quote disappears in v2", async () => {
    const db = getDb();

    // 1. Ingest v1
    const v1Res = await ingestContract(
      { text: v1Text },
      { contractTitle: "Removed Clause Test", providerOverride: new MockProvider() }
    );

    // 2. Approve convenience termination clause in v1
    const v1Findings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, v1Res.versionId));

    const termConv = v1Findings.find((f) => f.type === "termination");
    expect(termConv).toBeDefined();
    await updateFindingReview(termConv!.id, { action: "approve", confirmedUnverified: true });

    // 3. Ingest stripped v2 that completely omits termination clause
    const v2Stripped = `
MASTER SERVICES AGREEMENT V2
Acme Global Inc. and Nexus Logic Systems LLC.
1. Initial Term: one (1) year.
    `.trim();

    class EmptyV2Provider extends MockProvider {
      override async extract(_input?: ExtractionInput): Promise<ExtractionOutput> {
        return {
          rawJson: JSON.stringify({
            parties: [{ name: "Acme Global Inc.", role: "Client", quote: "Acme Global Inc." }],
            effective_date: null,
            findings: [],
          }),
          latencyMs: 10,
        };
      }
    }

    const v2Res = await ingestContract(
      { text: v2Stripped },
      { contractId: v1Res.contractId, providerOverride: new EmptyV2Provider() }
    );

    // 4. Compare
    const compareRes = await compareVersions(v1Res.versionId, v2Res.versionId);
    expect(compareRes.staleFlaggedCount).toBeGreaterThanOrEqual(1);

    // 5. Check v1 finding marked potentially_stale with evidence not found reason
    const [refreshedOld] = await db
      .select()
      .from(findings)
      .where(eq(findings.id, termConv!.id));

    expect(refreshedOld.reviewStatus).toBe("potentially_stale");
    expect(refreshedOld.staleReason).toContain("Evidence not found in version");
  });

  it("preserves user corrections without silent overwriting", async () => {
    const db = getDb();

    // 1. Ingest v1
    const v1Res = await ingestContract(
      { text: v1Text },
      { contractTitle: "No Silent Overwrite Test", providerOverride: new MockProvider() }
    );

    const v1Findings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, v1Res.versionId));

    const initialFinding = v1Findings[0];
    expect(initialFinding).toBeDefined();

    // 2. User edits finding
    await updateFindingReview(initialFinding.id, {
      action: "edit",
      correctedValue: "User-reviewed customized clause value",
    });

    // 3. User approves
    await updateFindingReview(initialFinding.id, { action: "approve", confirmedUnverified: true });

    // 4. Ingest v2
    const v2Res = await ingestContract(
      { text: v2Text },
      { contractId: v1Res.contractId, providerOverride: new MockProvider() }
    );

    await compareVersions(v1Res.versionId, v2Res.versionId);

    // 5. Verify v1 finding still has user correction intact
    const [v1After] = await db
      .select()
      .from(findings)
      .where(eq(findings.id, initialFinding.id));

    expect(v1After.correctedValue).toBe("User-reviewed customized clause value");
    expect(v1After.aiValue).toBe(initialFinding.aiValue); // AI value was immutable
  });
});
