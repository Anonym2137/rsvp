
export function cleanHtmlToPlainText(html: string): string {
  const decoded = html
    // 1. Usuwa całą zawartość sekcji <style>, <script> oraz <head>
    .replace(/<(style|script|head)\b[^>]*>([\s\S]*?)<\/\1>/gi, '')
    // 2. Usuwa wszystkie pozostałe tagi HTML
    .replace(/<[^>]*>/g, ' ')
    // 3. Dekoduje najczęstsze encje HTML na zwykłe znaki
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // 3b. Encje numeryczne (np. &#160; / &#x00A0;) — zamieniamy na właściwe znaki,
    // by dalej trafiły na mapowanie w sanitizeText
    .replace(/&#(\d+);/g, (_, d: string) => safeCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => safeCodePoint(parseInt(h, 16)));
  return sanitizeText(decoded);
}

/**
 * Oczyszcza surowy tekst z znaków, które psują łamanie słów w czytniku RSVP:
 * - twarde spacje i inne warianty spacji (U+00A0, U+2007, U+202F, U+2009, …) → zwykła spacja
 * - zero-width space / BOM / soft hyphen / ZWJ / ZWNJ (U+200B, U+FEFF, U+00AD, …) → usunięte
 * - normalizacja Unicode (NFKC) + kolaps wielokrotnych białych znaków
 */
export function sanitizeText(text: string): string {
  const normalized = text.normalize('NFKC');
  const mapped = normalized.replace(SPECIAL_CHARS_REGEX, (ch) => SPECIAL_CHARS_MAP[ch] ?? '');
  return mapped.replace(/\s+/gu, ' ').trim();
}

// Znaki specjalne często wpadające z EPUB/TXT: spacje -> ' ', niewidoczne -> ''
// Budujemy mapę z par [kod, zamiennik], żeby uniknąć niejednoznacznych literałów.
const SPECIAL_CHARS_PAIRS: [number, string][] = [
  [0x00a0, ' '], // NO-BREAK SPACE (znak 160)
  [0x2007, ' '], // FIGURE SPACE
  [0x202f, ' '], // NARROW NO-BREAK SPACE
  [0x2009, ' '], // THIN SPACE
  [0x2008, ' '], // PUNCTUATION SPACE
  [0x200a, ' '], // HAIR SPACE
  [0x1680, ' '], // OGHAM SPACE MARK
  [0x3000, ' '], // IDEOGRAPHIC SPACE
  [0x200b, ''],  // ZERO WIDTH SPACE — zwykle wewnątrz słów; usuwamy, by nie rozcinać tokenów RSVP
  [0x00ad, ''],  // SOFT HYPHEN — miękki łącznik wewnątrz słów; usuwamy
  [0xfeff, ''],  // ZERO WIDTH NO-BREAK SPACE (BOM) — bezwzględnie usuwamy
  [0x200c, ''],  // ZERO WIDTH NON-JOINER — usuwamy
  [0x200d, ''],  // ZERO WIDTH JOINER — usuwamy
];
const SPECIAL_CHARS_MAP: Record<string, string> = Object.fromEntries(
  SPECIAL_CHARS_PAIRS.map(([cp, rep]) => [String.fromCodePoint(cp), rep])
);
const SPECIAL_CHARS_REGEX = new RegExp(
  '[' + SPECIAL_CHARS_PAIRS.map(([cp]) => String.fromCodePoint(cp)).join('') + ']',
  'gu'
);

function safeCodePoint(cp: number): string {
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return '';
  try {
    return String.fromCodePoint(cp);
  } catch {
    return '';
  }
}
