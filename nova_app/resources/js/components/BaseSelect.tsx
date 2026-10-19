type Props = {
    id: string;
    label: string;
    modelValue: string;
    options: Array<{ value: string; label: string }>;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
};

export default function BaseSelect({
    id,
    label,
    modelValue,
    options,
    error,
    onChange,
    ...props
}: Props) {
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <select
                id={id}
                value={modelValue}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => onChange(event.target.value)}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p id={`${id}-error`} className="field-error">
                    {error}
                </p>
            )}
        </div>
    );
}
