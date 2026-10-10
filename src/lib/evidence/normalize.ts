/**
 * Normalizes text for robust substring matching:
 * - Lowercase
 * - Collapse whitespace (newlines, tabs, spaces -> single space)
 * - Unify curly quotes, primes, backticks to standard single/double quotes
 * - Unify em/en dashes, minus signs to standard hyphen
 * - Strip hyphenated line-break artifacts (e.g. "agree-\n  ment" -> "agreement")
 */
export function normalize(str: string): string {
  if (!str) return "";

  return (
    str
      // Strip hyphenated line-break artifacts: word-\n next -> wordnext
      .replace(/(\w+)-\s*\n\s*(\w+)/gi, "$1$2")
      // Unify quotes
      .replace(/[\u2018\u2019\u201A\u201B`]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      // Unify dashes and hyphens
      .replace(/[\u2013\u2014\u2212]/g, "-")
      // Lowercase
      .toLowerCase()
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}
