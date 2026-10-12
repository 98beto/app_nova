<script setup lang="ts">withDefaults(defineProps<{ loading?: boolean; disabled?: boolean; type?: 'button' | 'submit' }>(), { type: 'submit' })</script>
<template><button class="primary-button" :type="type" :disabled="disabled || loading" :aria-busy="loading">{{ loading ? 'Procesando...' : '' }}<slot v-if="!loading" /></button></template>
