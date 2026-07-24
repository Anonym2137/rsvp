import { userSettingsTable } from "~~/server/db/schema";

export default defineEventHandler(async () => {
   const db = useDrizzle();
   const [existing] = await db.select().from(userSettingsTable).limit(1);
   if (existing) return existing;
   
   const [created] = await db.insert(userSettingsTable).values({}).returning();
   return created;
});
