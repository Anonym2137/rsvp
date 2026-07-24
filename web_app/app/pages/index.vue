<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Progress } from '~/components/ui/progress'
import { Button } from '~/components/ui/button'
import RsvpPlayer from '~/components/rsvp/RsvpPlayer.vue'
import { useLibrary } from '~/composables/useLibrary'
import { useRsvp } from '~/composables/useRsvp'
import { LucideBookOpen, LucideExpand, LucideGauge, LucideSearch, LucideSettings2, LucideTimer, LucideZap } from 'lucide-vue-next'

const { t } = useI18n()

useSeoMeta({
  title: 'RSVP Reader',
  description: computed(() => t('home.noBooksDesc')),
})

const router = useRouter()
const { currentBook, books } = useLibrary()
const { progress } = useRsvp()

const { data: stats } = useAsyncData('stats', () => $fetch<any>('/api/stats'))

// Polecane — ostatnie dodane (bez aktualnej)
const recommended = computed(() => {
  const all = books.value ?? []
  const current = currentBook.value
  return all
    .filter((b: any) => !current || b.id !== current.id)
    .slice(-5)
    .reverse()
})
</script>

<template>
  <div class="flex-1 overflow-y-auto pb-28">

    <!-- ─── Header ────────────────────────────────────────────── -->
    <header class="flex items-center justify-between px-5 pt-6 pb-4">
      <div>
        <p class="text-xs text-muted-fg font-medium">{{ $t('home.welcome') }}</p>
        <h1 class="text-2xl font-extrabold text-foreground tracking-tight">
          RSVP <span class="text-primary">Reader</span>
        </h1>
      </div>

      <Button
        variant="ghost"
        size="icon"
        class="w-10 h-10 rounded-2xl bg-surface-2 hover:bg-surface-3 text-foreground border border-border"
        :aria-label="$t('nav.settings')"
        @click="router.push('/settings')"
      >
        <LucideSettings2 class="w-5 h-5" />
      </Button>
    </header>

    <!-- ─── Statystyki dnia ───────────────────────────────────── -->
    <section class="px-5 grid grid-cols-2 gap-3">
      <div class="bg-surface rounded-2xl p-4 border border-border">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-fg font-medium">{{ $t('home.timeToday') }}</span>
          <div class="p-1.5 rounded-lg" style="background: var(--accent-emerald-muted);">
            <LucideTimer class="w-4 h-4" style="color: var(--accent-emerald);" />
          </div>
        </div>
        <p class="text-2xl font-extrabold text-foreground tabular-nums">
          {{ stats?.totalMinutes ?? 0 }}
          <span class="text-xs font-normal text-muted-fg">{{ $t('stats.unit.min') }}</span>
        </p>
      </div>

      <div class="bg-surface rounded-2xl p-4 border border-border">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-fg font-medium">{{ $t('home.maxWpm') }}</span>
          <div class="p-1.5 rounded-lg bg-primary-muted">
            <LucideGauge class="w-4 h-4 text-primary" />
          </div>
        </div>
        <p class="text-2xl font-extrabold text-foreground tabular-nums">
          {{ stats?.maxWpm ?? 0 }}
          <span class="text-xs font-normal text-muted-fg">{{ $t('stats.unit.wpm') }}</span>
        </p>
      </div>
    </section>

    <!-- ─── Aktualnie czytasz ─────────────────────────────────── -->
    <section class="px-5 mt-4">

      <!-- Brak książek -->
      <div
        v-if="!currentBook"
        class="bg-surface rounded-2xl p-8 text-center border border-border"
      >
        <LucideBookOpen class="w-12 h-12 mx-auto mb-3 text-primary opacity-40" />
        <p class="font-semibold text-foreground mb-1">{{ $t('home.noBooks') }}</p>
        <p class="text-sm text-muted-fg mb-5">
          {{ $t('home.noBooksDesc') }}
        </p>
        <Button
          class="bg-primary hover:bg-primary-hover text-primary-fg rounded-2xl px-6"
          @click="router.push('/explore')"
        >
          <LucideSearch class="w-4 h-4 mr-2" />
          {{ $t('home.browseBooks') }}
        </Button>
      </div>

      <!-- Aktualnie czytasz -->
      <div
        v-else
        class="bg-surface rounded-2xl border border-border overflow-hidden"
      >
        <!-- Book info header -->
        <div class="p-4 flex gap-4">
          <!-- Cover -->
          <div class="w-16 h-24 rounded-xl overflow-hidden border border-border shrink-0 bg-surface-3 flex items-center justify-center">
            <img
              v-if="currentBook.cover"
              :src="currentBook.cover"
              :alt="$t('home.coverAlt', { title: currentBook.title })"
              class="w-full h-full object-cover"
            >
            <LucideBookOpen v-else class="w-6 h-6 text-subtle-fg" />
          </div>

          <!-- Meta -->
          <div class="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-muted mb-1.5">
                <LucideZap class="w-3 h-3 text-primary" />
                <span class="text-[10px] font-bold text-primary uppercase tracking-wider">{{ $t('home.readingNow') }}</span>
              </div>
              <h2 class="text-base font-bold text-foreground leading-snug line-clamp-2">
                {{ currentBook.title }}
              </h2>
              <p class="text-xs text-muted-fg mt-0.5">{{ currentBook.author }}</p>
            </div>

            <!-- Progress -->
            <div class="mt-2">
              <div class="flex justify-between text-[10px] text-muted-fg mb-1">
                <span>{{ $t('home.progress') }}</span>
                <span class="font-semibold text-foreground">{{ Math.round(progress) }}%</span>
              </div>
              <Progress :model-value="progress" class="h-1.5" />
            </div>
          </div>
        </div>

        <!-- RSVP Player -->
        <div class="px-4 pb-4">
          <RsvpPlayer />
        </div>

        <!-- Open reader -->
        <button
          class="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-primary border-t border-border hover:bg-primary-muted transition-colors duration-150"
          @click="router.push(`/reader/${currentBook.id}`)"
        >
          <LucideExpand class="w-4 h-4" />
          {{ $t('home.openReader') }}
        </button>
      </div>
    </section>

    <!-- ─── Z twojej biblioteki ───────────────────────────────── -->
    <section v-if="recommended.length > 0" class="px-5 mt-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-foreground">{{ $t('home.fromLibrary') }}</h3>
        <NuxtLink
          to="/library"
          class="text-xs text-primary hover:text-primary-hover font-medium transition-colors no-underline"
        >
          {{ $t('home.allBooks') }}
        </NuxtLink>
      </div>

      <div class="flex gap-3 overflow-x-auto pb-1 snap-x scrollbar-none">
        <button
          v-for="book in recommended"
          :key="book.id"
          class="w-28 shrink-0 snap-start text-left group focus:outline-none"
          :aria-label="$t('home.coverAlt', { title: book.title })"
          @click="router.push(`/reader/${book.id}`)"
        >
          <div class="w-full h-36 rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-colors duration-200 bg-surface-3 flex items-center justify-center mb-2">
            <img
              v-if="book.cover"
              :src="book.cover"
              :alt="book.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            >
            <LucideBookOpen v-else class="w-6 h-6 text-subtle-fg" />
          </div>
          <p class="text-xs font-bold text-foreground line-clamp-1">{{ book.title }}</p>
          <p class="text-[10px] text-muted-fg line-clamp-1">{{ book.author }}</p>
        </button>
      </div>
    </section>

  </div>
</template>