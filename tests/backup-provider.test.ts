import { describe, it, expect } from "vitest";
import { ingestContract } from "@/lib/services/ingest";
import { AiProvider, ExtractionOutput, isRateLimitOrQuotaError } from "@/lib/ai/adapter";
import { MOCK_EXTRACTION_FIXTURE } from "@/lib/ai/mock";
import { getDb } from "@/lib/db/client";
import { auditEvents, contractVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Provider-Level Backup Fallback System", () => {
  const sampleContract = `
MASTER SERVICES AGREEMENT
This Agreement is between Acme Corp and Tech Solutions LLC.
Effective Date: March 1, 2025.
Term: One (1) year from Effective Date.
Either party may terminate upon thirty (30) days prior written notice.
Payment is due within 30 days of invoice receipt.
  `.trim();

  describe("isRateLimitOrQuotaError()", () => {
    it("detects 429 and rate limit error patterns", () => {
      expect(isRateLimitOrQuotaError(new Error("OpenRouter request failed with status 429: Rate limit exceeded"))).toBe(true);
      expect(isRateLimitOrQuotaError(new Error("Gemini API request failed with status 429: RESOURCE_EXHAUSTED"))).toBe(true);
      expect(isRateLimitOrQuotaError(new Error("status 402: Insufficient credits"))).toBe(true);
      expect(isRateLimitOrQuotaError(new Error("Quota exceeded for quota metric"))).toBe(true);
      expect(isRateLimitOrQuotaError(new Error("Model is overloaded, please try again"))).toBe(true);
    });

    it("returns false for non-quota errors", () => {
      expect(isRateLimitOrQuotaError(new Error("Request timed out after 45000ms"))).toBe(false);
      expect(isRateLimitOrQuotaError(new Error("Malformed JSON response"))).toBe(false);
      expect(isRateLimitOrQuotaError(new Error("Invalid API key"))).toBe(false);
    });
  });

  describe("Automatic Fallback on Rate Limit / Quota Exhaustion", () => {
    it("switches to backup provider when primary hits rate limit (429) and succeeds", async () => {
      let primaryCalls = 0;
      let backupCalls = 0;

      const rateLimitedPrimary: AiProvider = {
        name: "openrouter",
        model: "cohere/north-mini-code:free",
        async extract(): Promise<ExtractionOutput> {
          primaryCalls++;
          throw new Error("OpenRouter request failed with status 429: Rate limit exceeded. Try again later.");
        },
      };

      const successfulBackup: AiProvider = {
        name: "gemini",
        model: "gemini-2.0-flash",
        async extract(): Promise<ExtractionOutput> {
          backupCalls++;
          return {
            rawJson: JSON.stringify(MOCK_EXTRACTION_FIXTURE),
            latencyMs: 120,
            usage: { promptTokens: 300, completionTokens: 150, totalTokens: 450 },
          };
        },
      };

      const result = await ingestContract(
        { text: sampleContract },
        {
          contractTitle: "Fallback Success Test",
          providerOverride: rateLimitedPrimary,
          backupProviderOverride: successfulBackup,
        }
      );

      // Verify execution counts
      expect(primaryCalls).toBe(1);
      expect(backupCalls).toBe(1);
      expect(result.extractionStatus).toBe("ok");
      expect(result.totalFindings).toBeGreaterThan(0);

      // Verify database reflects the backup provider that succeeded
      const db = getDb();
      const [version] = await db
        .select()
        .from(contractVersions)
        .where(eq(contractVersions.id, result.versionId));

      expect(version.aiProvider).toBe("gemini");
      expect(version.aiModel).toBe("gemini-2.0-flash");

      // Verify audit event logs the fallback event details
      const audits = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.contractId, result.contractId));

      const aiAudit = audits.find((a) => a.type === "ai_call");
      expect(aiAudit).toBeDefined();
      const detail = aiAudit!.detail as Record<string, unknown>;
      expect(detail.fallbackTriggered).toBe(true);
      expect(detail.provider).toBe("gemini");
      expect(detail.model).toBe("gemini-2.0-flash");
      expect(String(detail.fallbackReason)).toContain("status 429");
    });

    it("does not call backup provider when primary provider succeeds", async () => {
      let primaryCalls = 0;
      let backupCalls = 0;

      const healthyPrimary: AiProvider = {
        name: "openrouter",
        model: "primary-model",
        async extract(): Promise<ExtractionOutput> {
          primaryCalls++;
          return {
            rawJson: JSON.stringify(MOCK_EXTRACTION_FIXTURE),
            latencyMs: 50,
          };
        },
      };

      const unusedBackup: AiProvider = {
        name: "gemini",
        model: "gemini-2.0-flash",
        async extract(): Promise<ExtractionOutput> {
          backupCalls++;
          return { rawJson: "{}", latencyMs: 0 };
        },
      };

      const result = await ingestContract(
        { text: sampleContract },
        {
          contractTitle: "Healthy Primary Test",
          providerOverride: healthyPrimary,
          backupProviderOverride: unusedBackup,
        }
      );

      expect(primaryCalls).toBe(1);
      expect(backupCalls).toBe(0);
      expect(result.extractionStatus).toBe("ok");
    });

    it("does not trigger fallback on non-quota errors to protect AI budget", async () => {
      let primaryCalls = 0;
      let backupCalls = 0;

      const timedOutPrimary: AiProvider = {
        name: "openrouter",
        model: "primary-model",
        async extract(): Promise<ExtractionOutput> {
          primaryCalls++;
          throw new Error("Request timed out after 45000ms");
        },
      };

      const unusedBackup: AiProvider = {
        name: "gemini",
        model: "gemini-2.0-flash",
        async extract(): Promise<ExtractionOutput> {
          backupCalls++;
          return { rawJson: "{}", latencyMs: 0 };
        },
      };

      const result = await ingestContract(
        { text: sampleContract },
        {
          contractTitle: "Timeout No Fallback Test",
          providerOverride: timedOutPrimary,
          backupProviderOverride: unusedBackup,
        }
      );

      expect(primaryCalls).toBe(1);
      expect(backupCalls).toBe(0);
      expect(result.extractionStatus).toBe("failed");
      expect(result.error).toContain("Request timed out");
    });
  });
});
