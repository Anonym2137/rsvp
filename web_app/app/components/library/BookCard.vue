<script setup lang="ts">
/**
 * BookCard – compact book entry for list views.
 * Emits 'select' when the card is clicked; emits 'delete' when the trash
 * button is confirmed via the inline confirm dialog.
 */
import { ref } from 'vue'
import { Progress } from '~/components/ui/progress'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
import { useI18n } from '#imports'
import type { Book } from '~/types'
import { LucideBookOpen, LucideTrash2 } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps<{
  book: Book
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
}>()

const showDeleteDialog = ref(false)

function confirmDelete() {
  showDeleteDialog.value = false
  emit('delete', props.book.id)
}

function onCardClick() {
  // Nie otwieraj książki po kliknięciu w przycisk kosza
  emit('select', props.book.id)
}
</script>

<template>
  <div
    class="relative w-full bg-surface p-3.5 rounded-2xl border border-border flex gap-4 hover:border-primary/40 transition-all duration-150 text-left group"
  >
    <!-- Główny przycisk karty -->
    <button
      class="flex gap-4 flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
      :aria-label="t('explore.readBook', { title: book.title })"
      @click="onCardClick"
    >
      <!-- Cover -->
      <div class="w-16 h-24 rounded-xl overflow-hidden border border-border shrink-0 bg-surface-3 flex items-center justify-center">
        <img
          v-if="book.cover"
          :src="book.cover"
          :alt="t('home.coverAlt', { title: book.title })"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        >
        <LucideBookOpen v-else class="w-6 h-6 text-subtle-fg" />
      </div>

      <!-- Info -->
      <div class="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          <p class="font-bold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors duration-150">
            {{ book.title }}
          </p>
          <p class="text-xs text-muted-fg mt-0.5">{{ book.author }}</p>
        </div>
        <div>
          <div class="flex justify-between text-[10px] text-muted-fg mb-1.5">
            <span>{{ t('library.completed') }}</span>
            <span class="font-semibold text-foreground">{{ book.progress }}%</span>
          </div>
          <Progress :model-value="book.progress" class="h-1.5" />
        </div>
      </div>
    </button>

    <!-- Przycisk usuwania -->
    <button
      type="button"
      class="shrink-0 self-start p-2 rounded-xl text-muted-fg hover:text-destructive hover:bg-destructive/10 transition-colors"
      :aria-label="t('library.deleteBook', { title: book.title })"
      @click="showDeleteDialog = true"
    >
      <LucideTrash2 class="w-4 h-4" />
    </button>

    <!-- Dialog potwierdzenia -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('library.deleteTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('library.deleteConfirm', { title: book.title }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            {{ t('library.cancel') }}
          </Button>
          <Button variant="destructive" @click="confirmDelete">
            {{ t('library.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
