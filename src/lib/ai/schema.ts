import { z } from "zod";

export const partyExtractionSchema = z.object({
  name: z.string().min(1),
  role: z.string().nullable().optional(),
  quote: z.string().min(1),
});

export const effectiveDateExtractionSchema = z.object({
  value: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  quote: z.string().nullable(),
  certainty: z.enum(["confirmed", "uncertain"]),
  uncertainty_reason: z.string().nullable().optional(),
});

export const deadlineSpecSchema = z.object({
  anchor: z.preprocess((val) => {
    if (!val || typeof val !== "string") return val ?? null;
    const clean = val.toLowerCase().trim();
    if (clean === "expiry" || clean === "expiry_date" || clean === "expiration") return "expiry_date";
    if (clean === "effective" || clean === "effective_date") return "effective_date";
    if (clean === "fixed" || clean === "fixed_date") return "fixed_date";
    if (clean === "event") return "event";
    if (clean === "null" || clean === "none" || clean === "") return null;
    // Any domain trigger like "invoice", "notice", "completion" is an event anchor
    return "event";
  }, z.enum(["effective_date", "expiry_date", "fixed_date", "event"]).nullable()),
  fixed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  amount: z.number().nullable().optional(),
  unit: z.enum(["days", "weeks", "months", "years"]).nullable().optional(),
  direction: z.enum(["before", "after"]).nullable().optional(),
  day_type: z.enum(["calendar", "business", "unspecified"]).default("unspecified"),
});

export const findingItemSchema = z.object({
  type: z.enum([
    "expiry",
    "renewal",
    "termination",
    "notice",
    "obligation",
    "conflict",
    "ambiguity",
    "policy_mismatch",
  ]),
  title: z.string().min(1),
  value: z.string().min(1),
  quote: z.string().min(1),
  responsible_party: z.string().nullable().optional(),
  certainty: z.enum(["confirmed", "uncertain"]),
  uncertainty_reason: z.string().nullable().optional(),
  clarification_question: z.string().nullable().optional(),
  deadline: deadlineSpecSchema.nullable().optional(),
});

export const aiExtractionSchema = z.object({
  parties: z.array(partyExtractionSchema).default([]),
  effective_date: effectiveDateExtractionSchema.nullable().optional(),
  findings: z.array(findingItemSchema).default([]),
});

export type PartyExtraction = z.infer<typeof partyExtractionSchema>;
export type EffectiveDateExtraction = z.infer<typeof effectiveDateExtractionSchema>;
export type DeadlineSpec = z.infer<typeof deadlineSpecSchema>;
export type FindingItem = z.infer<typeof findingItemSchema>;
export type AiExtractionResult = z.infer<typeof aiExtractionSchema>;
