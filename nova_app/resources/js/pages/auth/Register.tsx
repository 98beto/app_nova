import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import AvatarUploader from '@/components/AvatarUploader';
import BaseInput from '@/components/BaseInput';
import BaseSelect from '@/components/BaseSelect';
import FormAlert from '@/components/FormAlert';
import PasswordInput from '@/components/PasswordInput';
import PrimaryButton from '@/components/PrimaryButton';
import RoleSelector from '@/components/RoleSelector';

type Role = 'user' | 'developer';
type FormData = {
    name: string;
    email: string;
    gender: string;
    birth_date: string;
    password: string;
    password_confirmation: string;
    role: Role;
    company_name: string;
    avatar: File | null;
};
const genders = [
    { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' },
    { value: 'female', label: 'Femenino' },
    { value: 'male', label: 'Masculino' },
    { value: 'non_binary', label: 'No binario' },
];

export default function Register() {
    const form = useForm<FormData>({
        name: '',
        email: '',
        gender: 'prefer_not_to_say',
        birth_date: '',
        password: '',
        password_confirmation: '',
        role: 'user',
        company_name: '',
        avatar: null,
    });
    const [requestError, setRequestError] = useState('');
    function submit(event: React.FormEvent) {
        event.preventDefault();
        setRequestError('');
        form.post('/register', {
            forceFormData: true,
            onFinish: () => form.reset('password', 'password_confirmation'),
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
    const set =
        <K extends keyof FormData>(key: K) =>
        (value: FormData[K]) =>
            form.setData(key, value as never);
    return (
        <>
            <Head title="Crear cuenta" />
            <AuthLayout>
                <h1>Crea tu cuenta</h1>
                <p className="form-intro">
                    Completa tu perfil y elige cómo usarás AppNova.
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
                    <AvatarUploader
                        error={form.errors.avatar}
                        disabled={form.processing}
                        onChange={set('avatar')}
                    />
                    <BaseInput
                        id="name"
                        modelValue={form.data.name}
                        onChange={set('name')}
                        label="Nombre completo"
                        autocomplete="name"
                        required
                        error={form.errors.name}
                        disabled={form.processing}
                    />
                    <div className="field-grid">
                        <BaseSelect
                            id="gender"
                            modelValue={form.data.gender}
                            onChange={set('gender')}
                            label="Género"
                            options={genders}
                            required
                            error={form.errors.gender}
                            disabled={form.processing}
                        />
                        <BaseInput
                            id="birth_date"
                            modelValue={form.data.birth_date}
                            onChange={set('birth_date')}
                            label="Fecha de nacimiento"
                            type="date"
                            autocomplete="bday"
                            required
                            error={form.errors.birth_date}
                            disabled={form.processing}
                        />
                    </div>
                    <BaseInput
                        id="email"
                        modelValue={form.data.email}
                        onChange={set('email')}
                        label="Correo electrónico"
                        type="email"
                        autocomplete="email"
                        required
                        error={form.errors.email}
                        disabled={form.processing}
                    />
                    <div className="field-grid">
                        <PasswordInput
                            id="password"
                            modelValue={form.data.password}
                            onChange={set('password')}
                            label="Contraseña"
                            autocomplete="new-password"
                            required
                            error={form.errors.password}
                            disabled={form.processing}
                        />
                        <PasswordInput
                            id="password_confirmation"
                            modelValue={form.data.password_confirmation}
                            onChange={set('password_confirmation')}
                            label="Confirmar contraseña"
                            autocomplete="new-password"
                            required
                            error={form.errors.password_confirmation}
                            disabled={form.processing}
                        />
                    </div>
                    <RoleSelector
                        modelValue={form.data.role}
                        onChange={set('role')}
                        error={form.errors.role}
                        disabled={form.processing}
                    />
                    {form.data.role === 'developer' && (
                        <BaseInput
                            id="company_name"
                            modelValue={form.data.company_name}
                            onChange={set('company_name')}
                            label="Empresa"
                            autocomplete="organization"
                            required
                            error={form.errors.company_name}
                            disabled={form.processing}
                        />
                    )}
                    <PrimaryButton loading={form.processing}>
                        Crear cuenta
                    </PrimaryButton>
                </form>
                <p className="form-switch">
                    ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
                </p>
            </AuthLayout>
        </>
    );
}
