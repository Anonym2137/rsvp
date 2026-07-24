<script setup lang="ts">
import { ref, computed } from 'vue'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import BookCard from '~/components/library/BookCard.vue'
import AddBookModal from '~/components/library/AddBookModal.vue'
import { useLibrary } from '~/composables/useLibrary'
import { useRouter } from 'vue-router'
import { LucidePlus, LucideBookOpen, LucideSearch } from 'lucide-vue-next'

const { t } = useI18n()

useSeoMeta({
  title: computed(() => `RSVP Reader – ${t('nav.library')}`),
  description: computed(() => t('library.emptyDesc')),
})

const router = useRouter()
const { books, selectBook, deleteBook } = useLibrary()
const query = ref('')
const showAddBook = ref(false)

const filteredBooks = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return books.value ?? []
  return (books.value ?? []).filter(
    (b: any) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q)
  )
})

async function handleSelect(id: string) {
  await selectBook(Number(id))
  router.push(`/reader/${id}`)
}

async function handleDelete(id: string) {
  await deleteBook(Number(id))
}
</script>

<template>
  <div class="flex-1 overflow-y-auto pb-28">

    <!-- ─── Header ────────────────────────────────────────────── -->
    <header class="px-5 pt-6 pb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-foreground tracking-tight">{{ $t('library.title') }}</h1>
        <p class="text-xs text-muted-fg mt-0.5">
          {{ books?.length ?? 0 }} {{ $t(books?.length === 1 ? 'library.book_one' : 'library.book_other') }}
        </p>
      </div>
      <Button
        id="go-explore-btn"
        size="icon"
        class="w-10 h-10 rounded-2xl bg-primary hover:bg-primary-hover text-primary-fg shadow-lg"
        :aria-label="$t('addBook.title')"
        @click="showAddBook = true"
      >
        <LucidePlus class="w-5 h-5" />
      </Button>
    </header>

    <!-- ─── Wyszukiwarka ──────────────────────────────────────── -->
    <section class="px-5 mb-4">
      <div class="relative">
        <LucideSearch class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
        <Input
          id="library-search-input"
          v-model="query"
          type="search"
          :placeholder="$t('library.searchPlaceholder')"
          class="w-full bg-surface border-border rounded-2xl py-5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-fg focus-visible:ring-primary/50"
        />
      </div>
    </section>

    <!-- ─── Lista książek ─────────────────────────────────────── -->
    <section class="px-5 space-y-3">

      <!-- Pusta biblioteka -->
      <div
        v-if="!filteredBooks.length"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
          <LucideBookOpen class="w-7 h-7 text-muted-fg" />
        </div>
        <p class="text-base font-semibold text-foreground mb-1">
          {{ query ? $t('library.noResults') : $t('library.empty') }}
        </p>
        <p class="text-sm text-muted-fg mb-5">
          {{ query ? $t('library.noResultsDesc', { query }) : $t('library.emptyDesc') }}
        </p>
        <Button
          v-if="!query"
          class="bg-primary hover:bg-primary-hover text-primary-fg rounded-2xl px-6"
          @click="router.push('/explore')"
        >
          <LucideSearch class="w-4 h-4 mr-2" />
          {{ $t('library.discoverBooks') }}
        </Button>
      </div>

      <BookCard
        v-for="book in filteredBooks"
        :key="book.id"
        :book="{ ...book, id: String(book.id), cover: book.cover ?? '' }"
        @select="handleSelect"
        @delete="handleDelete"
      />
    </section>

  </div>

  <AddBookModal v-model:open="showAddBook" />
</template>
