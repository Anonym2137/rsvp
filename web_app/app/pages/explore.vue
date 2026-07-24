<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Input } from '~/components/ui/input'
import { useLibrary } from '~/composables/useLibrary'
import { useRouter } from 'vue-router'
import { LucideBookOpen, LucideChevronDown, LucideDownload, LucideSearch, LucidePlus } from 'lucide-vue-next'
import AddBookModal from '~/components/library/AddBookModal.vue'

const { t } = useI18n()

useSeoMeta({
  title: computed(() => `RSVP Reader – ${t('nav.explore')}`),
  description: computed(() => t('explore.subtitle')),
})

type SearchResult = {
  id: string
  title: string
  author: string
  cover: string | null
  details: string | null
}

const router = useRouter()
const { books, selectBook } = useLibrary()

const query = ref('')

// Filter chips (mirror the mobile explore screen).
const selectedSort = ref('')
const selectedLang = ref('')
const selectedFormat = ref('epub')

// ─── Online search (Anna's Archive, server-side fetch + parse) ─────
const isLoading = ref(false)
const searchResults = ref<SearchResult[]>([])
const searchExecuted = ref(false)

// ─── Local library filtering ───────────────────────────────────────
const filteredLocal = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return books.value.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q),
  )
})

let debounceTimeout: any = null

watch(
  [query, selectedSort, selectedLang, selectedFormat],
  () => {
    if (debounceTimeout) clearTimeout(debounceTimeout)
    const trimmed = query.value.trim()
    if (!trimmed) {
      searchResults.value = []
      isLoading.value = false
      searchExecuted.value = false
      return
    }
    isLoading.value = true
    searchExecuted.value = true
    debounceTimeout = setTimeout(async () => {
      try {
        const results = await $fetch<SearchResult[]>('/api/search', {
          query: {
            title: trimmed,
            sort: selectedSort.value,
            lang: selectedLang.value,
            ext: selectedFormat.value,
          },
        })
        searchResults.value = results ?? []
      } catch (e) {
        console.error('Online search failed:', e)
        searchResults.value = []
      } finally {
        isLoading.value = false
      }
    }, 600)
  },
  { deep: true },
)

function handleSelectLocal(id: number) {
  selectBook(id)
  router.push(`/reader/${id}`)
}

// Open the Anna's Archive download page in a new browser tab — the user
// downloads the file manually and imports it locally (mirrors the mobile app).
function handleOpenDownloadPage(book: SearchResult) {
  const url = `https://annas-archive.gl/slow_download/${book.id}/0/0`
  window.open(url, '_blank', 'noopener')
}

const sortOptions = [
  { label: t('explore.sortRelevance'), value: '' },
  { label: t('explore.sortNewest'), value: 'newest' },
  { label: t('explore.sortOldest'), value: 'oldest' },
  { label: t('explore.sortLargest'), value: 'largest' },
  { label: t('explore.sortSmallest'), value: 'smallest' },
  { label: t('explore.sortRecentlyAdded'), value: 'newest_added' },
  { label: t('explore.sortRandom'), value: 'random' },
]

const langOptions = [
  { label: t('explore.langAll'), value: '' },
  { label: t('explore.langPl'), value: 'pl' },
  { label: t('explore.langEn'), value: 'en' },
  { label: t('explore.langDe'), value: 'de' },
  { label: t('explore.langFr'), value: 'fr' },
  { label: t('explore.langEs'), value: 'es' },
  { label: t('explore.langIt'), value: 'it' },
  { label: t('explore.langRu'), value: 'ru' },
  { label: t('explore.langPt'), value: 'pt' },
  { label: t('explore.langNl'), value: 'nl' },
  { label: t('explore.langZh'), value: 'zh' },
  { label: t('explore.langJa'), value: 'ja' },
]

const formatOptions = [
  { label: `${t('explore.format')}: EPUB`, value: 'epub' },
  { label: `${t('explore.format')}: TXT`, value: 'txt' },
  { label: `${t('explore.format')}: PDF`, value: 'pdf' },
]

const activeMenu = ref<'sort' | 'lang' | 'format' | null>(null)
const toggleMenu = (menu: 'sort' | 'lang' | 'format') => {
  activeMenu.value = activeMenu.value === menu ? null : menu
}
const showAddBook = ref(false)
</script>

<template>
  <div class="flex-1 overflow-y-auto pb-28">

    <!-- ─── Header ────────────────────────────────────────────── -->
    <header class="px-5 pt-6 pb-4 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-foreground tracking-tight">{{ $t('explore.title') }}</h1>
        <p class="text-xs text-muted-fg mt-0.5">{{ $t('explore.subtitle') }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary-hover transition-colors"
        :aria-label="$t('addBook.title')"
        @click="showAddBook = true"
      >
        <LucidePlus class="w-5 h-5 text-primary-fg" />
      </button>
    </header>

    <!-- ─── Search ────────────────────────────────────────────── -->
    <section class="px-5">
      <div class="relative">
        <LucideSearch class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
        <Input
          id="explore-search-input"
          v-model="query"
          type="search"
          :placeholder="$t('explore.searchPlaceholder')"
          class="w-full bg-surface border-border rounded-2xl py-5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-fg focus-visible:ring-primary/50"
        />
      </div>
    </section>

    <!-- ─── Filtry (chips) ────────────────────────────────────── -->
    <section class="px-5 mt-3 flex gap-2">
      <div class="relative flex-1">
        <select
          id="sort-select"
          v-model="selectedSort"
          class="w-full appearance-none bg-surface border border-border rounded-2xl py-2.5 pl-3 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-colors"
          @change="toggleMenu('sort')"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <LucideChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-fg pointer-events-none" />
      </div>

      <div class="relative flex-1">
        <select
          id="lang-select"
          v-model="selectedLang"
          class="w-full appearance-none bg-surface border border-border rounded-2xl py-2.5 pl-3 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-colors"
          @change="toggleMenu('lang')"
        >
          <option v-for="opt in langOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <LucideChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-fg pointer-events-none" />
      </div>

      <div class="relative flex-1">
        <select
          id="format-select"
          v-model="selectedFormat"
          class="w-full appearance-none bg-surface border border-border rounded-2xl py-2.5 pl-3 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-colors"
          @change="toggleMenu('format')"
        >
          <option v-for="opt in formatOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <LucideChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-fg pointer-events-none" />
      </div>
    </section>

    <!-- ─── Wyniki ────────────────────────────────────────────── -->
    <section class="px-5 mt-5 pb-6 space-y-6">

      <!-- Brak query -->
      <div
        v-if="!query.trim()"
        class="flex flex-col items-center py-10 text-center"
      >
        <LucideSearch class="w-10 h-10 text-muted-fg opacity-40 mb-3" />
        <p class="text-sm text-muted-fg">{{ $t('explore.noQuery') }}</p>
      </div>

      <!-- Ładowanie -->
      <div
        v-else-if="isLoading"
        class="flex flex-col items-center py-10 text-center"
      >
        <LucideSearch class="w-10 h-10 text-muted-fg opacity-40 mb-3 animate-pulse" />
        <p class="text-sm text-muted-fg">{{ $t('explore.loading') }}</p>
      </div>

      <!-- Brak wyników -->
      <div
        v-else-if="searchExecuted && searchResults.length === 0 && filteredLocal.length === 0"
        class="text-center py-10"
      >
        <p class="text-sm text-muted-fg">{{ $t('explore.noResults', { query }) }}</p>
      </div>

      <template v-else>
        <!-- Lokalna biblioteka (gdy są dopasowania) -->
        <div v-if="filteredLocal.length > 0" class="space-y-2">
          <h2 class="text-xs font-bold text-muted-fg uppercase tracking-wider">
            {{ $t('explore.yourLibrary') }}
          </h2>
          <button
            v-for="book in filteredLocal"
            :key="book.id"
            class="w-full bg-surface p-3.5 rounded-2xl border border-border flex gap-4 hover:border-primary/40 transition-all duration-200 text-left group relative overflow-hidden"
            :aria-label="$t('explore.readBook', { title: book.title })"
            @click="handleSelectLocal(Number(book.id))"
          >
            <img
              :src="book.cover"
              :alt="$t('explore.coverAlt', { title: book.title })"
              class="w-12 h-16 rounded-xl object-cover shrink-0 border border-border"
            >
            <div class="flex-1 flex flex-col justify-center min-w-0 pr-8">
              <p class="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors duration-150">
                {{ book.title }}
              </p>
              <p class="text-xs text-muted-fg mt-0.5 line-clamp-1">{{ book.author }}</p>
            </div>
          </button>
        </div>

        <!-- Wyniki online -->
        <div v-if="searchResults.length > 0" class="space-y-2">
          <h2 class="text-xs font-bold text-muted-fg uppercase tracking-wider">
            {{ $t('explore.onlineResults') }}
          </h2>
          <button
            v-for="book in searchResults"
            :key="book.id"
            class="w-full bg-surface p-3.5 rounded-2xl border border-border flex gap-4 hover:border-primary/40 transition-all duration-200 text-left group relative overflow-hidden"
            :aria-label="$t('explore.downloadAndRead', { title: book.title })"
            @click="handleOpenDownloadPage(book)"
          >
            <img
              v-if="book.cover"
              :src="book.cover"
              :alt="$t('explore.coverAlt', { title: book.title })"
              class="w-12 h-16 rounded-xl object-cover shrink-0 border border-border"
            >
            <div
              v-else
              class="w-12 h-16 rounded-xl shrink-0 border border-border flex items-center justify-center bg-surface3"
            >
              <LucideBookOpen class="w-5 h-5 text-subtle-fg" />
            </div>
            <div class="flex-1 flex flex-col justify-center min-w-0 pr-12">
              <p class="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors duration-150">
                {{ book.title }}
              </p>
              <p class="text-xs text-muted-fg mt-0.5 line-clamp-1">{{ book.author }}</p>
            </div>
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
            >
              <LucideDownload class="w-4 h-4 text-primary-fg" />
            </span>
          </button>
        </div>
      </template>
    </section>
  </div>

  <AddBookModal v-model:open="showAddBook" />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
