<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@/stores/store'
import { useAuthStore } from '@/stores/auth'
import { ratingLabel } from '@/lib/store'
import StoreShell from '@/components/store/StoreShell.vue'
import ApplicationPresentation from '@/components/store/ApplicationPresentation.vue'
import AppCard from '@/components/store/AppCard.vue'
import StoreState from '@/components/store/StoreState.vue'
import StorePagination from '@/components/store/StorePagination.vue'
import StoreIcon from '@/components/store/StoreIcon.vue'
import ReviewCard from '@/components/store/ReviewCard.vue'
import { useRouteOperation } from '@/composables/useRouteOperation'
import { useResourceHash } from '@/composables/useResourceHash'
const route = useRoute()
const router = useRouter()
const store = useStore()
const auth = useAuthStore()
const bundle = computed(() => store.detail.data)
const form = reactive({ rating: 5, body: '' })
const saved = ref(false)
const captureOperation = useRouteOperation()
const filledStars = computed(() =>
  Math.max(0, Math.min(5, Math.round(bundle.value?.application.average_rating ?? 0))),
)
const acquisitionError = computed(() =>
  store.progressApplicationId === bundle.value?.application.id
    ? store.fieldErrors.application?.[0]
    : '',
)
useResourceHash(() => !!bundle.value && !store.detail.loading)
function load() {
  return store.loadDetail(String(route.params.id), String(route.query.reviews_page || '1'))
}
watch(
  () => [route.params.id, route.query.reviews_page, auth.user?.id],
  () => {
    store.clearAction()
    saved.value = false
    void load()
  },
  { immediate: true },
)
watch(
  () => bundle.value?.own_review,
  (review) => {
    form.rating = review?.rating ?? 5
    form.body = review?.body || ''
  },
  { immediate: true },
)
async function review() {
  const isCurrent = captureOperation()
  const result = await store.saveReview({ rating: Number(form.rating), body: form.body })
  if (!isCurrent()) return
  saved.value = result
  if (saved.value && route.query.reviews_page)
    await router.replace({ query: { ...route.query, reviews_page: undefined } })
}
function page(value: number) {
  void router.push({ query: { ...route.query, reviews_page: String(value) }, hash: '#reviews' })
}
</script>
<template>
  <StoreShell title="Detalle de aplicación" subtitle="Tu próximo descubrimiento empieza aquí."
    ><RouterLink to="/store" class="store-back">← Volver a explorar</RouterLink
    ><StoreState
      :loading="store.detail.loading"
      :error="store.detail.error"
      @retry="load" /><template v-if="bundle && !store.detail.loading"
      ><ApplicationPresentation :application="bundle.application"
        ><template #action
          ><button v-if="!bundle.application.is_free" class="store-button" disabled>
            Compras próximamente</button
          ><button
            v-else
            class="store-button"
            :disabled="bundle.application.installed || store.saving || auth.user?.role === 'admin'"
            :aria-describedby="acquisitionError ? 'store-acquisition-error' : undefined"
            @click="store.install"
          >
            <StoreIcon :name="bundle.application.installed ? 'check' : 'download'" />{{
              bundle.application.installed
                ? 'Instalada'
                : store.saving &&
                    store.progress > 0 &&
                    store.progressApplicationId === bundle.application.id
                  ? 'Instalando…'
                  : 'Instalar gratis'
            }}</button
          ><span v-if="!auth.user && bundle.application.is_free" class="store-muted store-small"
            >Inicia sesión para instalar</span
          >
          <p
            v-if="acquisitionError"
            id="store-acquisition-error"
            class="store-field-error"
            role="alert"
          >
            {{ acquisitionError }}
          </p></template
        ></ApplicationPresentation
      >
      <div
        v-if="store.progress > 0 && store.progressApplicationId === bundle.application.id"
        class="store-install-progress"
        role="status"
      >
        <span>{{
          store.progress === 100
            ? 'Instalación guardada en tu biblioteca.'
            : 'Preparando instalación · progreso simulado'
        }}</span
        ><progress
          :value="store.progress"
          max="100"
          :aria-label="'Progreso simulado de instalación'"
        />
      </div>
      <p v-if="store.actionError" class="store-alert" role="alert">{{ store.actionError }}</p>
      <section id="reviews" class="store-reviews-section">
        <div class="store-section-heading">
          <h2>Valoraciones y reseñas</h2>
          <span class="store-muted store-small">Experiencias de la comunidad</span>
        </div>
        <div class="store-reviews-layout">
          <div class="store-panel store-rating-summary">
            <strong>{{
              bundle.application.average_rating === null
                ? '—'
                : ratingLabel(bundle.application.average_rating)
            }}</strong
            ><span v-if="bundle.application.average_rating === null" class="store-muted"
              >Sin valoraciones</span
            ><span
              v-if="bundle.application.average_rating !== null"
              class="store-stars"
              aria-hidden="true"
              >{{ '★'.repeat(filledStars) }}<span>{{ '☆'.repeat(5 - filledStars) }}</span></span
            ><span class="store-muted">{{ bundle.application.reviews_count }} reseñas</span>
          </div>
          <div class="store-review-compose store-panel">
            <template v-if="bundle.application.installed && auth.user && auth.user.role !== 'admin'"
              ><h3>{{ bundle.own_review ? 'Tu reseña' : '¿Qué te pareció esta app?' }}</h3>
              <p class="store-muted store-small">
                {{
                  bundle.own_review
                    ? 'Puedes actualizar tu valoración en cualquier momento.'
                    : 'Comparte tu experiencia con la comunidad.'
                }}
              </p>
              <form @submit.prevent="review">
                <label class="store-field"
                  >Valoración<select v-model="form.rating">
                    <option v-for="n in 5" :key="n" :value="n">
                      {{ n }} {{ n === 1 ? 'estrella' : 'estrellas' }}
                    </option>
                  </select></label
                ><label class="store-field"
                  >Tu experiencia (opcional)<textarea
                    v-model="form.body"
                    maxlength="5000"
                    rows="3"
                    placeholder="¿Qué te ha gustado?"
                  />
                </label>
                <p
                  v-for="(messages, field) in store.fieldErrors"
                  :key="field"
                  class="store-field-error"
                >
                  {{ messages[0] }}
                </p>
                <button class="store-button" :disabled="store.saving">
                  {{
                    store.saving
                      ? 'Guardando…'
                      : bundle.own_review
                        ? 'Actualizar reseña'
                        : 'Publicar reseña'
                  }}
                </button>
                <p v-if="saved" class="store-success" role="status">
                  Reseña guardada. ¡Gracias por compartir!
                </p>
              </form></template
            ><template v-else
              ><StoreIcon name="star" />
              <h3>Tu experiencia cuenta</h3>
              <p class="store-muted">Instala esta aplicación antes de publicar tu propia reseña.</p>
              <RouterLink
                v-if="!auth.user"
                :to="{ path: '/login', query: { redirect: route.fullPath } }"
                class="store-link"
                >Iniciar sesión →</RouterLink
              ></template
            >
          </div>
        </div>
        <div class="store-review-list">
          <ReviewCard
            v-for="item in bundle.reviews.data"
            :key="item.id"
            :review="item"
            :show-like="auth.user?.role !== 'admin'"
            :busy="store.liking.includes(item.id)"
            @like="store.likeReview"
          />
          <p v-if="!bundle.reviews.data.length" class="store-panel store-muted">
            Todavía no hay reseñas. La primera experiencia podría ser la tuya.
          </p>
        </div>
        <StorePagination :meta="bundle.reviews.meta" label="Páginas de reseñas" @change="page" />
      </section>
      <section v-if="bundle.similar.length" class="store-related">
        <div class="store-section-heading"><h2>También te puede gustar</h2></div>
        <div class="store-app-grid">
          <AppCard v-for="app in bundle.similar" :key="app.id" :application="app" />
        </div>
      </section>
      <section v-if="bundle.same_developer.length" class="store-related">
        <div class="store-section-heading">
          <h2>Más de {{ bundle.application.developer.company_name }}</h2>
        </div>
        <div class="store-app-grid">
          <AppCard v-for="app in bundle.same_developer" :key="app.id" :application="app" />
        </div></section></template
  ></StoreShell>
</template>
