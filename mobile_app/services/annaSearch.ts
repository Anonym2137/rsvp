/**
 * Anna's Archive search service.
 * HTML is provided by AnnaWebViewBridge (WebView) which resolves the JS challenge.
 * This module only contains pure parsing logic — no network calls.
 */
import type { SearchResult } from '../types'

// Anna's Archive rotates domains under legal pressure — `.org`/`.li`/`.se` are
// dead. Keep an ordered list of currently-live mirrors; callers fall back to the
// next one when a WebView fails to load. Order = preference.
export const ANNA_MIRRORS = [
  'https://annas-archive.gl',
  'https://annas-archive.pk',
  'https://annas-archive.gd',
] as const

// Primary mirror (kept for backward compatibility).
export const ANNA_BASE = ANNA_MIRRORS[0]

/** Build the search URL for a given query + format filter */
export function buildSearchUrl(
  query: string,
  format: string = 'epub',
  lang: string = '',
  sort: string = '',
  base: string = ANNA_BASE,
): string {
  const params = new URLSearchParams()
  params.set('q', query)
  if (format) params.set('ext', format)
  if (lang) params.set('lang', lang)
  if (sort) params.set('sort', sort)
  return `${base}/search?${params.toString()}`
}

/** Build the book page URL from a relative path (e.g. /md5/abc123) */
export function buildBookUrl(path: string, base: string = ANNA_BASE): string {
  if (path.startsWith('http')) {
    // Normalize ANY annas-archive.<tld> prefix (incl. stale dead domains
    // like .org/.se) to the chosen live base. Foreign hosts are left alone.
    const m = path.match(/^https?:\/\/annas-archive\.[a-z]+(?=\/)/i)
    if (m) {
      path = path.slice(m[0].length)
    } else {
      return path
    }
  }
  return `${base}${path}`
}

// ── Parsers ────────────────────────────────────────────────────────

/**
 * Parse search results from Anna's Archive HTML.
 * Anna uses <a class="... h-[125px] ..."> cards for results.
 */
export function parseAnnaSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = []

  // Current result rows separate the cover, title and author into sibling links.
  const rowStarts = [...html.matchAll(/<div\b[^>]*class="[^"]*\bpt-3 pb-3 border-b[^"]*"[^>]*>/gi)]
  for (let index = 0; index < rowStarts.length; index++) {
    const start = rowStarts[index].index!
    const end = rowStarts[index + 1]?.index ?? html.length
    const row = html.slice(start, end)
    const titleLink = row.match(/<a\b[^>]*href="(\/(?:md5|book|ol|lgli|lgrsnf)[^"]+)"[^>]*class="[^"]*js-vim-focus[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
    if (!titleLink) continue
    const title = stripTags(titleLink[2]).trim()
    if (!title || results.some(result => result.id === titleLink[1])) continue
    const authorLink = row.match(/<a\b[^>]*href="\/search\?q=[^"]*"[^>]*>\s*<span[^>]*class="[^"]*mdi--user-edit[^"]*"[^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/a>/i)
    const cover = row.match(/<img\b[^>]*src="([^"]+)"/i)?.[1]
    const details = row.match(/<div\b[^>]*class="[^"]*text-gray-800[^"]*"[^>]*>([^<]+)/i)?.[1]
    results.push({
      id: titleLink[1], title,
      author: authorLink ? stripTags(authorLink[1]).trim() : 'Unknown',
      cover: cover ? new URL(cover, ANNA_BASE).href : null,
      details: details ? stripTags(details).replace(/\s*·\s*$/, '').trim() : null,
    })
  }
  if (rowStarts.length) return results.slice(0, 20)


  // Each result is an <a> tag linking to /md5/... or /book/...
  // We match the card anchors by their href pattern
  const cardRegex = /<a\s+[^>]*href="(\/(?:md5|book|ol|lgli|lgrsnf)[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = cardRegex.exec(html)) !== null) {
    const href = match[1]
    const inner = match[2]

    // Skip navigation links etc — require an img or title-like text
    if (!inner.includes('<img') && !inner.includes('h3')) continue

    // Title — look for <h3> or <div> with title text
    const titleMatch =
      inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) ||
      inner.match(/class="[^"]*(?:title|name)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/i)
    const rawTitle = titleMatch ? stripTags(titleMatch[1]).trim() : ''
    if (!rawTitle) continue

    // Author — second meaningful text block or author-labelled element
    const authorMatch =
      inner.match(/class="[^"]*(?:author|creator)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/i) ||
      inner.match(/<div[^>]*>\s*([^<]{3,80})\s*<\/div>/i)
    const author = authorMatch ? stripTags(authorMatch[1]).trim() : 'Unknown'

    // Cover image
    let cover: string | null = null
    const imgMatch = inner.match(/<img[^>]+src="([^"]+)"[^>]*>/i)
    if (imgMatch) {
      const src = imgMatch[1]
      cover = src.startsWith('http') ? src : `${ANNA_BASE}${src}`
    }

    // Details — look for file size / ext / language badge text
    const detailMatches = inner.matchAll(
      /class="[^"]*(?:badge|tag|detail|meta|ext|format)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span)/gi,
    )
    const detailParts: string[] = []
    for (const dm of detailMatches) {
      const t = stripTags(dm[1]).trim()
      if (t) detailParts.push(t)
    }
    const details = detailParts.length ? detailParts.slice(0, 3).join(' · ') : null

    results.push({ id: href, title: rawTitle, author, cover, details })
  }

  return results.slice(0, 20)
}

/**
 * From a book detail page, extract the best direct download link.
 * Anna's Archive provides several mirrors — prefer the direct one.
 */
export function parseBestDownloadUrl(html: string): string | null {
  // Look for direct download links (libgen, annas-archive mirror, etc.)
  // Anna renders them as <a href="/fast_download/..."> or external mirror links
  const patterns = [
    /href="(\/fast_download\/[^"]+)"/i,
    /href="(\/slow_download\/[^"]+)"/i,
    /href="(https?:\/\/[^"]*\.epub[^"]*)"/i,
    /href="(https?:\/\/library\.lol\/[^"]*)"/i,
    /href="(https?:\/\/libgen\.[^/]+\/[^"]*)"/i,
  ]

  for (const pattern of patterns) {
    const m = html.match(pattern)
    if (m) {
      const url = m[1]
      return url.startsWith('http') ? url : `${ANNA_BASE}${url}`
    }
  }
  return null
}

// ── Helpers ───────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ')
}
