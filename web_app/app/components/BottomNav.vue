<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { NavTab } from '~/types'
import {
  LucideHome,
  LucideBookOpen,
  LucideSearch,
  LucideBarChart2,
  LucideSettings2,
} from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()

const tabs = computed<NavTab[]>(() => [
  { value: 'home',     label: t('nav.home'),     icon: LucideHome,      route: '/'         },
  { value: 'library',  label: t('nav.library'),  icon: LucideBookOpen,  route: '/library'  },
  { value: 'explore',  label: t('nav.explore'),  icon: LucideSearch,    route: '/explore'  },
  { value: 'stats',    label: t('nav.stats'),    icon: LucideBarChart2, route: '/stats'    },
  { value: 'settings', label: t('nav.settings'), icon: LucideSettings2, route: '/settings' },
])

const isActive = (tabRoute: string) =>
  tabRoute === '/' ? route.path === '/' : route.path.startsWith(tabRoute)
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border"
    :aria-label="t('nav.mainNav')"
    style="padding-bottom: env(safe-area-inset-bottom, 0px);"
  >
    <ul class="flex items-center justify-around px-2 py-2" role="list">
      <li v-for="tab in tabs" :key="tab.value">
        <NuxtLink
          :to="tab.route"
          class="flex flex-col items-center gap-1 min-w-[52px] py-1 px-2 rounded-xl no-underline transition-colors duration-150"
          :class="isActive(tab.route)
            ? 'text-primary'
            : 'text-muted-fg hover:text-foreground'"
          :aria-label="tab.label"
          :aria-current="isActive(tab.route) ? 'page' : undefined"
        >
          <!-- Icon wrapper z pill-indicator dla aktywnej zakładki -->
          <span
            class="flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200"
            :class="isActive(tab.route) ? 'bg-primary-muted' : 'bg-transparent'"
          >
            <component :is="tab.icon" class="w-5 h-5 shrink-0" />
          </span>
          <span class="text-[9px] font-semibold tracking-wide uppercase">{{ tab.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
