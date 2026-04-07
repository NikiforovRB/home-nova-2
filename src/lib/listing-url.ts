/** Сегмент URL вида `10000-kvartira-v-moskve` (публичный номер + slug). */
export function parseListingIdSlug(segment: string): {
  publicNumber: number;
  slug: string;
} | null {
  const decoded = decodeURIComponent(segment);
  const match = /^(\d+)-(.+)$/.exec(decoded);
  if (!match) return null;
  const publicNumber = Number(match[1]);
  const slug = match[2];
  if (!Number.isFinite(publicNumber) || !slug) return null;
  return { publicNumber, slug };
}

export function buildListingPath(publicNumber: number, slug: string) {
  return `/listing/${publicNumber}-${slug}`;
}
