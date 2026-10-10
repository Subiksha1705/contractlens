import { Finding, Contract, ContractVersion } from "../db/schema";

export interface SummaryParty {
  name: string;
  role: string;
  quote: string;
  isApproved: boolean;
}

export interface SummaryEffectiveDate {
  value: string;
  quote: string;
  isApproved: boolean;
}

export interface SummaryTermFinding {
  id: string;
  type: string;
  title: string;
  value: string;
  quote: string;
  deadlineDate?: string | null;
  deadlineBasis?: string | null;
}

export interface SummaryObligationFinding {
  id: string;
  title: string;
  value: string;
  responsibleParty?: string | null;
  quote: string;
  deadlineDate?: string | null;
  deadlineBasis?: string | null;
  deadlineFlag?: string | null;
}

export interface SummaryAttentionItem {
  id: string;
  type: string;
  title: string;
  value: string;
  reviewStatus: string;
  certainty: string;
  uncertaintyReason?: string | null;
  clarificationQuestion?: string | null;
  staleReason?: string | null;
  quote: string;
}

export interface ContractSummaryData {
  contractTitle: string;
  versionNumber: number;
  sourceKind: string;
  generatedAt: string;
  parties: SummaryParty[];
  effectiveDate: SummaryEffectiveDate | null;
  governanceAndTerms: SummaryTermFinding[];
  obligationsAndDeadlines: SummaryObligationFinding[];
  attentionItems: SummaryAttentionItem[];
  rejectedCount: number;
  totalFindingsCount: number;
  approvedCount: number;
  pendingCount: number;
  staleCount: number;
  uncertainCount: number;
  disclaimer: string;
}

export const LEGAL_DISCLAIMER =
  "LEGAL DISCLAIMER: This summary is generated for informational review only and does not constitute formal legal advice. ContractLens relies on deterministic evidence extraction and mathematical date logic. A qualified legal professional should review all contract terms, obligations, and deadlines before taking legal action.";

/**
 * Builds a structured, zero-AI reviewed summary from database findings:
 * Group 1: Parties & effective date (approved only, else marked "Pending review")
 * Group 2: Term, renewal, termination & notice (approved)
 * Group 3: Obligations & upcoming deadlines (approved, sorted by date, with basis)
 * Group 4: Pending, uncertain, or potentially stale items (with clarification questions)
 * Group 5: Rejected items count
 */
export function buildContractSummary(
  contract: Contract,
  version: ContractVersion,
  allFindings: Finding[]
): ContractSummaryData {
  // 1. Parties
  const partyFindings = allFindings.filter((f) => f.type === "party");
  const parties: SummaryParty[] = partyFindings.map((f) => {
    const isApproved = f.reviewStatus === "approved";
    const value = f.correctedValue ?? f.aiValue;
    return {
      name: isApproved ? value : "Pending review (" + value + ")",
      role: f.aiResponsibleParty ?? "Party",
      quote: f.evidenceQuote,
      isApproved,
    };
  });

  // 2. Effective Date
  const edFinding = allFindings.find((f) => f.type === "effective_date");
  let effectiveDate: SummaryEffectiveDate | null = null;
  if (edFinding) {
    const isApproved = edFinding.reviewStatus === "approved";
    effectiveDate = {
      value: isApproved
        ? (edFinding.correctedValue ?? edFinding.aiValue)
        : `Pending review (${edFinding.correctedValue ?? edFinding.aiValue})`,
      quote: edFinding.evidenceQuote,
      isApproved,
    };
  }

  // 3. Term, Renewal, Termination & Notice (Approved only)
  const termTypes = new Set(["expiry", "renewal", "termination", "notice"]);
  const governanceAndTerms: SummaryTermFinding[] = allFindings
    .filter((f) => termTypes.has(f.type) && f.reviewStatus === "approved")
    .map((f) => ({
      id: f.id,
      type: f.type,
      title: f.title,
      value: f.correctedValue ?? f.aiValue,
      quote: f.evidenceQuote,
      deadlineDate: f.correctedDeadlineDate ?? f.deadlineDate,
      deadlineBasis: f.deadlineBasis,
    }));

  // 4. Obligations & Deadlines (Approved only, sorted by date)
  const obligationsAndDeadlines: SummaryObligationFinding[] = allFindings
    .filter(
      (f) =>
        f.reviewStatus === "approved" &&
        (f.type === "obligation" || Boolean(f.deadlineDate || f.correctedDeadlineDate)) &&
        !termTypes.has(f.type)
    )
    .map((f) => ({
      id: f.id,
      title: f.title,
      value: f.correctedValue ?? f.aiValue,
      responsibleParty: f.correctedResponsibleParty ?? f.aiResponsibleParty,
      quote: f.evidenceQuote,
      deadlineDate: f.correctedDeadlineDate ?? f.deadlineDate,
      deadlineBasis: f.deadlineBasis,
      deadlineFlag: f.deadlineFlag,
    }))
    .sort((a, b) => {
      if (!a.deadlineDate) return 1;
      if (!b.deadlineDate) return -1;
      return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
    });

  // 5. Items requiring human attention: Pending, Stale, or Uncertain
  const attentionItems: SummaryAttentionItem[] = allFindings
    .filter(
      (f) =>
        f.reviewStatus === "pending" ||
        f.reviewStatus === "potentially_stale" ||
        f.certainty === "uncertain"
    )
    .map((f) => ({
      id: f.id,
      type: f.type,
      title: f.title,
      value: f.correctedValue ?? f.aiValue,
      reviewStatus: f.reviewStatus,
      certainty: f.certainty,
      uncertaintyReason: f.uncertaintyReason,
      clarificationQuestion: f.clarificationQuestion,
      staleReason: f.staleReason,
      quote: f.evidenceQuote,
    }));

  // 6. Counts
  const rejectedCount = allFindings.filter((f) => f.reviewStatus === "rejected").length;
  const approvedCount = allFindings.filter((f) => f.reviewStatus === "approved").length;
  const pendingCount = allFindings.filter((f) => f.reviewStatus === "pending").length;
  const staleCount = allFindings.filter((f) => f.reviewStatus === "potentially_stale").length;
  const uncertainCount = allFindings.filter((f) => f.certainty === "uncertain").length;

  return {
    contractTitle: contract.title,
    versionNumber: version.versionNumber,
    sourceKind: version.sourceKind,
    generatedAt: new Date().toISOString(),
    parties,
    effectiveDate,
    governanceAndTerms,
    obligationsAndDeadlines,
    attentionItems,
    rejectedCount,
    totalFindingsCount: allFindings.length,
    approvedCount,
    pendingCount,
    staleCount,
    uncertainCount,
    disclaimer: LEGAL_DISCLAIMER,
  };
}
