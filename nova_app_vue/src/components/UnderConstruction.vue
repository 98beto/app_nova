<script setup lang="ts">
import AppLogo from './AppLogo.vue'

defineProps<{ title: string; description?: string; message?: string }>()
defineEmits<{ logout: [] }>()
</script>

<template>
  <main class="placeholder-shell">
    <nav>
      <AppLogo /><button type="button" class="text-button" @click="$emit('logout')">Cerrar sesión</button>
    </nav>
    <p v-if="message" class="form-alert placeholder-alert" role="alert">{{ message }}</p>
    <section>
      <span aria-hidden="true">+</span>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </section>
  </main>
</template>
