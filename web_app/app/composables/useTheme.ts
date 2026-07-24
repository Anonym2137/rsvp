/**
 * useTheme — zarządza motywem dark/light.
 * - Domyślnie: 'dark'
 * - Persystencja: localStorage (klucz 'rsvp-theme')
 * - Aplikuje klasę 'dark' lub 'light' na <html>
 */

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'rsvp-theme'
const DEFAULT_THEME: Theme = 'dark'

// Shared reactive state — singleton
const theme = ref<Theme>(DEFAULT_THEME)

function applyTheme(t: Theme) {
  if (!import.meta.client) return
  const html = document.documentElement
  html.classList.remove('dark', 'light')
  html.classList.add(t)
}

export function useTheme() {
  function initTheme() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const resolved: Theme = saved === 'light' || saved === 'dark' ? saved : DEFAULT_THEME
    theme.value = resolved
    applyTheme(resolved)
  }

  function setTheme(t: Theme) {
    theme.value = t
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, t)
      applyTheme(t)
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  const isDark = computed(() => theme.value === 'dark')

  return {
    theme: readonly(theme),
    isDark,
    initTheme,
    setTheme,
    toggleTheme,
  }
}
