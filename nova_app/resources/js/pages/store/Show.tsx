import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    AppGrid,
    ApplicationPresentation,
    FormErrors,
    Notice,
    Pagination,
    ReviewCard,
    Section,
    Stars,
    StoreIcon,
    StoreLayout,
    number,
    rating,
    useStoreFeedback,
} from '@/components/StoreUI';
import { login, store } from '@/routes';
import { store as installRoute } from '@/routes/downloads';
import { like, update } from '@/routes/reviews';
import type { Auth } from '@/types/auth';
import type { ApplicationDetailBundle, StoreReview } from '@/types/store';

function LikeButton({
    review,
    reviewsPage,
}: {
    review: StoreReview;
    reviewsPage: number;
}) {
    const form = useForm({ liked: !review.liked, reviews_page: reviewsPage });
    const feedback = useStoreFeedback();
    return (
        <div>
            <button
                type="button"
                className={`store-like ${review.liked ? 'store-liked' : ''}`}
                aria-pressed={review.liked}
                disabled={form.processing}
                onClick={() => {
                    form.transform(() => ({
                        liked: !review.liked,
                        reviews_page: reviewsPage,
                    }));
                    form.put(like.url(review.id), {
                        ...feedback.options,
                        preserveScroll: true,
                    });
                }}
            >
                <StoreIcon name="heart" />
                Me gusta · {number(review.likes_count)}
            </button>
            <Notice error>{feedback.message}</Notice>
            <FormErrors errors={form.errors} />
        </div>
    );
}

export default function Show({
    application,
    reviews,
    own_review,
    similar,
    same_developer,
}: ApplicationDetailBundle) {
    const user = usePage<{ auth: Auth }>().props.auth.user;
    const canInteract =
        user?.status === 'active' &&
        (user.role === 'user' || user.role === 'developer');
    const install = useForm({});
    const review = useForm({
        rating: own_review?.rating ?? 5,
        body: own_review?.body ?? '',
    });
    const feedback = useStoreFeedback();
    const [simulating, setSimulating] = useState(false);
    const [reviewSaved, setReviewSaved] = useState(false);
    useEffect(() => {
        if (!simulating) return;
        const timeout = window.setTimeout(() => {
            install.post(installRoute.url(application.id), {
                ...feedback.options,
                preserveScroll: true,
                onFinish: () => setSimulating(false),
            });
        }, 650);
        return () => window.clearTimeout(timeout);
    }, [simulating, application.id]);
    const installing = simulating || install.processing;
    return (
        <StoreLayout
            title="Detalle de aplicación"
            subtitle="Tu próximo descubrimiento empieza aquí."
            active="explore"
        >
            <Link href={store()} className="store-back">
                ← Volver a explorar
            </Link>
            <ApplicationPresentation application={application}>
                {application.installed ? (
                    <button className="store-button" disabled>
                        <StoreIcon name="check" />
                        Instalada
                    </button>
                ) : !application.is_free ? (
                    <button className="store-button" disabled>
                        Compras próximamente
                    </button>
                ) : canInteract ? (
                    <button
                        className="store-button"
                        disabled={installing}
                        onClick={() => {
                            feedback.setMessage('');
                            setSimulating(true);
                        }}
                    >
                        <StoreIcon name="download" />
                        {installing ? 'Instalando…' : 'Instalar gratis'}
                    </button>
                ) : user ? (
                    <>
                        <button className="store-button" disabled>
                            Instalación no disponible
                        </button>
                        <span className="store-muted store-small">
                            Tu cuenta no tiene acceso a esta acción.
                        </span>
                    </>
                ) : (
                    <>
                        <Link
                            href={login()}
                            as="button"
                            className="store-button"
                        >
                            <StoreIcon name="download" />
                            Instalar gratis
                        </Link>
                        <span className="store-muted store-small">
                            Inicia sesión para instalar
                        </span>
                    </>
                )}
            </ApplicationPresentation>
            {installing && (
                <div className="store-install-progress" role="status">
                    <span>Preparando instalación · progreso simulado</span>
                    <progress aria-label="Progreso simulado de instalación" />
                </div>
            )}
            <Notice error>{feedback.message}</Notice>
            <FormErrors errors={install.errors} />
            <Section
                title="Valoraciones y reseñas"
                className="store-reviews-section"
                id="reviews"
                action={
                    <span className="store-muted store-small">
                        Experiencias de la comunidad
                    </span>
                }
            >
                <div className="store-reviews-layout">
                    <div className="store-panel store-rating-summary">
                        <strong>{rating(application.average_rating)}</strong>
                        {application.average_rating !== null && (
                            <Stars value={application.average_rating} />
                        )}
                        <span className="store-muted">
                            {application.average_rating === null
                                ? 'Sin valoraciones'
                                : `${number(application.reviews_count)} reseñas`}
                        </span>
                    </div>
                    <div className="store-review-compose store-panel">
                        {canInteract && application.installed ? (
                            <>
                                <h3>
                                    {own_review
                                        ? 'Tu reseña'
                                        : '¿Qué te pareció esta app?'}
                                </h3>
                                <p className="store-muted store-small">
                                    {own_review
                                        ? 'Puedes actualizar tu valoración en cualquier momento.'
                                        : 'Comparte tu experiencia con la comunidad.'}
                                </p>
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        setReviewSaved(false);
                                        review.put(update.url(application.id), {
                                            ...feedback.options,
                                            preserveScroll: true,
                                            onSuccess: () =>
                                                setReviewSaved(true),
                                        });
                                    }}
                                >
                                    <fieldset disabled={review.processing}>
                                        <label className="store-field">
                                            Valoración
                                            <select
                                                name="rating"
                                                value={review.data.rating}
                                                onChange={(event) =>
                                                    review.setData(
                                                        'rating',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            >
                                                {[1, 2, 3, 4, 5].map(
                                                    (value) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {value}{' '}
                                                            {value === 1
                                                                ? 'estrella'
                                                                : 'estrellas'}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </label>
                                        <label
                                            className="store-field"
                                            htmlFor="review-body"
                                        >
                                            Tu experiencia (opcional)
                                            <textarea
                                                id="review-body"
                                                maxLength={5000}
                                                rows={3}
                                                value={review.data.body}
                                                onChange={(event) =>
                                                    review.setData(
                                                        'body',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="¿Qué te ha gustado?"
                                            />
                                        </label>
                                        <FormErrors errors={review.errors} />
                                        <button
                                            className="store-button"
                                            disabled={review.processing}
                                        >
                                            {review.processing
                                                ? 'Guardando…'
                                                : own_review
                                                  ? 'Actualizar reseña'
                                                  : 'Publicar reseña'}
                                        </button>
                                        <Notice>
                                            {reviewSaved
                                                ? 'Reseña guardada. ¡Gracias por compartir!'
                                                : ''}
                                        </Notice>
                                    </fieldset>
                                </form>
                            </>
                        ) : (
                            <>
                                <StoreIcon name="star" />
                                <h3>Tu experiencia cuenta</h3>
                                <p className="store-muted">
                                    {user && !canInteract
                                        ? 'Tu cuenta no tiene acceso a publicar reseñas.'
                                        : 'Instala esta aplicación antes de publicar tu propia reseña.'}
                                </p>
                                {!user && (
                                    <Link href={login()} className="store-link">
                                        Iniciar sesión →
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className="store-review-list">
                    {reviews.data.length ? (
                        reviews.data.map((item) => (
                            <ReviewCard key={item.id} review={item}>
                                {canInteract && !item.is_own ? (
                                    <LikeButton
                                        review={item}
                                        reviewsPage={reviews.meta.current_page}
                                    />
                                ) : (
                                    <span className="store-muted store-small">
                                        {number(item.likes_count)} Me gusta
                                    </span>
                                )}
                            </ReviewCard>
                        ))
                    ) : (
                        <p className="store-panel store-muted">
                            Todavía no hay reseñas. La primera experiencia
                            podría ser la tuya.
                        </p>
                    )}
                </div>
                <Pagination meta={reviews.meta} parameter="reviews_page" />
            </Section>
            {similar.length > 0 && (
                <Section
                    title="También te puede gustar"
                    className="store-related"
                >
                    <AppGrid applications={similar} />
                </Section>
            )}
            {same_developer.length > 0 && (
                <Section
                    title={`Más de ${application.developer.company_name}`}
                    className="store-related"
                >
                    <AppGrid applications={same_developer} />
                </Section>
            )}
        </StoreLayout>
    );
}
