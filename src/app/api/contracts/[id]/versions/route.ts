import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { contractVersions, contracts } from "@/lib/db/schema";
import { ingestContract } from "@/lib/services/ingest";
import { compareVersions } from "@/lib/versions/compare";
import { eq, desc } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();

    // Verify contract exists
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: "Contract not found." },
        { status: 404 }
      );
    }

    // Get current latest version to compare against
    const prevVersions = await db
      .select()
      .from(contractVersions)
      .where(eq(contractVersions.contractId, id))
      .orderBy(desc(contractVersions.versionNumber))
      .limit(1);

    const prevVersion = prevVersions[0];

    const contentType = req.headers.get("content-type") || "";
    let parseInput: { buffer?: ArrayBuffer; fileName?: string; mimeType?: string; text?: string } | null = null;
    let policyText: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;
      policyText = (formData.get("policyText") as string | null) || undefined;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        parseInput = {
          buffer: arrayBuffer,
          fileName: file.name,
          mimeType: file.type,
        };
      } else if (text && text.trim().length > 0) {
        parseInput = { text };
      }
    } else {
      const body = await req.json();
      policyText = body.policyText;
      if (body.text && body.text.trim().length > 0) {
        parseInput = { text: body.text, fileName: body.fileName };
      }
    }

    if (!parseInput) {
      return NextResponse.json(
        { success: false, error: "Please upload a contract file or paste contract text for the new version." },
        { status: 400 }
      );
    }

    // Ingest new version (exactly 1 AI call, verification, deadline computation)
    const result = await ingestContract(parseInput, {
      contractId: id,
      policyText: policyText ?? prevVersion?.policyText ?? undefined,
    });

    // Run deterministic version comparison if a previous version existed
    let compareResult = null;
    if (prevVersion) {
      compareResult = await compareVersions(prevVersion.id, result.versionId);
    }

    // Check if this was submitted from an HTML browser form
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      return NextResponse.redirect(
        new URL(`/contracts/${id}?versionId=${result.versionId}`, req.url),
        { status: 303 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
      compareResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Version upload failed";
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      return NextResponse.redirect(
        new URL(`/contracts/${id}?error=${encodeURIComponent(message)}`, req.url),
        { status: 303 }
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
