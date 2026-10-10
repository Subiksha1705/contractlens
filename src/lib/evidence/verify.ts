import { normalize } from "./normalize";

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

  const isSubstring = normFullText.includes(normQuote);

  return {
    status: isSubstring ? "verified" : "unverified",
    normalizedQuote: normQuote,
  };
}
