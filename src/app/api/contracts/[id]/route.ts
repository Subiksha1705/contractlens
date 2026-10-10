import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { contracts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeErrorMessage } from "@/lib/security/sanitize";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = await db
      .select({ id: contracts.id })
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Contract not found." },
        { status: 404 }
      );
    }

    // Deleting the contract cascades to versions, findings, and auditEvents
    await db.delete(contracts).where(eq(contracts.id, id));

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = sanitizeErrorMessage(
      err instanceof Error ? err.message : "Failed to delete contract"
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const contract = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (contract.length === 0) {
      return NextResponse.json(
        { success: false, error: "Contract not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, contract: contract[0] });
  } catch (err: unknown) {
    const message = sanitizeErrorMessage(
      err instanceof Error ? err.message : "Failed to retrieve contract"
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
