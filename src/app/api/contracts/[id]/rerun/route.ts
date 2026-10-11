import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { contractVersions, auditEvents } from "@/lib/db/schema";
import { ingestContract } from "@/lib/services/ingest";
import { compareVersions } from "@/lib/versions/compare";
import { sanitizeErrorMessage } from "@/lib/security/sanitize";
import { isUuid } from "@/lib/db/queries";
import { PageOffset } from "@/lib/parse/pages";
import { eq, desc } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ success: false, error: "Invalid contract ID: must be a valid UUID." }, { status: 400 });
  }

  try {
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

    // Re-run extraction preserving original sourceKind and PDF pages
    const result = await ingestContract(
      { text: latest.fullText, fileName: latest.fileName ?? undefined },
      {
        contractId: id,
        policyText: latest.policyText ?? undefined,
        sourceKindOverride: latest.sourceKind as "pdf" | "docx" | "text",
        pagesOverride: (latest.pages as PageOffset[] | null) ?? null,
      }
    );

    // Run version comparison against previous version
    let compareResult = null;
    try {
      compareResult = await compareVersions(latest.id, result.versionId);
    } catch (cmpErr) {
      console.warn("Version comparison during rerun failed:", cmpErr);
    }

    // Record rerun audit event
    await db.insert(auditEvents).values({
      contractId: id,
      versionId: result.versionId,
      type: "rerun",
      detail: {
        previousVersionId: latest.id,
        newVersionId: result.versionId,
        sourceKind: latest.sourceKind,
        timestamp: new Date().toISOString(),
      },
    });

    // Check if this was submitted from an HTML browser form
    const acceptHeader = _req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      return NextResponse.redirect(new URL(`/contracts/${id}?versionId=${result.versionId}`, _req.url), { status: 303 });
    }

    return NextResponse.json({ success: true, ...result, compareResult });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Re-run failed";
    const safeMessage = sanitizeErrorMessage(rawMessage);
    const acceptHeader = _req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      return NextResponse.redirect(new URL(`/contracts/${id}?error=${encodeURIComponent(safeMessage)}`, _req.url), { status: 303 });
    }
    return NextResponse.json({ success: false, error: safeMessage }, { status: 500 });
  }
}

