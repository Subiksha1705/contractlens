import { describe, it, expect } from "vitest";
import { MockProvider, MOCK_EXTRACTION_FIXTURE } from "@/lib/ai/mock";
import { aiExtractionSchema } from "@/lib/ai/schema";

describe("Phase 1: Architecture, Schema & AI Provider Mock", () => {
  it("validates the mock extraction fixture against Zod AI schema", () => {
    const result = aiExtractionSchema.safeParse(MOCK_EXTRACTION_FIXTURE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parties.length).toBeGreaterThan(0);
      expect(result.data.findings.length).toBeGreaterThan(0);
      expect(result.data.effective_date?.value).toBe("2025-01-01");
    }
  });

  it("mock provider executes in a single call with valid JSON output", async () => {
    const provider = new MockProvider();
    expect(provider.name).toBe("mock");

    const result = await provider.extract({
      contractText: "Sample contract for zero-token test",
    });

    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.rawJson).toBeDefined();

    const parsed = JSON.parse(result.rawJson);
    const parsedSchema = aiExtractionSchema.safeParse(parsed);
    expect(parsedSchema.success).toBe(true);
  });

  it("rejects invalid AI extraction missing required quote field", () => {
    const invalidData = {
      parties: [{ name: "Acme Corp" }], // missing quote
      findings: [],
    };
    const result = aiExtractionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
