import { useEffect, useRef, useState } from 'react';

export default function AvatarUploader({
    error,
    disabled,
    onChange,
}: {
    error?: string;
    disabled?: boolean;
    onChange: (file: File | null) => void;
}) {
    const [preview, setPreview] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );
    function select(event: React.ChangeEvent<HTMLInputElement>) {
        if (preview) URL.revokeObjectURL(preview);
        const file = event.target.files?.[0] ?? null;
        setPreview(file ? URL.createObjectURL(file) : null);
        onChange(file);
    }
    function remove() {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (input.current) input.current.value = '';
        onChange(null);
    }
    return (
        <div className="avatar-field">
            <div
                className="avatar-preview"
                style={
                    preview ? { backgroundImage: `url(${preview})` } : undefined
                }
                aria-hidden="true"
            >
                {preview ? '' : 'AN'}
            </div>
            <div>
                <label htmlFor="avatar">
                    Foto de perfil <span className="optional">(opcional)</span>
                </label>
                <p>JPG, PNG o WebP, máximo 5 MB.</p>
                <div className="avatar-actions">
                    <label className="secondary-button" htmlFor="avatar">
                        Elegir foto
                    </label>
                    {preview && (
                        <button
                            type="button"
                            className="text-button"
                            onClick={remove}
                        >
                            Eliminar
                        </button>
                    )}
                </div>
                <input
                    id="avatar"
                    ref={input}
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={disabled}
                    onChange={select}
                />
                {error && (
                    <p className="field-error" role="alert">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}
