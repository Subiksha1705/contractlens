import { normalize } from "./normalize";
import { findMatchInText } from "./matcher";

export interface VerifyResult {
  status: "verified" | "unverified";
  normalizedQuote: string;
}

export function verifyQuote(quote: string, fullText: string): VerifyResult {
  const normQuote = normalize(quote);
  const normFullText = normalize(fullText);

  if (!normQuote || !normFullText) {
    return { status: "unverified", normalizedQuote: normQuote };
  }

  // 1. Direct normalized substring
  if (normFullText.includes(normQuote)) {
    return { status: "verified", normalizedQuote: normQuote };
  }

  // 2. Outer quotes or punctuation trimmed
  const trimmedQuote = normQuote.replace(/^["'.,;:!?\s]+|["'.,;:!?\s]+$/g, "");
  if (trimmedQuote && normFullText.includes(trimmedQuote)) {
    return { status: "verified", normalizedQuote: trimmedQuote };
  }

  // 3. Fallback to multi-line / line-break matcher
  const match = findMatchInText(fullText, quote);
  if (match) {
    return { status: "verified", normalizedQuote: normQuote };
  }

  return {
    status: "unverified",
    normalizedQuote: normQuote,
  };
}

