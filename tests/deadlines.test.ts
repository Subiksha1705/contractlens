import { describe, it, expect } from "vitest";
import { computeDeadlinesForFindings } from "@/lib/deadlines/compute";
import { calculateUpcomingReminders } from "@/lib/deadlines/reminders";
import { parseISO } from "date-fns";

describe("Phase 5: Deterministic Deadlines & Reminders", () => {
  describe("computeDeadlinesForFindings()", () => {
    it("computes 60-day renewal notice before expiry with assumed calendar days flag", () => {
      const findings = [
        {
          type: "effective_date",
          aiValue: "2025-01-01",
        },
        {
          type: "expiry",
          aiValue: "One year from effective date",
          deadlineSpec: {
            anchor: "effective_date" as const,
            fixed_date: null,
            amount: 1,
            unit: "years" as const,
            direction: "after" as const,
            day_type: "calendar" as const,
          },
        },
        {
          type: "notice",
          aiValue: "60 days prior notice",
          deadlineSpec: {
            anchor: "expiry_date" as const,
            fixed_date: null,
            amount: 60,
            unit: "days" as const,
            direction: "before" as const,
            day_type: "unspecified" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      const noticeFinding = findings[2];
      const computed = results.get(noticeFinding);

      expect(computed).toBeDefined();
      // Expiry is 2026-01-01. 60 days before is 2025-11-02.
      expect(computed?.deadlineDate).toBe("2025-11-02");
      expect(computed?.deadlineFlag).toBe("assumed_calendar_days");
      expect(computed?.deadlineBasis).toContain("Expiry 2026-01-01 minus 60 calendar days (assumed calendar days)");
    });

    it("calculates business days skipping weekends", () => {
      // 2025-01-10 is a Friday.
      // 5 business days after Friday Jan 10 = Friday Jan 17 (skipping Saturday Jan 11 & Sunday Jan 12).
      const findings = [
        {
          type: "effective_date",
          aiValue: "2025-01-10",
        },
        {
          type: "obligation",
          aiValue: "Payment within 5 business days",
          deadlineSpec: {
            anchor: "effective_date" as const,
            fixed_date: null,
            amount: 5,
            unit: "days" as const,
            direction: "after" as const,
            day_type: "business" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      const paymentItem = findings[1];
      const computed = results.get(paymentItem);

      expect(computed?.deadlineDate).toBe("2025-01-17");
      expect(computed?.deadlineFlag).toBeNull();
      expect(computed?.deadlineBasis).toContain("skipping weekends; holidays not considered");
    });

    it("handles month-end calculation (Jan 31 + 1 month = Feb 28)", () => {
      const findings = [
        {
          type: "effective_date",
          aiValue: "2025-01-31",
        },
        {
          type: "obligation",
          aiValue: "Audit after 1 month",
          deadlineSpec: {
            anchor: "effective_date" as const,
            fixed_date: null,
            amount: 1,
            unit: "months" as const,
            direction: "after" as const,
            day_type: "calendar" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      const computed = results.get(findings[1]);
      // 2025 is not a leap year -> Feb 28
      expect(computed?.deadlineDate).toBe("2025-02-28");
    });

    it("handles leap year (2024-01-31 + 1 month = 2024-02-29)", () => {
      const findings = [
        {
          type: "effective_date",
          aiValue: "2024-01-31",
        },
        {
          type: "obligation",
          aiValue: "Audit after 1 month",
          deadlineSpec: {
            anchor: "effective_date" as const,
            fixed_date: null,
            amount: 1,
            unit: "months" as const,
            direction: "after" as const,
            day_type: "calendar" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      const computed = results.get(findings[1]);
      expect(computed?.deadlineDate).toBe("2024-02-29");
    });

    it("handles direction 'before' vs 'after'", () => {
      const findings = [
        {
          type: "effective_date",
          aiValue: "2025-06-15",
        },
        {
          type: "obligation",
          aiValue: "10 days before",
          deadlineSpec: {
            anchor: "effective_date" as const,
            fixed_date: null,
            amount: 10,
            unit: "days" as const,
            direction: "before" as const,
            day_type: "calendar" as const,
          },
        },
        {
          type: "obligation",
          aiValue: "10 days after",
          deadlineSpec: {
            anchor: "effective_date" as const,
            fixed_date: null,
            amount: 10,
            unit: "days" as const,
            direction: "after" as const,
            day_type: "calendar" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      expect(results.get(findings[1])?.deadlineDate).toBe("2025-06-05");
      expect(results.get(findings[2])?.deadlineDate).toBe("2025-06-25");
    });

    it("flags event-based deadlines with needs_human_date (e.g. reasonable notice)", () => {
      const findings = [
        {
          type: "ambiguity",
          aiValue: "Reasonable notice required",
          deadlineSpec: {
            anchor: "event" as const,
            fixed_date: null,
            amount: 30,
            unit: "days" as const,
            direction: "after" as const,
            day_type: "calendar" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      const computed = results.get(findings[0]);
      expect(computed?.deadlineDate).toBeNull();
      expect(computed?.deadlineFlag).toBe("needs_human_date");
      expect(computed?.deadlineBasis).toContain("Contingent on event occurrence");
    });

    it("handles unresolved expiry anchor cleanly", () => {
      const findings = [
        {
          type: "notice",
          aiValue: "60 days before expiry",
          deadlineSpec: {
            anchor: "expiry_date" as const,
            fixed_date: null,
            amount: 60,
            unit: "days" as const,
            direction: "before" as const,
            day_type: "calendar" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      const computed = results.get(findings[0]);
      expect(computed?.deadlineDate).toBeNull();
      expect(computed?.deadlineFlag).toBe("needs_human_date");
      expect(computed?.deadlineBasis).toContain("Expiry is unresolved");
    });

    it("respects user correctedDeadlineDate and sets basis to User-corrected", () => {
      const findings = [
        {
          type: "notice",
          aiValue: "Original rule",
          correctedDeadlineDate: "2025-11-15",
          deadlineSpec: {
            anchor: "effective_date" as const,
            fixed_date: null,
            amount: 10,
            unit: "days" as const,
            direction: "after" as const,
            day_type: "calendar" as const,
          },
        },
      ];

      const results = computeDeadlinesForFindings(findings);
      const computed = results.get(findings[0]);
      expect(computed?.deadlineDate).toBe("2025-11-15");
      expect(computed?.deadlineBasis).toBe("User-corrected");
      expect(computed?.deadlineFlag).toBeNull();
    });
  });

  describe("calculateUpcomingReminders()", () => {
    it("returns reminders for 30, 14, 7, 1 days prior when all are future", () => {
      // Injected today: 2025-01-01
      // Target deadline: 2025-03-01 (60 days out)
      const today = parseISO("2025-01-01");
      const deadline = parseISO("2025-03-01");

      const reminders = calculateUpcomingReminders(deadline, today);

      expect(reminders.length).toBe(4);
      expect(reminders.map((r) => r.daysBefore)).toEqual([30, 14, 7, 1]);
    });

    it("filters out past reminder dates relative to injected today", () => {
      // Injected today: 2025-02-20
      // Target deadline: 2025-03-01 (9 days out)
      // 30 days before = Jan 30 (PAST -> filtered out)
      // 14 days before = Feb 15 (PAST -> filtered out)
      // 7 days before = Feb 22 (FUTURE -> kept)
      // 1 day before = Feb 28 (FUTURE -> kept)
      const today = parseISO("2025-02-20");
      const deadline = parseISO("2025-03-01");

      const reminders = calculateUpcomingReminders(deadline, today);

      expect(reminders.length).toBe(2);
      expect(reminders.map((r) => r.daysBefore)).toEqual([7, 1]);
    });

    it("returns empty array for past-due deadline", () => {
      const today = parseISO("2025-03-05");
      const deadline = parseISO("2025-03-01");

      const reminders = calculateUpcomingReminders(deadline, today);
      expect(reminders.length).toBe(0);
    });
  });
});
