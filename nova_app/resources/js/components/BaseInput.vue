<script setup lang="ts">
withDefaults(
    defineProps<{
        id: string;
        label: string;
        modelValue: string;
        type?: string;
        autocomplete?: string;
        error?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
    }>(),
    {
        type: 'text',
        autocomplete: undefined,
        error: undefined,
        placeholder: undefined,
    },
);

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
    <div class="field">
        <label :for="id">{{ label }}</label>
        <input
            :id="id"
            :value="modelValue"
            :type="type"
            :autocomplete="autocomplete"
            :placeholder="placeholder"
            :required="required"
            :disabled="disabled"
            :aria-invalid="Boolean(error)"
            :aria-describedby="error ? `${id}-error` : undefined"
            @input="
                $emit(
                    'update:modelValue',
                    ($event.target as HTMLInputElement).value,
                )
            "
        />
        <p v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</p>
    </div>
</template>
