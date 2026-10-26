<script setup lang="ts">
import type { PageMeta } from '@/types/store'
defineProps<{ meta: PageMeta; disabled?: boolean; label?: string }>()
defineEmits<{ change: [page: number] }>()
</script>
<template>
  <nav v-if="meta.last_page > 1" class="store-pagination" :aria-label="label || 'Paginación'">
    <button
      class="store-button store-button-secondary"
      :disabled="disabled || meta.current_page <= 1"
      @click="$emit('change', meta.current_page - 1)"
    >
      ← Anterior</button
    ><span aria-live="polite">{{ meta.current_page }} de {{ meta.last_page }}</span
    ><button
      class="store-button store-button-secondary"
      :disabled="disabled || meta.current_page >= meta.last_page"
      @click="$emit('change', meta.current_page + 1)"
    >
      Siguiente →
    </button>
  </nav>
</template>
