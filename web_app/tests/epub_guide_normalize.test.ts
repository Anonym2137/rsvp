import { expect, test } from "bun:test";
import { normalizeEpub } from "../server/utils/epub_parser";
import JSZip from "jszip";

async function buildEpub(opfGuide: string): Promise<Buffer> {
  const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="id">
  <metadata>
    <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Test Book</dc:title>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx"></spine>
  ${opfGuide}
</package>`;
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip");
  zip.file("content.opf", opf);
  return (await zip.generateAsync({ type: "nodebuffer" })) as Buffer;
}

test("normalizeEpub removes an empty self-closing <guide/>", async () => {
  const buf = await buildEpub(`<guide/>`);
  const fixed = await normalizeEpub(buf);
  const zip = await JSZip.loadAsync(fixed);
  const opf = await zip.file("content.opf")!.async("string");
  expect(/<guide\b/i.test(opf)).toBe(false);
});

test("normalizeEpub collects <reference> into a single valid <guide>", async () => {
  const buf = await buildEpub(
    `<guide><reference type="cover" href="cover.xhtml"/></guide>`,
  );
  const fixed = await normalizeEpub(buf);
  const zip = await JSZip.loadAsync(fixed);
  const opf = await zip.file("content.opf")!.async("string");
  const guides = opf.match(/<guide\b[^>]*>([\s\S]*?)<\/guide>/gi) || [];
  expect(guides.length).toBe(1);
  expect(/<reference[^>]*href="cover.xhtml"/i.test(opf)).toBe(true);
});

test("normalizeEpub leaves a guide-less EPUB unchanged in structure", async () => {
  const buf = await buildEpub(``);
  const fixed = await normalizeEpub(buf);
  const zip = await JSZip.loadAsync(fixed);
  const opf = await zip.file("content.opf")!.async("string");
  expect(/<guide\b/i.test(opf)).toBe(false);
});
