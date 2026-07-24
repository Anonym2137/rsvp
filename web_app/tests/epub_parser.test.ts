import { expect, test } from "bun:test";
import { epubParser } from '../server/utils/epub_parser';

test('epubParser - validates file extension', async () => {
  const result = await epubParser('not_an_epub_file.txt');
  expect(result).toBeNull();
});
