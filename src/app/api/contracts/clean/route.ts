import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { contracts } from "@/lib/db/schema";
import { sanitizeErrorMessage } from "@/lib/security/sanitize";

export async function POST() {
  try {
    const db = getDb();
    // Cascade delete removes all associated versions, findings, and audit events
    const deleted = await db.delete(contracts).returning({ id: contracts.id });
    return NextResponse.json({ success: true, count: deleted.length });
  } catch (err: unknown) {
    const message = sanitizeErrorMessage(
      err instanceof Error ? err.message : "Failed to clean database"
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
