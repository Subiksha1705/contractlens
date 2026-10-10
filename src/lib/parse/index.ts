import { parsePlainText } from "./text";
import { parsePdf } from "./pdf";
import { parseDocx } from "./docx";
import { PageOffset } from "./pages";
import { getEnv } from "../env";

export type DocumentSourceKind = "pdf" | "docx" | "text";

export interface ParseDocumentInput {
  text?: string;
  buffer?: Buffer | ArrayBuffer | Uint8Array;
  fileName?: string;
  mimeType?: string;
}

export interface ParseDocumentResult {
  text: string;
  pages: PageOffset[] | null;
  kind: DocumentSourceKind;
  fileName: string | null;
}

export async function parseDocument(
  input: ParseDocumentInput
): Promise<ParseDocumentResult> {
  const env = getEnv();
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

  // 1. Direct pasted text input
  if (input.text !== undefined) {
    const { text } = parsePlainText(input.text);
    return {
      text,
      pages: null,
      kind: "text",
      fileName: input.fileName ?? null,
    };
  }

  // 2. Binary file input
  if (!input.buffer) {
    throw new Error("No document content or file provided for ingestion.");
  }

  const rawBytes =
    input.buffer instanceof Uint8Array
      ? input.buffer.byteLength
      : (input.buffer as ArrayBuffer).byteLength;

  if (rawBytes > maxBytes) {
    throw new Error(
      `File size (${(rawBytes / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${env.MAX_UPLOAD_MB} MB.`
    );
  }

  const fileName = input.fileName || "";
  const ext = fileName.toLowerCase().split(".").pop();
  const mime = input.mimeType?.toLowerCase() || "";

  // PDF
  if (
    ext === "pdf" ||
    mime === "application/pdf"
  ) {
    const { text, pages } = await parsePdf(input.buffer);
    return {
      text,
      pages,
      kind: "pdf",
      fileName: input.fileName ?? "document.pdf",
    };
  }

  // DOCX
  if (
    ext === "docx" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { text } = await parseDocx(input.buffer);
    return {
      text,
      pages: null,
      kind: "docx",
      fileName: input.fileName ?? "document.docx",
    };
  }

  // Plain Text file
  if (
    ext === "txt" ||
    ext === "md" ||
    mime.startsWith("text/")
  ) {
    const textContent =
      input.buffer instanceof Buffer
        ? input.buffer.toString("utf8")
        : Buffer.from(
            input.buffer instanceof Uint8Array
              ? input.buffer
              : new Uint8Array(input.buffer)
          ).toString("utf8");

    const { text } = parsePlainText(textContent);
    return {
      text,
      pages: null,
      kind: "text",
      fileName: input.fileName ?? "document.txt",
    };
  }

  throw new Error(
    `Unsupported file type '${ext ? `.${ext}` : mime || "unknown"}'. Only PDF (.pdf), Word (.docx), and plain text (.txt) files are supported.`
  );
}

export * from "./pages";
export * from "./text";
export * from "./pdf";
export * from "./docx";
