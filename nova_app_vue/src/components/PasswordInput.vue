<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ id: string; label: string; modelValue: string; error?: string; autocomplete?: string; required?: boolean; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
const visible = ref(false)
</script>
<template><div class="field"><label :for="id">{{ label }}</label><div class="password-field"><input :id="id" :value="modelValue" :type="visible ? 'text' : 'password'" :autocomplete="autocomplete" :required="required" :disabled="disabled" :aria-invalid="Boolean(error)" :aria-describedby="error ? `${id}-error` : undefined" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" /><button type="button" :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'" :aria-pressed="visible" @click="visible = !visible">{{ visible ? 'Ocultar' : 'Mostrar' }}</button></div><p v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</p></div></template>
