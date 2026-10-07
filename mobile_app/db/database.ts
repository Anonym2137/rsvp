/**
 * Local database for RSVP Reader.
 * Uses expo-sqlite on iOS/Android native devices.
 * Uses AsyncStorage fallback on Web platform to ensure web preview works cleanly.
 */
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, BookChapter, UserSettings, ReadingSession, Stats } from '../types';

const IS_WEB = Platform.OS === 'web';

let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (IS_WEB) return Promise.resolve(null);
  if (_db) return Promise.resolve(_db);

  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync('rsvp_reader.db');
        try {
          await db.execAsync('PRAGMA journal_mode = WAL;');
        } catch (e) {
          // ignore PRAGMA error
        }
        await initTables(db);
        _db = db;
        return db;
      } catch (err) {
        console.warn('SQLite init failed:', err);
        return null;
      }
    })();
  }
  return _initPromise;
}

async function initTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Nieznany',
      cover TEXT DEFAULT NULL,
      progress INTEGER DEFAULT 0,
      word_index INTEGER DEFAULT 0,
      is_finished INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS book_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      play_order INTEGER NOT NULL,
      label TEXT NOT NULL,
      href TEXT DEFAULT NULL,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
      show_fixation INTEGER DEFAULT 1,
      reading_speed INTEGER DEFAULT 300,
      theme TEXT DEFAULT 'dark'
    );

    CREATE TABLE IF NOT EXISTS reading_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      duration_seconds INTEGER NOT NULL,
      wpm INTEGER NOT NULL,
      words_read INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Migration: add is_finished to already-installed databases (idempotent).
  // CREATE TABLE IF NOT EXISTS above only creates the table on fresh installs;
  // existing databases with a books table need the column added explicitly.
  try {
    await db.execAsync('ALTER TABLE books ADD COLUMN is_finished INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists — safe to ignore.
  }
  try {
    await db.execAsync('ALTER TABLE books ADD COLUMN rating INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists — safe to ignore.
  }
}

// ── Web Fallback Memory / AsyncStorage Store ───────────────────────
const WEB_BOOKS_KEY = 'rsvp_web_books';
const WEB_CHAPTERS_KEY = 'rsvp_web_chapters';
const WEB_SETTINGS_KEY = 'rsvp_web_settings';
const WEB_SESSIONS_KEY = 'rsvp_web_sessions';

async function getWebStorage<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

async function setWebStorage<T>(key: string, val: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Web storage error:', e);
  }
}

// ── Books ──────────────────────────────────────────────────────────

export async function getAllBooks(): Promise<Book[]> {
  if (IS_WEB) {
    return getWebStorage<Book[]>(WEB_BOOKS_KEY, []);
  }
  const db = await getDatabase();
  if (!db) return getWebStorage<Book[]>(WEB_BOOKS_KEY, []);
  const rows = await db.getAllAsync<any>('SELECT * FROM books ORDER BY id DESC');
  return rows.map(rowToBook);
}

export async function getBookById(id: number): Promise<Book | null> {
  if (IS_WEB) {
    const list = await getAllBooks();
    return list.find((b) => b.id === id) ?? null;
  }
  const db = await getDatabase();
  if (!db) return null;
  const row = await db.getFirstAsync<any>('SELECT * FROM books WHERE id = ?', [id]);
  return row ? rowToBook(row) : null;
}

export async function insertBook(title: string, author: string, cover: string | null = null): Promise<number> {
  if (IS_WEB) {
    const books = await getAllBooks();
    const newId = Date.now();
    const newBook: Book = { id: newId, title, author, cover, progress: 0, wordIndex: 0, isFinished: false, rating: 0 };
    books.unshift(newBook);
    await setWebStorage(WEB_BOOKS_KEY, books);
    return newId;
  }
  const db = await getDatabase();
  if (!db) return 0;
  const result = await db.runAsync(
    'INSERT INTO books (title, author, cover) VALUES (?, ?, ?)',
    [title, author, cover]
  );
  return result.lastInsertRowId;
}

export async function updateBookProgress(id: number, progress: number, wordIndex: number): Promise<void> {
  const roundedProgress = Math.round(progress);
  const finished = progress >= 100;

  if (IS_WEB) {
    const books = await getAllBooks();
    const b = books.find((x) => x.id === id);
    if (b) {
      b.progress = roundedProgress;
      b.wordIndex = wordIndex;
      b.isFinished = finished;
      await setWebStorage(WEB_BOOKS_KEY, books);
    }
    return;
  }
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    'UPDATE books SET progress = ?, word_index = ?, is_finished = ? WHERE id = ?',
    [roundedProgress, wordIndex, finished ? 1 : 0, id]
  );
}

export async function updateBookFinished(id: number, isFinished: boolean): Promise<void> {
  if (IS_WEB) {
    const books = await getAllBooks();
    const b = books.find((x) => x.id === id);
    if (b) {
      b.isFinished = isFinished;
      await setWebStorage(WEB_BOOKS_KEY, books);
    }
    return;
  }
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    'UPDATE books SET is_finished = ? WHERE id = ?',
    [isFinished ? 1 : 0, id]
  );
}

export async function updateBookRating(id: number, rating: number): Promise<void> {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  if (IS_WEB) {
    const books = await getAllBooks();
    const b = books.find((x) => x.id === id);
    if (b) {
      b.rating = clamped;
      await setWebStorage(WEB_BOOKS_KEY, books);
    }
    return;
  }
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    'UPDATE books SET rating = ? WHERE id = ?',
    [clamped, id]
  );
}

export async function deleteBook(id: number): Promise<void> {
  if (IS_WEB) {
    const books = await getAllBooks();
    const updated = books.filter((b) => b.id !== id);
    await setWebStorage(WEB_BOOKS_KEY, updated);
    return;
  }
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
}

function rowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    cover: row.cover,
    progress: row.progress ?? 0,
    wordIndex: row.word_index ?? 0,
    isFinished: row.is_finished === 1,
    rating: row.rating ?? 0,
  };
}

// ── Chapters ───────────────────────────────────────────────────────

export async function getChapters(bookId: number): Promise<BookChapter[]> {
  if (IS_WEB) {
    const all = await getWebStorage<BookChapter[]>(WEB_CHAPTERS_KEY, []);
    return all.filter((c) => c.bookId === bookId).sort((a, b) => a.playOrder - b.playOrder);
  }
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM book_chapters WHERE book_id = ? ORDER BY play_order ASC',
    [bookId]
  );
  return rows.map(rowToChapter);
}

export async function insertChapters(bookId: number, chapters: Omit<BookChapter, 'id' | 'bookId'>[]): Promise<void> {
  if (IS_WEB) {
    const all = await getWebStorage<BookChapter[]>(WEB_CHAPTERS_KEY, []);
    let idCounter = Date.now();
    for (const ch of chapters) {
      all.push({
        id: idCounter++,
        bookId,
        playOrder: ch.playOrder,
        label: ch.label,
        href: ch.href,
        content: ch.content,
      });
    }
    await setWebStorage(WEB_CHAPTERS_KEY, all);
    return;
  }
  const db = await getDatabase();
  if (!db) return;
  for (const ch of chapters) {
    await db.runAsync(
      'INSERT INTO book_chapters (book_id, play_order, label, href, content) VALUES (?, ?, ?, ?, ?)',
      [bookId, ch.playOrder, ch.label, ch.href, ch.content]
    );
  }
}

function rowToChapter(row: any): BookChapter {
  return {
    id: row.id,
    bookId: row.book_id,
    playOrder: row.play_order,
    label: row.label,
    href: row.href,
    content: row.content,
  };
}

// ── Settings ───────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const defaultSettings: UserSettings = {
    id: 1,
    currentBookId: null,
    showFixation: true,
    readingSpeed: 300,
    theme: 'dark',
  };

  if (IS_WEB) {
    return getWebStorage<UserSettings>(WEB_SETTINGS_KEY, defaultSettings);
  }
  const db = await getDatabase();
  if (!db) return defaultSettings;

  let row = await db.getFirstAsync<any>('SELECT * FROM user_settings LIMIT 1');
  if (!row) {
    await db.runAsync('INSERT INTO user_settings DEFAULT VALUES');
    row = await db.getFirstAsync<any>('SELECT * FROM user_settings LIMIT 1');
  }
  return {
    id: row ? row.id : 1,
    currentBookId: row ? row.current_book_id : null,
    showFixation: row ? row.show_fixation === 1 : true,
    readingSpeed: row ? row.reading_speed : 300,
    theme: row ? row.theme ?? 'dark' : 'dark',
  };
}

export async function updateSettings(updates: Partial<Omit<UserSettings, 'id'>>): Promise<void> {
  if (IS_WEB) {
    const s = await getSettings();
    const updated = { ...s, ...updates };
    await setWebStorage(WEB_SETTINGS_KEY, updated);
    return;
  }
  const db = await getDatabase();
  if (!db) return;

  const row = await db.getFirstAsync<any>('SELECT id FROM user_settings LIMIT 1');
  if (!row) {
    await db.runAsync('INSERT INTO user_settings DEFAULT VALUES');
  }

  const existing = await db.getFirstAsync<any>('SELECT id FROM user_settings LIMIT 1');
  if (!existing) return;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.currentBookId !== undefined) {
    fields.push('current_book_id = ?');
    values.push(updates.currentBookId);
  }
  if (updates.showFixation !== undefined) {
    fields.push('show_fixation = ?');
    values.push(updates.showFixation ? 1 : 0);
  }
  if (updates.readingSpeed !== undefined) {
    fields.push('reading_speed = ?');
    values.push(updates.readingSpeed);
  }
  if (updates.theme !== undefined) {
    fields.push('theme = ?');
    values.push(updates.theme);
  }

  if (fields.length === 0) return;
  values.push(existing.id);
  await db.runAsync(`UPDATE user_settings SET ${fields.join(', ')} WHERE id = ?`, values);
}

// ── Reading Sessions ───────────────────────────────────────────────

export async function insertSession(bookId: number, durationSeconds: number, wpm: number, wordsRead: number): Promise<void> {
  if (IS_WEB) {
    const list = await getWebStorage<ReadingSession[]>(WEB_SESSIONS_KEY, []);
    list.push({
      id: Date.now(),
      bookId,
      durationSeconds,
      wpm,
      wordsRead,
      createdAt: Math.floor(Date.now() / 1000),
    });
    await setWebStorage(WEB_SESSIONS_KEY, list);
    return;
  }
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    'INSERT INTO reading_sessions (book_id, duration_seconds, wpm, words_read) VALUES (?, ?, ?, ?)',
    [bookId, durationSeconds, wpm, wordsRead]
  );
}

export async function getStats(): Promise<Stats> {
  if (IS_WEB) {
    const sessions = await getWebStorage<ReadingSession[]>(WEB_SESSIONS_KEY, []);
    const books = await getAllBooks();

    const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const maxWpm = sessions.reduce((acc, s) => Math.max(acc, s.wpm), 0);
    const totalWordsRead = sessions.reduce((acc, s) => acc + s.wordsRead, 0);

    return {
      totalMinutes: Math.round(totalSeconds / 60),
      maxWpm,
      booksCount: books.length,
      streak: sessions.length > 0 ? 1 : 0,
      totalWordsRead,
    };
  }

  const db = await getDatabase();
  if (!db) {
    return { totalMinutes: 0, maxWpm: 0, booksCount: 0, streak: 0, totalWordsRead: 0 };
  }

  const session = await db.getFirstAsync<any>(`
    SELECT
      COALESCE(SUM(duration_seconds), 0) as total_seconds,
      COALESCE(MAX(wpm), 0) as max_wpm,
      COALESCE(SUM(words_read), 0) as total_words
    FROM reading_sessions
  `);

  const bookCount = await db.getFirstAsync<any>('SELECT COUNT(DISTINCT id) as cnt FROM books');

  const sessions = await db.getAllAsync<any>(
    'SELECT created_at FROM reading_sessions ORDER BY created_at DESC'
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const seenDays = new Set(
    (sessions || []).map((s: any) => {
      const d = new Date(s.created_at * 1000);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    if (seenDays.has(day.getTime())) {
      streak++;
    } else {
      if (i > 0) break;
    }
  }

  return {
    totalMinutes: Math.round((session?.total_seconds ?? 0) / 60),
    maxWpm: session?.max_wpm ?? 0,
    booksCount: bookCount?.cnt ?? 0,
    streak,
    totalWordsRead: session?.total_words ?? 0,
  };
}

// ── Rated books (ratings overview) ──────────────────────────────

export interface RatedBook {
  id: number;
  title: string;
  author: string;
  cover: string | null;
  rating: number;
}

export async function getRatedBooks(): Promise<RatedBook[]> {
  if (IS_WEB) {
    const books = await getAllBooks();
    return books
      .filter((b) => b.rating > 0)
      .map((b) => ({ id: b.id, title: b.title, author: b.author, cover: b.cover, rating: b.rating }))
      .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
  }
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT id, title, author, cover, rating FROM books WHERE rating > 0 ORDER BY rating DESC, title ASC'
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    cover: row.cover,
    rating: row.rating ?? 0,
  }));
}

// Additive, read-only query; existing session storage and schemas stay unchanged.
export async function getRecentReadingSessions(): Promise<{ createdAt: number; durationSeconds: number }[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  if (IS_WEB) {
    const sessions = await getWebStorage<ReadingSession[]>(WEB_SESSIONS_KEY, []);
    return sessions.filter(session => session.createdAt >= start.getTime() / 1000);
  }
  const database = await getDatabase();
  if (!database) return [];
  return database.getAllAsync<{ createdAt: number; durationSeconds: number }>(
    'SELECT created_at AS createdAt, duration_seconds AS durationSeconds FROM reading_sessions WHERE created_at >= ?',
    [Math.floor(start.getTime() / 1000)]
  );
}
