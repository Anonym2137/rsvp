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
