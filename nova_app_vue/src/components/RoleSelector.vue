<script setup lang="ts">
defineProps<{ modelValue: 'user' | 'developer'; error?: string; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [value: 'user' | 'developer'] }>()
</script>
<template><fieldset class="role-selector"><legend>¿Cómo usarás AppNova?</legend><label :class="{ selected: modelValue === 'user' }"><input type="radio" name="role" value="user" :checked="modelValue === 'user'" :disabled="disabled" @change="$emit('update:modelValue', 'user')" /><span><strong>Usuario</strong><small>Descubre, compra y reseña apps</small></span></label><label :class="{ selected: modelValue === 'developer' }"><input type="radio" name="role" value="developer" :checked="modelValue === 'developer'" :disabled="disabled" @change="$emit('update:modelValue', 'developer')" /><span><strong>Desarrollador</strong><small>Publica aplicaciones próximamente</small></span></label><p v-if="error" class="field-error">{{ error }}</p></fieldset></template>
