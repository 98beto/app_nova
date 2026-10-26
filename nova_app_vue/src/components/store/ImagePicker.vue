<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { imageError } from '@/lib/store'
import StoreIcon from './StoreIcon.vue'
const props = withDefaults(
  defineProps<{ label: string; maxMB?: number; existing?: string | null; error?: string }>(),
  { maxMB: 5 },
)
const file = defineModel<File | null>({ default: null })
const preview = ref('')
const localError = ref('')
watch(
  file,
  (value) => {
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = value ? URL.createObjectURL(value) : ''
  },
  { immediate: true },
)
onUnmounted(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
function select(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  if (!selected) return
  localError.value = imageError(selected, props.maxMB)
  if (!localError.value) file.value = selected
  input.value = ''
}
</script>
<template>
  <div class="store-upload">
    <label class="store-image-picker"
      ><img
        v-if="preview || existing"
        :src="preview || existing || ''"
        :alt="`Vista previa: ${label}`" /><span v-else class="store-upload-placeholder"
        ><StoreIcon name="image" /></span
      ><span>{{ label }}</span
      ><input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        :aria-label="label"
        @change="select" /></label
    ><button v-if="file" type="button" class="store-link store-small" @click="file = null">
      Quitar selección
    </button>
    <p v-if="localError || error" class="store-field-error" role="alert">
      {{ localError || error }}
    </p>
  </div>
</template>
