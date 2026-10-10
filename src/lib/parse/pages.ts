export interface PageOffset {
  page: number;
  start: number;
  end: number;
}

export function findPageForOffset(offset: number, pages?: PageOffset[] | null): number | null {
  if (!pages || pages.length === 0) return null;
  const match = pages.find((p) => offset >= p.start && offset <= p.end);
  return match ? match.page : null;
}
