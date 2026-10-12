<script setup lang="ts">import AppLogo from './AppLogo.vue'; import AuthPromoPanel from './AuthPromoPanel.vue'</script>
<template><main class="auth-shell"><section class="auth-card"><AuthPromoPanel /><div class="auth-form-panel"><AppLogo class="auth-form-logo" /><div class="auth-form-content"><slot /></div></div></section></main></template>
