import { parseEpubFile, parsePlainText } from './epubParser';
import * as FileSystem from 'expo-file-system/legacy';

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
});
