<script setup lang="ts">
import AppLogo from './AppLogo.vue'
</script>
<template>
  <aside class="auth-promo" aria-label="Acerca de AppNova">
    <AppLogo />
    <div class="auth-promo__art" aria-hidden="true"><span v-for="index in 6" :key="index" /></div>
    <div class="auth-promo__copy">
      <h2>Tu próxima app favorita está aquí.</h2>
      <p>
        Descubre nuevas ideas, comparte tu experiencia y publica tus propias aplicaciones en una
        sola plataforma.
      </p>
    </div>
  </aside>
</template>
