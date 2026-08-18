import { parseSearchResults } from './bookSearch'
const fs = require('fs')
const path = require('path')

const html = fs.readFileSync(
  path.join(__dirname, '../../web_app/tests/fixtures/zlibrary_search.html'),
  'utf-8',
)

describe('bookSearch (z-lib.gl parser)', () => {
  it('wyciąga wyniki z z-bookcard', () => {
    expect(parseSearchResults(html).length).toBeGreaterThanOrEqual(10)
  })

  it('mapuje tytuł/autora i href→id', () => {
    const gra = parseSearchResults(html).find((x) =>
      x.title.toLowerCase().includes('gra o tron'),
    )
    expect(gra).toBeTruthy()
    expect(gra!.id).toMatch(/^\/book\//)
    expect(gra!.author.toLowerCase()).toContain('martin')
  })
})
