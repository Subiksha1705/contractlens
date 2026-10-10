import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contractVersions = pgTable(
  "contract_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .references(() => contracts.id, { onDelete: "cascade" })
      .notNull(),
    versionNumber: integer("version_number").notNull(),
    sourceKind: text("source_kind", { enum: ["pdf", "docx", "text"] }).notNull(),
    fileName: text("file_name"),
    fullText: text("full_text").notNull(),
    pages: jsonb("pages").$type<Array<{ page: number; start: number; end: number }>>(),
    policyText: text("policy_text"),
    truncated: boolean("truncated").default(false).notNull(),
    aiProvider: text("ai_provider").notNull(),
    aiModel: text("ai_model").notNull(),
    extractionStatus: text("extraction_status", {
      enum: ["ok", "partial", "failed"],
    }).notNull(),
    extractionError: text("extraction_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("contract_versions_contract_version_idx").on(
      table.contractId,
      table.versionNumber
    ),
  ]
);

export const findings = pgTable("findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  versionId: uuid("version_id")
    .references(() => contractVersions.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // party | effective_date | expiry | renewal | termination | notice | obligation | conflict | ambiguity | policy_mismatch
  title: text("title").notNull(),
  aiValue: text("ai_value").notNull(),
  aiResponsibleParty: text("ai_responsible_party"),
  certainty: text("certainty", { enum: ["confirmed", "uncertain"] }).notNull(),
  uncertaintyReason: text("uncertainty_reason"),
  clarificationQuestion: text("clarification_question"),
  evidenceQuote: text("evidence_quote").notNull(),
  evidenceStatus: text("evidence_status", { enum: ["verified", "unverified"] }).notNull(),
  page: integer("page"),
  section: text("section"),
  charStart: integer("char_start"),
  charEnd: integer("char_end"),
  deadlineSpec: jsonb("deadline_spec"),
  deadlineDate: date("deadline_date"),
  deadlineBasis: text("deadline_basis"),
  deadlineFlag: text("deadline_flag"),
  reviewStatus: text("review_status", {
    enum: ["pending", "approved", "rejected", "potentially_stale"],
  })
    .default("pending")
    .notNull(),
  correctedValue: text("corrected_value"),
  correctedResponsibleParty: text("corrected_responsible_party"),
  correctedDeadlineDate: date("corrected_deadline_date"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  staleReason: text("stale_reason"),
  carriedFromFindingId: uuid("carried_from_finding_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id")
    .references(() => contracts.id, { onDelete: "cascade" })
    .notNull(),
  versionId: uuid("version_id").references(() => contractVersions.id, {
    onDelete: "set null",
  }),
  findingId: uuid("finding_id").references(() => findings.id, {
    onDelete: "set null",
  }),
  type: text("type", {
    enum: ["upload", "ai_call", "edit", "approve", "reject", "stale_flag", "rerun"],
  }).notNull(),
  detail: jsonb("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type ContractVersion = typeof contractVersions.$inferSelect;
export type NewContractVersion = typeof contractVersions.$inferInsert;
export type Finding = typeof findings.$inferSelect;
export type NewFinding = typeof findings.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
