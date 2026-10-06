import { parseEpubFile, parsePlainText, sanitizeText, cleanHtmlToPlainText } from './epubParser';
import * as FileSystem from 'expo-file-system/legacy';
const JSZip = require('jszip');

// Mock FileSystem methods
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  StorageAccessFramework: {
    readAsStringAsync: jest.fn(),
  },
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
  },
}));

describe('epubParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parsePlainText', () => {
    it('should correctly format plain text into single-chapter book structure', () => {
      const result = parsePlainText('My Custom Text', 'This is a test content  with extra   spaces.');
      expect(result.title).toBe('My Custom Text');
      expect(result.author).toBe('Własny tekst');
      expect(result.cover).toBeNull();
      expect(result.chapters).toHaveLength(1);
      expect(result.chapters[0]).toEqual({
        playOrder: 1,
        label: 'My Custom Text',
        href: null,
        content: 'This is a test content with extra spaces.',
      });
    });
  });

  describe('parseEpubFile', () => {
    it('should read file using readAsStringAsync', async () => {
      const mockBase64 = 'UEsDBBQAAAAIAAAAAAD';
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(mockBase64);

      try {
        await parseEpubFile('file:///some/path/to/book.epub');
      } catch (err) {
        // expect zip parse error
      }

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        'file:///some/path/to/book.epub',
        { encoding: 'base64' }
      );
    });
  });

  describe('parsePlainText - special chars sanitization', () => {
    it('should strip non-breaking space (U+00A0, znak 160) between words', () => {
      const input = `Warszawa${' '}jest${' '}stolicą.`;
      const result = parsePlainText('T', input);
      expect(result.chapters[0].content).toBe('Warszawa jest stolicą.');
      expect(result.chapters[0].content).not.toContain(' ');
    });

    it('should REMOVE zero-width space / soft hyphen INSIDE a word (not split the RSVP token)', () => {
      // ZWS i soft hyphen w EPUB są wewnątrz słów — zamiana na spację rozcinałaby je w RSVP.
      // Używamy jawnych kodów Unicode, by uniknąć degradacji znaków niewidocznych w pliku źródłowym.
      const input = `sto\u200Blic\u00E4 i\u00A0cza\u00ADsem`; // ZWS w "sto­licä", NBSP między "i" i "cza", soft-hyphen w "cza­sem"
      const result = parsePlainText('T', input);
      const content = result.chapters[0].content;
      // ZWS i soft-hyphen znikają; NBSP → spacja
      expect(content).toBe('stolicä i czasem');
      const tokens = content.split(/\s+/).filter(Boolean);
      expect(tokens).toEqual(['stolicä', 'i', 'czasem']);
    });

    it('should remove soft hyphen (U+00AD) and BOM (U+FEFF)', () => {
      const input = `­${'﻿'}tekst`;
      const result = parsePlainText('T', input);
      expect(result.chapters[0].content).toBe('tekst');
    });
  });

  describe('sanitizeText', () => {
    it('should collapse multiple spaces left after sanitization', () => {
      expect(sanitizeText(`a${' '}${' '}b`)).toBe('a b');
    });

    it('should not mangle normal accented characters', () => {
      expect(sanitizeText('Zażółć gęślą jaźń')).toBe('Zażółć gęślą jaźń');
    });

    it('should normalize NFC/NFKC composed characters', () => {
      expect(sanitizeText('naïve')).toBe('naïve');
    });
  });

  describe('cleanHtmlToPlainText - numeric entities & special chars', () => {
    it('should decode numeric entities like &#160; / &#x00A0; to normal spaces', () => {
      const out = cleanHtmlToPlainText(`<p>To&#160;jest&#x00A0;test.</p>`);
      expect(out).toBe('To jest test.');
      expect(out).not.toContain(' ');
    });

    it('should REMOVE U+200B / U+00AD INSIDE a word (not split the RSVP token)', () => {
      const out = cleanHtmlToPlainText(`<p>sto\u200Blic\u00E4 i\u00A0cza\u00ADsem</p>`);
      expect(out).toBe('stolicä i czasem');
      const tokens = out.split(/\s+/).filter(Boolean);
      expect(tokens).toEqual(['stolicä', 'i', 'czasem']);
    });
  });

  describe('manifest parsing - attribute order', () => {
    it('should map spine ids to chapters when item has href BEFORE id (Sigil producer)', async () => {
      // Minimal EPUB (ZIP) where <item> lists href before id, like Sigil exports.
      const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Testowa</dc:title>
    <dc:creator>Autor</dc:creator>
  </metadata>
  <manifest>
    <item href="Text/chap01.xhtml" id="chap01" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chap01"/>
  </spine>
</package>`;
      const chap = '<html><head><title>Rozdział</title></head><body><p>To jest treść rozdziału pierwszego.</p></body></html>';
      const zip = new JSZip();
      zip.file('mimetype', 'application/epub+zip');
      zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
      zip.file('OEBPS/content.opf', opf);
      zip.file('OEBPS/Text/chap01.xhtml', chap);
      const base64 = await zip.generateAsync({ type: 'base64' });

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(base64);
      const parsed = await parseEpubFile('file:///test.epub');

      expect(parsed.title).toBe('Testowa');
      expect(parsed.chapters).toHaveLength(1);
      expect(parsed.chapters[0].content).toContain('treść rozdziału pierwszego');
    });
  });
});

describe('EPUB cover extraction', () => {
  async function parseCover(metadata: string, manifest: string, files: Record<string, string>) {
    const zip = new JSZip();
    zip.file('META-INF/container.xml', '<container><rootfiles><rootfile full-path="OPS/package.opf"/></rootfiles></container>');
    zip.file('OPS/package.opf', `<package><metadata>${metadata}</metadata><manifest>${manifest}</manifest><spine/></package>`);
    for (const [name, content] of Object.entries(files)) zip.file(name, content);
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(await zip.generateAsync({ type: 'base64' }));
    return (await parseEpubFile('file:///cover-test.epub')).cover;
  }

  test('ignores unrelated metadata before the EPUB 2 cover declaration', async () => {
    const cover = await parseCover('<meta name="generator" content="Calibre"/><meta content="picture" name="cover"/>',
      '<item href="images/front.jpg" media-type="image/jpeg" id="picture"/>', { 'OPS/images/front.jpg': 'cover bytes' });
    expect(cover).toBe(`data:image/jpeg;base64,${Buffer.from('cover bytes').toString('base64')}`);
  });

  test('recognizes EPUB 3 cover-image after id, including other properties', async () => {
    const cover = await parseCover('', '<item id="picture" href="images/front.png" properties="nav cover-image" media-type="image/png"/>',
      { 'OPS/images/front.png': 'png bytes' });
    expect(cover).toBe(`data:image/png;base64,${Buffer.from('png bytes').toString('base64')}`);
  });

  test('resolves percent-encoded relative cover paths', async () => {
    const cover = await parseCover('<meta name="cover" content="picture"/>', '<item id="picture" href="../images/front%20cover.webp" media-type="image/webp"/>',
      { 'images/front cover.webp': 'webp bytes' });
    expect(cover).toBe(`data:image/webp;base64,${Buffer.from('webp bytes').toString('base64')}`);
  });

  test('extracts the image referenced by an XHTML cover page', async () => {
    const cover = await parseCover('', '<item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/><item id="picture" href="images/front.jpg" media-type="image/jpeg"/>',
      { 'OPS/text/cover.xhtml': '<html><body><img src="../images/front.jpg"/></body></html>', 'OPS/images/front.jpg': 'cover bytes' });
    expect(cover).toBe(`data:image/jpeg;base64,${Buffer.from('cover bytes').toString('base64')}`);
  });

  test('uses the guide cover page when its manifest id does not contain cover', async () => {
    const cover = await parseCover('', '<item id="title" href="text/title.xhtml" media-type="application/xhtml+xml"/></manifest><guide><reference type="cover" href="text/title.xhtml"/></guide><manifest>',
      { 'OPS/text/title.xhtml': '<svg><image xlink:href="../images/front.jpg"/></svg>', 'OPS/images/front.jpg': 'cover bytes' });
    expect(cover).toBe(`data:image/jpeg;base64,${Buffer.from('cover bytes').toString('base64')}`);
  });

  test('does not treat unrelated metadata or illustrations as a cover', async () => {
    expect(await parseCover('<meta name="generator" content="picture"/>', '<item id="picture" href="image.jpg" media-type="image/jpeg"/>',
      { 'OPS/image.jpg': 'illustration' })).toBeNull();
  });
});
