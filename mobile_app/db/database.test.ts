/**
 * Tests for db/database.ts — covers the web (AsyncStorage) branch end-to-end.
 * The native SQLite branch uses the same SQL verified separately against the
 * real sqlite3 engine, so here we exercise the TS logic + defaults wiring.
 */
import * as db from './database';

const store: Record<string, string> = {};

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
    setItem: jest.fn((k: string, v: string) => {
      store[k] = v;
      return Promise.resolve();
    }),
    removeItem: jest.fn((k: string) => {
      delete store[k];
      return Promise.resolve();
    }),
  },
}));

describe('database (web branch)', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
  });

  it('marks isFinished on reaching 100% progress', async () => {
    const id = await db.insertBook('Kniha', 'Autor');
    await db.updateBookProgress(id, 100, 500);
    const book = await db.getBookById(id);
    expect(book?.progress).toBe(100);
    expect(book?.isFinished).toBe(true);
  });

  it('does NOT mark finished below 100% (incl. rounded 99.6 -> 100 progress)', async () => {
    const id = await db.insertBook('Kniha', 'Autor');
    await db.updateBookProgress(id, 99.6, 1999);
    const book = await db.getBookById(id);
    expect(book?.progress).toBe(100); // rounded up
    expect(book?.isFinished).toBe(false); // but not finished
  });

  it('un-flags finished when progress drops back', async () => {
    const id = await db.insertBook('Kniha', 'Autor');
    await db.updateBookProgress(id, 100, 500);
    await db.updateBookProgress(id, 40, 100);
    const book = await db.getBookById(id);
    expect(book?.isFinished).toBe(false);
  });

  it('updateBookFinished toggles the flag directly', async () => {
    const id = await db.insertBook('Kniha', 'Autor');
    await db.updateBookFinished(id, true);
    expect((await db.getBookById(id))?.isFinished).toBe(true);
    await db.updateBookFinished(id, false);
    expect((await db.getBookById(id))?.isFinished).toBe(false);
  });

  it('new books default to isFinished=false', async () => {
    const id = await db.insertBook('Kniha', 'Autor');
    const book = await db.getBookById(id);
    expect(book?.isFinished).toBe(false);
  });
  it('reads only recent sessions without modifying saved activity', async () => {
    const now = Math.floor(Date.now() / 1000);
    store['rsvp_web_sessions'] = JSON.stringify([
      { createdAt: now, durationSeconds: 90 },
      { createdAt: now - 10 * 86400, durationSeconds: 300 },
    ]);
    const saved = store['rsvp_web_sessions'];
    expect(await db.getRecentReadingSessions()).toEqual([{ createdAt: now, durationSeconds: 90 }]);
    expect(store['rsvp_web_sessions']).toBe(saved);
  });

});
