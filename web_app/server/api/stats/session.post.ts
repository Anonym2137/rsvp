import { readingSessionTable } from "~~/server/db/schema";

export default defineEventHandler(async (e) => {
   const body = await readBody<{ bookId: number; durationSeconds: number; wpm: number; wordsRead: number }>(e);
   const db = useDrizzle();
   
   const [inserted] = await db.insert(readingSessionTable)
      .values({
         bookId: body.bookId,
         durationSeconds: body.durationSeconds,
         wpm: body.wpm,
         wordsRead: body.wordsRead,
      })
      .returning();
      
   return inserted;
});
