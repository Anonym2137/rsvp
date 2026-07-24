<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRsvp } from '~/composables/useRsvp'
import { useLibrary } from '~/composables/useLibrary'
import { Slider } from '~/components/ui/slider'
import { Button } from '~/components/ui/button'
import RsvpWord from '~/components/rsvp/RsvpWord.vue'
import { LucideRotateCcw, LucideArrowLeft, LucidePause, LucidePlay, LucideBookmarkCheck, LucideBookmark } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { currentBook, chapters, isLoadingChapters, selectBook } = useLibrary()
const { speed, isPlaying, wordIndex, showFixation, words, progress, formattedWord, toggle, reset, rewind15, setBookmark, jumpToBookmark, hasBookmark } = useRsvp()

// shadcn/reka-ui Slider expects v-model to be number[] (not a scalar number),
// otherwise the thumb never renders and the slider is dead. Wrap speed.
const speedArray = computed({
  get: () => [speed.value],
  set: (val: number[]) => { speed.value = val[0] },
})

const bookId = Number(route.params.id)
onMounted(async () => {
  if (bookId) {
    await selectBook(bookId)
  }
})

useSeoMeta({
  title: computed(() => `${t('reader.play')}: ${currentBook.value?.title ?? '...'}`),
  description: computed(() => t('reader.rsvpWindow')),
})

// Oblicz który rozdział jest aktualnie czytany na podstawie wordIndex
const chapterWordOffsets = computed(() => {
  let offset = 0
  return chapters.value.map((ch: any) => {
    const start = offset
    const chWords = ch.content ? ch.content.split(/\s+/).filter(Boolean).length : 0
    offset += chWords
    return { ...ch, startWord: start, endWord: offset - 1 }
  })
})

const currentChapterIndex = computed(() => {
  const idx = chapterWordOffsets.value.findLastIndex((c: any) => wordIndex.value >= c.startWord)
  return idx >= 0 ? idx : 0
})

function jumpToChapter(ch: any) {
  const found = chapterWordOffsets.value.find((c: any) => c.playOrder === ch.playOrder)
  if (found) {
    wordIndex.value = found.startWord
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-950 text-white">
    <!-- Header -->
    <header class="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-800/60">
      <button
        class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
        :aria-label="$t('reader.back')"
        @click="router.back()"
      >
        <LucideArrowLeft class="w-5 h-5 text-slate-300" />
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="font-bold text-white text-sm line-clamp-1">{{ currentBook?.title }}</h1>
        <p class="text-[11px] text-slate-400">{{ currentBook?.author }}</p>
      </div>
      <span class="text-xs text-indigo-400 font-bold tabular-nums">{{ Math.round(progress) }}%</span>
    </header>

    <!-- Loading State -->
    <div v-if="isLoadingChapters" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span class="text-sm">{{ $t('reader.loading') }}</span>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Chapters selector scroll -->
      <div class="px-4 py-2 border-b border-slate-800/40">
        <div class="flex gap-2 overflow-x-auto pb-1 snap-x scrollbar-hide">
          <button
            v-for="(ch, idx) in chapters"
            :key="ch.playOrder"
            class="shrink-0 snap-start px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            :class="{
              'bg-indigo-600 text-white': idx === currentChapterIndex,
              'bg-slate-800 text-slate-400 hover:bg-slate-700': idx !== currentChapterIndex
            }"
            @click="jumpToChapter(ch)"
          >
            {{ ch.label }}
          </button>
        </div>
      </div>

      <!-- Main RSVP reader area -->
      <div class="flex-1 flex flex-col justify-center items-center px-6 py-8 gap-6">
        <!-- Progress bar -->
        <div class="w-full max-w-sm">
          <div class="flex justify-between text-[10px] text-slate-500 mb-1.5">
            <span>{{ $t('reader.word', { current: Math.min(wordIndex + 1, words.length), total: words.length }) }}</span>
            <span>{{ speed }} WPM</span>
          </div>
          <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-300"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <!-- RSVP word window -->
        <div
          class="w-full max-w-sm h-28 bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-800 shadow-2xl"
          role="region"
          :aria-label="$t('reader.rsvpWindow')"
          aria-live="assertive"
        >
          <!-- ORP guides -->
          <div class="absolute top-0 bottom-0 left-1/2 w-px bg-indigo-500/10 pointer-events-none" />
          <div class="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500/30 pointer-events-none" />
          <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500/30 pointer-events-none" />

          <RsvpWord :word="formattedWord" />
        </div>

        <!-- Speed slider -->
        <div class="w-full max-w-sm space-y-2">
          <div class="flex justify-between text-xs text-slate-400">
            <span>{{ $t('reader.speed') }}</span>
            <span class="font-bold text-indigo-400">{{ speed }} WPM</span>
          </div>
          <Slider 
            v-model="speedArray" 
            :min="100" 
            :max="1000" 
            :step="25" 
          />
        </div>

        <!-- Controls -->
        <div class="grid grid-cols-4 gap-2 w-full max-w-sm">
          <Button
            id="reader-rewind-btn"
            variant="secondary"
            class="h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm"
            :aria-label="$t('reader.rewind')"
            @click="rewind15"
          >
            15s
          </Button>
          <Button
            id="reader-toggle-btn"
            class="col-span-2 h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 gap-2 text-sm"
            @click="toggle"
          >
            <component :is="isPlaying ? 'LucidePause' : 'LucidePlay'" class="w-5 h-5 fill-white" />
            {{ isPlaying ? $t('reader.pause') : $t('reader.play') }}
          </Button>
          <Button
            id="reader-reset-btn"
            variant="secondary"
            class="h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl"
            :aria-label="$t('reader.back')"
            @click="reset"
          >
            <LucideRotateCcw class="w-5 h-5" />
          </Button>
          <Button
            id="reader-bookmark-btn"
            class="col-span-2 h-12 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl gap-2 text-xs"
            :class="{ 'ring-1 ring-amber-500/60': hasBookmark }"
            @click="setBookmark"
          >
            <LucideBookmark class="w-4 h-4 text-amber-400" />
            {{ $t('reader.bookmarkSet') }}
          </Button>
          <Button
            v-if="hasBookmark"
            id="reader-bookmark-jump-btn"
            class="col-span-2 h-12 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-2xl gap-2 text-xs"
            @click="jumpToBookmark"
          >
            <LucideBookmarkCheck class="w-4 h-4" />
            {{ $t('reader.bookmarkGo') }}
          </Button>
        </div>

        <!-- Fixation toggle -->
        <div class="flex items-center gap-3 text-xs text-slate-400">
          <span>{{ $t('reader.fixation') }}</span>
          <button
            class="w-10 h-5 rounded-full relative transition-colors"
            :class="showFixation ? 'bg-indigo-600' : 'bg-slate-700'"
            @click="showFixation = !showFixation"
          >
            <span
              class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              :class="showFixation ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
