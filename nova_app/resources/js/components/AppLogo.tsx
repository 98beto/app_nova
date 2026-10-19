export default function AppLogo({ className }: { className?: string }) {
    return (
        <div
            className={className ? `app-logo ${className}` : 'app-logo'}
            aria-label="AppNova"
        >
            <span className="app-logo__mark" aria-hidden="true">
                +
            </span>
            <span>
                App<span>Nova</span>
            </span>
        </div>
    );
}
