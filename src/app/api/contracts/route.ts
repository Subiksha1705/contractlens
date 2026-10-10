import { NextRequest, NextResponse } from "next/server";
import { ingestContract } from "@/lib/services/ingest";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;
      const title = (formData.get("title") as string | null) || undefined;
      const policyText = (formData.get("policyText") as string | null) || undefined;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await ingestContract(
          {
            buffer: arrayBuffer,
            fileName: file.name,
            mimeType: file.type,
          },
          { contractTitle: title, policyText }
        );

        return NextResponse.json({ success: true, ...result });
      } else if (text && text.trim().length > 0) {
        const result = await ingestContract(
          { text },
          { contractTitle: title, policyText }
        );

        return NextResponse.json({ success: true, ...result });
      } else {
        return NextResponse.json(
          { success: false, error: "Please upload a contract file or paste contract text." },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      if (!body.text || body.text.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Contract text cannot be empty." },
          { status: 400 }
        );
      }

      const result = await ingestContract(
        { text: body.text },
        { contractTitle: body.title, policyText: body.policyText }
      );

      return NextResponse.json({ success: true, ...result });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
