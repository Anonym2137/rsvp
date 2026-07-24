import { booksTable } from "~~/server/db/schema";

export default defineEventHandler(async () => {
   const db = useDrizzle();
   return await db.select().from(booksTable);
});
