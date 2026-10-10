import { describe, it, expect } from "vitest";
import { ingestContract } from "@/lib/services/ingest";
import { AiProvider, ExtractionInput, ExtractionOutput } from "@/lib/ai/adapter";
import { MOCK_EXTRACTION_FIXTURE } from "@/lib/ai/mock";
import { getDb } from "@/lib/db/client";
import { auditEvents, findings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Phase 3: Extraction Pipeline (AI Budget Rule: Exactly 1 Call)", () => {
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

  it("calls provider adapter exactly once and stores version and findings", async () => {
    let callCount = 0;
    const testProvider: AiProvider = {
      name: "test-single-call-mock",
      model: "test-v1",
      async extract(_input: ExtractionInput): Promise<ExtractionOutput> {
        callCount++;
        return {
          rawJson: JSON.stringify(MOCK_EXTRACTION_FIXTURE),
          latencyMs: 25,
          usage: { promptTokens: 400, completionTokens: 200, totalTokens: 600 },
        };
      },
    };

    const result = await ingestContract(
      { text: sampleContract },
      { contractTitle: "Single AI Call Test", providerOverride: testProvider }
    );

    // AI BUDGET RULE ENFORCEMENT
    expect(callCount).toBe(1);
    expect(result.extractionStatus).toBe("ok");
    expect(result.totalFindings).toBeGreaterThan(0);
    expect(result.contractId).toBeDefined();

    // Verify Audit Event logged ai_call
    const db = getDb();
    const audits = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.contractId, result.contractId));

    const aiCallAudits = audits.filter((a) => a.type === "ai_call");
    expect(aiCallAudits.length).toBe(1);
  });

  it("forces unverified quotes to uncertainty='uncertain'", async () => {
    // Provider returns a fabricated quote not in the text
    const fixtureWithHallucination = {
      ...MOCK_EXTRACTION_FIXTURE,
      findings: [
        {
          type: "obligation",
          title: "Hallucinated Obligation",
          value: "Client must pay 100% upfront penalty fee",
          quote: "This sentence does not exist anywhere in the contract text.",
          responsible_party: "Client",
          certainty: "confirmed", // AI claims it is confirmed!
          uncertainty_reason: null,
          clarification_question: null,
          deadline: null,
        },
      ],
    };

    const testProvider: AiProvider = {
      name: "hallucination-tester",
      model: "test-v1",
      async extract(): Promise<ExtractionOutput> {
        return {
          rawJson: JSON.stringify(fixtureWithHallucination),
          latencyMs: 10,
        };
      },
    };

    const result = await ingestContract(
      { text: sampleContract },
      { contractTitle: "Unverified Test", providerOverride: testProvider }
    );

    const db = getDb();
    const storedFindings = await db
      .select()
      .from(findings)
      .where(eq(findings.versionId, result.versionId));

    const hallucinated = storedFindings.find((f) => f.title === "Hallucinated Obligation");
    expect(hallucinated).toBeDefined();
    expect(hallucinated?.evidenceStatus).toBe("unverified");
    // USP RULE: Unverified findings are forced to uncertain!
    expect(hallucinated?.certainty).toBe("uncertain");
  });

  it("gracefully handles malformed JSON without crashing", async () => {
    const malformedProvider: AiProvider = {
      name: "broken-json-provider",
      model: "broken-v1",
      async extract(): Promise<ExtractionOutput> {
        return {
          rawJson: "{ incomplete json string...",
          latencyMs: 5,
        };
      },
    };

    const result = await ingestContract(
      { text: sampleContract },
      { contractTitle: "Malformed Test", providerOverride: malformedProvider }
    );

    expect(result.extractionStatus).toBe("failed");
    expect(result.totalFindings).toBe(0);
    expect(result.error).toContain("Malformed JSON");
  });

  it("handles provider timeout or network error cleanly", async () => {
    const timeoutProvider: AiProvider = {
      name: "timeout-provider",
      model: "timeout-v1",
      async extract(): Promise<ExtractionOutput> {
        throw new Error("Request timed out after 45000ms");
      },
    };

    const result = await ingestContract(
      { text: sampleContract },
      { contractTitle: "Timeout Test", providerOverride: timeoutProvider }
    );

    expect(result.extractionStatus).toBe("failed");
    expect(result.error).toContain("Request timed out");
  });

  it("flags truncated input when text exceeds MAX_INPUT_CHARS", async () => {
    // Generate text > 60,000 chars
    const hugeText = "Section 1. Obligation text.\n\n".repeat(2500);

    const mockProvider: AiProvider = {
      name: "mock-truncation",
      model: "mock-v1",
      async extract(): Promise<ExtractionOutput> {
        return {
          rawJson: JSON.stringify(MOCK_EXTRACTION_FIXTURE),
          latencyMs: 10,
        };
      },
    };

    const result = await ingestContract(
      { text: hugeText },
      { contractTitle: "Truncation Test", providerOverride: mockProvider }
    );

    expect(result.truncated).toBe(true);
  });
});
