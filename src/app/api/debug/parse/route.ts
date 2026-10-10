import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/parse";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await parseDocument({
          buffer: arrayBuffer,
          fileName: file.name,
          mimeType: file.type,
        });

        return NextResponse.json({
          success: true,
          kind: parsed.kind,
          fileName: parsed.fileName,
          charCount: parsed.text.length,
          pageCount: parsed.pages?.length ?? null,
          pages: parsed.pages,
          previewText: parsed.text.slice(0, 1000),
          fullText: parsed.text,
        });
      } else if (text && text.trim().length > 0) {
        const parsed = await parseDocument({ text });
        return NextResponse.json({
          success: true,
          kind: parsed.kind,
          fileName: null,
          charCount: parsed.text.length,
          pageCount: null,
          pages: null,
          previewText: parsed.text.slice(0, 1000),
          fullText: parsed.text,
        });
      } else {
        return NextResponse.json(
          { success: false, error: "Please upload a file or paste contract text." },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      if (!body.text || body.text.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Pasted text cannot be empty." },
          { status: 400 }
        );
      }

      const parsed = await parseDocument({ text: body.text });
      return NextResponse.json({
        success: true,
        kind: parsed.kind,
        fileName: null,
        charCount: parsed.text.length,
        pageCount: null,
        pages: null,
        previewText: parsed.text.slice(0, 1000),
        fullText: parsed.text,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parsing error";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
