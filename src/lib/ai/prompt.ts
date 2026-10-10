export const SYSTEM_PROMPT = `You are a contract information extraction engine.
You extract structured facts, clauses, and deadlines from contracts.
You do NOT provide legal advice, interpretations, or recommendations.

STRICT OPERATING RULES:
1. Return ONLY valid JSON matching the exact schema specified in the prompt. No markdown fences, no explanatory text, no HTML.
2. Every item MUST have a "quote": copy text VERBATIM from the document, <= 300 characters, exactly one contiguous passage.
3. NEVER guess or output page numbers or section numbers.
4. If something is unclear, contradictory, ambiguous, or lacks precise date logic:
   - set certainty: "uncertain"
   - fill uncertainty_reason with the factual reason
   - provide a clarification_question asking the human reviewer what needs confirmation.
5. If something is clearly and unambiguously stated: set certainty: "confirmed", uncertainty_reason: null, clarification_question: null.
6. Use null for unknown or unstated values. Never invent dates, monetary amounts, or party names.
7. Use type: "conflict" when two clauses contradict each other (quote the first; describe the conflicting clause in value).
8. If a POLICY section is present, add findings with type: "policy_mismatch" where the contract departs from the company policy, quoting the CONTRACT text.
9. For deadlines:
   - Set fixed_date (YYYY-MM-DD) ONLY when an explicit fixed calendar date is written in the contract.
   - Otherwise set fixed_date: null, and describe the rule using anchor ("effective_date" | "expiry_date" | "fixed_date" | "event"), amount, unit ("days" | "weeks" | "months" | "years"), direction ("before" | "after"), and day_type ("calendar" | "business" | "unspecified").
10. Valid finding types: "expiry" | "renewal" | "termination" | "notice" | "obligation" | "conflict" | "ambiguity" | "policy_mismatch".
11. Focus on the most significant findings (up to 15 key items: term, auto-renewal, termination, notice periods, payment deadlines, governing law, ambiguities, and conflicts). Keep verbatim quotes concise (<= 250 characters).`;

export function buildExtractionPrompt(contractText: string, policyText?: string): string {
  let prompt = `Extract all parties, the effective date, and key contract findings from the contract below into the following EXACT JSON format:

{
  "parties": [
    {
      "name": "Acme Corp",
      "role": "Client",
      "quote": "verbatim quote from contract naming party"
    }
  ],
  "effective_date": {
    "value": "2025-01-01",
    "quote": "verbatim quote stating effective date",
    "certainty": "confirmed",
    "uncertainty_reason": null
  },
  "findings": [
    {
      "type": "expiry",
      "title": "Contract Expiration",
      "value": "One year from effective date",
      "quote": "verbatim quote from contract",
      "responsible_party": null,
      "certainty": "confirmed",
      "uncertainty_reason": null,
      "clarification_question": null,
      "deadline": {
        "anchor": "effective_date",
        "fixed_date": null,
        "amount": 1,
        "unit": "years",
        "direction": "after",
        "day_type": "calendar"
      }
    }
  ]
}

--- BEGIN CONTRACT TEXT ---
${contractText}
--- END CONTRACT TEXT ---`;

  if (policyText && policyText.trim().length > 0) {
    prompt += `

--- BEGIN COMPANY POLICY TEXT ---
${policyText.trim()}
--- END COMPANY POLICY TEXT ---
Compare the contract against the company policy above. Flag any clauses that deviate from or violate this policy as type "policy_mismatch", quoting the contract text.`;
  }

  return prompt;
}
