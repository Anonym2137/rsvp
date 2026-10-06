/**
 * EPUB parser for React Native.
 * Uses JSZip to unpack .epub files and extracts metadata + chapter text.
 * Runs entirely on-device — no server needed.
 */
import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';

interface ParsedBook {
  title: string;
  author: string;
  cover: string | null;
  chapters: { playOrder: number; label: string; href: string | null; content: string }[];
}

/**
 * Parse an EPUB file from a local URI in the app’s private storage.
 */
export async function parseEpubFile(fileUri: string): Promise<ParsedBook> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const zip = await JSZip.loadAsync(base64, { base64: true });

  // 1. Find container.xml to locate the .opf file
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

  const opfPath = extractAttribute(containerXml, 'rootfile', 'full-path');
  if (!opfPath) throw new Error('Invalid EPUB: cannot find OPF path');

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Parse the OPF file for metadata and spine
  const opfContent = await zip.file(opfPath)?.async('text');
  if (!opfContent) throw new Error('Invalid EPUB: missing OPF file');

  const title = extractTagContent(opfContent, 'dc:title') || extractTagContent(opfContent, 'title') || 'Bez tytułu';
  const author = extractTagContent(opfContent, 'dc:creator') || extractTagContent(opfContent, 'creator') || 'Nieznany';

  // 3. Extract manifest items
  // NOTE: item attribute order varies between EPUB producers. Sigil emits
  // `href` before `id`; many others emit `id` before `href`. Parse both
  // attributes independently so the order doesn't matter.
  const manifestItems = new Map<string, string>();
  const itemRegex = /<item\b([^>]*?)\/?>/gi;
  let match;
  while ((match = itemRegex.exec(opfContent)) !== null) {
    const tag = match[1];
    const idMatch = tag.match(/\bid=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
    if (idMatch && hrefMatch) {
      manifestItems.set(idMatch[1].trim(), hrefMatch[1].trim());
    }
  }

  // 4. Extract spine order
  const spineIds: string[] = [];
  const spineRegex = /<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*\/?>/gi;
  while ((match = spineRegex.exec(opfContent)) !== null) {
    spineIds.push(match[1]);
  }

  // Cover metadata is independent of XML attribute order. Only select image
  // manifest entries; an item named "cover" can also be an XHTML page.
  let coverBase64: string | null = null;
  const items = [...opfContent.matchAll(/<item\b([^>]*?)\/?>/gi)].map(match => ({
    id: xmlAttribute(match[1], 'id'), href: xmlAttribute(match[1], 'href'),
    mime: xmlAttribute(match[1], 'media-type'), properties: xmlAttribute(match[1], 'properties') ?? '',
  }));
  const coverId = [...opfContent.matchAll(/<meta\b([^>]*?)\/?>/gi)]
    .find(match => xmlAttribute(match[1], 'name')?.toLowerCase() === 'cover');
  const metadataId = coverId ? xmlAttribute(coverId[1], 'content') : null;
  const candidates = [
    ...items.filter(item => item.id === metadataId),
    ...items.filter(item => item.properties.split(/\s+/).includes('cover-image')),
    ...items.filter(item => /cover/i.test(item.id ?? '') || /(?:^|\/)cover[.]/i.test(item.href ?? '')),
  ];
  const guideCover = [...opfContent.matchAll(/<reference\b([^>]*?)\/?>/gi)]
    .find(match => xmlAttribute(match[1], 'type') === 'cover');
  if (guideCover) candidates.push({ id: null, href: xmlAttribute(guideCover[1], 'href'), mime: null, properties: '' });
  for (const candidate of candidates) {
    if (!candidate.href) continue;
    let coverPath = resolveEpubPath(opfPath, candidate.href);
    let mime = candidate.mime;
    let coverFile = zip.file(coverPath);
    if (!coverFile) continue;
    if (!mime?.startsWith('image/') && !/\.(?:png|jpe?g|gif|webp|svg)$/i.test(coverPath)) {
      const page = await coverFile.async('text');
      const imageTag = page.match(/<(?:img|image)\b([^>]+)>/i);
      const imageHref = imageTag && (xmlAttribute(imageTag[1], 'src') || xmlAttribute(imageTag[1], 'href') || xmlAttribute(imageTag[1], 'xlink:href'));
      if (!imageHref) continue;
      coverPath = resolveEpubPath(coverPath, imageHref);
      coverFile = zip.file(coverPath);
      mime = items.find(item => item.href && resolveEpubPath(opfPath, item.href) === coverPath)?.mime ?? null;
    }
    if (!coverFile) continue;
    mime = mime?.startsWith('image/') ? mime : imageMimeType(coverPath);
    if (!mime) continue;
    coverBase64 = `data:${mime};base64,${await coverFile.async('base64')}`;
    break;
  }

  // 6. Parse chapters from spine
  const chapters: ParsedBook['chapters'] = [];
  let order = 0;

  for (const spineId of spineIds) {
    const href = manifestItems.get(spineId);
    if (!href) continue;

    const filePath = opfDir + href;
    const file = zip.file(filePath);
    if (!file) continue;

    const html = await file.async('text');
    const plainText = cleanHtmlToPlainText(html);

    if (plainText.trim().length < 10) continue; // Skip nearly empty chapters

    order++;
    chapters.push({
      playOrder: order,
      label: extractChapterTitle(html) || `Rozdział ${order}`,
      href: null,
      content: plainText,
    });
  }

  return {
    title,
    author,
    cover: coverBase64,
    chapters,
  };
}

/**
 * Parse plain text into a single-chapter book.
 */
export function parsePlainText(title: string, text: string): ParsedBook {
  return {
    title,
    author: 'Własny tekst',
    cover: null,
    chapters: [{
      playOrder: 1,
      label: title,
      href: null,
      content: sanitizeText(text),
    }],
  };
}

// ── Helpers ────────────────────────────────────────────────────────

export function cleanHtmlToPlainText(html: string): string {
  const decoded = html
    .replace(/<(style|script|head)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    // Najczęstsze encje tekstowe
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Encje numeryczne (np. &#160; / &#x00A0;) — zamieniamy na właściwe znaki,
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

function extractTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractAttribute(xml: string, elementPattern: string, attr: string): string | null {
  // Simple case: element name with attribute
  const tagName = elementPattern.replace(/\[.*\]/, '');
  const regex = new RegExp(`<${tagName}[^>]*${attr}=["']([^"']+)["'][^>]*/?>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function xmlAttribute(attributes: string, name: string): string | null {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? match[1].replace(/&amp;/g, '&') : null;
}

function resolveEpubPath(reference: string, href: string): string {
  const pathname = new URL(href, `https://epub.local/${reference}`).pathname;
  try { return decodeURIComponent(pathname).slice(1); } catch { return pathname.slice(1); }
}

function imageMimeType(path: string): string | null {
  const extension = path.split('.').pop()?.toLowerCase();
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' } as Record<string, string>)[extension ?? ''] ?? null;
}

function extractChapterTitle(html: string): string | null {
  // Try to find <title> or <h1>...<h3> tags
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) return titleMatch[1].trim();

  for (const tag of ['h1', 'h2', 'h3']) {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
    if (match && match[1].trim()) return match[1].trim();
  }
  return null;
}
