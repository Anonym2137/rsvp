/**
 * useTheme — React context for dark/light theme management.
 * Persists theme choice in AsyncStorage.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, LightTheme, type ThemeColors } from '../constants/theme';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'rsvp-theme';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: DarkTheme,
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    AsyncStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    colors: theme === 'dark' ? DarkTheme : LightTheme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }), [theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
