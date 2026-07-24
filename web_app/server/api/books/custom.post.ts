import { booksTable, bookContentsTable } from "~~/server/db/schema";
import { epubParser, parsePlainText } from "~~/server/utils/epub_parser";
import { getRequestHeader } from "h3";
import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

type ParsedBook = {
  metaData: { title: string; author: string; cover: string | null; progress: number; wordIndex: number };
  chapters: { playOrder: number; label: string; href: string | null; content: string }[];
};

export default defineEventHandler(async (e) => {
  const contentType = getRequestHeader(e, "content-type") || "";
  const db = useDrizzle();

  let parsed: ParsedBook | null = null;
  let tmpPath: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const parts = await readMultipartFormData(e);
      if (!parts) throw new Error("Brak danych formularza");

      const filePart = parts.find((p) => p.name === "file");
      if (!filePart) throw new Error("Brak pliku w żądaniu");

      const originalName = filePart.filename || "book.epub";
      const lower = originalName.toLowerCase();

      if (lower.endsWith(".epub")) {
        tmpPath = join(tmpdir(), `rsvp-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`);
        writeFileSync(tmpPath, filePart.data);
        parsed = (await epubParser(tmpPath)) as ParsedBook | null;
      } else if (lower.endsWith(".txt")) {
        const text = filePart.data.toString("utf-8");
        const title = originalName.replace(/\.txt$/i, "");
        parsed = parsePlainText(title, text) as ParsedBook;
      } else {
        throw new Error("Obsługiwane są tylko pliki .epub i .txt");
      }
    } else {
      // Pasted text: { title, author, text }
      const body = await readBody<{ title?: string; content?: string }>(e);
      if (!body?.content?.trim()) throw new Error("Brak tekstu książki");
      const title = body.title?.trim() || "Własny tekst";
      parsed = parsePlainText(title, body.content) as ParsedBook;
    }

    if (!parsed) throw new Error("Nie udało się przetworzyć książki");

    const [book] = await db
      .insert(booksTable)
      .values({
        title: parsed.metaData.title || "Bez tytułu",
        author: parsed.metaData.author || "Nieznany",
        cover: parsed.metaData.cover ?? "",
      })
      .returning();

    if (parsed.chapters.length > 0) {
      await db.insert(bookContentsTable).values(
        parsed.chapters.map((c) => ({
          bookId: book.id,
          playOrder: c.playOrder,
          label: c.label,
          href: c.href,
          content: c.content,
        })),
      );
    }

    return book;
  } finally {
    if (tmpPath) {
      try {
        rmSync(tmpPath, { force: true });
      } catch {
        /* ignore */
      }
    }
  }
});
