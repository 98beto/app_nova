import type { ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Pagination, StoreLayout } from '@/components/StoreUI';
import AuthPromoPanel from '@/components/AuthPromoPanel';
import Dashboard from '@/pages/developer/Dashboard';
import Create from '@/pages/developer/Create';
import Profile from '@/pages/profile/Show';
import Show from '@/pages/store/Show';
import Index from '@/pages/store/Index';
import type { Auth, User } from '@/types/auth';
import type {
    ApplicationDetailBundle,
    StoreApplication,
    StoreReview,
} from '@/types/store';

const page = vi.hoisted(() => ({
    props: { auth: { user: null } as Auth },
    url: '/store/7',
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({
        href,
        children,
        className,
    }: {
        href: string | { url: string };
        children: ReactNode;
        className?: string;
    }) => (
        <a
            href={typeof href === 'string' ? href : href.url}
            className={className}
        >
            {children}
        </a>
    ),
    usePage: () => page,
    useForm: vi.fn((data: object) => ({
        data,
        errors: {},
        processing: false,
        progress: null,
        setData: vi.fn(),
        transform: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        reset: vi.fn(),
    })),
}));

const user: User = {
    id: 1,
    name: 'Ana',
    email: 'ana@example.test',
    avatar_url: null,
    gender: 'prefer_not_to_say',
    birth_date: '2000-01-01',
    role: 'user',
    status: 'active',
};
const app: StoreApplication = {
    id: 7,
    slug: 'real-app',
    name: 'Real App',
    description: 'Una aplicación real.',
    icon_url: null,
    minimum_age: 0,
    price: '0.00',
    is_free: true,
    status: 'approved',
    published_at: null,
    category: { id: 1, name: 'Herramientas', slug: 'tools' },
    developer: { id: 2, company_name: 'Real Studio' },
    screenshots: [1, 2, 3, 4].map((position) => ({
        position,
        url: `/capture-${position}.png`,
    })),
    downloads_count: 0,
    trending_downloads_count: 0,
    reviews_count: 0,
    average_rating: null,
    installed: false,
};
const meta = { current_page: 1, last_page: 1, per_page: 10, total: 0 };
const bundle: ApplicationDetailBundle = {
    application: app,
    reviews: { data: [], meta },
    own_review: null,
    similar: [],
    same_developer: [],
};
const ownReview: StoreReview = {
    id: 1,
    application_id: 7,
    author: { id: 1, name: 'Ana', avatar_url: null },
    rating: 4,
    body: 'Mi opinión.',
    likes_count: 0,
    liked: false,
    is_own: true,
    created_at: null,
    updated_at: null,
};

beforeEach(() => {
    vi.clearAllMocks();
    page.props.auth.user = user;
    page.url = '/store/7';
});

describe('store interaction and navigation contracts', () => {
    it('uses qualitative auth copy instead of invented platform statistics', () => {
        const html = renderToStaticMarkup(<AuthPromoPanel />);
        expect(html).toContain(
            'Descubre nuevas ideas, comparte tu experiencia',
        );
        expect(html).not.toMatch(/12 mil|4\.8|2 M\+|<dl>/);
        expect(html).not.toContain('compra');
    });

    it('uses the canonical phone hero, search link, and store heading copy', () => {
        const html = renderToStaticMarkup(
            <Index
                applications={{ data: [app], meta }}
                categories={[]}
                filters={{
                    search: '',
                    category: null,
                    free: null,
                    sort: 'newest',
                }}
                popular={[]}
                trending={[]}
            />,
        );
        const banner = html
            .split('<section class="store-banner">')[1]
            .split('</section>')[0];
        expect(banner).toContain('class="store-art-phone"');
        expect(banner).toContain('class="store-phone-notch"');
        expect(banner).toContain('TU PRÓXIMO DESCUBRIMIENTO');
        expect(banner).not.toContain('Real App');
        expect(html).toContain('UN MUNDO DE POSIBILIDADES');
        expect(html).toContain(
            'Ideas, herramientas y experiencias para tu día a día.',
        );
        expect(html).toContain('<button class="store-link">Buscar ');
    });

    it('keeps four navigation entries for guests on desktop and mobile', () => {
        page.props.auth.user = null;
        const html = renderToStaticMarkup(
            <StoreLayout title="Test">Contenido</StoreLayout>,
        );
        const desktop = html
            .split('<nav class="store-nav"')[1]
            .split('</nav>')[0];
        const mobile = html
            .split('<nav class="store-bottom-nav"')[1]
            .split('</nav>')[0];
        for (const nav of [desktop, mobile]) {
            expect(nav.match(/<a /g)).toHaveLength(4);
            expect(nav).toContain('href="/profile#library"');
            expect(nav).toContain('href="/profile"');
        }
    });

    it('presents four detail fact columns and four gallery images without category pills', () => {
        const html = renderToStaticMarkup(<Show {...bundle} />);
        const facts = html
            .split('<div class="store-app-facts">')[1]
            .split('<div class="store-screenshots"')[0];
        expect(facts.match(/<strong>/g)).toHaveLength(4);
        expect(facts).toContain('Edad mínima');
        expect(facts).toContain('Precio');
        expect(html.match(/alt="Real App — captura [1-4]"/g)).toHaveLength(4);
        expect(html).not.toContain('class="store-tags"');
        expect(html).toContain('class="store-review-compose store-panel"');
    });

    it('renders independent popular and trending collections in server ranking order', () => {
        const popular = [
            { ...app, id: 9, name: 'Popular primero' },
            { ...app, id: 8, name: 'Popular segundo' },
        ];
        const trending = [{ ...app, id: 10, name: 'Tendencia real' }];
        const html = renderToStaticMarkup(
            <Index
                applications={{ data: [app], meta }}
                categories={[]}
                filters={{
                    search: '',
                    category: null,
                    free: null,
                    sort: 'newest',
                }}
                popular={popular}
                trending={trending}
            />,
        );
        const popularSection = html
            .split('<h2>Populares ahora</h2>')[1]
            .split('</section>')[0];
        const trendingSection = html
            .split('<h2>En tendencia</h2>')[1]
            .split('</section>')[0];
        expect(popularSection).toContain('/store?sort=downloads');
        expect(popularSection).toContain('Popular primero');
        expect(popularSection.indexOf('Popular primero')).toBeLessThan(
            popularSection.indexOf('Popular segundo'),
        );
        expect(popularSection).not.toContain('Real App');
        expect(popularSection).not.toContain('Tendencia real');
        expect(trendingSection).toContain('/store?sort=trending');
        expect(trendingSection).toContain('Tendencia real');
        expect(trendingSection).not.toContain('Popular primero');
        expect(trendingSection).not.toContain('Real App');
    });

    it('does not substitute newest apps for empty ranked collections', () => {
        const html = renderToStaticMarkup(
            <Index
                applications={{ data: [app], meta }}
                categories={[]}
                filters={{
                    search: '',
                    category: null,
                    free: null,
                    sort: 'newest',
                }}
                popular={[]}
                trending={[]}
            />,
        );
        const popularSection = html
            .split('<h2>Populares ahora</h2>')[1]
            .split('</section>')[0];
        const trendingSection = html
            .split('<h2>En tendencia</h2>')[1]
            .split('</section>')[0];
        expect(popularSection).toContain(
            'Las próximas favoritas están por llegar.',
        );
        expect(trendingSection).toContain(
            'Todavía no hay aplicaciones en tendencia.',
        );
        expect(popularSection).not.toContain('Real App');
        expect(trendingSection).not.toContain('Real App');
    });

    it('keeps ranked homepage sections out of filtered catalogue results', () => {
        const html = renderToStaticMarkup(
            <Index
                applications={{ data: [app], meta }}
                categories={[]}
                filters={{
                    search: 'real',
                    category: null,
                    free: null,
                    sort: 'newest',
                }}
                popular={[app]}
                trending={[app]}
            />,
        );
        expect(html).not.toContain('<h2>Populares ahora</h2>');
        expect(html).not.toContain('<h2>En tendencia</h2>');
        expect(html).toContain('Real App');
    });

    it('initializes like and unlike payloads with the server’s current review page', () => {
        page.url = '/store/7';
        const otherReview = { ...ownReview, id: 2, is_own: false };
        renderToStaticMarkup(
            <Show
                {...bundle}
                reviews={{
                    data: [otherReview, { ...otherReview, id: 3, liked: true }],
                    meta: { ...meta, current_page: 2, last_page: 3 },
                }}
            />,
        );
        const inputs = vi
            .mocked(useForm as (data: object) => unknown)
            .mock.calls.map(([data]) => data);
        expect(inputs).toContainEqual({ liked: true, reviews_page: 2 });
        expect(inputs).toContainEqual({ liked: false, reviews_page: 2 });
    });

    it('shows no invented rating and requires installation before reviewing', () => {
        const html = renderToStaticMarkup(<Show {...bundle} />);
        expect(html).toContain('Sin valoraciones');
        expect(html).toContain('>0</strong><span>Descargas</span>');
        expect(html).toContain(
            'Instala esta aplicación antes de publicar tu propia reseña.',
        );
        expect(html).not.toContain('id="review-body"');
        expect(html).toContain('Instalar gratis');
    });

    it('shows persisted install state and only the current user’s editable review', () => {
        const html = renderToStaticMarkup(
            <Show
                {...bundle}
                application={{ ...app, installed: true }}
                own_review={ownReview}
            />,
        );
        expect(html).toMatch(
            /<button[^>]*disabled=""[^>]*>.*?Instalada<\/button>/,
        );
        expect(html).toContain('Actualizar reseña');
        expect(html).toContain('Mi opinión.');
        expect(html).toMatch(
            /<option(?=[^>]*value="4")(?=[^>]*selected="")[^>]*>4 estrellas<\/option>/,
        );
        expect(html).not.toContain('Instalar gratis');
    });

    it('keeps paid acquisition disabled and labels it forthcoming', () => {
        const html = renderToStaticMarkup(
            <Show
                {...bundle}
                application={{ ...app, is_free: false, price: '4.99' }}
            />,
        );
        expect(html).toMatch(
            /<button[^>]*disabled=""[^>]*>Compras próximamente<\/button>/,
        );
        expect(html).toContain('<strong>$4.99 USD</strong><span>Precio</span>');
        expect(html).toContain('Compras próximamente');
        expect(html).not.toContain('Instalar gratis');
    });

    it('requires authentication for free installs and hides likes for guests', () => {
        page.props.auth.user = null;
        const otherReview = { ...ownReview, id: 2, is_own: false };
        const html = renderToStaticMarkup(
            <Show {...bundle} reviews={{ data: [otherReview], meta }} />,
        );
        expect(html).toContain('Inicia sesión para instalar');
        expect(html).not.toContain('class="store-like');
        expect(html).not.toContain('id="review-body"');
    });

    it('renders likes only for other users’ reviews', () => {
        const otherReview = {
            ...ownReview,
            id: 2,
            is_own: false,
            author: { id: 2, name: 'Otra persona', avatar_url: null },
        };
        const html = renderToStaticMarkup(
            <Show
                {...bundle}
                reviews={{ data: [ownReview, otherReview], meta }}
            />,
        );
        expect(html.match(/class="store-like /g)).toHaveLength(1);
    });

    it('does not offer login or review actions to an authenticated inactive account', () => {
        page.props.auth.user = { ...user, status: 'suspended' };
        const html = renderToStaticMarkup(<Show {...bundle} />);
        expect(html).toContain('Instalación no disponible');
        expect(html).toContain('Tu cuenta no tiene acceso a publicar reseñas.');
        expect(html).not.toContain('Inicia sesión para instalar');
        expect(html).not.toContain('id="review-body"');
    });

    it('keeps the same store and profile navigation, adding developer-only links', () => {
        const regular = renderToStaticMarkup(
            <StoreLayout title="Test">Contenido</StoreLayout>,
        );
        expect(regular).toContain('href="/profile"');
        expect(regular).not.toContain('Panel de desarrollador');
        page.props.auth.user = { ...user, role: 'developer' };
        const developer = renderToStaticMarkup(
            <StoreLayout title="Test">Contenido</StoreLayout>,
        );
        expect(developer).toContain('href="/store"');
        expect(developer).toContain('href="/profile"');
        expect(developer).toContain('Panel de desarrollador');
        expect(developer).toContain('href="/developer/dashboard"');
        page.url = '/developer/dashboard';
        const panel = renderToStaticMarkup(
            <StoreLayout title="Test" active="developer">
                Contenido
            </StoreLayout>,
        );
        expect(panel).toContain('/developer/applications/create');
        expect(panel).toContain('Dashboard');
        expect(panel).not.toContain('Resumen');
        expect(panel).not.toContain('Aplicaciones');
        for (const nav of [
            panel.split('<nav class="store-nav"')[1],
            panel.split('<nav class="store-bottom-nav"')[1],
        ]) {
            expect(nav.split('</nav>')[0].match(/<a /g)).toHaveLength(3);
        }
        expect(panel).toContain('Ir a la tienda');
    });

    it('preserves independent profile pagination parameters', () => {
        page.url = '/profile?library_page=3&reviews_page=2';
        const html = renderToStaticMarkup(
            <Pagination
                meta={{ ...meta, current_page: 2, last_page: 4 }}
                parameter="reviews_page"
            />,
        );
        expect(html).toContain('/profile?library_page=3&amp;reviews_page=1');
        expect(html).toContain('/profile?library_page=3&amp;reviews_page=3');
    });

    it('shows unavailable library entries without a broken application link', () => {
        const html = renderToStaticMarkup(
            <Profile
                profile={{ ...user, role: 'user' }}
                library={{
                    data: [
                        {
                            id: 1,
                            application_id: 999,
                            downloaded_at: '2026-10-25T12:00:00Z',
                            application: null,
                            available: false,
                        },
                    ],
                    meta,
                }}
                reviews={{ data: [], meta }}
                summary={{ downloads_count: 1, reviews_count: 0 }}
            />,
        );
        expect(html).toContain('Aplicación no disponible');
        expect(html).not.toContain('href="/store/999"');
        expect(html).toContain('Todavía no has compartido una reseña');
    });

    it('keeps the dashboard limited to four stats and the paginated own app list', () => {
        const developer = {
            ...user,
            role: 'developer' as const,
            developer_profile: {
                company_name: 'Real Studio',
                payment_status: 'pending' as const,
                activated_at: null,
            },
        };
        page.props.auth.user = developer;
        page.url = '/developer/dashboard';
        const html = renderToStaticMarkup(
            <Dashboard
                applications={{ data: [app], meta: { ...meta, last_page: 2 } }}
                categories={[{ ...app.category, description: null }]}
                summary={{
                    applications_count: 0,
                    published_count: 0,
                    downloads_count: 0,
                    reviews_count: 0,
                    average_rating: null,
                }}
            />,
        );
        const stats = html
            .split('aria-label="Resumen de tus aplicaciones">')[1]
            .split('</section>')[0];
        expect(stats.match(/<article /g)).toHaveLength(4);
        expect(stats).toContain(
            '<strong>—</strong><p>Ingresos</p><small>Próximamente</small>',
        );
        expect(stats).toContain(
            '<strong>—</strong><p>Valoración media</p><small>Sin valoraciones</small>',
        );
        expect(html).toContain('Real App');
        expect(html).toContain('/developer/dashboard?page=2');
        expect(html).toContain('/developer/applications/create');
        expect(html).not.toContain('<form');
        expect(html).not.toContain('PayPal');
    });

    it('preserves catalogue filters when moving to another page', () => {
        page.url = '/store?search=real&category=tools&free=0&sort=rating';
        const html = renderToStaticMarkup(
            <Pagination meta={{ ...meta, last_page: 2 }} />,
        );
        expect(html).toContain(
            'search=real&amp;category=tools&amp;free=0&amp;sort=rating&amp;page=2',
        );
    });

    it('preserves a library anchor without treating it as a query value', () => {
        page.url = '/profile?reviews_page=2#library';
        const html = renderToStaticMarkup(
            <Pagination
                meta={{ ...meta, last_page: 2 }}
                parameter="library_page"
            />,
        );
        expect(html).toContain(
            '/profile?reviews_page=2&amp;library_page=2#library',
        );
        expect(html).not.toContain('%23library');
    });

    it('renders only the publication form on the dedicated create page with exactly four screenshots', () => {
        page.props.auth.user = { ...user, role: 'developer' };
        page.url = '/developer/applications/create';
        const html = renderToStaticMarkup(
            <Create categories={[{ ...app.category, description: null }]} />,
        );
        expect(html).toContain('Nueva aplicación');
        expect(html.match(/aria-label="Captura [1-4]"/g)).toHaveLength(4);
        expect(html.match(/type="file"/g)).toHaveLength(5);
        expect(html).toContain('Publicar aplicación');
        expect(html).not.toContain('Enviar a revisión');
        expect(html).not.toContain('class="store-stats"');
        expect(html).not.toContain('store-own-app-list');
        expect(html).not.toContain('PayPal');
        expect(html).toContain('No necesitas activar un pago para publicar.');
        expect(html).toMatch(
            /<button class="store-button"><svg[^]*?Publicar aplicación<\/button>/,
        );
    });

    it.each(['user', 'developer'] as const)(
        'shows the disabled PayPal card only on developer profiles (%s)',
        (role) => {
            page.props.auth.user = { ...user, role };
            page.url = '/profile';
            const html = renderToStaticMarkup(
                <Profile
                    profile={{ ...user, role }}
                    library={{ data: [], meta }}
                    reviews={{ data: [], meta }}
                    summary={{ downloads_count: 0, reviews_count: 0 }}
                />,
            );
            if (role === 'developer') {
                expect(html).toContain('PayPal');
                expect(html).toContain('Ya puedes publicar tus aplicaciones.');
                expect(html).toMatch(
                    /<button[^>]*disabled=""[^>]*>Pagos no disponibles<\/button>/,
                );
                expect(html).toContain('Dashboard');
            } else {
                expect(html).not.toContain('PayPal');
            }
        },
    );

    it.each([null, 4.5])(
        'keeps detail rating values compact and their explanation secondary (%s)',
        (average_rating) => {
            const html = renderToStaticMarkup(
                <Show {...bundle} application={{ ...app, average_rating }} />,
            );
            const summary = html
                .split('class="store-panel store-rating-summary">')[1]
                .split('</div>')[0];
            expect(summary).toContain(
                `<strong>${average_rating === null ? '—' : '4.5'}</strong>`,
            );
            expect(summary).not.toContain('<strong>Sin valoraciones</strong>');
            if (average_rating === null) {
                expect(summary).toContain(
                    '<span class="store-muted">Sin valoraciones</span>',
                );
                expect(html).toContain(
                    '—</strong><span>Sin valoraciones</span>',
                );
            }
        },
    );
});
