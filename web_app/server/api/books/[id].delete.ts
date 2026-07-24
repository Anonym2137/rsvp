import { booksTable, bookContentsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { join, dirname } from "node:path";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

export default defineEventHandler(async (e) => {
   const idString = getRouterParam(e, "id");
   const id = Number(idString);
   if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid or missing book ID" });

   const db = useDrizzle();

   // 1. Pobierz książkę (potrzebne do wyliczenia ścieżki pliku)
   const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id)).limit(1);
   if (!book) throw createError({ statusCode: 404, statusMessage: "Book not found" });

   // 2. Usuń rozdziały (jawnie — better-sqlite3 może nie mieć włączonego FK cascade)
   await db.delete(bookContentsTable).where(eq(bookContentsTable.bookId, id));

   // 3. Usuń rekord książki
   await db.delete(booksTable).where(eq(booksTable.id, id));

   // 4. Usuń pliki fizyczne (epub + folder obrazków okładki)
   //    cover ma postać "/images/<fileName>/<coverFile>", epub to "public/books/<fileName>.epub"
   try {
      const cover = (book as any).cover as string | null;
      const fileName = cover?.includes("/images/")
         ? cover.split("/images/")[1].split("/")[0]
         : null;

      const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "public");
      if (fileName) {
         const epubPath = join(publicDir, "books", `${fileName}.epub`);
         if (existsSync(epubPath)) rmSync(epubPath);
         const imgDir = join(publicDir, "images", fileName);
         if (existsSync(imgDir)) rmSync(imgDir, { recursive: true });
      }
   } catch (err) {
      // Usunięcie bazy się powiodło; błąd plików nie jest krytyczny.
      console.error("Failed to delete book files:", err);
   }

   return { success: true, id };
});
