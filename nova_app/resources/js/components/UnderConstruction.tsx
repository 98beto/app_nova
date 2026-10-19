import AppLogo from './AppLogo';

type Props = {
    title: string;
    description?: string;
    message?: string;
    onLogout: () => void;
};

export default function UnderConstruction({
    title,
    description,
    message,
    onLogout,
}: Props) {
    return (
        <main className="placeholder-shell">
            <nav>
                <AppLogo />
                <button
                    type="button"
                    className="text-button"
                    onClick={onLogout}
                >
                    Cerrar sesión
                </button>
            </nav>
            {message && (
                <p className="form-alert placeholder-alert" role="alert">
                    {message}
                </p>
            )}
            <section>
                <span aria-hidden="true">+</span>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </section>
        </main>
    );
}
