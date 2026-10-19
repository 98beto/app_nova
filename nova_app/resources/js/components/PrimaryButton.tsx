import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    children?: ReactNode;
};

export default function PrimaryButton({
    loading,
    children,
    disabled,
    type = 'submit',
    ...props
}: Props) {
    return (
        <button
            className="primary-button"
            type={type}
            disabled={disabled || loading}
            aria-busy={loading}
            {...props}
        >
            {loading ? 'Procesando...' : children}
        </button>
    );
}
