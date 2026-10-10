import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { contractVersions } from "@/lib/db/schema";
import { ingestContract } from "@/lib/services/ingest";
import { eq, desc } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Get latest version of this contract
    const versions = await db
      .select()
      .from(contractVersions)
      .where(eq(contractVersions.contractId, id))
      .orderBy(desc(contractVersions.versionNumber))
      .limit(1);

    const latest = versions[0];
    if (!latest) {
      return NextResponse.json(
        { success: false, error: "Contract version not found." },
        { status: 404 }
      );
    }

    // Re-run extraction using stored fullText
    const result = await ingestContract(
      { text: latest.fullText, fileName: latest.fileName ?? undefined },
      {
        contractId: id,
        policyText: latest.policyText ?? undefined,
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Re-run failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
