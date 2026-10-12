<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import UnderConstruction from '@/components/UnderConstruction.vue';

const message = ref('');

function logout() {
    message.value = '';
    router.delete('/logout', {
        onHttpException: () => {
            message.value = 'No se pudo cerrar la sesión.';
            return false;
        },
        onNetworkError: () => {
            message.value = 'No se pudo conectar con AppNova.';
            return false;
        },
    });
}
</script>
<template>
    <Head title="AppNova" /><UnderConstruction
        title="Tienda en construccion"
        :message="message"
        @logout="logout"
    />
</template>
