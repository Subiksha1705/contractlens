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
  anchor: z.enum(["effective_date", "expiry_date", "fixed_date", "event"]).nullable(),
  fixed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  amount: z.number().nullable(),
  unit: z.enum(["days", "weeks", "months", "years"]).nullable(),
  direction: z.enum(["before", "after"]).nullable(),
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
