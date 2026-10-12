<script setup lang="ts">
import AppLogo from './AppLogo.vue';

defineProps<{ title: string; description?: string }>();
defineEmits<{ logout: [] }>();
</script>

<template>
    <main class="placeholder-shell">
        <nav>
            <AppLogo /><button
                type="button"
                class="text-button"
                @click="$emit('logout')"
            >
                Cerrar sesión
            </button>
        </nav>
        <section>
            <span aria-hidden="true">+</span>
            <h1>{{ title }}</h1>
            <p v-if="description">{{ description }}</p>
        </section>
    </main>
</template>
