import { bookContentsTable } from "~~/server/db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (e) => {
   const idString = getRouterParam(e, "id");
   const id = Number(idString);
   if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid or missing book ID" });
   
   const db = useDrizzle();
   return await db.select().from(bookContentsTable)
      .where(eq(bookContentsTable.bookId, id))
      .orderBy(asc(bookContentsTable.playOrder));
});
