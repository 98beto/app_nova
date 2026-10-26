import { Link } from '@inertiajs/react';
import {
    AppIcon,
    Empty,
    Pagination,
    Section,
    StoreIcon,
    StoreLayout,
    date,
    number,
} from '@/components/StoreUI';
import { store } from '@/routes';
import { show } from '@/routes/store';
import type { LibraryBundle } from '@/types/store';

export default function Index({ library, summary }: LibraryBundle) {
    return (
        <StoreLayout
            title="Mi biblioteca"
            subtitle={`${number(summary.downloads_count)} aplicaciones en tu biblioteca`}
            active="library"
        >
            <Section
                title="Tus aplicaciones"
                className="store-library"
                action={
                    <Link href={store()} className="store-link">
                        Descubrir más →
                    </Link>
                }
            >
                <div className="store-library-list">
                    {library.data.length ? (
                        library.data.map((item) => (
                            <article
                                key={item.id}
                                className="store-panel store-library-item"
                            >
                                {item.available && item.application ? (
                                    <>
                                        <AppIcon
                                            application={item.application}
                                        />
                                        <div>
                                            <Link
                                                href={show(item.application.id)}
                                            >
                                                <h3>{item.application.name}</h3>
                                            </Link>
                                            <p className="store-muted">
                                                Instalada ·{' '}
                                                {date(item.downloaded_at)}
                                            </p>
                                        </div>
                                        <span className="store-badge store-status-approved">
                                            INSTALADA
                                        </span>
                                        <Link
                                            href={`${show.url(item.application.id)}#reviews`}
                                            className="store-link store-library-review"
                                        >
                                            Escribir o editar reseña →
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <span className="store-stat-icon">
                                            <StoreIcon />
                                        </span>
                                        <div>
                                            <h3>Aplicación no disponible</h3>
                                            <p className="store-muted">
                                                Instalada el{' '}
                                                {date(item.downloaded_at)}
                                            </p>
                                        </div>
                                        <span className="store-badge">
                                            NO DISPONIBLE
                                        </span>
                                    </>
                                )}
                            </article>
                        ))
                    ) : (
                        <Empty>
                            Tu biblioteca está por descubrir
                            <br />
                            <Link href={store()} className="store-link">
                                Explora el catálogo →
                            </Link>
                        </Empty>
                    )}
                </div>
                <Pagination meta={library.meta} parameter="library_page" />
            </Section>
        </StoreLayout>
    );
}
