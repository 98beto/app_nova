<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import AuthLayout from '@/components/AuthLayout.vue';
import AvatarUploader from '@/components/AvatarUploader.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import FormAlert from '@/components/FormAlert.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import RoleSelector from '@/components/RoleSelector.vue';

const form = useForm({
    name: '',
    email: '',
    gender: 'prefer_not_to_say',
    birth_date: '',
    password: '',
    password_confirmation: '',
    role: 'user' as 'user' | 'developer',
    company_name: '',
    avatar: null as File | null,
});
const requestError = ref('');
const genders = [
    { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' },
    { value: 'female', label: 'Femenino' },
    { value: 'male', label: 'Masculino' },
    { value: 'non_binary', label: 'No binario' },
];
function submit() {
    requestError.value = '';
    form.post('/register', {
        forceFormData: true,
        onFinish: () => form.reset('password', 'password_confirmation'),
        onHttpException: () => {
            requestError.value = 'No se pudo completar la solicitud.';
            return false;
        },
        onNetworkError: () => {
            requestError.value = 'No se pudo conectar con AppNova.';
            return false;
        },
    });
}
</script>

<template>
    <Head title="Crear cuenta" />
    <AuthLayout>
        <h1>Crea tu cuenta</h1>
        <p class="form-intro">
            Completa tu perfil y elige cómo usarás AppNova.
        </p>
        <form @submit.prevent="submit">
            <FormAlert
                :message="
                    requestError ||
                    (form.hasErrors
                        ? 'Revisa los campos indicados.'
                        : undefined)
                "
            />
            <AvatarUploader
                :error="form.errors.avatar"
                :disabled="form.processing"
                @update:model-value="form.avatar = $event"
            />
            <BaseInput
                id="name"
                v-model="form.name"
                label="Nombre completo"
                autocomplete="name"
                required
                :error="form.errors.name"
                :disabled="form.processing"
            />
            <div class="field-grid">
                <BaseSelect
                    id="gender"
                    v-model="form.gender"
                    label="Género"
                    :options="genders"
                    required
                    :error="form.errors.gender"
                    :disabled="form.processing"
                />
                <BaseInput
                    id="birth_date"
                    v-model="form.birth_date"
                    label="Fecha de nacimiento"
                    type="date"
                    autocomplete="bday"
                    required
                    :error="form.errors.birth_date"
                    :disabled="form.processing"
                />
            </div>
            <BaseInput
                id="email"
                v-model="form.email"
                label="Correo electrónico"
                type="email"
                autocomplete="email"
                required
                :error="form.errors.email"
                :disabled="form.processing"
            />
            <div class="field-grid">
                <PasswordInput
                    id="password"
                    v-model="form.password"
                    label="Contraseña"
                    autocomplete="new-password"
                    required
                    :error="form.errors.password"
                    :disabled="form.processing"
                />
                <PasswordInput
                    id="password_confirmation"
                    v-model="form.password_confirmation"
                    label="Confirmar contraseña"
                    autocomplete="new-password"
                    required
                    :disabled="form.processing"
                />
            </div>
            <RoleSelector
                v-model="form.role"
                :error="form.errors.role"
                :disabled="form.processing"
            />
            <BaseInput
                v-if="form.role === 'developer'"
                id="company_name"
                v-model="form.company_name"
                label="Empresa"
                autocomplete="organization"
                required
                :error="form.errors.company_name"
                :disabled="form.processing"
            />
            <PrimaryButton :loading="form.processing"
                >Crear cuenta</PrimaryButton
            >
        </form>
        <p class="form-switch">
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
        </p>
    </AuthLayout>
</template>
