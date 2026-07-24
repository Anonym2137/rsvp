import { booksTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (e) => {
   const idString = getRouterParam(e, "id");
   const id = Number(idString);
   if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid or missing book ID" });

   const { progress, wordIndex, bookmark } = await readBody<{ progress: number; wordIndex: number; bookmark?: number }>(e);
   const db = useDrizzle();

   const setValues: Partial<typeof booksTable.$inferInsert> = { progress, wordIndex };
   if (typeof bookmark === "number") setValues.bookmark = bookmark;

   const [updated] = await db.update(booksTable)
      .set(setValues)
      .where(eq(booksTable.id, id))
      .returning();
      
   return updated;
});
