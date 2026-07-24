/**
 * useRsvp — RSVP engine hook.
 * Handles play/pause/reset, word interval, ORP calculation, session tracking.
 * Direct port of web_app's useRsvp.ts composable.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { FormattedWord } from '../types';
import * as db from '../db/database';

function calcOrpIndex(word: string): number {
  if (word.length < 2) return 0;
  if (word.length >= 6) return Math.floor(word.length / 2) - 1;
  return Math.floor((word.length - 1) / 3);
}

function splitWordAtOrp(word: string, useOrp: boolean): FormattedWord {
  if (!useOrp || word.length < 2) {
    return { part1: word, focus: '', part2: '', isIntro: false };
  }
  const idx = calcOrpIndex(word);
  return {
    part1: word.substring(0, idx),
    focus: word.charAt(idx),
    part2: word.substring(idx + 1),
    isIntro: false,
  };
}

interface UseRsvpOptions {
  currentText: string;
  currentBookId: number | null;
  initialWordIndex?: number;
  initialSpeed?: number;
  initialShowFixation?: boolean;
  onProgressUpdate?: (percent: number, wordIndex: number) => void;
}

export function useRsvp({
  currentText,
  currentBookId,
  initialWordIndex = 0,
  initialSpeed = 300,
  initialShowFixation = true,
  onProgressUpdate,
}: UseRsvpOptions) {
  const [speed, setSpeed] = useState(initialSpeed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(initialWordIndex);
  const [showFixation, setShowFixation] = useState(initialShowFixation);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const wordIndexRef = useRef(wordIndex);
  const speedRef = useRef(speed);

  // Keep refs in sync
  wordIndexRef.current = wordIndex;
  speedRef.current = speed;

  // ── Words array ──────────────────────────────────────────────────
  const words = useMemo<string[]>(() => {
    if (!currentText || currentText === 'Brak tekstu…') return [];
    return currentText.split(/\s+/).filter(Boolean);
  }, [currentText]);

  // ── Progress ─────────────────────────────────────────────────────
  const progress = useMemo(() => {
    if (words.length === 0) return 0;
    return (wordIndex / words.length) * 100;
  }, [wordIndex, words.length]);

  // ── Formatted word ───────────────────────────────────────────────
  const formattedWord = useMemo<FormattedWord>(() => {
    if (wordIndex === 0 && !isPlaying) {
      return { part1: 'Naciśnij ', focus: 'Czytaj', part2: ' aby zacząć', isIntro: true };
    }
    if (wordIndex >= words.length) {
      return { part1: 'Koniec', focus: '!', part2: '', isIntro: false };
    }
    return splitWordAtOrp(words[wordIndex], showFixation);
  }, [wordIndex, isPlaying, words, showFixation]);

  // ── Sync wordIndex when book selection loads or changes ──────────
  const initialWordIndexRef = useRef(initialWordIndex);
  useEffect(() => {
    initialWordIndexRef.current = initialWordIndex;
  }, [initialWordIndex]);

  useEffect(() => {
    setWordIndex(initialWordIndexRef.current);
    setIsPlaying(false);
    clearTimer();
  }, [currentBookId]);

  // ── Sync settings from props ─────────────────────────────────────
  useEffect(() => { setSpeed(initialSpeed); }, [initialSpeed]);
  useEffect(() => { setShowFixation(initialShowFixation); }, [initialShowFixation]);

  // ── Timer management ─────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const saveSession = useCallback(async (durationSeconds: number) => {
    if (!currentBookId || durationSeconds < 3) return;
    try {
      await db.insertSession(currentBookId, durationSeconds, speedRef.current, wordIndexRef.current);
    } catch (e) {
      console.error('Failed to save reading session:', e);
    }
  }, [currentBookId]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
    if (sessionStartRef.current !== null) {
      const dur = Math.round((Date.now() - sessionStartRef.current) / 1000);
      saveSession(dur);
      sessionStartRef.current = null;
    }
  }, [clearTimer, saveSession]);

  const play = useCallback(() => {
    if (words.length === 0) return;
    clearTimer();
    setIsPlaying(true);
    sessionStartRef.current = Date.now();

    const intervalMs = (60 / speedRef.current) * 1000;

    timerRef.current = setInterval(() => {
      setWordIndex((prev) => {
        if (prev >= words.length) {
          // Reached the end
          pause();
          onProgressUpdate?.(0, 0);
          return 0;
        }
        const next = prev + 1;
        const pct = (next / words.length) * 100;
        onProgressUpdate?.(pct, next);
        return next;
      });
    }, intervalMs);
  }, [words.length, clearTimer, pause, onProgressUpdate]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const reset = useCallback(() => {
    pause();
    setWordIndex(0);
    onProgressUpdate?.(0, 0);
  }, [pause, onProgressUpdate]);

  const rewind = useCallback(() => {
    const wordsToRewind = Math.max(10, Math.round((speedRef.current / 60) * 15));
    setWordIndex((prev) => {
      const next = Math.max(0, prev - wordsToRewind);
      onProgressUpdate?.(words.length > 0 ? (next / words.length) * 100 : 0, next);
      return next;
    });
  }, [words.length, onProgressUpdate]);

  // ── Restart timer when speed changes during playback ─────────────
  useEffect(() => {
    if (isPlaying) {
      play();
    }
  }, [speed]);

  // ── Save speed & fixation to DB when they change ─────────────────
  useEffect(() => {
    db.updateSettings({ readingSpeed: speed }).catch(() => {});
  }, [speed]);

  useEffect(() => {
    db.updateSettings({ showFixation }).catch(() => {});
  }, [showFixation]);

  // ── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    speed,
    setSpeed,
    isPlaying,
    wordIndex,
    setWordIndex,
    showFixation,
    setShowFixation,
    words,
    progress,
    formattedWord,
    play,
    pause,
    toggle,
    reset,
    rewind,
  };
}
