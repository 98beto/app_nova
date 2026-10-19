type Props = {
    id: string;
    label: string;
    modelValue: string;
    type?: string;
    autocomplete?: string;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
};

export default function BaseInput({
    id,
    label,
    modelValue,
    type = 'text',
    autocomplete,
    error,
    onChange,
    ...props
}: Props) {
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                value={modelValue}
                type={type}
                autoComplete={autocomplete}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => onChange(event.target.value)}
                {...props}
            />
            {error && (
                <p id={`${id}-error`} className="field-error">
                    {error}
                </p>
            )}
        </div>
    );
}
