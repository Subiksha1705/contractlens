import {
  parseISO,
  format,
  isValid,
  addDays,
  subDays,
  addMonths,
  subMonths,
  addYears,
  subYears,
  addBusinessDays,
  subBusinessDays,
} from "date-fns";
import { DeadlineSpec } from "../ai/schema";

export interface FindingDeadlineInput {
  id?: string;
  type: string;
  aiValue: string;
  deadlineSpec?: DeadlineSpec | null | unknown;
  correctedDeadlineDate?: string | null;
}

export interface ComputedDeadlineOutput {
  deadlineDate: string | null; // YYYY-MM-DD
  deadlineBasis: string | null;
  deadlineFlag: "assumed_calendar_days" | "needs_human_date" | null;
}

function formatDateString(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parseDateSafely(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  // Match YYYY-MM-DD
  const clean = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const d = parseISO(clean);
  return isValid(d) ? d : null;
}

export function computeDeadlinesForFindings<T extends FindingDeadlineInput>(
  findings: T[]
): Map<T, ComputedDeadlineOutput> {
  const results = new Map<T, ComputedDeadlineOutput>();

  // 1. Resolve Effective Date
  let effectiveDateStr: string | null = null;
  for (const f of findings) {
    if (f.type === "effective_date") {
      const explicit = f.correctedDeadlineDate || parseDateSafely(f.aiValue) ? f.correctedDeadlineDate || (parseDateSafely(f.aiValue) ? f.aiValue : null) : null;
      if (explicit) {
        effectiveDateStr = explicit;
        break;
      }
    }
  }

  // 2. Resolve Expiry Date
  let expiryDateStr: string | null = null;
  for (const f of findings) {
    if (f.type === "expiry") {
      if (f.correctedDeadlineDate) {
        expiryDateStr = f.correctedDeadlineDate;
        break;
      }
      const spec = f.deadlineSpec as DeadlineSpec | null | undefined;
      if (spec?.fixed_date) {
        expiryDateStr = spec.fixed_date;
        break;
      }
      if (spec?.anchor === "effective_date" && effectiveDateStr) {
        if (spec.amount == null || !spec.unit || !spec.direction) {
          // Do not guess missing amount, unit, or direction
          continue;
        }
        const effDate = parseISO(effectiveDateStr);
        const amount = spec.amount;
        const unit = spec.unit;
        const dir = spec.direction;

        let computed: Date;
        if (unit === "years") computed = dir === "before" ? subYears(effDate, amount) : addYears(effDate, amount);
        else if (unit === "months") computed = dir === "before" ? subMonths(effDate, amount) : addMonths(effDate, amount);
        else if (unit === "weeks") computed = dir === "before" ? subDays(effDate, amount * 7) : addDays(effDate, amount * 7);
        else computed = dir === "before" ? subDays(effDate, amount) : addDays(effDate, amount);

        expiryDateStr = formatDateString(computed);
        break;
      }
    }
  }

  // 3. Compute deadline for each finding
  for (const f of findings) {
    // If user corrected deadline date explicitly
    if (f.correctedDeadlineDate) {
      results.set(f, {
        deadlineDate: f.correctedDeadlineDate,
        deadlineBasis: "User-corrected",
        deadlineFlag: null,
      });
      continue;
    }

    const spec = f.deadlineSpec as DeadlineSpec | null | undefined;
    if (!spec) {
      // If it's effective_date or expiry with a fixed date in value
      if (f.type === "effective_date" && effectiveDateStr) {
        results.set(f, {
          deadlineDate: effectiveDateStr,
          deadlineBasis: "Effective date stated in contract",
          deadlineFlag: null,
        });
        continue;
      }
      if (f.type === "expiry" && expiryDateStr) {
        results.set(f, {
          deadlineDate: expiryDateStr,
          deadlineBasis: "Expiry date stated or derived from contract term",
          deadlineFlag: null,
        });
        continue;
      }

      results.set(f, {
        deadlineDate: null,
        deadlineBasis: null,
        deadlineFlag: null,
      });
      continue;
    }

    // Explicit fixed date
    if (spec.fixed_date) {
      results.set(f, {
        deadlineDate: spec.fixed_date,
        deadlineBasis: `Explicit fixed date in contract (${spec.fixed_date})`,
        deadlineFlag: null,
      });
      continue;
    }

    // Event anchor -> requires human trigger date
    if (spec.anchor === "event") {
      const amount = spec.amount != null ? `${spec.amount} ${spec.unit ?? "days"}` : "Unspecified window";
      results.set(f, {
        deadlineDate: null,
        deadlineBasis: `Contingent on event occurrence (${amount} ${spec.direction ?? "after"} event)`,
        deadlineFlag: "needs_human_date",
      });
      continue;
    }

    // Anchor: effective_date or expiry_date
    if (spec.anchor === "effective_date" || spec.anchor === "expiry_date") {
      const isExpiry = spec.anchor === "expiry_date";
      const anchorDateStr = isExpiry ? expiryDateStr : effectiveDateStr;
      const anchorName = isExpiry ? "Expiry" : "Effective date";

      if (!anchorDateStr) {
        results.set(f, {
          deadlineDate: null,
          deadlineBasis: `Cannot calculate deadline: ${anchorName} is unresolved in document`,
          deadlineFlag: "needs_human_date",
        });
        continue;
      }

      // PRD §8.2: Never guess dates if amount, unit, or direction is missing
      if (spec.amount == null || !spec.unit || !spec.direction) {
        const missingFields = [
          spec.amount == null ? "amount" : null,
          !spec.unit ? "unit" : null,
          !spec.direction ? "direction" : null,
        ]
          .filter(Boolean)
          .join(", ");

        results.set(f, {
          deadlineDate: null,
          deadlineBasis: `Cannot calculate deadline: missing ${missingFields} in specification`,
          deadlineFlag: "needs_human_date",
        });
        continue;
      }

      const baseDate = parseISO(anchorDateStr);
      const amount = spec.amount;
      const unit = spec.unit;
      const direction = spec.direction;
      const dayType = spec.day_type ?? "unspecified";

      let computedDate: Date;
      let basis: string;
      let flag: "assumed_calendar_days" | "needs_human_date" | null = null;

      if (dayType === "business") {
        let businessDaysCount = amount;
        if (unit === "weeks") {
          businessDaysCount = amount * 5;
        }

        computedDate =
          direction === "before"
            ? subBusinessDays(baseDate, businessDaysCount)
            : addBusinessDays(baseDate, businessDaysCount);

        const unitDesc =
          unit === "weeks"
            ? `${amount} business ${amount === 1 ? "week" : "weeks"} (${businessDaysCount} business days, skipping weekends; holidays not considered)`
            : `${amount} business ${amount === 1 ? "day" : "days"} (skipping weekends; holidays not considered)`;

        basis = `${anchorName} ${anchorDateStr} ${direction === "before" ? "minus" : "plus"} ${unitDesc}`;
      } else {
        if (dayType === "unspecified") {
          flag = "assumed_calendar_days";
        }

        let unitLabel: string;
        if (unit === "years") {
          computedDate = direction === "before" ? subYears(baseDate, amount) : addYears(baseDate, amount);
          unitLabel = amount === 1 ? "year" : "years";
        } else if (unit === "months") {
          computedDate = direction === "before" ? subMonths(baseDate, amount) : addMonths(baseDate, amount);
          unitLabel = amount === 1 ? "month" : "months";
        } else if (unit === "weeks") {
          computedDate = direction === "before" ? subDays(baseDate, amount * 7) : addDays(baseDate, amount * 7);
          unitLabel = amount === 1 ? "week" : "weeks";
        } else {
          computedDate = direction === "before" ? subDays(baseDate, amount) : addDays(baseDate, amount);
          unitLabel = amount === 1 ? "calendar day" : "calendar days";
        }

        const note = dayType === "unspecified" ? " (assumed calendar days)" : "";
        basis = `${anchorName} ${anchorDateStr} ${direction === "before" ? "minus" : "plus"} ${amount} ${unitLabel}${note}`;
      }

      results.set(f, {
        deadlineDate: formatDateString(computedDate),
        deadlineBasis: basis,
        deadlineFlag: flag,
      });
      continue;
    }

    // Default missing pieces
    results.set(f, {
      deadlineDate: null,
      deadlineBasis: "Missing deadline reference anchor",
      deadlineFlag: "needs_human_date",
    });
  }

  return results;
}
