type Props = {
    modelValue: 'user' | 'developer';
    error?: string;
    disabled?: boolean;
    onChange: (value: 'user' | 'developer') => void;
};

export default function RoleSelector({
    modelValue,
    error,
    disabled,
    onChange,
}: Props) {
    return (
        <fieldset
            className="role-selector"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'role-error' : undefined}
        >
            <legend>¿Cómo usarás AppNova?</legend>
            <label className={modelValue === 'user' ? 'selected' : ''}>
                <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={modelValue === 'user'}
                    disabled={disabled}
                    onChange={() => onChange('user')}
                />
                <span>
                    <strong>Usuario</strong>
                    <small>Descubre, compra y reseña apps</small>
                </span>
            </label>
            <label className={modelValue === 'developer' ? 'selected' : ''}>
                <input
                    type="radio"
                    name="role"
                    value="developer"
                    checked={modelValue === 'developer'}
                    disabled={disabled}
                    onChange={() => onChange('developer')}
                />
                <span>
                    <strong>Desarrollador</strong>
                    <small>Publica aplicaciones próximamente</small>
                </span>
            </label>
            {error && (
                <p id="role-error" className="field-error">
                    {error}
                </p>
            )}
        </fieldset>
    );
}
