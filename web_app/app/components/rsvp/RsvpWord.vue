<script setup lang="ts">
/**
 * RsvpWord – displays a single word with the ORP (optimal recognition point)
 * letter highlighted and pinned to the horizontal center of the reader box,
 * so the fixation guide always points at the colored letter.
 */
import { ref, nextTick, watch, onMounted } from 'vue'
import type { FormattedWord } from '~/types'

const props = defineProps<{
  word: FormattedWord
}>()

const root = ref<HTMLElement | null>(null)
// Horizontal shift (px) applied to the word so the focus letter lands at center.
const offset = ref(0)

function recompute() {
  const el = root.value
  if (!el) return
  const part1El = el.querySelector('[data-part1]') as HTMLElement | null
  const focusEl = el.querySelector('[data-focus]') as HTMLElement | null
  const part2El = el.querySelector('[data-part2]') as HTMLElement | null
  if (!part1El || !focusEl || !part2El) return

  const part1W = part1El.offsetWidth
  const focusW = focusEl.offsetWidth
  const wordW = part1W + focusW + part2El.offsetWidth
  // Center of the focus letter relative to the word's left edge.
  const focusCenter = part1W + focusW / 2
  // Shift the (already centered) word so the focus letter reaches box center.
  offset.value = wordW / 2 - focusCenter
}

watch(
  () => props.word,
  async () => {
    offset.value = 0
    await nextTick()
    recompute()
  },
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
  recompute()
  // Web fonts (Inter) load asynchronously; re-measure once they're ready.
  if (typeof document !== 'undefined' && 'fonts' in document) {
    document.fonts.ready.then(recompute).catch(() => {})
  }
})
</script>

<template>
  <span
    ref="root"
    class="inline-flex items-baseline text-xl font-bold tracking-wide font-sans text-foreground will-change-transform"
    :style="{ transform: `translateX(${offset}px)` }"
  >
    <span data-part1>{{ word.part1 }}</span><span
      data-focus
      class="font-extrabold"
      style="color: var(--accent-emerald);"
    >{{ word.focus }}</span><span data-part2>{{ word.part2 }}</span>
  </span>
</template>
