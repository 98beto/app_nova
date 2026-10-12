<script setup lang="ts">
defineProps<{ message?: string }>();
</script>

<template>
    <p v-if="message" class="form-alert" role="alert">{{ message }}</p>
</template>
