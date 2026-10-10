import mammoth from "mammoth";

export interface ParsedDocx {
  text: string;
}

export async function parseDocx(
  data: Buffer | ArrayBuffer | Uint8Array
): Promise<ParsedDocx> {
  const nodeBuffer = Buffer.isBuffer(data)
    ? data
    : Buffer.from(data instanceof Uint8Array ? data : new Uint8Array(data));

  let result;
  try {
    result = await mammoth.extractRawText({ buffer: nodeBuffer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read DOCX document: ${msg}`);
  }

  const normalized = (result.value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const trimmed = normalized.trim();

  if (trimmed.length === 0) {
    throw new Error("No readable text found in DOCX document.");
  }

  return { text: normalized };
}
