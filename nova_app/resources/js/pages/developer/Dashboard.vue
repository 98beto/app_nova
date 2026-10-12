<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import UnderConstruction from '@/components/UnderConstruction.vue';
</script>
<template>
    <Head title="Panel de desarrollador" /><UnderConstruction
        title="Panel de desarrollador en construccion"
        description="La activación con PayPal estará disponible próximamente."
        @logout="router.delete('/logout')"
    />
</template>
