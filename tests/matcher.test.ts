import { describe, it, expect } from "vitest";
import { findMatchInText, findAllMatchesInText, normalizeWithMap } from "@/lib/evidence/matcher";

describe("Evidence & Long Sentence Matcher", () => {
  describe("findMatchInText()", () => {
    it("matches exact long sentence without line breaks", () => {
      const text = "This Agreement shall commence on the Effective Date and shall continue for an initial period of three (3) years.";
      const query = "This Agreement shall commence on the Effective Date and shall continue for an initial period of three (3) years.";
      const match = findMatchInText(text, query);
      expect(match).not.toBeNull();
      expect(text.slice(match!.start, match!.end)).toBe(query);
    });

    it("matches long sentence across multiple line breaks (\\n) in document text", () => {
      const text = `
Section 12. Termination. This Agreement may be terminated by either party
upon providing thirty (30) days prior written notice to the other party
in the event of a material breach of any provision hereof, provided that
such breach is not cured within said thirty (30) day period.
      `.trim();

      const query = "This Agreement may be terminated by either party upon providing thirty (30) days prior written notice to the other party in the event of a material breach of any provision hereof, provided that such breach is not cured within said thirty (30) day period.";

      const match = findMatchInText(text, query);
      expect(match).not.toBeNull();
      expect(match!.start).toBeGreaterThan(0);
      expect(text.slice(match!.start, match!.end)).toContain("This Agreement may be terminated by either party");
      expect(text.slice(match!.start, match!.end)).toContain("said thirty (30) day period.");
    });

    it("matches long sentence when query is wrapped in quotes or ellipses", () => {
      const text = "The Supplier warrants that all deliverables shall conform to the specifications set forth in Exhibit A.";
      const query = '"...The Supplier warrants that all deliverables shall conform to the specifications set forth in Exhibit A..."';

      const match = findMatchInText(text, query);
      expect(match).not.toBeNull();
      expect(text.slice(match!.start, match!.end)).toBe(
        "The Supplier warrants that all deliverables shall conform to the specifications set forth in Exhibit A."
      );
    });

    it("matches long sentence with PDF hyphenated line-break artifacts (word-\\n ment)", () => {
      const text = "The Client shall make pay-\n  ment in full within forty-five (45) calendar days.";
      const query = "The Client shall make payment in full within forty-five (45) calendar days.";

      const match = findMatchInText(text, query);
      expect(match).not.toBeNull();
      expect(text.slice(match!.start, match!.end)).toBe(text);
    });

    it("matches long sentence with smart quotes and em-dashes", () => {
      const text = "The “Company” covenants—subject to Section 8—that it will maintain confidentiality.";
      const query = 'The "Company" covenants - subject to Section 8 - that it will maintain confidentiality.';

      const match = findMatchInText(text, query);
      expect(match).not.toBeNull();
      expect(text.slice(match!.start, match!.end)).toBe(text);
    });

    it("matches long sentence with minor punctuation or clause prefix variations", () => {
      const text = "14.2 Governing Law. This Agreement and any dispute arising from it shall be governed by Delaware law without regard to conflicts of law.";
      const query = "This Agreement and any dispute arising from it shall be governed by Delaware law without regard to conflicts of law.";

      const match = findMatchInText(text, query);
      expect(match).not.toBeNull();
      expect(text.slice(match!.start, match!.end)).toContain("This Agreement and any dispute");
    });
  });

  describe("findAllMatchesInText()", () => {
    it("returns all occurrences for short search terms", () => {
      const text = "Payment must be made. If payment is late, an additional payment fee applies.";
      const matches = findAllMatchesInText(text, "payment");
      expect(matches.length).toBe(3);
    });

    it("returns single comprehensive match for long sentence query", () => {
      const text = "Either party may terminate upon thirty (30) days notice.\nThis Agreement is governed by Delaware law.";
      const query = "Either party may terminate upon thirty (30) days notice.";
      const matches = findAllMatchesInText(text, query);
      expect(matches.length).toBe(1);
      expect(text.slice(matches[0].start, matches[0].end)).toBe("Either party may terminate upon thirty (30) days notice.");
    });
  });

  describe("normalizeWithMap()", () => {
    it("maps normalized indices back to original positions accurately", () => {
      const text = "Hello\n  World!";
      const { normText, map } = normalizeWithMap(text);
      expect(normText).toBe("hello world!");
      expect(map.length).toBe(normText.length);
      // 'w' in normalized text corresponds to position 8 in original text
      const wIdx = normText.indexOf("w");
      expect(text[map[wIdx]]).toBe("W");
    });
  });
});
