<script setup lang="ts">
import { useRouter } from 'vue-router'
import UnderConstruction from '@/components/UnderConstruction.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  try {
    await auth.logout()
    await router.push('/login')
  } catch {
    // Keep the protected view visible while the store exposes the server error.
  }
}
</script>

<template><UnderConstruction title="Dashboard administrativo en construccion" :message="auth.message" @logout="logout" /></template>
