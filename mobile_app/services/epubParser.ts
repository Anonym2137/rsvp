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
 * Parse an EPUB file from a local URI (e.g. from document picker).
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
  const manifestItems = new Map<string, string>();
  const manifestRegex = /<item\s+[^>]*id=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
  let match;
  while ((match = manifestRegex.exec(opfContent)) !== null) {
    manifestItems.set(match[1], match[2]);
  }

  // 4. Extract spine order
  const spineIds: string[] = [];
  const spineRegex = /<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*\/?>/gi;
  while ((match = spineRegex.exec(opfContent)) !== null) {
    spineIds.push(match[1]);
  }

  // 5. Try to extract cover image
  let coverBase64: string | null = null;
  const coverMeta = extractAttribute(opfContent, 'meta[name="cover"]', 'content')
    || findCoverItemId(opfContent);

  if (coverMeta) {
    const coverHref = manifestItems.get(coverMeta);
    if (coverHref) {
      const coverPath = opfDir + coverHref;
      const coverFile = zip.file(coverPath);
      if (coverFile) {
        const coverData = await coverFile.async('base64');
        const ext = coverHref.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
        coverBase64 = `data:image/${ext};base64,${coverData}`;
      }
    }
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
      content: text.replace(/\s+/g, ' ').trim(),
    }],
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function cleanHtmlToPlainText(html: string): string {
  return html
    .replace(/<(style|script|head)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
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

function findCoverItemId(opfContent: string): string | null {
  // Look for item with properties="cover-image" or id containing "cover"
  const coverPropMatch = opfContent.match(/<item[^>]*properties=["'][^"']*cover-image[^"']*["'][^>]*id=["']([^"']+)["']/i);
  if (coverPropMatch) return coverPropMatch[1];

  const coverIdMatch = opfContent.match(/<item[^>]*id=["']([^"']*cover[^"']*)["']/i);
  if (coverIdMatch) return coverIdMatch[1];

  return null;
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
