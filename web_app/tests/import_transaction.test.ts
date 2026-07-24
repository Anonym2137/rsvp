import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import { booksTable, bookContentsTable } from "../server/db/schema";

// Regression test for the import crash:
//   "object is not iterable (cannot read property Symbol(Symbol.iterator))"
// at import.post.ts. Inside db.transaction((tx) => {...}) the callback must be
// synchronous, so `tx.insert(...).returning(...)` is a thenable (Drizzle query
// builder), NOT an executed array — destructuring `const [x] = ...` throws.
// The fix is `.returning(...).get()` which executes and returns the row.
//
// NOTE: web_app uses better-sqlite3 (Node runtime); Bun can't load it, so this
// test uses bun:sqlite to validate the *pattern*. The Drizzle API
// (.returning().get() vs destructuring a thenable) is identical across both.
test("db.transaction insert+returning works with .get() (import fix)", () => {
  const sqlite = new Database(":memory:");
  // bun:sqlite doesn't auto-create tables from the Drizzle schema, so declare
  // minimal mirrors of the real tables (schema shape matches server/db/schema.ts).
  sqlite.run(`
    CREATE TABLE books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover TEXT DEFAULT '',
      progress INTEGER DEFAULT 0,
      word_index INTEGER DEFAULT 0,
      bookmark INTEGER DEFAULT 0
    );
    CREATE TABLE book_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      play_order INTEGER NOT NULL,
      label TEXT NOT NULL,
      href TEXT,
      content TEXT NOT NULL
    );
  `);
  const db = drizzle(sqlite, { schema: { booksTable, bookContentsTable } });

  const bookId = db.transaction((tx) => {
    const insertedBook = tx
      .insert(booksTable)
      .values({ title: "Gra o tron 1", author: "George R. R. Martin", cover: "", progress: 0, wordIndex: 0 })
      .returning({ id: booksTable.id })
      .get();

    tx.insert(bookContentsTable).values({
      bookId: insertedBook.id,
      playOrder: 1,
      label: "Rozdział 1",
      href: null,
      content: "Trei i dysk",
    }).run();

    return insertedBook.id;
  });

  expect(typeof bookId).toBe("number");
  const rows = sqlite.query("SELECT COUNT(*) AS n FROM books").get() as { n: number };
  expect(rows.n).toBe(1);
  const chapters = sqlite
    .query("SELECT COUNT(*) AS n FROM book_contents WHERE book_id = ?")
    .get(bookId) as { n: number };
  expect(chapters.n).toBe(1);
});

// The OLD (broken) pattern must NOT be used — documents the failure so the
// regression is obvious if someone reverts to destructuring a thenable.
test("OLD pattern (returning without .get()) is a thenable, not an array", () => {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema: { booksTable, bookContentsTable } });
  const q = db
    .insert(booksTable)
    .values({ title: "x", author: "y", cover: "", progress: 0, wordIndex: 0 })
    .returning({ id: booksTable.id });
  // A Drizzle query builder is thenable (has .then) and NOT iterable by default.
  expect(typeof (q as any).then).toBe("function");
  expect(() => {
    const [row] = q as any; // mimics `const [insertedBook] = tx.insert(...).returning(...)`
    void row;
  }).toThrow(/not iterable|Cannot/);
});
