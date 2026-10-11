CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"version_id" uuid,
	"finding_id" uuid,
	"type" text NOT NULL,
	"detail" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source_kind" text NOT NULL,
	"file_name" text,
	"full_text" text NOT NULL,
	"pages" jsonb,
	"policy_text" text,
	"truncated" boolean DEFAULT false NOT NULL,
	"ai_provider" text NOT NULL,
	"ai_model" text NOT NULL,
	"extraction_status" text NOT NULL,
	"extraction_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"ai_value" text NOT NULL,
	"ai_responsible_party" text,
	"certainty" text NOT NULL,
	"uncertainty_reason" text,
	"clarification_question" text,
	"evidence_quote" text NOT NULL,
	"evidence_status" text NOT NULL,
	"page" integer,
	"section" text,
	"char_start" integer,
	"char_end" integer,
	"deadline_spec" jsonb,
	"deadline_date" date,
	"deadline_basis" text,
	"deadline_flag" text,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"corrected_value" text,
	"corrected_responsible_party" text,
	"corrected_deadline_date" date,
	"reviewed_at" timestamp with time zone,
	"stale_reason" text,
	"carried_from_finding_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_version_id_contract_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."contract_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_version_id_contract_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."contract_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contract_versions_contract_version_idx" ON "contract_versions" USING btree ("contract_id","version_number");