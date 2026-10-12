<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import UnderConstruction from '@/components/UnderConstruction.vue';
</script>
<template>
    <Head title="Administración" /><UnderConstruction
        title="Dashboard administrativo en construccion"
        @logout="router.delete('/logout')"
    />
</template>
