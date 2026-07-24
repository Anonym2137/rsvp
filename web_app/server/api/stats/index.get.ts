import { readingSessionTable, booksTable } from "~~/server/db/schema";
import { sql, max, sum, countDistinct } from "drizzle-orm";

export default defineEventHandler(async () => {
   const db = useDrizzle();
   
   const [sessionStats] = await db.select({
      totalSeconds: sum(readingSessionTable.durationSeconds),
      maxWpm: max(readingSessionTable.wpm),
      totalWordsRead: sum(readingSessionTable.wordsRead),
   }).from(readingSessionTable);

   const [bookCount] = await db.select({
      count: countDistinct(booksTable.id)
   }).from(booksTable);

   const sessions = await db.select({ 
      createdAt: readingSessionTable.createdAt 
   })
   .from(readingSessionTable)
   .orderBy(sql`created_at DESC`);

   let streak = 0;
   const today = new Date();
   today.setHours(0, 0, 0, 0);

   const seenDays = new Set(sessions.map(s => {
      // s.createdAt to obiekt Date lub timestamp w ms/s
      // Zgodnie ze schematem: mode: 'timestamp' z sql`(strftime('%s', 'now'))`
      // Lepiej obsłużyć oba przypadki (Date lub number jako timestamp w sekundach)
      let d: Date;
      if (s.createdAt instanceof Date) {
         d = s.createdAt;
      } else {
         d = new Date((s.createdAt as unknown as number) * 1000);
      }
      d.setHours(0, 0, 0, 0);
      return d.getTime();
   }));

   for (let i = 0; i < 365; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      if (seenDays.has(day.getTime())) {
         streak++;
      } else {
         // streak przerywa się tylko gdy opuścimy dzień inny niż dzisiejszy (gdy dzisiaj jeszcze nie czytaliśmy)
         if (i > 0) break;
      }
   }

   return {
      totalMinutes: Math.round((Number(sessionStats?.totalSeconds) || 0) / 60),
      maxWpm: Number(sessionStats?.maxWpm) || 0,
      booksCount: Number(bookCount?.count) || 0,
      streak,
      totalWordsRead: Number(sessionStats?.totalWordsRead) || 0,
   };
});
