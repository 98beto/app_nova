<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
defineProps<{ error?: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: File | null] }>()
const preview = ref<string | null>(null); const input = ref<HTMLInputElement | null>(null)
function clearPreview() { if (preview.value) URL.revokeObjectURL(preview.value); preview.value = null }
function select(event: Event) { const file = (event.target as HTMLInputElement).files?.[0] ?? null; clearPreview(); if (file) preview.value = URL.createObjectURL(file); emit('update:modelValue', file) }
function remove() { clearPreview(); if (input.value) input.value.value = ''; emit('update:modelValue', null) }
onBeforeUnmount(clearPreview)
</script>
<template><div class="avatar-field"><div class="avatar-preview" :style="preview ? { backgroundImage: `url(${preview})` } : undefined" aria-hidden="true">{{ preview ? '' : 'AN' }}</div><div><label for="avatar">Foto de perfil <span class="optional">(opcional)</span></label><p>JPG, PNG o WebP, máximo 5 MB.</p><div class="avatar-actions"><label class="secondary-button" for="avatar">Elegir foto</label><button v-if="preview" type="button" class="text-button" @click="remove">Eliminar</button></div><input id="avatar" ref="input" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" :disabled="disabled" @change="select" /><p v-if="error" class="field-error" role="alert">{{ error }}</p></div></div></template>
