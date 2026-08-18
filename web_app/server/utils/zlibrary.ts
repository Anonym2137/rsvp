import { DOMParser } from 'linkedom'
import type { SearchResult } from '../types'

/**
 * Parse raw HTML response from z-lib.gl search page
 * and extract search results.
 */
export function parseZLibraryHtml(html: string): SearchResult[] {
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')

  const cards = document.querySelectorAll('z-bookcard')

  const results: SearchResult[] = Array.from(cards).map((card) => {
    const id = card.getAttribute('href') || card.getAttribute('id') || ''

    const title =
      card.querySelector('[slot="title"]')?.textContent?.trim() || 'Bez tytułu'

    const author =
      card.querySelector('[slot="author"]')?.textContent?.trim() || 'Nieznany'

    const dataSrc = card.querySelector('img')?.getAttribute('data-src') || null
    let cover: string | null = dataSrc
    if (cover && cover.includes('/img/cover-not-exists.png')) {
      cover = null
    }

    const parts: string[] = []
    const extension = card.getAttribute('extension')
    const filesize = card.getAttribute('filesize')
    const language = card.getAttribute('language')
    if (extension) parts.push(extension)
    if (filesize) parts.push(filesize)
    if (language) parts.push(language)
    const details = parts.length > 0 ? parts.join(' · ') : null

    return {
      id,
      title,
      author,
      cover,
      details,
    }
  })

  return results
}
