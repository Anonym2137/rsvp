<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog'
import { useI18n } from 'vue-i18n'
import { useLibrary } from '~/composables/useLibrary'

const { t } = useI18n()
const { refreshBooks } = useLibrary()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ added: [] }>()

// ── Paste text tab ────────────────────────────────────────────────
const title = ref('')
const content = ref('')

// ── Upload file tab ──────────────────────────────────────────────
const activeTab = ref<'paste' | 'file'>('paste')
const file = ref<File | null>(null)
const isUploading = ref(false)

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

async function submitPaste() {
  if (!title.value.trim() || !content.value.trim()) return
  try {
    await $fetch('/api/books/custom', {
      method: 'POST',
      body: { title: title.value.trim(), content: content.value.trim() },
    })
    await refreshBooks()
    title.value = ''
    content.value = ''
    open.value = false
    emit('added')
  } catch (e) {
    console.error('Failed to add book:', e)
  }
}

async function uploadFile() {
  if (!file.value) return
  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.value)
    await $fetch('/api/books/custom', {
      method: 'POST',
      body: formData,
    })
    await refreshBooks()
    file.value = null
    open.value = false
    emit('added')
  } catch (e) {
    console.error('Failed to upload book:', e)
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[380px] bg-surface border-border rounded-3xl text-foreground">
      <DialogHeader>
        <DialogTitle class="text-lg font-bold text-foreground">{{ t('addBook.title') }}</DialogTitle>
      </DialogHeader>

      <!-- Tab switcher -->
      <div class="flex gap-2 mb-2">
        <button
          type="button"
          class="flex-1 rounded-xl py-2 text-xs font-medium border transition-colors"
          :class="activeTab === 'paste'
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-background border-border text-muted-fg'"
          @click="activeTab = 'paste'"
        >
          {{ t('addBook.tabPaste') }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl py-2 text-xs font-medium border transition-colors"
          :class="activeTab === 'file'
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-background border-border text-muted-fg'"
          @click="activeTab = 'file'"
        >
          {{ t('addBook.tabFile') }}
        </button>
      </div>

      <!-- Paste text -->
      <form v-if="activeTab === 'paste'" class="space-y-4 py-2" @submit.prevent="submitPaste">
        <div class="space-y-1.5">
          <label for="book-title" class="text-xs text-muted-fg font-medium">{{ t('addBook.bookTitle') }}</label>
          <Input
            id="book-title"
            v-model="title"
            :placeholder="t('addBook.bookTitlePlaceholder')"
            class="bg-background border-border rounded-xl text-foreground placeholder:text-muted-fg focus-visible:ring-primary/50"
            required
          />
        </div>
        <div class="space-y-1.5">
          <label for="book-content" class="text-xs text-muted-fg font-medium">{{ t('addBook.content') }}</label>
          <Textarea
            id="book-content"
            v-model="content"
            :rows="4"
            :placeholder="t('addBook.contentPlaceholder')"
            class="bg-background border-border rounded-xl text-foreground placeholder:text-muted-fg resize-none focus-visible:ring-primary/50"
            required
          />
        </div>

        <DialogFooter>
          <Button
            type="submit"
            class="w-full bg-primary hover:bg-primary-hover text-primary-fg py-3 rounded-xl font-semibold"
          >
            {{ t('addBook.submit') }}
          </Button>
        </DialogFooter>
      </form>

      <!-- Upload file -->
      <div v-else class="space-y-4 py-2">
        <div class="space-y-1.5">
          <label for="book-file" class="text-xs text-muted-fg font-medium">{{ t('addBook.fileLabel') }}</label>
          <input
            id="book-file"
            type="file"
            accept=".epub,.txt"
            class="block w-full text-xs text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-primary file:text-primary-fg file:cursor-pointer bg-background border border-border rounded-xl"
            @change="handleFileChange"
          />
          <p class="text-[11px] text-muted-fg">{{ t('addBook.filePlaceholder') }}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            :disabled="!file || isUploading"
            class="w-full bg-primary hover:bg-primary-hover text-primary-fg py-3 rounded-xl font-semibold disabled:opacity-50"
            @click="uploadFile"
          >
            {{ isUploading ? t('addBook.uploading') : t('addBook.upload') }}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
