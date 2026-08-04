import { sql } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex, check } from "drizzle-orm/sqlite-core";


export const booksTable = sqliteTable("books", {
   id: int().primaryKey({autoIncrement: true}),
   title: text().notNull(),
   author: text().notNull(),
   cover: text().default(""),
   progress: int().default(0),
   wordIndex: int("word_index").default(0),
   bookmark: int("bookmark").default(0),
})

export const bookContentsTable = sqliteTable("book_contents", {
    bookId: int("book_id").notNull().references(() => booksTable.id, {onDelete: "cascade"}),
    playOrder: int("play_order").notNull(),
    label: text().notNull(),
    href: text(),
    content: text().notNull(),
})

export const userSettingsTable = sqliteTable("user_settings", {
   id: int().primaryKey({autoIncrement: true}),
   currentBookId: int("current_book_id").references(() => booksTable.id, {onDelete: "cascade"}),
   showFixation: int("show_fixation", {mode: 'boolean'}).default(true),
   readingSpeed: int("reading_speed").default(300).notNull(),
})

export const readingSessionTable = sqliteTable("reading_session", {
   id: int().primaryKey({autoIncrement: true}),
   bookId: int("book_id").notNull().references(() => booksTable.id, {onDelete: "cascade"}),
   durationSeconds: int("duration_seconds").notNull(),
   wpm: int().notNull(),
   wordsRead: int("words_read").notNull(),
   createdAt: int("created_at", {mode: 'timestamp'}).default(sql`(strftime('%s', 'now'))`).notNull(),
})

export const bookRatingsTable = sqliteTable(
  "book_ratings",
  {
    id: int().primaryKey({autoIncrement: true}),
    bookId: int("book_id").notNull().references(() => booksTable.id, {onDelete: "cascade"}),
    rating: int().notNull(),
    review: text(),
    updatedAt: int("updated_at", {mode: 'timestamp'}).default(sql`(strftime('%s', 'now'))`).notNull(),
  },
  (table) => [
    uniqueIndex("book_ratings_book_id_unique").on(table.bookId),
    check("rating_range", sql`${table.rating} >= 1 AND ${table.rating} <= 10`),
  ],
)
