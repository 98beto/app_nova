<script setup lang="ts">
import { onMounted } from 'vue'
import { useStore } from '@/stores/store'
import StoreShell from '@/components/store/StoreShell.vue'
import StoreState from '@/components/store/StoreState.vue'
import PublicationForm from '@/components/store/PublicationForm.vue'

const store = useStore()
onMounted(() => {
  store.clearAction()
  void store.loadCategories()
})
</script>

<template>
  <StoreShell title="Publicar app" subtitle="Dale vida a tu próxima idea en AppNova.">
    <StoreState
      :loading="store.categories.loading"
      :error="store.categories.error"
      @retry="store.loadCategories"
    />
    <PublicationForm
      v-if="store.categories.data && !store.categories.loading"
      :categories="store.categories.data.categories"
    />
  </StoreShell>
</template>
