import { neon } from "@neondatabase/serverless";
import { getEnv } from "../env";

let initPromise: Promise<void> | null = null;

/**
 * Ensures all required PostgreSQL tables and foreign keys exist.
 * This guarantees that fresh Neon databases or preview deployments
 * will automatically initialize without crashing on unpushed schemas.
 */
export async function ensureTablesExist(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const env = getEnv();
      const sql = neon(env.DATABASE_URL);

      await sql`
        CREATE TABLE IF NOT EXISTS "contracts" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "title" text NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS "contract_versions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "contract_id" uuid NOT NULL REFERENCES "contracts"("id") ON DELETE CASCADE,
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
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          CONSTRAINT "contract_versions_contract_id_version_number_unique" UNIQUE("contract_id", "version_number")
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS "findings" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "version_id" uuid NOT NULL REFERENCES "contract_versions"("id") ON DELETE CASCADE,
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
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS "audit_events" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "contract_id" uuid NOT NULL REFERENCES "contracts"("id") ON DELETE CASCADE,
          "version_id" uuid,
          "finding_id" uuid,
          "type" text NOT NULL,
          "detail" jsonb NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `;
    } catch (err) {
      console.warn("Auto-initialization of DB schema warning:", err);
      // Let subsequent queries handle or report specific errors
    }
  })();

  return initPromise;
}
