import { normalize } from "../evidence/normalize";
import { getDb } from "../db/client";
import { findings, contractVersions, auditEvents, Finding } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Computes token-level Jaccard similarity between two strings.
 * Normalized and case-insensitive.
 */
export function tokenJaccardSimilarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  const tokensA = new Set(normA.split(/\s+/).filter(Boolean));
  const tokensB = new Set(normB.split(/\s+/).filter(Boolean));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface StaleComparisonItem {
  oldFindingId: string;
  newFindingId?: string;
  reason: string;
  oldValue: string;
  newValue?: string;
}

export interface CompareResult {
  previousVersionId: string;
  newVersionId: string;
  carriedForwardCount: number;
  staleFlaggedCount: number;
  unmatchedCount: number;
  staleItems: StaleComparisonItem[];
}

/**
 * Compares version N with newly ingested version N+1:
 * - Carries forward unchanged approvals from version N to version N+1
 * - Flags changed or removed approved clauses as potentially_stale
 * - Logs audit_events with type 'stale_flag'
 * - Leaves untouched user corrections on version N (never silently overwrites)
 */
export async function compareVersions(
  previousVersionId: string,
  newVersionId: string
): Promise<CompareResult> {
  const db = getDb();

  // 1. Fetch versions
  const [prevVersion] = await db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.id, previousVersionId))
    .limit(1);

  const [newVersion] = await db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.id, newVersionId))
    .limit(1);

  if (!prevVersion || !newVersion) {
    throw new Error("One or both contract versions could not be found.");
  }

  // 2. Fetch findings for both versions
  const oldFindingsList: Finding[] = await db
    .select()
    .from(findings)
    .where(eq(findings.versionId, previousVersionId));

  const newFindingsList: Finding[] = await db
    .select()
    .from(findings)
    .where(eq(findings.versionId, newVersionId));

  const newTextNormalized = normalize(newVersion.fullText);

  // Filter old findings to those that were approved or had user corrections
  const relevantOldFindings = oldFindingsList.filter(
    (f) =>
      f.reviewStatus === "approved" ||
      Boolean(f.correctedValue || f.correctedResponsibleParty || f.correctedDeadlineDate)
  );

  let carriedForwardCount = 0;
  let staleFlaggedCount = 0;
  const staleItems: StaleComparisonItem[] = [];
  const matchedNewFindingIds = new Set<string>();

  for (const old of relevantOldFindings) {
    // 1. Match candidates by same type
    let bestMatch: Finding | null = null;
    let bestSimilarity = -1;

    for (const newF of newFindingsList) {
      if (newF.type !== old.type) continue;
      const sim = tokenJaccardSimilarity(old.evidenceQuote, newF.evidenceQuote);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = newF;
      }
    }

    const oldQuoteInNewText = newTextNormalized.includes(normalize(old.evidenceQuote));

    if (!bestMatch || bestSimilarity < 0.7) {
      // 2. No match -> old finding potentially_stale
      const reason = oldQuoteInNewText
        ? `Clause re-evaluated in version ${newVersion.versionNumber}`
        : `Evidence not found in version ${newVersion.versionNumber}`;
      await db
        .update(findings)
        .set({
          reviewStatus: "potentially_stale",
          staleReason: reason,
        })
        .where(eq(findings.id, old.id));

      await db.insert(auditEvents).values({
        contractId: newVersion.contractId,
        versionId: newVersion.id,
        findingId: old.id,
        type: "stale_flag",
        detail: {
          reason,
          oldFindingId: old.id,
          oldFindingTitle: old.title,
        },
      });

      staleFlaggedCount++;
      staleItems.push({
        oldFindingId: old.id,
        reason,
        oldValue: old.correctedValue ?? old.aiValue,
      });
    } else {
      matchedNewFindingIds.add(bestMatch.id);

      // 3. Matched: Check if value or deadline differs
      const oldEffectiveValue = (old.correctedValue ?? old.aiValue).trim();
      const newEffectiveValue = bestMatch.aiValue.trim();
      const oldEffectiveDeadline = old.correctedDeadlineDate ?? old.deadlineDate;
      const newEffectiveDeadline = bestMatch.deadlineDate;

      const valueChanged = oldEffectiveValue !== newEffectiveValue;
      const deadlineChanged = oldEffectiveDeadline !== newEffectiveDeadline;

      if (valueChanged || deadlineChanged) {
        // Matched but value or deadline differs -> potentially_stale
        const reason = `Value changed in version ${newVersion.versionNumber}`;
        const newFindingStaleReason = `Value changed from version ${prevVersion.versionNumber}: was "${oldEffectiveValue}"`;

        // Flag old finding
        await db
          .update(findings)
          .set({
            reviewStatus: "potentially_stale",
            staleReason: reason,
          })
          .where(eq(findings.id, old.id));

        // Flag new finding in version N+1 with pointer to old
        await db
          .update(findings)
          .set({
            reviewStatus: "potentially_stale",
            carriedFromFindingId: old.id,
            staleReason: newFindingStaleReason,
          })
          .where(eq(findings.id, bestMatch.id));

        await db.insert(auditEvents).values({
          contractId: newVersion.contractId,
          versionId: newVersion.id,
          findingId: bestMatch.id,
          type: "stale_flag",
          detail: {
            reason,
            oldFindingId: old.id,
            newFindingId: bestMatch.id,
            previousValue: oldEffectiveValue,
            newValue: newEffectiveValue,
            previousDeadline: oldEffectiveDeadline,
            newDeadline: newEffectiveDeadline,
          },
        });

        staleFlaggedCount++;
        staleItems.push({
          oldFindingId: old.id,
          newFindingId: bestMatch.id,
          reason,
          oldValue: oldEffectiveValue,
          newValue: newEffectiveValue,
        });
      } else {
        // 4. Matched and identical -> carry forward
        await db
          .update(findings)
          .set({
            reviewStatus: "approved",
            carriedFromFindingId: old.id,
            correctedValue: old.correctedValue,
            correctedResponsibleParty: old.correctedResponsibleParty,
            correctedDeadlineDate: old.correctedDeadlineDate,
            reviewedAt: old.reviewedAt ?? new Date(),
          })
          .where(eq(findings.id, bestMatch.id));

        carriedForwardCount++;
      }
    }
  }

  const unmatchedCount = newFindingsList.length - matchedNewFindingIds.size;

  return {
    previousVersionId,
    newVersionId,
    carriedForwardCount,
    staleFlaggedCount,
    unmatchedCount,
    staleItems,
  };
}
