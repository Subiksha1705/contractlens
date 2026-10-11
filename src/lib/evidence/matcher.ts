import { normalize } from "./normalize";

export interface MatchRange {
  start: number;
  end: number;
}

/**
 * Escapes regex special characters and makes quotes & dashes flexible.
 */
function escapeRegexWord(word: string): string {
  // 1. Escape characters that have special regex meaning (excluding quotes & dashes)
  let escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 2. Replace quotes with flexible quote class
  escaped = escaped.replace(/['"“”’‘`]/g, "['\"“”’‘`]");

  // 3. Replace dashes with flexible dash class, allowing optional spaces around them
  escaped = escaped.replace(/[-—–\u2013\u2014\u2212]/g, "\\s*[-—–\\u2013\\u2014\\u2212]\\s*");

  return escaped;
}

/**
 * Builds a regex pattern from word tokens where whitespace and dashes are flexible.
 */
function buildRegexPattern(words: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const isDash = /^[-—–\u2013\u2014\u2212]+$/.test(w);
    const escaped = escapeRegexWord(w);

    if (i === 0) {
      parts.push(escaped);
    } else {
      const prevWasDash = /^[-—–\u2013\u2014\u2212]+$/.test(words[i - 1]);
      if (isDash || prevWasDash) {
        parts.push(`\\s*${escaped}`);
      } else {
        parts.push(`\\s+${escaped}`);
      }
    }
  }
  return parts.join("");
}

/**
 * Builds an index map from normalized text back to original indices in text.
 * Handles whitespace collapsing, typographic unification, and PDF line-break hyphens.
 */
export function normalizeWithMap(text: string): { normText: string; map: number[] } {
  let normText = "";
  const map: number[] = [];

  let i = 0;
  const len = text.length;
  let inWhitespace = false;

  while (i < len) {
    // Check hyphenated line break: word-\n next -> wordnext
    if (
      i + 2 < len &&
      /[a-zA-Z0-9]/.test(text[i]) &&
      text[i + 1] === "-" &&
      /\n/.test(text.slice(i + 2, i + 6))
    ) {
      let j = i + 2;
      while (j < len && /\s/.test(text[j])) j++;
      if (j < len && /[a-zA-Z0-9]/.test(text[j])) {
        const ch = text[i].toLowerCase();
        normText += ch;
        map.push(i);
        i = j;
        continue;
      }
    }

    const ch = text[i];
    if (/\s/.test(ch)) {
      if (!inWhitespace && normText.length > 0) {
        normText += " ";
        map.push(i);
        inWhitespace = true;
      }
      i++;
      continue;
    }

    inWhitespace = false;
    let normalizedChar = ch.toLowerCase();
    if (/[\u2018\u2019\u201A\u201B`]/.test(ch)) normalizedChar = "'";
    else if (/[\u201C\u201D\u201E\u201F]/.test(ch)) normalizedChar = '"';
    else if (/[\u2013\u2014\u2212]/.test(ch)) normalizedChar = "-";

    normText += normalizedChar;
    map.push(i);
    i++;
  }

  return { normText: normText.trimEnd(), map };
}

/**
 * Robustly finds the character range [start, end] in `text` that matches `query`.
 * Designed specifically for long sentences that may contain:
 * - Line wraps / soft breaks (`\n`) in original document text
 * - Typographic quotes (curly vs straight) and dashes (em/en vs hyphen)
 * - Leading/trailing quotation marks or ellipses from AI output
 * - Minor punctuation or prefix variations
 */
export function findMatchInText(text: string, query: string): MatchRange | null {
  if (!text || !query) return null;

  const rawQuery = query.trim();
  if (!rawQuery) return null;

  // 1. Direct case-insensitive match
  const lowerText = text.toLowerCase();
  const lowerQuery = rawQuery.toLowerCase();
  const directIdx = lowerText.indexOf(lowerQuery);
  if (directIdx !== -1) {
    return { start: directIdx, end: directIdx + rawQuery.length };
  }

  // 2. Clean outer quotation marks and ellipses (preserving sentence periods)
  const cleanQuery = rawQuery
    .replace(/^["'“”‘«»\s…]+|["'“”’«»\s…]+$/g, "")
    .replace(/^\.{3,}|\.{3,}$/g, "")
    .trim();

  if (cleanQuery && cleanQuery !== rawQuery) {
    const cleanLower = cleanQuery.toLowerCase();
    const cleanIdx = lowerText.indexOf(cleanLower);
    if (cleanIdx !== -1) {
      let end = cleanIdx + cleanQuery.length;
      if (end < text.length && text[end] === "." && rawQuery.includes(".")) {
        end++;
      }
      return { start: cleanIdx, end };
    }
  }

  const targetQuery = cleanQuery || rawQuery;
  const words = targetQuery.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // 3. Multi-line whitespace & quote/dash flexible regex
  try {
    const pattern = buildRegexPattern(words);
    const reg = new RegExp(pattern, "i");
    const match = reg.exec(text);
    if (match) {
      let end = match.index + match[0].length;
      // If original query ended with a period and the text has a period directly following
      if (end < text.length && text[end] === "." && (rawQuery.endsWith(".") || rawQuery.includes("."))) {
        end++;
      }
      return { start: match.index, end };
    }
  } catch {
    // Fall back to normalized map if regex compilation fails
  }

  // 4. Normalized character-index mapping
  // Handles collapsed whitespace, stripped line-break hyphens, and smart quotes
  const { normText, map } = normalizeWithMap(text);
  const normQuery = normalize(targetQuery);

  if (normText && normQuery) {
    const normIdx = normText.indexOf(normQuery);
    if (normIdx !== -1 && map[normIdx] !== undefined) {
      const origStart = map[normIdx];
      const endMapIdx = Math.min(normIdx + normQuery.length - 1, map.length - 1);
      let origEnd = (map[endMapIdx] ?? origStart) + 1;
      if (origEnd < text.length && text[origEnd] === "." && (rawQuery.endsWith(".") || targetQuery.endsWith("."))) {
        origEnd++;
      }
      return { start: origStart, end: Math.min(Math.max(origStart + 1, origEnd), text.length) };
    }
  }

  // 5. Long Sentence Sub-clause / Window Matching
  // For long sentences (> 4 words), if a few words differed or the sentence was partially quoted,
  // find the longest matching word window (e.g. 6-12 words or 70%+ of the clause).
  if (words.length >= 5) {
    // Try matching the first 6-10 words
    const prefixCount = Math.min(words.length, Math.max(5, Math.min(10, Math.floor(words.length * 0.7))));
    try {
      const prefixPattern = buildRegexPattern(words.slice(0, prefixCount));
      const prefixReg = new RegExp(prefixPattern, "i");
      const prefixMatch = prefixReg.exec(text);
      if (prefixMatch) {
        // Try extending forward to match as many trailing words as possible
        let bestEnd = prefixMatch.index + prefixMatch[0].length;
        for (let w = prefixCount; w < words.length; w++) {
          const extendedPattern = buildRegexPattern(words.slice(0, w + 1));
          const extReg = new RegExp(extendedPattern, "i");
          const extMatch = extReg.exec(text);
          if (extMatch && extMatch.index === prefixMatch.index) {
            bestEnd = extMatch.index + extMatch[0].length;
          } else {
            break;
          }
        }
        return { start: prefixMatch.index, end: bestEnd };
      }
    } catch {
      // Continue to suffix fallback
    }

    // Try matching the last 6-10 words (e.g. when beginning has an omitted prefix)
    const suffixCount = Math.min(words.length, Math.max(5, Math.min(10, Math.floor(words.length * 0.7))));
    try {
      const suffixPattern = buildRegexPattern(words.slice(-suffixCount));
      const suffixReg = new RegExp(suffixPattern, "i");
      const suffixMatch = suffixReg.exec(text);
      if (suffixMatch) {
        return { start: suffixMatch.index, end: suffixMatch.index + suffixMatch[0].length };
      }
    } catch {
      // Continue
    }
  }

  return null;
}

/**
 * Returns all non-overlapping match ranges in text for query.
 * For long queries / sentences, delegates to findMatchInText.
 * For short word queries, finds all case-insensitive occurrences.
 */
export function findAllMatchesInText(text: string, query: string): MatchRange[] {
  if (!text || !query) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/).filter(Boolean);
  // For long queries, sentences, or queries with linebreaks, use findMatchInText
  if (words.length >= 4 || trimmed.length > 30) {
    const singleMatch = findMatchInText(text, trimmed);
    return singleMatch ? [singleMatch] : [];
  }

  // For short queries, find all occurrences
  const ranges: MatchRange[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  let pos = 0;
  while (pos < text.length) {
    const idx = lowerText.indexOf(lowerQuery, pos);
    if (idx === -1) break;
    ranges.push({ start: idx, end: idx + trimmed.length });
    pos = idx + Math.max(1, trimmed.length);
  }

  if (ranges.length === 0) {
    const singleMatch = findMatchInText(text, trimmed);
    if (singleMatch) ranges.push(singleMatch);
  }

  return ranges;
}

