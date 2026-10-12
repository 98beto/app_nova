<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import AuthLayout from '@/components/AuthLayout.vue';
import BaseInput from '@/components/BaseInput.vue';
import FormAlert from '@/components/FormAlert.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

const form = useForm({ email: '', password: '', remember: false });
const requestError = ref('');

function submit() {
    requestError.value = '';
    form.post('/login', {
        onFinish: () => form.reset('password'),
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
    <Head title="Iniciar sesión" />
    <AuthLayout>
        <h1>Bienvenido de nuevo</h1>
        <p class="form-intro">Ingresa para continuar explorando AppNova.</p>
        <form @submit.prevent="submit">
            <FormAlert
                :message="
                    requestError ||
                    (form.hasErrors
                        ? 'Revisa los campos indicados.'
                        : undefined)
                "
            />
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
            <PasswordInput
                id="password"
                v-model="form.password"
                label="Contraseña"
                autocomplete="current-password"
                required
                :error="form.errors.password"
                :disabled="form.processing"
            />
            <label class="remember"
                ><input
                    v-model="form.remember"
                    type="checkbox"
                    :disabled="form.processing"
                />
                Mantener sesión iniciada</label
            >
            <PrimaryButton :loading="form.processing"
                >Iniciar sesión</PrimaryButton
            >
        </form>
        <p class="form-switch">
            ¿Aún no tienes cuenta?
            <Link href="/register">Regístrate gratis</Link>
        </p>
    </AuthLayout>
</template>
