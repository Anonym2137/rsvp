<script setup lang="ts">
import type { Component } from 'vue'

/**
 * StatCard – a small metric tile used on the Stats page.
 */
defineProps<{
  label: string
  value: string
  unit?: string
  accent?: 'indigo' | 'emerald' | 'amber'
  icon: Component
}>()
</script>

<template>
  <div class="bg-surface rounded-2xl p-4 border border-border flex flex-col gap-3">
    <div class="flex justify-between items-center">
      <span class="text-[10px] text-muted-fg uppercase tracking-wider font-semibold">{{ label }}</span>
      <div
        class="w-8 h-8 rounded-xl flex items-center justify-center"
        :class="{
          'bg-primary-muted text-primary': accent === 'indigo' || !accent,
        }"
        :style="accent === 'emerald'
          ? 'background: var(--accent-emerald-muted); color: var(--accent-emerald);'
          : accent === 'amber'
          ? 'background: var(--accent-amber-muted); color: var(--accent-amber);'
          : ''"
      >
        <component :is="icon" class="w-4 h-4" />
      </div>
    </div>
    <p
      class="text-2xl font-extrabold tabular-nums"
      :class="{
        'text-foreground': accent === 'indigo' || !accent,
      }"
      :style="accent === 'emerald'
        ? 'color: var(--accent-emerald);'
        : accent === 'amber'
        ? 'color: var(--accent-amber);'
        : ''"
    >
      {{ value }}
      <span v-if="unit" class="text-xs font-normal text-muted-fg ml-0.5">{{ unit }}</span>
    </p>
  </div>
</template>
