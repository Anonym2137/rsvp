import * as dbSchema from "#server/db/schema"

export type Book = typeof dbSchema.booksTable.$inferSelect;
export type NewBook = typeof dbSchema.booksTable.$inferInsert;

export type BookContent = typeof dbSchema.bookContentsTable.$inferSelect;
export type NewBookContent = typeof dbSchema.bookContentsTable.$inferInsert;

export type UserSettings = typeof dbSchema.userSettingsTable.$inferSelect;

export type ReadingSession = typeof dbSchema.readingSessionTable.$inferSelect;

export type BookRating = typeof dbSchema.bookRatingsTable.$inferSelect;
export type NewBookRating = typeof dbSchema.bookRatingsTable.$inferInsert;