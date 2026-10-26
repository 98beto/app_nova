import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AppGrid,
    FormErrors,
    Notice,
    Pagination,
    Section,
    StoreIcon,
    StoreLayout,
    useStoreFeedback,
} from '@/components/StoreUI';
import { store } from '@/routes';
import type { CatalogueBundle } from '@/types/store';

export default function Index({
    applications,
    categories,
    filters,
    popular = [],
    trending = [],
}: CatalogueBundle) {
    const [search, setSearch] = useState(filters.search);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const feedback = useStoreFeedback();
    function filter(changes: Record<string, string | number | undefined>) {
        router.get(
            store.url(),
            {
                search: search || undefined,
                category: filters.category ?? undefined,
                free: filters.free === null ? undefined : Number(filters.free),
                sort: filters.sort,
                ...changes,
            },
            {
                ...feedback.options,
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    setLoading(true);
                    setErrors({});
                    feedback.setMessage('');
                },
                onError: setErrors,
                onFinish: () => setLoading(false),
            },
        );
    }
    const isHome =
        !filters.search &&
        !filters.category &&
        filters.free === null &&
        filters.sort === 'newest' &&
        applications.meta.current_page === 1;
    return (
        <StoreLayout
            title={isHome ? 'Descubre algo nuevo' : 'Encuentra tu próxima app'}
            subtitle={
                isHome
                    ? 'Ideas, herramientas y experiencias para tu día a día.'
                    : 'Justo lo que buscas, a un paso de distancia.'
            }
            active={isHome ? 'home' : 'explore'}
        >
            <form
                className="store-search"
                role="search"
                onSubmit={(event) => {
                    event.preventDefault();
                    filter({});
                }}
            >
                <StoreIcon name="search" />
                <label className="sr-only" htmlFor="catalogue-search">
                    Buscar aplicaciones
                </label>
                <input
                    id="catalogue-search"
                    name="search"
                    type="search"
                    maxLength={255}
                    placeholder="Buscar aplicaciones, juegos y más"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <button className="store-link" disabled={loading}>
                    Buscar <StoreIcon name="arrow" />
                </button>
            </form>
            <Notice error>{feedback.message}</Notice>
            <FormErrors errors={errors} />
            {isHome && (
                <>
                    <section className="store-banner">
                        <div className="store-banner-copy">
                            <span className="store-banner-tag">
                                TU PRÓXIMO DESCUBRIMIENTO
                            </span>
                            <h2>
                                Pequeñas apps.
                                <br />
                                Grandes posibilidades.
                            </h2>
                            <p>
                                Un espacio para aprender, crear
                                <br className="store-desktop-only" /> y hacer
                                más de lo que te gusta.
                            </p>
                            <Link href={store({ query: { sort: 'trending' } })}>
                                Explora las tendencias{' '}
                                <StoreIcon name="arrow" />
                            </Link>
                        </div>
                        <div className="store-banner-art" aria-hidden="true">
                            <span className="store-orbit store-orbit-one" />
                            <span className="store-orbit store-orbit-two" />
                            <div className="store-art-tile store-art-tile-one">
                                <StoreIcon name="spark" />
                            </div>
                            <div className="store-art-phone">
                                <div className="store-phone-notch" />
                                <StoreIcon name="spark" />
                                <span>
                                    Tu próxima
                                    <br />
                                    <strong>gran idea.</strong>
                                </span>
                                <div className="store-art-lines">
                                    <i />
                                    <i />
                                    <i />
                                </div>
                                <div className="store-art-dots">
                                    <i />
                                    <i />
                                    <i />
                                </div>
                            </div>
                            <div className="store-art-tile store-art-tile-two">
                                <StoreIcon name="heart" />
                            </div>
                        </div>
                    </section>
                    <Section
                        title="Populares ahora"
                        className="store-home-highlights"
                        action={
                            <Link
                                href={store({ query: { sort: 'downloads' } })}
                                className="store-link"
                            >
                                Ver todas →
                            </Link>
                        }
                    >
                        <AppGrid
                            applications={popular}
                            empty="Las próximas favoritas están por llegar."
                        />
                    </Section>
                    <Section
                        title="En tendencia"
                        className="store-home-highlights"
                        action={
                            <Link
                                href={store({ query: { sort: 'trending' } })}
                                className="store-link"
                            >
                                Ver todas →
                            </Link>
                        }
                    >
                        <AppGrid
                            applications={trending}
                            empty="Todavía no hay aplicaciones en tendencia."
                        />
                    </Section>
                </>
            )}
            <Section
                title={isHome ? 'Explora a tu manera' : 'Afinar la búsqueda'}
                id="catalogue"
                className="store-discovery"
                action={
                    !isHome && (
                        <Link href={store()} className="store-link">
                            Limpiar filtros
                        </Link>
                    )
                }
            >
                <div className="store-category-chips" aria-label="Categorías">
                    <button
                        className={`store-chip ${!filters.category ? 'store-chip-active' : ''}`}
                        aria-pressed={!filters.category}
                        disabled={loading}
                        onClick={() => filter({ category: undefined })}
                    >
                        <StoreIcon />
                        Todas
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            className={`store-chip ${filters.category === category.slug ? 'store-chip-active' : ''}`}
                            aria-pressed={filters.category === category.slug}
                            disabled={loading}
                            onClick={() => filter({ category: category.slug })}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
                <div className="store-filter-row">
                    <label>
                        Precio
                        <select
                            aria-label="Filtrar por precio"
                            value={
                                filters.free === null
                                    ? ''
                                    : String(Number(filters.free))
                            }
                            disabled={loading}
                            onChange={(event) =>
                                filter({
                                    free: event.target.value || undefined,
                                })
                            }
                        >
                            <option value="">Todos los precios</option>
                            <option value="1">Gratis</option>
                            <option value="0">De pago</option>
                        </select>
                    </label>
                    <label>
                        Ordenar por
                        <select
                            value={filters.sort}
                            disabled={loading}
                            onChange={(event) =>
                                filter({ sort: event.target.value })
                            }
                        >
                            <option value="newest">Más recientes</option>
                            <option value="rating">Mejor valoradas</option>
                            <option value="downloads">Más descargadas</option>
                            <option value="trending">En tendencia</option>
                        </select>
                    </label>
                </div>
            </Section>
            <Section
                title={isHome ? 'Recién llegadas' : 'Aplicaciones para ti'}
                className="store-catalogue"
                action={
                    <span className="store-muted store-small">
                        {applications.meta.total}{' '}
                        {applications.meta.total === 1
                            ? 'resultado'
                            : 'resultados'}
                    </span>
                }
            >
                <div aria-busy={loading}>
                    {loading && (
                        <p role="status" className="store-loading">
                            Buscando aplicaciones…
                        </p>
                    )}
                    <AppGrid
                        applications={applications.data}
                        empty="No encontramos aplicaciones con estos filtros. Prueba otra búsqueda o explora todas las categorías."
                    />
                </div>
                <Pagination meta={applications.meta} />
            </Section>
            {isHome && (
                <section className="store-discover-note">
                    <span className="store-note-icon">
                        <StoreIcon name="spark" />
                    </span>
                    <div>
                        <h2>Tu próxima favorita está por aquí.</h2>
                        <p>
                            Explora nuevas ideas de desarrolladores
                            independientes.
                        </p>
                    </div>
                    <Link
                        href={store({ query: { sort: 'rating' } })}
                        className="store-link"
                    >
                        Mejor valoradas <StoreIcon name="arrow" />
                    </Link>
                </section>
            )}
        </StoreLayout>
    );
}
