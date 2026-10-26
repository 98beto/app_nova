<script setup lang="ts">
import { ref, watch } from 'vue'
import StoreIcon from './StoreIcon.vue'
const props = defineProps<{ url: string | null; name: string; id?: number }>()
const broken = ref(false)
watch(
  () => props.url,
  () => {
    broken.value = false
  },
)
</script>
<template>
  <span class="store-app-icon" :class="`store-color-${(id || 0) % 4}`"
    ><img
      v-if="url && !broken"
      :src="url"
      :alt="`${name} — icono`"
      loading="lazy"
      @error="broken = true" /><StoreIcon v-else name="grid"
  /></span>
</template>
