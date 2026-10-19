import type { ReactNode } from 'react';
import AppLogo from './AppLogo';
import AuthPromoPanel from './AuthPromoPanel';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main className="auth-shell">
            <section className="auth-card">
                <AuthPromoPanel />
                <div className="auth-form-panel">
                    <AppLogo className="auth-form-logo" />
                    <div className="auth-form-content">{children}</div>
                </div>
            </section>
        </main>
    );
}
