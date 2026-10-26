import { Link } from '@inertiajs/react';
import {
    ApplicationPresentation,
    StoreLayout,
    date,
    statusLabels,
} from '@/components/StoreUI';
import { index } from '@/routes/developer/applications';
import { show } from '@/routes/store';
import type { DeveloperApplicationBundle } from '@/types/store';

export default function Show({ application }: DeveloperApplicationBundle) {
    return (
        <StoreLayout
            title="Tu aplicación"
            subtitle="Todos los detalles de tu creación, en un solo lugar."
            active="applications"
        >
            <Link href={index()} className="store-back">
                ← Volver a mis aplicaciones
            </Link>
            <section className="store-publication-status store-panel">
                <div>
                    <p className="store-eyebrow">ESTADO ACTUAL</p>
                    <h2>{statusLabels[application.status]}</h2>
                    <p className="store-muted">
                        {application.published_at
                            ? `Publicada el ${date(application.published_at)}`
                            : 'Esta aplicación no está publicada en el catálogo.'}
                    </p>
                </div>
                {application.status === 'approved' &&
                    application.published_at && (
                        <Link
                            href={show(application.id)}
                            className="store-button"
                        >
                            Ver en la tienda →
                        </Link>
                    )}
            </section>
            <ApplicationPresentation application={application} own>
                <span
                    className={`store-badge store-status-${application.status}`}
                >
                    {statusLabels[application.status]}
                </span>
            </ApplicationPresentation>
        </StoreLayout>
    );
}
