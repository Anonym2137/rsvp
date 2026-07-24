<script setup lang="ts">
import StatCard from '~/components/stats/StatCard.vue'
import { LucideBarChart2, LucideTimer, LucideGauge, LucideBookOpen, LucideFlame } from 'lucide-vue-next'

const { t } = useI18n()

useSeoMeta({
  title: computed(() => `RSVP Reader – ${t('stats.title')}`),
  description: computed(() => t('stats.subtitle')),
})

const { data: stats } = useAsyncData('stats', () => $fetch<any>('/api/stats'))
</script>

<template>
  <div class="flex-1 overflow-y-auto pb-28">

    <!-- ─── Header ────────────────────────────────────────────── -->
    <header class="px-5 pt-6 pb-4">
      <h1 class="text-2xl font-extrabold text-foreground tracking-tight">{{ $t('stats.title') }}</h1>
      <p class="text-xs text-muted-fg mt-0.5">{{ $t('stats.subtitle') }}</p>
    </header>

    <!-- ─── Siatka statystyk ──────────────────────────────────── -->
    <section class="px-5">
      <div class="grid grid-cols-2 gap-3">
        <StatCard
          :label="$t('stats.totalTime')"
          :value="String(stats?.totalMinutes ?? 0)"
          :unit="$t('stats.unit.min')"
          :icon="LucideTimer"
          accent="indigo"
        />
        <StatCard
          :label="$t('stats.maxSpeed')"
          :value="String(stats?.maxWpm ?? 0)"
          :unit="$t('stats.unit.wpm')"
          :icon="LucideGauge"
          accent="emerald"
        />
        <StatCard
          :label="$t('stats.books')"
          :value="String(stats?.booksCount ?? 0)"
          :unit="$t('stats.unit.pcs')"
          :icon="LucideBookOpen"
          accent="indigo"
        />
        <StatCard
          :label="$t('stats.streak')"
          :value="String(stats?.streak ?? 0)"
          :unit="$t('stats.unit.days')"
          :icon="LucideFlame"
          accent="amber"
        />
      </div>
    </section>

    <!-- ─── Puste stany ───────────────────────────────────────── -->
    <section
      v-if="!stats?.totalMinutes"
      class="px-5 mt-6"
    >
      <div class="bg-surface rounded-2xl border border-border p-8 text-center">
        <LucideBarChart2 class="w-10 h-10 mx-auto mb-3 text-muted-fg opacity-40" />
        <p class="text-sm font-semibold text-foreground mb-1">{{ $t('stats.noData') }}</p>
        <p class="text-xs text-muted-fg">
          {{ $t('stats.noDataDesc') }}
        </p>
      </div>
    </section>

  </div>
</template>
