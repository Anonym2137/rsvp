/**
 * Book search service for mobile devices.
 * Searches Anna's Archive via a direct HTTP request and parses the results.
 * Downloading is handled by the user in the device browser (see explore screen),
 * so no in-app auto-download / file-system import is performed here.
 */
import type { SearchResult } from '../types'

const ANNAS_ARCHIVE_URL = 'https://annas-archive.gl/search'

/**
 * Search for books on Anna's Archive directly from the mobile app.
 */
export async function searchBooks(
  title: string,
  sort: string = '',
  lang: string = '',
  format: string = 'epub',
): Promise<SearchResult[]> {
  const query = title.trim()
  if (!query) return []

  const params = new URLSearchParams({
    index: '',
    page: '1',
    sort,
    ext: format,
    lang,
    display: '',
    q: query,
  })

  try {
    const response = await fetch(`${ANNAS_ARCHIVE_URL}?${params.toString()}`, {
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

function parseSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = []

  const blockRegex = /<a[^>]*href=["']\/md5\/([^"']+)["'][^>]*class=["'][^"']*(?:custom-a|js-)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi
  let match

  while ((match = blockRegex.exec(html)) !== null) {
    const id = match[1]
    const block = match[2]

    const titleMatch = block.match(/data-content=["']([^"']+)["'][^>]*class=["'][^"']*text-violet/i)
      || block.match(/class=["'][^"']*text-violet[^"']*["'][^>]*data-content=["']([^"']+)["']/i)
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : null

    const authorMatch = block.match(/data-content=["']([^"']+)["'][^>]*class=["'][^"']*text-amber/i)
      || block.match(/class=["'][^"']*text-amber[^"']*["'][^>]*data-content=["']([^"']+)["']/i)
    const author = authorMatch ? (authorMatch[1] || authorMatch[2] || '').trim() : null

    const coverMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i)
    const cover = coverMatch ? coverMatch[1] : null

    if (title) {
      results.push({
        id,
        title,
        author: author || 'Nieznany',
        cover,
        details: null,
      })
    }
  }

  if (results.length === 0) {
    const simpleRegex = /\/md5\/([a-f0-9]+)/gi
    const titleRegex = /data-content=["']([^"']{3,})["']/gi
    const ids: string[] = []
    let m
    while ((m = simpleRegex.exec(html)) !== null) {
      if (!ids.includes(m[1])) ids.push(m[1])
    }
    const titles: string[] = []
    while ((m = titleRegex.exec(html)) !== null) {
      titles.push(m[1])
    }
    for (let i = 0; i < Math.min(ids.length, 20); i++) {
      results.push({
        id: ids[i],
        title: titles[i * 2] || `Książka ${i + 1}`,
        author: titles[i * 2 + 1] || 'Nieznany',
        cover: null,
        details: null,
      })
    }
  }

  return results.slice(0, 20)
}
