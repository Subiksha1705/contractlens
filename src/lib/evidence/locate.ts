import { PageOffset, findPageForOffset } from "../parse/pages";
import { normalize } from "./normalize";
import { findMatchInText } from "./matcher";

export interface LocateResult {
  charStart: number | null;
  charEnd: number | null;
  page: number | null;
  section: string | null;
}

const SECTION_HEADING_REGEX = /^(article|section|clause)?\s*\d+(\.\d+)*[.)]?\s+\S/i;

export function locateQuote(
  quote: string,
  fullText: string,
  pages?: PageOffset[] | null
): LocateResult {
  if (!quote || !fullText) {
    return { charStart: null, charEnd: null, page: null, section: null };
  }

  let charStart: number | null = null;
  let charEnd: number | null = null;

  // 1. Match quote in full text (exact, multi-line, normalized, or sub-clause)
  const match = findMatchInText(fullText, quote);
  if (match) {
    charStart = match.start;
    charEnd = match.end;
  }

  // 3. Derive Page Number
  const page = charStart !== null ? findPageForOffset(charStart, pages) : null;

  // 4. Derive Preceding Section Heading
  let section: string | null = null;
  if (charStart !== null) {
    const textBefore = fullText.slice(0, charStart);
    const lines = textBefore.split("\n");

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (SECTION_HEADING_REGEX.test(line)) {
        // Look for heading title before sentence continuation
        const inlineTitleMatch = line.match(
          /^((?:article|section|clause)?\s*\d+(?:\.\d+)*[.)]?\s+[^.!?:\n]{2,70})(?:\.\s+[A-Z]|\s*[:—–-]\s*[A-Z]|\s*$)/i
        );

        if (inlineTitleMatch && inlineTitleMatch[1]) {
          section = inlineTitleMatch[1].trim();
        } else {
          const firstSentenceEnd = line.indexOf(". ");
          if (firstSentenceEnd !== -1 && firstSentenceEnd <= 70) {
            section = line.slice(0, firstSentenceEnd).trim();
          } else {
            section = line.length <= 70 ? line : line.slice(0, 70).trim();
          }
        }
        break;
      }
    }
  }

  return {
    charStart,
    charEnd,
    page,
    section,
  };
}
