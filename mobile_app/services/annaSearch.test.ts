import { readFileSync } from 'fs'
import { join } from 'path'
import { buildSearchUrl, buildBookUrl, parseAnnaSearchResults } from './annaSearch'

test('encodes query and selected filters on the chosen mirror', () => {
  const url = new URL(buildSearchUrl('Żółw & Austen', 'epub', 'pl', 'newest', 'https://annas-archive.pk'))
  expect(url.origin).toBe('https://annas-archive.pk')
  expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'Żółw & Austen', ext: 'epub', lang: 'pl', sort: 'newest' })
})

test('opens book details on the mirror used for search', () => {
  expect(buildBookUrl('/md5/abc', 'https://annas-archive.pk')).toBe('https://annas-archive.pk/md5/abc')
  expect(buildBookUrl('https://annas-archive.org/md5/abc', 'https://annas-archive.pk')).toBe('https://annas-archive.pk/md5/abc')
})

test('extracts book metadata and ignores navigation', () => {
  const html = '<a href="/md5/navigation">Details</a><a href="/md5/abc"><img src="https://example.com/cover.jpg"><h3>Pride &amp; Prejudice</h3><div class="author">Jane Austen</div><span class="format">epub</span></a>'
  expect(parseAnnaSearchResults(html)).toEqual([{ id: '/md5/abc', title: 'Pride & Prejudice', author: 'Jane Austen', cover: 'https://example.com/cover.jpg', details: 'epub' }])
})


test('parses the current live Anna result layout with sibling title and author links', () => {
  const html = readFileSync(join(__dirname, '../tests/fixtures/anna-result.html'), 'utf8')
  const results = parseAnnaSearchResults(html)
  expect(results).toHaveLength(1)
  expect(results[0]).toMatchObject({
    id: '/md5/7dda47ae759624d011a99d97ca1f6a9f',
    title: 'Beautiful Mistake: A Multiple Shifter Paranormal Romance',
    author: 'Corrigan, Nancy',
  })
  expect(results[0].details).toContain('EPUB')
})
