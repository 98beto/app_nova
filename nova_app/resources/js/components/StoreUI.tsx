import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { login, logout, store } from '@/routes';
import { dashboard } from '@/routes/developer';
import { create } from '@/routes/developer/applications';
import { show as profileShow } from '@/routes/profile';
import { show as applicationShow } from '@/routes/store';
import type { Auth } from '@/types/auth';
import type { PageMeta, StoreApplication, StoreReview } from '@/types/store';

export function StoreIcon({
    name = 'grid',
    className = '',
}: {
    name?: string;
    className?: string;
}) {
    const paths: Record<string, string> = {
        home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
        grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
        search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
        download: 'M12 3v12 m-5-5 5 5 5-5 M3 16v5h18v-5',
        user: 'M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
        plus: 'M12 3v18 M3 12h18',
        arrow: 'M4 12h16 m-6-6 6 6-6 6',
        star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
        heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
        logout: 'M9 21H3V3h6 M9 12h12 m-5-5 5 5-5 5',
        check: 'm5 12 4 4L20 5',
        image: 'M3 3h18v18H3z m0 13 5-5 5 5 3-3 5 5 M8 7h.01',
        spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
        chart: 'M3 3v18h18 M7 16v-4 m5 4V8 m5 8V5',
    };
    return (
        <svg
            className={`store-icon ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={paths[name] ?? paths.grid} />
        </svg>
    );
}

export function useStoreFeedback() {
    const [message, setMessage] = useState('');
    return {
        message,
        setMessage,
        options: {
            onStart: () => setMessage(''),
            onHttpException: () => {
                setMessage(
                    'No se pudo completar la solicitud. Inténtalo de nuevo.',
                );
                return false as const;
            },
            onNetworkError: () => {
                setMessage(
                    'No se pudo conectar con AppNova. Comprueba tu conexión e inténtalo de nuevo.',
                );
                return false as const;
            },
        },
    };
}
export function Notice({
    children,
    error = false,
}: {
    children?: ReactNode;
    error?: boolean;
}) {
    return children ? (
        <div
            className={error ? 'store-alert' : 'store-success'}
            role={error ? 'alert' : 'status'}
        >
            {children}
        </div>
    ) : null;
}
export function StoreLayout({
    title,
    subtitle,
    active = 'home',
    children,
}: {
    title: string;
    subtitle?: string;
    active?: string;
    children: ReactNode;
}) {
    const {
        props: { auth },
        url,
    } = usePage<{ auth: Auth }>();
    const user = auth.user;
    const developerArea =
        url.startsWith('/developer') ||
        (user?.role === 'developer' && url.startsWith('/profile'));
    const feedback = useStoreFeedback();
    const links = developerArea
        ? [
              {
                  key: 'developer',
                  label: 'Dashboard',
                  icon: 'chart',
                  href: dashboard.url(),
                  selected: active === 'developer' || active === 'applications',
              },
              {
                  key: 'publish',
                  label: 'Publicar app',
                  icon: 'plus',
                  href: create.url(),
                  selected: active === 'publish',
              },
              {
                  key: 'profile',
                  label: 'Mi cuenta',
                  icon: 'user',
                  href: profileShow.url(),
                  selected: active === 'profile' || active === 'library',
              },
          ]
        : [
              {
                  key: 'home',
                  label: 'Inicio',
                  icon: 'home',
                  href: store.url(),
                  selected: active === 'home',
              },
              {
                  key: 'explore',
                  label: 'Explorar',
                  icon: 'grid',
                  href: store.url({ query: { sort: 'trending' } }),
                  selected: active === 'explore',
              },
              {
                  key: 'library',
                  label: 'Biblioteca',
                  icon: 'download',
                  href: `${profileShow.url()}#library`,
                  selected: active === 'library',
              },
              {
                  key: 'profile',
                  label: 'Mi cuenta',
                  icon: 'user',
                  href: profileShow.url(),
                  selected: active === 'profile',
              },
          ];
    const switchRoute = developerArea ? store() : dashboard();
    return (
        <div className="store-shell">
            <Head title={title} />
            <a className="store-skip" href="#store-content">
                Saltar al contenido
            </a>
            <aside className="store-sidebar">
                <Link
                    href={store()}
                    className="store-logo"
                    aria-label="AppNova, inicio"
                >
                    <span className="store-logo-mark">
                        <StoreIcon name="spark" />
                    </span>
                    <span>
                        App<span>Nova</span>
                    </span>
                </Link>
                <p className="store-nav-caption">
                    {developerArea
                        ? 'ESPACIO DE DESARROLLADOR'
                        : 'DESCUBRE TU PRÓXIMA APP'}
                </p>
                <nav className="store-nav" aria-label="Navegación principal">
                    {links.map((link) => (
                        <Link
                            key={link.key}
                            href={link.href}
                            className={link.selected ? 'store-nav-active' : ''}
                            aria-current={link.selected ? 'page' : undefined}
                        >
                            <StoreIcon name={link.icon} />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
                {user?.role === 'developer' && (
                    <Link href={switchRoute} className="store-switch">
                        <StoreIcon name={developerArea ? 'grid' : 'chart'} />
                        {developerArea
                            ? 'Ir a la tienda'
                            : 'Panel de desarrollador'}
                        <StoreIcon name="arrow" />
                    </Link>
                )}
                <div className="store-sidebar-bottom">
                    {user ? (
                        <>
                            <Link
                                href={profileShow()}
                                className="store-identity"
                            >
                                <Avatar
                                    name={user.name}
                                    url={user.avatar_url}
                                />
                                <span>
                                    <strong>{user.name}</strong>
                                    <small>
                                        {user.role === 'developer'
                                            ? 'Desarrollador'
                                            : user.role === 'admin'
                                              ? 'Administrador'
                                              : 'Usuario'}
                                    </small>
                                </span>
                            </Link>
                            <Link
                                href={logout()}
                                as="button"
                                className="store-logout"
                                {...feedback.options}
                            >
                                <StoreIcon name="logout" />
                                Cerrar sesión
                            </Link>
                        </>
                    ) : (
                        <Link className="store-button" href={login()}>
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            </aside>
            <main id="store-content" className="store-main">
                <header className="store-header">
                    <div>
                        <p className="store-eyebrow">
                            {developerArea
                                ? 'CREA. COMPARTE. INSPIRA.'
                                : 'UN MUNDO DE POSIBILIDADES'}
                        </p>
                        <h1>{title}</h1>
                        {subtitle && <p className="store-muted">{subtitle}</p>}
                    </div>
                    <div className="store-header-actions">
                        {user?.role === 'developer' && (
                            <Link
                                href={switchRoute}
                                className="store-header-developer store-button store-button-secondary"
                            >
                                {developerArea ? 'Ver tienda' : 'Mi panel'}
                            </Link>
                        )}
                        {user ? (
                            <Link
                                href={profileShow()}
                                aria-label={`Perfil de ${user.name}`}
                            >
                                <Avatar
                                    name={user.name}
                                    url={user.avatar_url}
                                />
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="store-button store-button-secondary"
                            >
                                Entrar
                            </Link>
                        )}
                    </div>
                </header>
                <Notice error>{feedback.message}</Notice>
                {children}
                <footer className="store-footer">
                    <span>AppNova · Encuentra lo que te mueve.</span>
                    <span>Hecho para descubrir.</span>
                </footer>
            </main>
            <nav className="store-bottom-nav" aria-label="Navegación móvil">
                {links.map((link) => (
                    <Link
                        key={link.key}
                        href={link.href}
                        className={link.selected ? 'store-nav-active' : ''}
                        aria-current={link.selected ? 'page' : undefined}
                    >
                        <StoreIcon name={link.icon} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
export function Avatar({
    name,
    url,
    large = false,
}: {
    name: string;
    url: string | null;
    large?: boolean;
}) {
    return (
        <span className={`store-avatar${large ? ' store-avatar-large' : ''}`}>
            {url ? <img src={url} alt="" /> : name.slice(0, 1)}
        </span>
    );
}
export function AppIcon({ application }: { application: StoreApplication }) {
    const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
    return (
        <span className={`store-app-icon store-color-${application.id % 4}`}>
            {application.icon_url && application.icon_url !== brokenUrl ? (
                <img
                    src={application.icon_url}
                    alt={`${application.name} — icono`}
                    loading="lazy"
                    onError={() => setBrokenUrl(application.icon_url)}
                />
            ) : (
                <StoreIcon />
            )}
        </span>
    );
}
export const number = (value: number) => value.toLocaleString('es');
export const rating = (value: number | null) =>
    value === null ? '—' : value.toFixed(1);
export const price = (app: StoreApplication) =>
    app.is_free ? 'Gratis' : `$${app.price} USD`;
export const date = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(
              new Date(value),
          )
        : '—';
export const statusLabels: Record<StoreApplication['status'], string> = {
    approved: 'Publicada',
    draft: 'Borrador',
    pending_review: 'En revisión',
    rejected: 'Rechazada',
    unpublished: 'No publicada',
};
export function AppCard({ application }: { application: StoreApplication }) {
    return (
        <Link href={applicationShow(application.id)} className="store-app-card">
            <AppIcon application={application} />
            <div className="store-app-card-info">
                <h3>{application.name}</h3>
                <p>{application.category.name}</p>
                <div className="store-app-card-meta">
                    <span
                        className="store-rating"
                        aria-label={
                            application.average_rating === null
                                ? 'Sin valoraciones'
                                : undefined
                        }
                    >
                        <StoreIcon name="star" />
                        {rating(application.average_rating)}
                    </span>
                    <span
                        className={
                            application.is_free ? 'store-free' : 'store-price'
                        }
                    >
                        {application.installed
                            ? 'Instalada'
                            : price(application)}
                    </span>
                </div>
            </div>
            <StoreIcon name="arrow" className="store-card-arrow" />
        </Link>
    );
}
export function AppGrid({
    applications,
    empty = 'Aún no hay aplicaciones en esta sección.',
}: {
    applications: StoreApplication[];
    empty?: string;
}) {
    return applications.length ? (
        <div className="store-app-grid">
            {applications.map((app) => (
                <AppCard key={app.id} application={app} />
            ))}
        </div>
    ) : (
        <Empty>{empty}</Empty>
    );
}
export function Empty({ children }: { children: ReactNode }) {
    return (
        <div className="store-empty">
            <StoreIcon name="grid" />
            <p>{children}</p>
        </div>
    );
}
export function Section({
    title,
    children,
    action,
    id,
    className = '',
}: {
    title: string;
    children: ReactNode;
    action?: ReactNode;
    id?: string;
    className?: string;
}) {
    return (
        <section className={`store-section ${className}`} id={id}>
            <div className="store-section-heading">
                <h2>{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}
export function Pagination({
    meta,
    parameter = 'page',
}: {
    meta: PageMeta;
    parameter?: string;
}) {
    const { url } = usePage();
    if (meta.last_page <= 1) return null;
    function href(page: number) {
        const [route, fragment] = url.split('#');
        const [path, query = ''] = route.split('?');
        const params = new URLSearchParams(query);
        params.set(parameter, String(page));
        return `${path}?${params.toString()}${fragment ? `#${fragment}` : ''}`;
    }
    return (
        <nav
            className="store-pagination"
            aria-label={`Paginación ${parameter}`}
        >
            {meta.current_page > 1 ? (
                <Link
                    href={href(meta.current_page - 1)}
                    preserveScroll
                    className="store-button store-button-secondary"
                >
                    Anterior
                </Link>
            ) : (
                <button
                    className="store-button store-button-secondary"
                    disabled
                >
                    Anterior
                </button>
            )}
            <span>
                {meta.current_page} / {meta.last_page}
            </span>
            {meta.current_page < meta.last_page ? (
                <Link
                    href={href(meta.current_page + 1)}
                    preserveScroll
                    className="store-button store-button-secondary"
                >
                    Siguiente
                </Link>
            ) : (
                <button
                    className="store-button store-button-secondary"
                    disabled
                >
                    Siguiente
                </button>
            )}
        </nav>
    );
}
export function Stars({ value }: { value: number }) {
    return (
        <span className="store-stars" aria-label={`${value} de 5 estrellas`}>
            {'★'.repeat(Math.round(value))}
            <span aria-hidden="true">{'☆'.repeat(5 - Math.round(value))}</span>
        </span>
    );
}
export function ReviewCard({
    review,
    children,
}: {
    review: StoreReview;
    children?: ReactNode;
}) {
    return (
        <article className="store-review store-panel">
            <header>
                <Avatar
                    name={review.author.name}
                    url={review.author.avatar_url}
                />
                <div>
                    <strong>
                        {review.author.name}
                        {review.is_own && (
                            <span className="store-own-label"> · Tú</span>
                        )}
                    </strong>
                    <Stars value={review.rating} />
                </div>
                <time dateTime={review.created_at ?? undefined}>
                    {date(review.created_at)}
                </time>
            </header>
            {review.body && <p className="store-review-body">{review.body}</p>}
            {children ?? (
                <span className="store-muted store-small">
                    {number(review.likes_count)} Me gusta
                </span>
            )}
        </article>
    );
}
export function ApplicationFacts({
    application,
    own = false,
}: {
    application: StoreApplication;
    own?: boolean;
}) {
    return (
        <div className="store-app-facts">
            <div>
                <strong>
                    <StoreIcon name="star" />
                    {rating(application.average_rating)}
                </strong>
                <span>
                    {application.average_rating === null
                        ? 'Sin valoraciones'
                        : `${number(application.reviews_count)} reseñas`}
                </span>
            </div>
            <div>
                <strong>
                    <StoreIcon name="download" />
                    {number(application.downloads_count)}
                </strong>
                <span>Descargas</span>
            </div>
            <div>
                <strong>{application.minimum_age}+</strong>
                <span>Edad mínima</span>
            </div>
            <div>
                <strong>{price(application)}</strong>
                <span>{own ? statusLabels[application.status] : 'Precio'}</span>
            </div>
        </div>
    );
}
export function ApplicationVisuals({
    application,
}: {
    application: StoreApplication;
}) {
    return (
        <>
            {application.screenshots.length > 0 && (
                <div
                    className="store-screenshots"
                    aria-label="Capturas de la aplicación"
                >
                    {[...application.screenshots]
                        .sort((a, b) => a.position - b.position)
                        .map((image) => (
                            <a
                                key={image.position}
                                href={image.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Ampliar captura ${image.position} de ${application.name}`}
                            >
                                <img
                                    src={image.url}
                                    alt={`${application.name} — captura ${image.position}`}
                                    loading="lazy"
                                />
                            </a>
                        ))}
                </div>
            )}
            <section className="store-about">
                <h2>Acerca de esta app</h2>
                <p>{application.description}</p>
            </section>
        </>
    );
}
export function ApplicationPresentation({
    application,
    own = false,
    children,
}: {
    application: StoreApplication;
    own?: boolean;
    children?: ReactNode;
}) {
    return (
        <section className="store-presentation">
            <div className="store-app-hero">
                <AppIcon application={application} />
                <div className="store-app-heading">
                    <p className="store-eyebrow">{application.category.name}</p>
                    <h2>{application.name}</h2>
                    <p className="store-developer-name">
                        {application.developer.company_name}
                    </p>
                </div>
                <div className="store-install-action">{children}</div>
            </div>
            <ApplicationFacts application={application} own={own} />
            <ApplicationVisuals application={application} />
        </section>
    );
}
export function FormErrors({ errors }: { errors: object }) {
    const messages = [...new Set(Object.values(errors) as string[])];
    return messages.length ? (
        <div className="store-alert" role="alert">
            <strong>Revisa los datos del formulario.</strong>
            <ul>
                {messages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        </div>
    ) : null;
}
export function ImagePicker({
    label,
    value,
    existing,
    onChange,
    required = false,
}: {
    label: string;
    value: File | null;
    existing?: string | null;
    onChange: (file: File | null) => void;
    required?: boolean;
}) {
    const [preview, setPreview] = useState('');
    useEffect(() => {
        if (!value) {
            setPreview('');
            return;
        }
        const url = URL.createObjectURL(value);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [value]);
    return (
        <div className="store-upload">
            <label className="store-image-picker">
                {preview || existing ? (
                    <img src={preview || existing || ''} alt="Vista previa" />
                ) : (
                    <span className="store-upload-placeholder">
                        <StoreIcon name="image" />
                    </span>
                )}
                <span>{label}</span>
                <input
                    aria-label={label}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required={required}
                    onChange={(event) =>
                        onChange(event.target.files?.[0] ?? null)
                    }
                />
            </label>
            {value && <small className="store-muted">{value.name}</small>}
        </div>
    );
}
