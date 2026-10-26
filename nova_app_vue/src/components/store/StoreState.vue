<script setup lang="ts">
import StoreIcon from './StoreIcon.vue'
defineProps<{ loading?: boolean; error?: string; empty?: boolean; message?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div class="store-state">
    <div v-if="loading" class="store-loading" role="status">
      <span class="store-spinner" />Cargando…
      <div class="store-skeleton-grid"><span v-for="n in 4" :key="n" /></div>
    </div>
    <div v-else-if="error" class="store-empty" role="alert">
      <StoreIcon name="grid" />
      <h2>No pudimos cargar esta página</h2>
      <p>{{ error }}</p>
      <button class="store-button" @click="$emit('retry')">Volver a intentar</button>
    </div>
    <div v-else-if="empty" class="store-empty">
      <StoreIcon name="search" />
      <h2>{{ message || 'Todavía no hay contenido' }}</h2>
      <p>Cuando haya novedades, las encontrarás aquí.</p>
      <slot />
    </div>
  </div>
</template>
