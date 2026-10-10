import { extractText } from "unpdf";
import { PageOffset } from "./pages";

export interface ParsedPdf {
  text: string;
  pages: PageOffset[];
  totalPages: number;
}

export async function parsePdf(
  data: ArrayBuffer | Uint8Array | Buffer
): Promise<ParsedPdf> {
  let uint8: Uint8Array;
  if (data instanceof Uint8Array && data.constructor.name === "Uint8Array") {
    uint8 = data;
  } else if (Buffer.isBuffer(data)) {
    uint8 = new Uint8Array(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    );
  } else {
    uint8 = new Uint8Array(data);
  }

  let result;
  try {
    result = await extractText(uint8, { mergePages: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read PDF document: ${msg}`);
  }

  const pagesArray: string[] = Array.isArray(result.text)
    ? result.text
    : [result.text];

  let fullText = "";
  const pageOffsets: PageOffset[] = [];

  for (let i = 0; i < pagesArray.length; i++) {
    const rawPage = pagesArray[i] ?? "";
    const cleanPage = rawPage.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const pageStart = fullText.length;
    fullText += cleanPage;
    const pageEnd = fullText.length;

    pageOffsets.push({
      page: i + 1,
      start: pageStart,
      end: pageEnd,
    });

    if (i < pagesArray.length - 1) {
      fullText += "\n\n";
    }
  }

  const trimmed = fullText.trim();
  if (trimmed.length === 0) {
    throw new Error(
      "No extractable text found in PDF. Scanned PDFs are not supported (OCR is disabled)."
    );
  }

  return {
    text: fullText,
    pages: pageOffsets,
    totalPages: result.totalPages || pagesArray.length,
  };
}
