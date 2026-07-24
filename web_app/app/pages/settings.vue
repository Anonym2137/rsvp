<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useTheme } from '~/composables/useTheme'
import { useRsvp } from '~/composables/useRsvp'
import { Switch } from '~/components/ui/switch'
import { Slider } from '~/components/ui/slider'
import { LucideMoon, LucideSun, LucideGauge, LucideEye, LucideInfo, LucideZap, LucideLanguages } from 'lucide-vue-next'

const { t, locale, setLocale } = useI18n()

useSeoMeta({
  title: computed(() => `RSVP Reader – ${t('settings.title')}`),
  description: computed(() => t('settings.subtitle')),
})

const { theme, setTheme } = useTheme()
const { speed, showFixation } = useRsvp()

// shadcn Slider uses number[] for v-model
const speedArray = computed({
  get: () => [speed.value],
  set: (val: number[]) => { speed.value = val[0] },
})
</script>

<template>
  <div class="flex-1 overflow-y-auto pb-28">

    <!-- ─── Header ────────────────────────────────────────────── -->
    <header class="px-5 pt-6 pb-2">
      <h1 class="text-2xl font-bold text-foreground tracking-tight">{{ t('settings.title') }}</h1>
      <p class="text-sm text-muted-fg mt-0.5">{{ t('settings.subtitle') }}</p>
    </header>

    <!-- ─── Appearance ────────────────────────────────────────────── -->
    <section class="px-5 mt-6">
      <h2 class="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3 px-1">
        {{ t('settings.appearance') }}
      </h2>

      <!-- Theme picker -->
      <div class="flex gap-3">
        <!-- Dark -->
        <button
          id="theme-dark-btn"
          type="button"
          class="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
          :class="theme === 'dark'
            ? 'border-primary bg-primary-muted'
            : 'border-border bg-surface hover:border-primary/40'"
          :aria-pressed="theme === 'dark'"
          @click="setTheme('dark')"
        >
          <!-- Preview miniature -->
          <div class="w-full h-16 rounded-xl bg-[oklch(0.09_0.015_260)] border border-[oklch(0.22_0.015_260)] overflow-hidden relative">
            <div class="absolute top-2 left-2 right-2 h-1.5 rounded bg-[oklch(0.22_0.015_260)]" />
            <div class="absolute top-5 left-2 right-4 h-1 rounded bg-[oklch(0.19_0.015_260)]" />
            <div class="absolute top-7.5 left-2 right-6 h-1 rounded bg-[oklch(0.19_0.015_260)]" />
            <div class="absolute bottom-2 left-2 w-8 h-3 rounded-lg bg-[oklch(0.62_0.22_265)]" />
          </div>
          <div class="flex items-center gap-1.5">
            <LucideMoon class="w-4 h-4 text-primary" />
            <span class="text-sm font-semibold text-foreground">{{ t('settings.dark') }}</span>
          </div>
          <div
            v-if="theme === 'dark'"
            class="w-2 h-2 rounded-full bg-primary"
            aria-hidden="true"
          />
        </button>

        <!-- Light -->
        <button
          id="theme-light-btn"
          type="button"
          class="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
          :class="theme === 'light'
            ? 'border-primary bg-primary-muted'
            : 'border-border bg-surface hover:border-primary/40'"
          :aria-pressed="theme === 'light'"
          @click="setTheme('light')"
        >
          <!-- Preview miniature -->
          <div class="w-full h-16 rounded-xl bg-[oklch(0.97_0.005_260)] border border-[oklch(0.88_0.01_260)] overflow-hidden relative">
            <div class="absolute top-2 left-2 right-2 h-1.5 rounded bg-[oklch(0.88_0.01_260)]" />
            <div class="absolute top-5 left-2 right-4 h-1 rounded bg-[oklch(0.92_0.008_260)]" />
            <div class="absolute top-7.5 left-2 right-6 h-1 rounded bg-[oklch(0.92_0.008_260)]" />
            <div class="absolute bottom-2 left-2 w-8 h-3 rounded-lg bg-[oklch(0.52_0.22_265)]" />
          </div>
          <div class="flex items-center gap-1.5">
            <LucideSun class="w-4 h-4 text-primary" />
            <span class="text-sm font-semibold text-foreground">{{ t('settings.light') }}</span>
          </div>
          <div
            v-if="theme === 'light'"
            class="w-2 h-2 rounded-full bg-primary"
            aria-hidden="true"
          />
        </button>
      </div>
    </section>

    <!-- ─── Język / Language ─────────────────────────────────── -->
    <section class="px-5 mt-8">
      <h2 class="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3 px-1">
        {{ t('settings.language') }}
      </h2>

      <div class="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border">
        <div class="flex justify-between items-center p-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-muted flex items-center justify-center">
              <LucideLanguages class="w-4 h-4 text-primary" />
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground">{{ t('settings.language') }}</p>
              <p class="text-xs text-muted-fg">{{ t('settings.languageDesc') }}</p>
            </div>
          </div>
          <select
            :value="locale"
            class="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            :aria-label="t('settings.language')"
            @change="setLocale(($event.target as HTMLSelectElement).value)"
          >
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ─── RSVP Reading ─────────────────────────────────────── -->
    <section class="px-5 mt-8">
      <h2 class="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3 px-1">
        {{ t('settings.rsvpReading') }}
      </h2>

      <div class="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border">

        <!-- Reading speed -->
        <div class="p-4">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-primary-muted flex items-center justify-center">
                <LucideGauge class="w-4 h-4 text-primary" />
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">{{ t('settings.readingSpeed') }}</p>
                <p class="text-xs text-muted-fg">{{ t('settings.readingSpeedDesc') }}</p>
              </div>
            </div>
            <span class="text-sm font-bold text-primary tabular-nums">{{ speed }}<span class="text-xs font-normal text-muted-fg ml-1">{{ t('stats.unit.wpm') }}</span></span>
          </div>
          <Slider
            id="speed-slider"
            v-model="speedArray"
            :min="100"
            :max="800"
            :step="25"
            class="w-full"
            :aria-label="t('settings.readingSpeed')"
          />
          <div class="flex justify-between text-[10px] text-subtle-fg mt-1.5">
            <span>100 {{ t('stats.unit.wpm') }}</span>
            <span>800 {{ t('stats.unit.wpm') }}</span>
          </div>
        </div>

        <!-- Punkt fiksacji -->
        <div class="flex justify-between items-center p-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-muted flex items-center justify-center">
              <LucideEye class="w-4 h-4 text-primary" />
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground">{{ t('settings.fixationPoint') }}</p>
              <p class="text-xs text-muted-fg">{{ t('settings.fixationPointDesc') }}</p>
            </div>
          </div>
          <Switch
            id="fixation-toggle"
            v-model:checked="showFixation"
            class="data-[state=checked]:bg-primary"
          />
        </div>

      </div>
    </section>

    <!-- ─── O aplikacji ───────────────────────────────────────── -->
    <section class="px-5 mt-8">
      <h2 class="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3 px-1">
        {{ t('settings.about') }}
      </h2>

      <div class="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border">
        <div class="flex justify-between items-center p-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-surface-3 flex items-center justify-center">
              <LucideInfo class="w-4 h-4 text-muted-fg" />
            </div>
            <span class="text-sm font-medium text-foreground">{{ t('settings.version') }}</span>
          </div>
          <span class="text-sm text-muted-fg">1.0.0</span>
        </div>

        <div class="flex justify-between items-center p-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-surface-3 flex items-center justify-center">
              <LucideZap class="w-4 h-4 text-muted-fg" />
            </div>
            <span class="text-sm font-medium text-foreground">{{ t('settings.technology') }}</span>
          </div>
          <span class="text-sm text-muted-fg">RSVP</span>
        </div>
      </div>
    </section>

  </div>
</template>
