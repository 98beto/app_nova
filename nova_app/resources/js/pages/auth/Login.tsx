import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import BaseInput from '@/components/BaseInput';
import FormAlert from '@/components/FormAlert';
import PasswordInput from '@/components/PasswordInput';
import PrimaryButton from '@/components/PrimaryButton';

export default function Login() {
    const form = useForm({ email: '', password: '', remember: false });
    const [requestError, setRequestError] = useState('');
    function submit(event: React.FormEvent) {
        event.preventDefault();
        setRequestError('');
        form.post('/login', {
            onFinish: () => form.reset('password'),
            onHttpException: () => {
                setRequestError('No se pudo completar la solicitud.');
                return false;
            },
            onNetworkError: () => {
                setRequestError('No se pudo conectar con AppNova.');
                return false;
            },
        });
    }
    return (
        <>
            <Head title="Iniciar sesión" />
            <AuthLayout>
                <h1>Bienvenido de nuevo</h1>
                <p className="form-intro">
                    Ingresa para continuar explorando AppNova.
                </p>
                <form onSubmit={submit}>
                    <FormAlert
                        message={
                            requestError ||
                            (form.hasErrors
                                ? 'Revisa los campos indicados.'
                                : undefined)
                        }
                    />
                    <BaseInput
                        id="email"
                        modelValue={form.data.email}
                        onChange={(value) => form.setData('email', value)}
                        label="Correo electrónico"
                        type="email"
                        autocomplete="email"
                        required
                        error={form.errors.email}
                        disabled={form.processing}
                    />
                    <PasswordInput
                        id="password"
                        modelValue={form.data.password}
                        onChange={(value) => form.setData('password', value)}
                        label="Contraseña"
                        autocomplete="current-password"
                        required
                        error={form.errors.password}
                        disabled={form.processing}
                    />
                    <label className="remember">
                        <input
                            checked={form.data.remember}
                            onChange={(event) =>
                                form.setData('remember', event.target.checked)
                            }
                            type="checkbox"
                            disabled={form.processing}
                        />{' '}
                        Mantener sesión iniciada
                    </label>
                    <PrimaryButton loading={form.processing}>
                        Iniciar sesión
                    </PrimaryButton>
                </form>
                <p className="form-switch">
                    ¿Aún no tienes cuenta?{' '}
                    <Link href="/register">Regístrate gratis</Link>
                </p>
            </AuthLayout>
        </>
    );
}
