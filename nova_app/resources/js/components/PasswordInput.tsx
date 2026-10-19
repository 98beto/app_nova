import { useState } from 'react';

type Props = {
    id: string;
    label: string;
    modelValue: string;
    error?: string;
    autocomplete?: string;
    required?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
};

export default function PasswordInput({
    id,
    label,
    modelValue,
    autocomplete,
    error,
    onChange,
    ...props
}: Props) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <div className="password-field">
                <input
                    id={id}
                    value={modelValue}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autocomplete}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(event) => onChange(event.target.value)}
                    {...props}
                />
                <button
                    type="button"
                    aria-label={
                        visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                >
                    {visible ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>
            {error && (
                <p id={`${id}-error`} className="field-error">
                    {error}
                </p>
            )}
        </div>
    );
}
