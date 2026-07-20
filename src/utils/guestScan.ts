const CARD_URL_PATTERN = /(?:nfcglobal\.com\/c\/|biocloud\.app\/c\/)([A-Za-z0-9-]+)/i;
const SLUG_URL_PATTERN = /(?:nfcglobal\.com\/p\/|\/public\/|\/p\/)([a-z0-9-]+)/i;

export function parseScanPayloadToSlug(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const cardMatch = trimmed.match(CARD_URL_PATTERN);
  if (cardMatch?.[1]) return cardMatch[1];

  const slugMatch = trimmed.match(SLUG_URL_PATTERN);
  if (slugMatch?.[1]) return slugMatch[1].toLowerCase();

  if (/^[a-z0-9-]{3,40}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return null;
}
