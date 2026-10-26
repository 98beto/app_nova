import { useForm } from '@inertiajs/react';
import {
    FormErrors,
    ImagePicker,
    Notice,
    StoreIcon,
    useStoreFeedback,
} from '@/components/StoreUI';
import { store } from '@/routes/developer/applications';
import type { Category } from '@/types/store';

export default function PublishForm({
    categories,
}: {
    categories: Category[];
}) {
    const form = useForm({
        name: '',
        description: '',
        category_id: '',
        minimum_age: '0',
        price: '0.00',
        icon: null as File | null,
        screenshots: [null, null, null, null] as (File | null)[],
    });
    const feedback = useStoreFeedback();
    return (
        <section id="publish" className="store-publication">
            <div className="store-section-heading">
                <div>
                    <p className="store-eyebrow">
                        COMPARTE TU PRÓXIMA GRAN IDEA
                    </p>
                    <h2>Nueva aplicación</h2>
                    <p className="store-muted">
                        Completa los detalles y dale un lugar en AppNova.
                    </p>
                </div>
            </div>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(store.url(), {
                        ...feedback.options,
                        forceFormData: true,
                    });
                }}
            >
                <fieldset disabled={form.processing}>
                    <div className="store-publish-grid">
                        <div className="store-panel">
                            <h3>Información principal</h3>
                            <label className="store-field">
                                Nombre de la aplicación
                                <input
                                    id="app-name"
                                    required
                                    maxLength={255}
                                    placeholder="El nombre de tu próxima gran idea"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    aria-invalid={!!form.errors.name}
                                />
                            </label>
                            <label className="store-field">
                                Descripción
                                <textarea
                                    id="app-description"
                                    rows={6}
                                    maxLength={20000}
                                    placeholder="Cuéntanos qué hace especial a tu app…"
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    required
                                    aria-invalid={!!form.errors.description}
                                />
                            </label>
                            <div className="store-field-grid store-field-grid-three">
                                <label className="store-field">
                                    Categoría
                                    <select
                                        id="app-category"
                                        value={form.data.category_id}
                                        onChange={(event) =>
                                            form.setData(
                                                'category_id',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option disabled value="">
                                            Seleccionar
                                        </option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="store-field">
                                    Edad mínima
                                    <input
                                        id="minimum-age"
                                        type="number"
                                        min="0"
                                        max="18"
                                        step="1"
                                        required
                                        value={form.data.minimum_age}
                                        onChange={(event) =>
                                            form.setData(
                                                'minimum_age',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label className="store-field">
                                    Precio (USD)
                                    <input
                                        id="app-price"
                                        type="number"
                                        min="0"
                                        max="9999999999.99"
                                        step="0.01"
                                        required
                                        value={form.data.price}
                                        onChange={(event) =>
                                            form.setData(
                                                'price',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                            </div>
                            <p className="store-muted store-small">
                                Indica 0 para una aplicación gratuita. Las
                                compras de pago aún no están disponibles.
                            </p>
                        </div>
                        <div className="store-panel">
                            <h3>Recursos visuales</h3>
                            <p className="store-muted store-small">
                                JPG, PNG o WebP · máximo 5 MB por imagen.
                            </p>
                            <ImagePicker
                                label="Icono de la aplicación"
                                value={form.data.icon}
                                onChange={(file) => form.setData('icon', file)}
                                required
                            />
                            <h4>Cuatro capturas de pantalla</h4>
                            <div className="store-upload-grid">
                                {form.data.screenshots.map((file, index) => (
                                    <ImagePicker
                                        key={index}
                                        label={`Captura ${index + 1}`}
                                        value={file}
                                        onChange={(value) =>
                                            form.setData(
                                                'screenshots',
                                                form.data.screenshots.map(
                                                    (previous, position) =>
                                                        position === index
                                                            ? value
                                                            : previous,
                                                ),
                                            )
                                        }
                                        required
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="store-publish-notice">
                        <StoreIcon name="check" />
                        <p>
                            Tu aplicación se publicará al completar el envío. No
                            necesitas activar un pago para publicar.
                        </p>
                    </div>
                    <Notice error>{feedback.message}</Notice>
                    <FormErrors errors={form.errors} />
                    {form.progress && (
                        <progress
                            max="100"
                            value={form.progress.percentage}
                            aria-label="Subiendo imágenes"
                        />
                    )}
                    <div className="store-form-actions">
                        <span className="store-muted store-small">
                            Revisa los datos antes de compartir tu aplicación.
                        </span>
                        <button
                            className="store-button"
                            disabled={
                                form.processing || categories.length === 0
                            }
                        >
                            <StoreIcon name="plus" />
                            {form.processing
                                ? 'Publicando…'
                                : 'Publicar aplicación'}
                        </button>
                    </div>
                </fieldset>
            </form>
        </section>
    );
}
