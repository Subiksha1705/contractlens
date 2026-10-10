import { AiProvider, ExtractionInput, ExtractionOutput } from "./adapter";

export const MOCK_EXTRACTION_FIXTURE = {
  parties: [
    {
      name: "Acme Corporation",
      role: "Client",
      quote: 'This Master Services Agreement ("Agreement") is made between Acme Corporation ("Client")',
    },
    {
      name: "Nexus Solutions LLC",
      role: "Provider",
      quote: 'and Nexus Solutions LLC ("Provider").',
    },
  ],
  effective_date: {
    value: "2025-01-01",
    quote: 'The Effective Date of this Agreement shall be January 1, 2025.',
    certainty: "confirmed",
    uncertainty_reason: null,
  },
  findings: [
    {
      type: "expiry",
      title: "Initial Term Expiration",
      value: "One year from the Effective Date (2026-01-01)",
      quote: "This Agreement shall commence on the Effective Date and continue for an initial term of one (1) year.",
      responsible_party: null,
      certainty: "confirmed",
      uncertainty_reason: null,
      clarification_question: null,
      deadline: {
        anchor: "effective_date",
        fixed_date: null,
        amount: 1,
        unit: "years",
        direction: "after",
        day_type: "calendar",
      },
    },
    {
      type: "renewal",
      title: "Automatic Renewal",
      value: "Renews automatically for successive one-year periods unless terminated.",
      quote: "The Agreement shall automatically renew for successive terms of one (1) year unless either party gives written notice.",
      responsible_party: null,
      certainty: "confirmed",
      uncertainty_reason: null,
      clarification_question: null,
      deadline: null,
    },
    {
      type: "notice",
      title: "Non-Renewal Notice Window",
      value: "Written notice of non-renewal must be provided at least sixty (60) days prior to expiration.",
      quote: "written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.",
      responsible_party: "Either Party",
      certainty: "confirmed",
      uncertainty_reason: null,
      clarification_question: null,
      deadline: {
        anchor: "expiry_date",
        fixed_date: null,
        amount: 60,
        unit: "days",
        direction: "before",
        day_type: "calendar",
      },
    },
    {
      type: "termination",
      title: "Termination for Convenience",
      value: "Either party may terminate upon thirty (30) days prior written notice.",
      quote: "Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice.",
      responsible_party: "Either Party",
      certainty: "confirmed",
      uncertainty_reason: null,
      clarification_question: null,
      deadline: {
        anchor: "event",
        fixed_date: null,
        amount: 30,
        unit: "days",
        direction: "after",
        day_type: "calendar",
      },
    },
    {
      type: "obligation",
      title: "Payment Terms",
      value: "Invoices payable within thirty (30) days of receipt.",
      quote: "Client shall pay all undisputed invoice amounts within thirty (30) days of receipt.",
      responsible_party: "Acme Corporation",
      certainty: "confirmed",
      uncertainty_reason: null,
      clarification_question: null,
      deadline: {
        anchor: "event",
        fixed_date: null,
        amount: 30,
        unit: "days",
        direction: "after",
        day_type: "calendar",
      },
    },
    {
      type: "ambiguity",
      title: "Ambiguous Notice Standard",
      value: "Clause requires 'reasonable notice' without defining days or business hours.",
      quote: "Provider may adjust maintenance schedules upon providing reasonable notice.",
      responsible_party: "Nexus Solutions LLC",
      certainty: "uncertain",
      uncertainty_reason: "Term 'reasonable notice' does not specify a quantifiable number of days or notice method.",
      clarification_question: "How many business days of advance notice are required for maintenance schedule adjustments?",
      deadline: null,
    },
    {
      type: "conflict",
      title: "Conflicting Notice Durations",
      value: "Section 4.1 specifies 30 days notice for termination while Section 11.2 mentions 45 days.",
      quote: "All legal notices under Section 11 must be delivered in writing with forty-five (45) days advance notification.",
      responsible_party: null,
      certainty: "uncertain",
      uncertainty_reason: "Direct contradiction between 30-day convenience termination and 45-day general notice provision.",
      clarification_question: "Does termination for convenience require 30 days or 45 days notice?",
      deadline: null,
    },
  ],
};

export class MockProvider implements AiProvider {
  name = "mock";
  model = "mock-deterministic-v1";

  async extract(_input?: ExtractionInput): Promise<ExtractionOutput> {
    // Deterministic latency simulation
    return {
      rawJson: JSON.stringify(MOCK_EXTRACTION_FIXTURE),
      usage: {
        promptTokens: 850,
        completionTokens: 420,
        totalTokens: 1270,
      },
      latencyMs: 15,
    };
  }
}
