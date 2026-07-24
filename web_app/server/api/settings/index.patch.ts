import { userSettingsTable } from "~~/server/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (e) => {
   const body = await readBody(e);
   const db = useDrizzle();
   
   const [row] = await db.select().from(userSettingsTable).limit(1);
   if (!row) throw createError({ statusCode: 404, statusMessage: "Settings not found" });
   
   const [updated] = await db.update(userSettingsTable)
      .set(body)
      .where(eq(userSettingsTable.id, row.id))
      .returning();
      
   return updated;
});
