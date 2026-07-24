import { ref, computed, onUnmounted, watch } from 'vue'
import type { FormattedWord } from '~/types'
import { useLibrary } from '~/composables/useLibrary'

function calcOrpIndex(word: string): number {
  if (word.length < 2) return 0
  if (word.length >= 6) return Math.floor(word.length / 2) - 1
  return Math.floor((word.length - 1) / 3)
}

function splitWordAtOrp(word: string, useOrp: boolean): FormattedWord {
  if (!useOrp || word.length < 2) {
    return { part1: word, focus: '', part2: '', isIntro: false }
  }
  const idx = calcOrpIndex(word)
  return {
    part1: word.substring(0, idx),
    focus: word.charAt(idx),
    part2: word.substring(idx + 1),
    isIntro: false,
  }
}

export function useRsvp() {
  const { currentText, updateProgress, currentBook, settings } = useLibrary()

  const speed = ref(300)
  const isPlaying = ref(false)
  const wordIndex = ref(0)
  const showFixation = ref(true)

  // Flaga: blokujemy reset() podczas początkowego ładowania rozdziałów,
  // żeby odtworzone z bazy wordIndex nie zostało nadpisane zerem.
  let restoring = false

  // Zapisywanie postępu w DB (z debounce'm, by nie uderzać co słowo).
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    const wi = wordIndex.value
    const prog = progress.value
    saveTimer = setTimeout(() => {
      updateProgress(prog, wi)
    }, 500)
  }

  // Sync speed and showFixation from settings when they load
  watch(() => settings.value, (s) => {
    if (s) {
      if (s.readingSpeed !== undefined && s.readingSpeed !== null) {
        speed.value = s.readingSpeed
      }
      if (s.showFixation !== undefined && s.showFixation !== null) {
        showFixation.value = s.showFixation
      }
    }
  }, { immediate: true })

  // Sync speed and showFixation back to server
  watch(speed, async (newSpeed) => {
    if (settings.value && settings.value.readingSpeed !== newSpeed) {
      try {
        await $fetch('/api/settings', { method: 'PATCH', body: { readingSpeed: newSpeed } })
      } catch (e) {
        console.error('Failed to save speed:', e)
      }
    }
  })

  watch(showFixation, async (newFix) => {
    if (settings.value && settings.value.showFixation !== newFix) {
      try {
        await $fetch('/api/settings', { method: 'PATCH', body: { showFixation: newFix } })
      } catch (e) {
        console.error('Failed to save fixation:', e)
      }
    }
  })

  // PRZYWRACANIE POZYCJI: gdy zmienia się książka (lub gdy z bazy
  // dochodzi zapisane wordIndex), wczytujemy ostatnie miejsce.
  watch(() => currentBook.value, (book) => {
    if (book) {
      restoring = true
      wordIndex.value = book.wordIndex ?? 0
      // odblokuj po następnej zmianie currentText (rozdziały się załadowały)
      setTimeout(() => { restoring = false }, 0)
    } else {
      restoring = true
      wordIndex.value = 0
      setTimeout(() => { restoring = false }, 0)
    }
  }, { immediate: true })

  let timer: ReturnType<typeof setInterval> | null = null
  let sessionStart: number | null = null

  const words = computed<string[]>(() => {
    if (!currentText.value || currentText.value === 'Brak tekstu…') return []
    return currentText.value.split(/\s+/).filter(Boolean)
  })

  const progress = computed<number>(() =>
    words.value.length === 0
      ? 0
      : (wordIndex.value / words.value.length) * 100,
  )

  const formattedWord = computed<FormattedWord>(() => {
    if (wordIndex.value === 0 && !isPlaying.value) {
      return { part1: 'Kliknij ', focus: 'Czytaj', part2: ' aby zacząć', isIntro: true }
    }
    if (wordIndex.value >= words.value.length) {
      return { part1: 'Koniec', focus: '!', part2: '', isIntro: false }
    }
    const w = words.value[wordIndex.value] ?? ''
    return splitWordAtOrp(w, showFixation.value)
  })

  function _clearTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  async function saveSession(durationSeconds: number) {
    const book = currentBook.value
    if (!book || durationSeconds < 3) return // Ignore very short sessions
    try {
      await $fetch('/api/stats/session', {
        method: 'POST',
        body: {
          bookId: book.id,
          durationSeconds,
          wpm: speed.value,
          wordsRead: wordIndex.value,
        },
      })
    } catch (e) {
      console.error('Failed to save reading session:', e)
    }
  }

  function play() {
    if (words.value.length === 0) return
    _clearTimer()
    isPlaying.value = true
    sessionStart = Date.now()
    const intervalMs = (60 / speed.value) * 1000

    timer = setInterval(() => {
      if (wordIndex.value >= words.value.length) {
        pause()
        wordIndex.value = 0
        updateProgress(0, 0)
        return
      }
      wordIndex.value++
      updateProgress(progress.value, wordIndex.value)
    }, intervalMs)
  }

  function pause() {
    isPlaying.value = false
    _clearTimer()
    if (sessionStart !== null) {
      const dur = Math.round((Date.now() - sessionStart) / 1000)
      saveSession(dur)
      sessionStart = null
    }
    updateProgress(progress.value, wordIndex.value)
  }

  function toggle() {
    isPlaying.value ? pause() : play()
  }

  function reset() {
    pause()
    wordIndex.value = 0
    updateProgress(0, 0)
  }

  // Cofnij o 15 sekund czytania przy obecnej prędkości.
  // 15 s * (speed słów/min) / 60 s = speed / 4 słów.
  function rewind15() {
    if (words.value.length === 0) return
    const wordsBack = Math.max(1, Math.round(speed.value / 4))
    wordIndex.value = Math.max(0, wordIndex.value - wordsBack)
    updateProgress(progress.value, wordIndex.value)
  }

  // ── ZAKŁADKA (BOOKMARK) ──────────────────────────────────────────
  // Zapisuje aktualną pozycję jako zakładkę w bazie (kolumna bookmark).
  async function setBookmark() {
    const book = currentBook.value
    if (!book) return
    try {
      await $fetch(`/api/books/${book.id}/progress`, {
        method: 'PATCH',
        body: { progress: Math.round(progress.value), wordIndex: wordIndex.value, bookmark: wordIndex.value },
      })
    } catch (e) {
      console.error('Failed to save bookmark:', e)
    }
  }

  // Wskakuje na zapisanym miejscu zakładki (jeśli istnieje).
  function jumpToBookmark() {
    const book = currentBook.value
    if (!book) return
    const bm = book.bookmark ?? 0
    wordIndex.value = Math.max(0, Math.min(bm, words.value.length - 1))
    updateProgress(progress.value, wordIndex.value)
  }

  const hasBookmark = computed(() => {
    const bm = currentBook.value?.bookmark
    return typeof bm === 'number' && bm > 0
  })

  watch(speed, () => {
    if (isPlaying.value) play()
  })

  // Gdy tekst książki się zmienia (nowe rozdziały), NIE resetuj do zera
  // podczas przywracania pozycji — pozwól zachować wordIndex z bazy.
  watch(currentText, () => {
    if (restoring) return
    // Ręczna zmiana książki bez zapisanego miejsca → zacznij od 0.
    if (wordIndex.value >= words.value.length) wordIndex.value = 0
  })

  // Okresowe zapisywanie postępu podczas czytania.
  watch(wordIndex, () => {
    if (!restoring) scheduleSave()
  })

  onUnmounted(() => {
    if (isPlaying.value) pause()
    _clearTimer()
    if (saveTimer) clearTimeout(saveTimer)
  })

  return {
    speed,
    isPlaying,
    wordIndex,
    showFixation,
    words,
    progress,
    formattedWord,
    play,
    pause,
    toggle,
    reset,
    rewind15,
    setBookmark,
    jumpToBookmark,
    hasBookmark,
    saveSession,
  }
}
