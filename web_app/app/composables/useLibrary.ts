import { ref, computed, watch } from 'vue'

const state = {
  // Współdzielone między wszystkimi instancjami composable'u (singleton).
  books: ref<any[]>([]),
  settings: ref<any>({ currentBookId: null, showFixation: true, readingSpeed: 300 }),
  chapters: ref<any[]>([]),
  isLoadingChapters: ref(false),
  // Książka jawnie otwarta przez URL /reader/[id] lub selectBook().
  // Gdy niepusta, nadpisuje wybór na podstawie settings.currentBookId —
  // dzięki temu otwarcie konkretnego tomu zawsze ładuje jego rozdziały.
  targetBookId: ref<number | null>(null),
  _initialized: false,
}

export function useLibrary() {
  async function init() {
    if (state._initialized) return
    state._initialized = true
    try {
      state.books.value = await $fetch<any[]>('/api/books')
    } catch (e) {
      console.error('Failed to load books:', e)
      state.books.value = []
    }
    try {
      state.settings.value = await $fetch<any>('/api/settings')
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }
  // Uruchom ładowanie od razu (jednokrotnie).
  init()

  const currentBook = computed(() => {
    if (!state.books.value || state.books.value.length === 0) return null
    const id = state.targetBookId.value ?? state.settings.value?.currentBookId
    if (id !== null && id !== undefined) {
      const found = state.books.value.find((b: any) => Number(b.id) === Number(id))
      if (found) return found
    }
    return state.books.value[0]
  })

  // Załaduj rozdziały gdy currentBook się zmieni
  watch(
    () => currentBook.value?.id,
    async (id) => {
      if (!id) {
        state.chapters.value = []
        return
      }
      state.isLoadingChapters.value = true
      try {
        state.chapters.value = await $fetch<any[]>(`/api/books/${id}/chapters`)
      } catch (e) {
        console.error('Failed to load chapters:', e)
        state.chapters.value = []
      } finally {
        state.isLoadingChapters.value = false
      }
    },
    { immediate: true },
  )

  // Złączony tekst wszystkich rozdziałów dla RSVP
  const currentText = computed(() => {
    if (!state.chapters.value || state.chapters.value.length === 0) return 'Brak tekstu…'
    return state.chapters.value.map((c: any) => c.content).join(' ')
  })

  // ── Akcje ─────────────────────────────────────────────────────────
  async function selectBook(id: number) {
    state.targetBookId.value = Number(id)
    try {
      await $fetch('/api/settings', { method: 'PATCH', body: { currentBookId: id } })
      state.settings.value = { ...state.settings.value, currentBookId: id }
    } catch (e) {
      console.error('Failed to set current book:', e)
    }
  }

  async function deleteBook(id: number) {
    await $fetch(`/api/books/${id}`, { method: 'DELETE' })
    if (state.targetBookId.value === id) state.targetBookId.value = null
    if (state.settings.value?.currentBookId === id) {
      try {
        await $fetch('/api/settings', { method: 'PATCH', body: { currentBookId: null } })
      } catch (e) {
        console.error('Failed to clear currentBookId after delete:', e)
      }
    }
    try {
      state.books.value = await $fetch<any[]>('/api/books')
      state.settings.value = await $fetch<any>('/api/settings')
    } catch (e) {
      console.error('Failed to refresh after delete:', e)
    }
  }

  async function updateProgress(percent: number, wordIndex: number, bookmark?: number) {
    const book = currentBook.value
    if (!book) return
    const body: { progress: number; wordIndex: number; bookmark?: number } = {
      progress: Math.round(percent),
      wordIndex,
    }
    if (typeof bookmark === 'number') body.bookmark = bookmark
    try {
      await $fetch(`/api/books/${book.id}/progress`, { method: 'PATCH', body })
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  }

  return {
    books: state.books,
    currentBook,
    currentText,
    chapters: state.chapters,
    isLoadingChapters: state.isLoadingChapters,
    targetBookId: state.targetBookId,
    selectBook,
    deleteBook,
    updateProgress,
    settings: state.settings,
    refreshBooks: async () => {
      try {
        state.books.value = await $fetch<any[]>('/api/books')
      } catch (e) {
        console.error('Failed to refresh books:', e)
      }
    },
    refreshSettings: async () => {
      try {
        state.settings.value = await $fetch<any>('/api/settings')
      } catch (e) {
        console.error('Failed to refresh settings:', e)
      }
    },
  }
}
