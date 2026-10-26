import { Link, usePage } from '@inertiajs/react';
import {
    AppIcon,
    Empty,
    Pagination,
    Section,
    StoreIcon,
    StoreLayout,
    number,
    price,
    rating,
    statusLabels,
} from '@/components/StoreUI';
import { create, show } from '@/routes/developer/applications';
import type { User } from '@/types/auth';
import type { DeveloperBundle, StoreProfile } from '@/types/store';

export default function Dashboard({ applications, summary }: DeveloperBundle) {
    const {
        props: { auth },
    } = usePage<{
        auth: { user: (User & Pick<StoreProfile, 'developer_profile'>) | null };
    }>();
    return (
        <StoreLayout
            title={`Hola, ${auth.user?.developer_profile?.company_name || auth.user?.name || 'creador'}`}
            subtitle="Un vistazo a lo que estás construyendo en AppNova."
            active="developer"
        >
            <section
                className="store-stats"
                aria-label="Resumen de tus aplicaciones"
            >
                <article className="store-panel">
                    <span className="store-stat-icon">
                        <StoreIcon />
                    </span>
                    <strong>{number(summary.applications_count)}</strong>
                    <p>Aplicaciones</p>
                    <small>{number(summary.published_count)} publicadas</small>
                </article>
                <article className="store-panel">
                    <span className="store-stat-icon store-violet">
                        <StoreIcon name="download" />
                    </span>
                    <strong>{number(summary.downloads_count)}</strong>
                    <p>Descargas totales</p>
                    <small>Tu alcance en la comunidad</small>
                </article>
                <article className="store-panel">
                    <span className="store-stat-icon store-green">
                        <StoreIcon name="star" />
                    </span>
                    <strong>{rating(summary.average_rating)}</strong>
                    <p>Valoración media</p>
                    <small>
                        {summary.average_rating === null
                            ? 'Sin valoraciones'
                            : `${number(summary.reviews_count)} reseñas recibidas`}
                    </small>
                </article>
                <article className="store-panel">
                    <span className="store-stat-icon">
                        <StoreIcon name="chart" />
                    </span>
                    <strong>—</strong>
                    <p>Ingresos</p>
                    <small>Próximamente</small>
                </article>
            </section>
            <Section
                title="Lo que has creado"
                className="store-developer-apps"
                action={
                    <Link href={create()} className="store-button">
                        <StoreIcon name="plus" />
                        Publicar app
                    </Link>
                }
            >
                <div className="store-own-app-list">
                    {applications.data.length ? (
                        applications.data.map((app) => (
                            <Link
                                key={app.id}
                                href={show(app.id)}
                                className="store-own-app store-panel"
                            >
                                <AppIcon application={app} />
                                <div className="store-own-app-name">
                                    <h3>{app.name}</h3>
                                    <p>{app.category.name}</p>
                                </div>
                                <span
                                    className={`store-badge store-status-${app.status}`}
                                >
                                    {statusLabels[app.status]}
                                </span>
                                <span className="store-own-app-stat">
                                    <strong>
                                        {number(app.downloads_count)}
                                    </strong>
                                    <small>descargas</small>
                                </span>
                                <span className="store-price">
                                    {price(app)}
                                </span>
                                <StoreIcon name="arrow" />
                            </Link>
                        ))
                    ) : (
                        <Empty>
                            Tu primera gran idea empieza aquí
                            <br />
                            <Link href={create()} className="store-link">
                                Publica tu primera aplicación →
                            </Link>
                        </Empty>
                    )}
                </div>
                <Pagination meta={applications.meta} />
            </Section>
        </StoreLayout>
    );
}
