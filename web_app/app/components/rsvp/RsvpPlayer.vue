<script setup lang="ts">
/**
 * RsvpPlayer – full RSVP reading widget:
 * speed slider, word display window, play/pause and reset controls.
 */
import { Slider } from '~/components/ui/slider'
import { Button } from '~/components/ui/button'
import { useRsvp } from '~/composables/useRsvp'
import RsvpWord from '~/components/rsvp/RsvpWord.vue'
import { LucidePause, LucidePlay, LucideRotateCcw } from 'lucide-vue-next'

const { t } = useI18n()
const { speed, isPlaying, formattedWord, toggle, reset } = useRsvp()

// shadcn Slider uses number[] for v-model
const speedArray = computed({
  get: () => [speed.value],
  set: (val: number[]) => { speed.value = val[0] },
})
</script>

<template>
  <div class="bg-surface-2 rounded-2xl p-4 border border-border">

    <!-- Speed header -->
    <div class="flex justify-between items-center mb-3">
      <span class="text-xs text-muted-fg font-medium">{{ $t('rsvpPlayer.preview') }}</span>
      <span class="text-xs font-bold text-primary tabular-nums">{{ speed }} WPM</span>
    </div>

    <!-- Slider -->
    <Slider
      v-model="speedArray"
      :min="100"
      :max="800"
      :step="25"
      class="mb-4"
      :aria-label="$t('rsvpPlayer.readingSpeed')"
    />

    <!-- Word display -->
    <div
      class="h-16 bg-background rounded-xl flex items-center justify-center relative overflow-hidden border border-border mb-3"
      role="region"
      aria-label="Okno RSVP"
      aria-live="assertive"
    >
      <!-- ORP guides -->
      <div class="absolute top-0 bottom-0 left-1/2 w-px bg-primary/10 pointer-events-none" />
      <div class="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/25 pointer-events-none" />
      <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/25 pointer-events-none" />

      <RsvpWord :word="formattedWord" />
    </div>

    <!-- Controls -->
    <div class="flex gap-2">
      <Button
        id="rsvp-toggle-btn"
        class="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg font-semibold text-xs rounded-xl gap-1.5"
        @click="toggle"
      >
        <component :is="isPlaying ? 'LucidePause' : 'LucidePlay'" class="w-4 h-4 fill-current" />
        {{ isPlaying ? $t('rsvpPlayer.pause') : $t('rsvpPlayer.play') }}
      </Button>
      <Button
        id="rsvp-reset-btn"
        variant="secondary"
        class="px-3 bg-surface-3 hover:bg-surface-2 text-foreground rounded-xl border border-border"
        :aria-label="$t('rsvpPlayer.reset')"
        @click="reset"
      >
        <LucideRotateCcw class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
