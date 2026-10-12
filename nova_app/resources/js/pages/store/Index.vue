<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import UnderConstruction from '@/components/UnderConstruction.vue';
</script>
<template>
    <Head title="AppNova" /><UnderConstruction
        title="Tienda en construccion"
        @logout="router.delete('/logout')"
    />
</template>
