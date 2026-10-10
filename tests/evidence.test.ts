import { describe, it, expect } from "vitest";
import { normalize } from "@/lib/evidence/normalize";
import { verifyQuote } from "@/lib/evidence/verify";
import { locateQuote } from "@/lib/evidence/locate";

describe("Phase 3: Evidence Verification & Location", () => {
  describe("normalize()", () => {
    it("converts to lowercase and collapses whitespace", () => {
      const input = "  Master   SERVICES \n\n  Agreement\t ";
      expect(normalize(input)).toBe("master services agreement");
    });

    it("unifies curly quotes and typographic dashes", () => {
      const input = "“Client’s” terms — Section 1–2";
      expect(normalize(input)).toBe('"client\'s" terms - section 1-2');
    });

    it("strips hyphenated line-break artifacts from PDF columns", () => {
      const input = "agree-\n  ment for pay-\n\tment";
      expect(normalize(input)).toBe("agreement for payment");
    });
  });

  describe("verifyQuote()", () => {
    const documentText = `
      1. TERM AND DURATION
      This Agreement shall commence on the Effective Date and continue for an initial term of one (1) year.
      Notice of non-renewal must be delivered sixty (60) days prior.
    `;

    it("verifies verbatim quote existing in the document", () => {
      const quote = "continue for an initial term of one (1) year";
      const result = verifyQuote(quote, documentText);
      expect(result.status).toBe("verified");
    });

    it("verifies quote with curly quotes against straight quotes", () => {
      const docWithStraight = 'The "Client" shall pay within 30 days.';
      const quoteWithCurly = 'The “Client” shall pay within 30 days.';
      const result = verifyQuote(quoteWithCurly, docWithStraight);
      expect(result.status).toBe("verified");
    });

    it("flags fabricated quote as unverified", () => {
      const fabricatedQuote = "Either party may terminate immediately with zero notice.";
      const result = verifyQuote(fabricatedQuote, documentText);
      expect(result.status).toBe("unverified");
    });
  });

  describe("locateQuote()", () => {
    const sampleDoc = `
1. TERM AND DURATION
1.1 Initial Term. This Agreement shall commence on the Effective Date.
1.2 Automatic Renewal. This Agreement automatically renews for one year.
    `.trim();

    const samplePages = [
      { page: 1, start: 0, end: 100 },
      { page: 2, start: 101, end: 200 },
    ];

    it("locates character offsets and section heading", () => {
      const quote = "This Agreement automatically renews for one year.";
      const result = locateQuote(quote, sampleDoc, samplePages);

      expect(result.charStart).toBeGreaterThan(0);
      expect(result.section).toBe("1.2 Automatic Renewal.");
      expect(result.page).toBe(2);
    });

    it("returns null page when pages array is not provided (pasted text)", () => {
      const quote = "This Agreement shall commence on the Effective Date.";
      const result = locateQuote(quote, sampleDoc, null);

      expect(result.charStart).toBeGreaterThan(0);
      expect(result.page).toBeNull();
      expect(result.section).toBe("1.1 Initial Term.");
    });

    it("returns null section when no heading line precedes the quote", () => {
      const unheadedDoc = "Random contract text without any numbered sections.";
      const quote = "Random contract text";
      const result = locateQuote(quote, unheadedDoc, null);

      expect(result.section).toBeNull();
    });
  });
});
