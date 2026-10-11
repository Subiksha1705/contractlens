import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { contracts } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { sanitizeErrorMessage } from "@/lib/security/sanitize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No contract IDs provided." },
        { status: 400 }
      );
    }

    const validIds = ids.filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0
    );

    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid contract IDs provided." },
        { status: 400 }
      );
    }

    const db = getDb();
    // Cascade deletes automatically remove versions, findings, and audit events
    const deleted = await db
      .delete(contracts)
      .where(inArray(contracts.id, validIds))
      .returning({ id: contracts.id });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.length,
      deletedIds: deleted.map((d) => d.id),
    });
  } catch (err: unknown) {
    const message = sanitizeErrorMessage(
      err instanceof Error ? err.message : "Failed to bulk delete contracts"
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
