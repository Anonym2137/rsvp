/**
 * Book search service for mobile devices.
 * Searches z-lib.gl via a direct HTTP request and parses the results.
 * Downloading is handled by the user in the device browser (see explore screen),
 * so no in-app auto-download / file-system import is performed here.
 */
import type { SearchResult } from '../types'

const ZLIB_URL = 'https://z-lib.gl/s'

/**
 * Search for books on z-lib.gl directly from the mobile app.
 */
export async function searchBooks(
  title: string,
  _sort: string = '',
  _lang: string = '',
  _format: string = 'epub',
): Promise<SearchResult[]> {
  const query = title.trim()
  if (!query) return []

  try {
    const response = await fetch(`${ZLIB_URL}/${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) return []

    const html = await response.text()
    return parseSearchResults(html)
  } catch (error) {
    console.warn('Book search failed (offline or network error):', error)
    return []
  }
}

// ── Helpers ────────────────────────────────────────────────────────

export function parseSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = []

  const cardRegex = /<z-bookcard\b([\s\S]*?)>([\s\S]*?)<\/z-bookcard>/gi
  let match

  while ((match = cardRegex.exec(html)) !== null) {
    const attrs = match[1]
    const inner = match[2]

    // id: prefer href attr, fall back to id attr; skip cards without one
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)
    const idAttrMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)
    const id = (hrefMatch ? hrefMatch[1] : '') || (idAttrMatch ? idAttrMatch[1] : '')
    if (!id) continue

    const titleMatch = inner.match(/<div\s+slot=["']title["'][^>]*>([\s\S]*?)<\/div>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Bez tytułu'

    const authorMatch = inner.match(/<div\s+slot=["']author["'][^>]*>([\s\S]*?)<\/div>/i)
    const author = authorMatch ? authorMatch[1].trim() : 'Nieznany'

    // cover: data-src takes priority over src; treat cover-not-exists as missing
    let cover: string | null = null
    const imgMatch = inner.match(/<img[^>]*>/i)
    if (imgMatch) {
      const imgTag = imgMatch[0]
      const dataSrc = imgTag.match(/\bdata-src\s*=\s*["']([^"']+)["']/i)
      const src = imgTag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
      const raw = dataSrc ? dataSrc[1] : src ? src[1] : ''
      if (raw && !raw.includes('cover-not-exists')) {
        cover = raw
      }
    }

    // details: join extension · filesize · language (from card attrs)
    const extM = attrs.match(/\bextension\s*=\s*["']([^"']+)["']/i)
    const fsM = attrs.match(/\bfilesize\s*=\s*["']([^"']+)["']/i)
    const langM = attrs.match(/\blanguage\s*=\s*["']([^"']+)["']/i)
    const detailParts = [
      extM ? extM[1] : '',
      fsM ? fsM[1] : '',
      langM ? langM[1] : '',
    ].filter(Boolean)
    const details = detailParts.length ? detailParts.join(' · ') : null

    results.push({ id, title, author, cover, details })
  }

  return results.slice(0, 20)
}
