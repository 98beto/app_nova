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
                    Descubre, compra y publica experiencias digitales confiables
                    en una sola plataforma.
                </p>
                <dl>
                    <div>
                        <dt>12 mil</dt>
                        <dd>aplicaciones</dd>
                    </div>
                    <div>
                        <dt>4.8</dt>
                        <dd>valoración</dd>
                    </div>
                    <div>
                        <dt>2 M+</dt>
                        <dd>descargas</dd>
                    </div>
                </dl>
            </div>
        </aside>
    );
}
