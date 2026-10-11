import { PageOffset, findPageForOffset } from "../parse/pages";
import { normalize } from "./normalize";

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

  // 1. Direct match
  const directIdx = fullText.indexOf(quote);
  if (directIdx !== -1) {
    charStart = directIdx;
    charEnd = directIdx + quote.length;
  } else {
    // 2. Fuzzy substring match via first 25 normalized chars
    const normQuote = normalize(quote);
    const snippet = normQuote.slice(0, 30);

    // Search window in full text
    const lowerFull = fullText.toLowerCase();
    const snippetWords = snippet.split(" ").filter(Boolean);
    const firstWord = snippetWords[0];

    if (firstWord) {
      let searchPos = 0;
      while (searchPos < lowerFull.length) {
        const found = lowerFull.indexOf(firstWord, searchPos);
        if (found === -1) break;

        const candidateWindow = fullText.slice(found, found + quote.length + 150);
        if (normalize(candidateWindow).includes(normQuote.slice(0, Math.min(normQuote.length, 60)))) {
          charStart = found;
          charEnd = Math.min(found + quote.length, fullText.length);
          break;
        }
        searchPos = found + firstWord.length;
      }
    }
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
