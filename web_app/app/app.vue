<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
import { useTheme } from './composables/useTheme'

const { initTheme } = useTheme()

// Inicjalizuj motyw po stronie klienta (przed renderem stron)
if (import.meta.client) {
  initTheme()
}
</script>

<template>
  <NuxtLayout>
    <div class="min-h-screen flex flex-col bg-background">
      <NuxtRouteAnnouncer />
      <NuxtPage />
      <BottomNav />
    </div>
  </NuxtLayout>
</template>
