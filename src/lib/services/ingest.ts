import { getDb } from "../db/client";
import {
  contracts,
  contractVersions,
  findings,
  auditEvents,
  NewFinding,
} from "../db/schema";
import { parseDocument, ParseDocumentInput } from "../parse";
import { getProvider, AiProvider } from "../ai/adapter";
import {
  aiExtractionSchema,
  partyExtractionSchema,
  findingItemSchema,
  effectiveDateExtractionSchema,
} from "../ai/schema";
import { verifyQuote } from "../evidence/verify";
import { locateQuote } from "../evidence/locate";
import { getEnv } from "../env";

export interface IngestOptions {
  contractTitle?: string;
  contractId?: string; // If creating a new version of existing contract
  policyText?: string;
  providerOverride?: AiProvider;
}

export interface IngestResult {
  contractId: string;
  versionId: string;
  versionNumber: number;
  extractionStatus: "ok" | "partial" | "failed";
  truncated: boolean;
  totalFindings: number;
  aiCallLatencyMs?: number;
  error?: string;
}

export async function ingestContract(
  input: ParseDocumentInput,
  options: IngestOptions = {}
): Promise<IngestResult> {
  const env = getEnv();
  const db = getDb();

  // 1. Deterministic Parse
  const parsed = await parseDocument(input);

  // 2. Truncation Guard
  let fullText = parsed.text;
  let truncated = false;
  if (fullText.length > env.MAX_INPUT_CHARS) {
    truncated = true;
    const boundary = fullText.lastIndexOf("\n\n", env.MAX_INPUT_CHARS);
    const cutPoint = boundary > 1000 ? boundary : env.MAX_INPUT_CHARS;
    fullText = fullText.slice(0, cutPoint);
  }

  // 3. Resolve Contract ID & Version Number
  let contractId = options.contractId;
  let versionNumber = 1;

  if (!contractId) {
    const title =
      options.contractTitle ||
      parsed.fileName ||
      "Untitled Agreement " + new Date().toISOString().slice(0, 10);

    const [createdContract] = await db
      .insert(contracts)
      .values({ title })
      .returning({ id: contracts.id });

    contractId = createdContract.id;
  } else {
    // Determine next version number
    const existingVersions = await db
      .select({ versionNumber: contractVersions.versionNumber })
      .from(contractVersions)
      .where(drizzleEq(contractVersions.contractId, contractId));

    versionNumber = existingVersions.length + 1;
  }

  // 4. Exactly ONE AI Call
  const provider = options.providerOverride ?? getProvider();
  let extractionStatus: "ok" | "partial" | "failed" = "ok";
  let extractionError: string | null = null;
  let rawAiOutput = "";
  let aiLatencyMs = 0;
  let tokenUsage: Record<string, unknown> | undefined;

  let parsedExtraction: unknown = null;

  try {
    const aiResult = await provider.extract({
      contractText: fullText,
      policyText: options.policyText,
    });

    rawAiOutput = aiResult.rawJson;
    aiLatencyMs = aiResult.latencyMs;
    tokenUsage = aiResult.usage;

    // Strip accidental markdown code fences
    let cleanJson = rawAiOutput.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      parsedExtraction = JSON.parse(cleanJson);
    } catch (parseErr: unknown) {
      extractionStatus = "failed";
      extractionError = `Malformed JSON from AI model: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`;
    }
  } catch (err: unknown) {
    extractionStatus = "failed";
    extractionError = `AI provider error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 5. Create contract_versions row
  const [createdVersion] = await db
    .insert(contractVersions)
    .values({
      contractId,
      versionNumber,
      sourceKind: parsed.kind,
      fileName: parsed.fileName,
      fullText,
      pages: parsed.pages ?? undefined,
      policyText: options.policyText ?? null,
      truncated,
      aiProvider: provider.name,
      aiModel: provider.model,
      extractionStatus,
      extractionError,
    })
    .returning({ id: contractVersions.id });

  const versionId = createdVersion.id;

  // 6. Record Audit Events
  await db.insert(auditEvents).values({
    contractId,
    versionId,
    type: "upload",
    detail: {
      fileName: parsed.fileName,
      sourceKind: parsed.kind,
      charCount: fullText.length,
      truncated,
      versionNumber,
    },
  });

  await db.insert(auditEvents).values({
    contractId,
    versionId,
    type: "ai_call",
    detail: {
      provider: provider.name,
      model: provider.model,
      latencyMs: aiLatencyMs,
      usage: tokenUsage ?? null,
      status: extractionStatus,
      error: extractionError,
    },
  });

  // If extraction failed completely, save version with failure and return for manual rerun
  if (extractionStatus === "failed" || !parsedExtraction) {
    return {
      contractId,
      versionId,
      versionNumber,
      extractionStatus: "failed",
      truncated,
      totalFindings: 0,
      aiCallLatencyMs: aiLatencyMs,
      error: extractionError ?? "AI extraction failed",
    };
  }

  // 7. Salvage & Validate Zod Output
  const fullValidation = aiExtractionSchema.safeParse(parsedExtraction);
  const findingsToInsert: NewFinding[] = [];

  const rawObj = parsedExtraction as Record<string, unknown>;

  // A. Normalize Parties
  const rawParties = Array.isArray(rawObj.parties) ? rawObj.parties : [];
  for (const party of rawParties) {
    const validParty = partyExtractionSchema.safeParse(party);
    if (validParty.success) {
      const p = validParty.data;
      const verify = verifyQuote(p.quote, fullText);
      const loc = locateQuote(p.quote, fullText, parsed.pages);

      findingsToInsert.push({
        versionId,
        type: "party",
        title: `Party: ${p.name}`,
        aiValue: p.role ? `${p.name} (${p.role})` : p.name,
        aiResponsibleParty: p.name,
        certainty: verify.status === "verified" ? "confirmed" : "uncertain",
        uncertaintyReason:
          verify.status === "unverified"
            ? "Quote could not be verified in document text."
            : null,
        evidenceQuote: p.quote,
        evidenceStatus: verify.status,
        page: loc.page,
        section: loc.section,
        charStart: loc.charStart,
        charEnd: loc.charEnd,
        reviewStatus: "pending",
      });
    } else {
      extractionStatus = "partial";
    }
  }

  // B. Normalize Effective Date
  if (rawObj.effective_date) {
    const validDate = effectiveDateExtractionSchema.safeParse(rawObj.effective_date);
    if (validDate.success) {
      const ed = validDate.data;
      const quote = ed.quote ?? "";
      const verify = quote ? verifyQuote(quote, fullText) : { status: "unverified" as const };
      const loc = quote ? locateQuote(quote, fullText, parsed.pages) : { page: null, section: null, charStart: null, charEnd: null };

      findingsToInsert.push({
        versionId,
        type: "effective_date",
        title: "Effective Date",
        aiValue: ed.value ?? "Unspecified",
        aiResponsibleParty: null,
        certainty: verify.status === "verified" ? ed.certainty : "uncertain",
        uncertaintyReason:
          verify.status === "unverified"
            ? "Quote not found in document text."
            : ed.uncertainty_reason,
        evidenceQuote: quote,
        evidenceStatus: verify.status,
        page: loc.page,
        section: loc.section,
        charStart: loc.charStart,
        charEnd: loc.charEnd,
        reviewStatus: "pending",
      });
    } else {
      extractionStatus = "partial";
    }
  }

  // C. Normalize Findings (clauses, obligations, ambiguities, etc.)
  const rawFindings = Array.isArray(rawObj.findings) ? rawObj.findings : [];
  for (const item of rawFindings) {
    const validFinding = findingItemSchema.safeParse(item);
    if (validFinding.success) {
      const f = validFinding.data;
      const verify = verifyQuote(f.quote, fullText);
      const loc = locateQuote(f.quote, fullText, parsed.pages);

      // Force unverified quotes to uncertain
      const certainty = verify.status === "verified" ? f.certainty : "uncertain";
      const uncertaintyReason =
        verify.status === "unverified"
          ? "Quote not found in document text — treat as unconfirmed."
          : f.uncertainty_reason;

      findingsToInsert.push({
        versionId,
        type: f.type,
        title: f.title,
        aiValue: f.value,
        aiResponsibleParty: f.responsible_party ?? null,
        certainty,
        uncertaintyReason,
        clarificationQuestion: f.clarification_question ?? null,
        evidenceQuote: f.quote,
        evidenceStatus: verify.status,
        page: loc.page,
        section: loc.section,
        charStart: loc.charStart,
        charEnd: loc.charEnd,
        deadlineSpec: f.deadline ?? undefined,
        reviewStatus: "pending",
      });
    } else {
      extractionStatus = "partial";
    }
  }

  // If full validation failed but we salvaged items -> status is partial
  if (!fullValidation.success && findingsToInsert.length > 0) {
    extractionStatus = "partial";
  }

  // Update version status if partial
  if (extractionStatus !== "ok") {
    await db
      .update(contractVersions)
      .set({ extractionStatus })
      .where(drizzleEq(contractVersions.id, versionId));
  }

  // Batch insert all findings
  if (findingsToInsert.length > 0) {
    await db.insert(findings).values(findingsToInsert);
  }

  return {
    contractId,
    versionId,
    versionNumber,
    extractionStatus,
    truncated,
    totalFindings: findingsToInsert.length,
    aiCallLatencyMs: aiLatencyMs,
  };
}

// Internal drizzle helper
import { eq as drizzleEq } from "drizzle-orm";
