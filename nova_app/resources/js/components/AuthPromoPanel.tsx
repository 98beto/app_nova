import AppLogo from './AppLogo';

export default function AuthPromoPanel() {
    return (
        <aside className="auth-promo" aria-label="Acerca de AppNova">
            <AppLogo />
            <div className="auth-promo__art" aria-hidden="true">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                    <span key={index} />
                ))}
            </div>
            <div className="auth-promo__copy">
                <h2>Tu próxima app favorita está aquí.</h2>
                <p>
                    Descubre nuevas ideas, comparte tu experiencia y publica tus
                    propias aplicaciones en una sola plataforma.
                </p>
            </div>
        </aside>
    );
}
