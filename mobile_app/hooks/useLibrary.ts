/**
 * useLibrary — manages book catalogue, chapters, and current selection.
 * All data is stored locally in expo-sqlite.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Book, BookChapter, UserSettings } from '../types';
import * as db from '../db/database';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load books and settings on mount ─────────────────────────────
  const refreshBooks = useCallback(async () => {
    try {
      const allBooks = await db.getAllBooks();
      setBooks(allBooks);
    } catch (e) {
      console.error('Failed to load books:', e);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const s = await db.getSettings();
      setSettings(s);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshBooks(), refreshSettings()]).finally(() => setIsLoading(false));
  }, [refreshBooks, refreshSettings]);

  // ── Current book ─────────────────────────────────────────────────
  const currentBook = useMemo(() => {
    if (!books.length) return null;
    if (settings?.currentBookId) {
      return books.find((b) => b.id === settings.currentBookId) ?? books[0];
    }
    return books[0];
  }, [books, settings?.currentBookId]);

  // ── Load chapters when current book changes ──────────────────────
  useEffect(() => {
    if (!currentBook) {
      setChapters([]);
      return;
    }

    let cancelled = false;
    setIsLoadingChapters(true);

    db.getChapters(currentBook.id)
      .then((chs) => {
        if (!cancelled) setChapters(chs);
      })
      .catch((e) => {
        console.error('Failed to load chapters:', e);
        if (!cancelled) setChapters([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChapters(false);
      });

    return () => { cancelled = true; };
  }, [currentBook?.id]);

  // ── Combined text of all chapters ───────────────────────────────
  const currentText = useMemo(() => {
    if (!chapters.length) return 'Brak tekstu…';
    return chapters.map((c) => c.content).join(' ');
  }, [chapters]);

  // ── Actions ──────────────────────────────────────────────────────
  const selectBook = useCallback(async (id: number) => {
    await db.updateSettings({ currentBookId: id });
    await refreshSettings();
    // Load chapters for the new book
    setIsLoadingChapters(true);
    try {
      const chs = await db.getChapters(id);
      setChapters(chs);
    } catch (e) {
      console.error('Failed to load chapters:', e);
      setChapters([]);
    } finally {
      setIsLoadingChapters(false);
    }
  }, [refreshSettings]);

  const updateProgress = useCallback(async (percent: number, wordIndex: number) => {
    if (!currentBook) return;
    await db.updateBookProgress(currentBook.id, percent, wordIndex);
    await refreshBooks();
  }, [currentBook, refreshBooks]);

  const removeBook = useCallback(async (id: number) => {
    await db.deleteBook(id);
    if (settings?.currentBookId === id) {
      await db.updateSettings({ currentBookId: null });
      await refreshSettings();
    }
    await refreshBooks();
  }, [settings, refreshBooks, refreshSettings]);

  return {
    books,
    currentBook,
    currentText,
    chapters,
    isLoading,
    isLoadingChapters,
    settings,
    selectBook,
    updateProgress,
    refreshBooks,
    refreshSettings,
    removeBook,
  };
}
