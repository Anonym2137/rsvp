import { parseZLibraryHtml } from './zlibrary'
import { readFileSync } from 'node:fs'

const html = readFileSync(
  new URL('../../tests/fixtures/zlibrary_search.html', import.meta.url),
  'utf-8',
)

test('wyciąga przynajmniej 10 wyników', () => {
  expect(parseZLibraryHtml(html).length).toBeGreaterThanOrEqual(10)
})

test('mapuje tytuł i autora', () => {
  const r = parseZLibraryHtml(html)
  const gra = r.find((x) => x.title.toLowerCase().includes('gra o tron'))
  expect(gra).toBeTruthy()
  expect(gra!.author.toLowerCase()).toContain('martin')
})

test('href staje się id, cover null gdy brak okładki', () => {
  const r = parseZLibraryHtml(html)
  const gra = r.find((x) => x.title.toLowerCase().includes('gra o tron'))!
  expect(gra.id).toMatch(/^\/book\//)
  expect(gra.cover).toBeNull()
})

test('details składa się z extension/filesize/language', () => {
  const r = parseZLibraryHtml(html)
  const w = r.find((x) => x.details && x.details.includes('·'))
  expect(w).toBeTruthy()
})
