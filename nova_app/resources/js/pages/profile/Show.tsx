import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    Avatar,
    Empty,
    FormErrors,
    ImagePicker,
    Notice,
    Pagination,
    ReviewCard,
    Section,
    StoreIcon,
    StoreLayout,
    number,
    useStoreFeedback,
} from '@/components/StoreUI';
import { logout } from '@/routes';
import { dashboard } from '@/routes/developer';
import { index as libraryIndex } from '@/routes/library';
import { update } from '@/routes/profile';
import { show } from '@/routes/store';
import type { ProfileBundle } from '@/types/store';

export default function Show({ profile, reviews, summary }: ProfileBundle) {
    const initialData = {
        name: profile.name,
        email: profile.email,
        gender: profile.gender,
        birth_date: profile.birth_date,
        company_name: profile.developer_profile?.company_name ?? '',
        avatar: null as File | null,
    };
    const form = useForm(initialData);
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const feedback = useStoreFeedback();
    function submit(event: React.FormEvent) {
        event.preventDefault();
        setSaved(false);
        form.transform((data) => {
            const { company_name, avatar, ...fields } = data;
            return {
                ...fields,
                _method: 'patch',
                ...(avatar ? { avatar } : {}),
                ...(profile.role === 'developer' ? { company_name } : {}),
            };
        });
        form.post(update.url(), {
            ...feedback.options,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
                setEditing(false);
                form.reset('avatar');
            },
        });
    }
    return (
        <StoreLayout
            title="Mi cuenta"
            subtitle="Tu espacio, tus aplicaciones, tus experiencias."
            active="profile"
        >
            <section className="store-profile-card store-panel">
                <Avatar name={profile.name} url={profile.avatar_url} large />
                <div>
                    <h2>{profile.name}</h2>
                    <p className="store-muted">{profile.email}</p>
                    <span className="store-badge">
                        {profile.role === 'developer'
                            ? 'Desarrollador'
                            : 'Miembro de AppNova'}
                    </span>
                </div>
                {!editing && (
                    <button
                        className="store-button store-button-secondary"
                        aria-expanded={editing}
                        aria-controls="profile-editor"
                        onClick={() => {
                            form.setData(initialData);
                            setEditing(true);
                            setSaved(false);
                        }}
                    >
                        Editar perfil
                    </button>
                )}
            </section>
            <Notice error>{feedback.message}</Notice>
            <Notice>
                {saved ? 'Tus cambios se guardaron correctamente.' : ''}
            </Notice>
            {editing && (
                <form
                    id="profile-editor"
                    className="store-panel store-profile-form"
                    onSubmit={submit}
                >
                    <h2>Hazlo tuyo</h2>
                    <fieldset disabled={form.processing}>
                        <div className="store-profile-edit-layout">
                            <ImagePicker
                                label="Cambiar avatar"
                                value={form.data.avatar}
                                existing={profile.avatar_url}
                                onChange={(file) =>
                                    form.setData('avatar', file)
                                }
                            />
                            <div>
                                <div className="store-field-grid">
                                    <label className="store-field">
                                        Nombre completo
                                        <input
                                            name="name"
                                            value={form.data.name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="name"
                                            maxLength={255}
                                            required
                                            aria-invalid={!!form.errors.name}
                                        />
                                    </label>
                                    <label className="store-field">
                                        Correo electrónico
                                        <input
                                            name="email"
                                            type="email"
                                            value={form.data.email}
                                            onChange={(event) =>
                                                form.setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="email"
                                            maxLength={255}
                                            required
                                            aria-invalid={!!form.errors.email}
                                        />
                                    </label>
                                    <label className="store-field">
                                        Género
                                        <select
                                            name="gender"
                                            value={form.data.gender}
                                            onChange={(event) =>
                                                form.setData(
                                                    'gender',
                                                    event.target
                                                        .value as typeof profile.gender,
                                                )
                                            }
                                        >
                                            <option value="female">
                                                Femenino
                                            </option>
                                            <option value="male">
                                                Masculino
                                            </option>
                                            <option value="non_binary">
                                                No binario
                                            </option>
                                            <option value="prefer_not_to_say">
                                                Prefiero no decirlo
                                            </option>
                                        </select>
                                    </label>
                                    <label className="store-field">
                                        Fecha de nacimiento
                                        <input
                                            type="date"
                                            value={form.data.birth_date}
                                            onChange={(event) =>
                                                form.setData(
                                                    'birth_date',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="bday"
                                            required
                                            aria-invalid={
                                                !!form.errors.birth_date
                                            }
                                        />
                                    </label>
                                </div>
                                {profile.role === 'developer' && (
                                    <label className="store-field">
                                        Nombre de empresa
                                        <input
                                            name="company_name"
                                            value={form.data.company_name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'company_name',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="organization"
                                            maxLength={255}
                                            required
                                            aria-invalid={
                                                !!form.errors.company_name
                                            }
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <FormErrors errors={form.errors} />
                        <div className="store-form-actions">
                            <button
                                type="button"
                                className="store-button store-button-secondary"
                                onClick={() => setEditing(false)}
                                disabled={form.processing}
                            >
                                Cancelar
                            </button>
                            <button
                                className="store-button"
                                disabled={form.processing}
                            >
                                <StoreIcon name="check" />
                                {form.processing
                                    ? 'Guardando…'
                                    : 'Guardar cambios'}
                            </button>
                        </div>
                    </fieldset>
                </form>
            )}
            {profile.role === 'developer' && (
                <section className="store-payment-card store-panel">
                    <div className="store-stat-icon">
                        <StoreIcon />
                    </div>
                    <div>
                        <span className="store-badge">PRÓXIMAMENTE</span>
                        <h2>PayPal</h2>
                        <p className="store-muted">
                            Los pagos estarán disponibles en una próxima
                            actualización. Ya puedes publicar tus aplicaciones.
                        </p>
                    </div>
                    <button
                        className="store-button store-button-secondary"
                        disabled
                    >
                        Pagos no disponibles
                    </button>
                </section>
            )}
            <section className="store-profile-summary">
                <Link href={libraryIndex()} className="store-panel">
                    <StoreIcon name="download" />
                    <strong>{number(summary.downloads_count)}</strong>
                    <span>Aplicaciones en tu biblioteca</span>
                </Link>
                <div className="store-panel">
                    <StoreIcon name="star" />
                    <strong>{number(summary.reviews_count)}</strong>
                    <span>Experiencias compartidas</span>
                </div>
            </section>
            <Section
                title="Mis reseñas"
                id="my-reviews"
                className="store-related"
                action={
                    <span className="store-muted store-small">
                        Tu opinión hace la diferencia
                    </span>
                }
            >
                {reviews.data.length ? (
                    <div className="store-review-list">
                        {reviews.data.map((item) => (
                            <div key={item.id}>
                                <ReviewCard review={item} />
                                <Link
                                    className="store-link store-edit-review"
                                    href={`${show.url(item.application_id)}#reviews`}
                                >
                                    Ver aplicación y editar reseña →
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty>Todavía no has compartido una reseña</Empty>
                )}
                <Pagination meta={reviews.meta} parameter="reviews_page" />
            </Section>
            {profile.role === 'developer' && (
                <Link
                    href={dashboard()}
                    className="store-mobile-panel-link store-button store-button-secondary"
                >
                    Ir a mi panel de desarrollador →
                </Link>
            )}
            <Link
                href={logout()}
                as="button"
                className="store-logout store-profile-logout"
                {...feedback.options}
            >
                <StoreIcon name="logout" />
                Cerrar sesión
            </Link>
        </StoreLayout>
    );
}
