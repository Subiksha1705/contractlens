export function parsePlainText(rawText: string): { text: string } {
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmed = normalized.trim();

  if (trimmed.length === 0) {
    throw new Error("Document contains no readable text.");
  }

  return { text: normalized };
}
