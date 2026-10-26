<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStore } from '@/stores/store'
import { priceLabel, ratingLabel, statusLabels } from '@/lib/store'
import StoreShell from '@/components/store/StoreShell.vue'
import StoreState from '@/components/store/StoreState.vue'
import StorePagination from '@/components/store/StorePagination.vue'
import AppIcon from '@/components/store/AppIcon.vue'
import StoreIcon from '@/components/store/StoreIcon.vue'
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useStore()
const bundle = computed(() => store.developer.data)
function load() {
  return store.loadDeveloper(String(route.query.page || '1'))
}
watch(
  () => [route.path, route.query.page],
  () => {
    store.clearAction()
    void load()
  },
  { immediate: true },
)
function page(value: number) {
  void router.push({ query: { ...route.query, page: String(value) } })
}
</script>
<template>
  <StoreShell
    :title="`Hola, ${auth.user?.name || 'creador'}`"
    subtitle="Un vistazo a lo que estás construyendo en AppNova."
    ><StoreState
      :loading="store.developer.loading"
      :error="store.developer.error"
      @retry="load" /><template v-if="bundle && !store.developer.loading"
      ><section class="store-stats" aria-label="Resumen de tus aplicaciones">
        <article class="store-panel">
          <span class="store-stat-icon"><StoreIcon name="grid" /></span
          ><strong>{{ bundle.summary.applications_count }}</strong>
          <p>Aplicaciones</p>
          <small>{{ bundle.summary.published_count }} publicadas</small>
        </article>
        <article class="store-panel">
          <span class="store-stat-icon store-violet"><StoreIcon name="download" /></span
          ><strong>{{ bundle.summary.downloads_count.toLocaleString('es') }}</strong>
          <p>Descargas totales</p>
          <small>Tu alcance en la comunidad</small>
        </article>
        <article class="store-panel">
          <span class="store-stat-icon store-green"><StoreIcon name="star" /></span
          ><strong>{{
            bundle.summary.average_rating === null
              ? '—'
              : ratingLabel(bundle.summary.average_rating)
          }}</strong>
          <p>Valoración media</p>
          <small>{{
            bundle.summary.average_rating === null
              ? 'Sin valoraciones'
              : `${bundle.summary.reviews_count} reseñas recibidas`
          }}</small>
        </article>
        <article class="store-panel">
          <span class="store-stat-icon"><StoreIcon name="chart" /></span>
          <strong>—</strong>
          <p>Ingresos</p>
          <small>Próximamente</small>
        </article>
      </section>
      <section class="store-developer-apps">
        <div class="store-section-heading">
          <h2>Lo que has creado</h2>
          <RouterLink to="/developer/applications/create" class="store-button"
            ><StoreIcon name="plus" />Publicar app</RouterLink
          >
        </div>
        <StoreState
          :empty="!bundle.applications.data.length"
          message="Tu primera gran idea empieza aquí"
          ><RouterLink to="/developer/applications/create" class="store-link"
            >Publica tu primera aplicación →</RouterLink
          ></StoreState
        >
        <div class="store-own-app-list">
          <RouterLink
            v-for="app in bundle.applications.data"
            :key="app.id"
            :to="`/developer/applications/${app.id}`"
            class="store-own-app store-panel"
            ><AppIcon :url="app.icon_url" :name="app.name" :id="app.id" />
            <div class="store-own-app-name">
              <h3>{{ app.name }}</h3>
              <p>{{ app.category.name }}</p>
            </div>
            <span class="store-badge" :class="`store-status-${app.status}`">{{
              statusLabels[app.status]
            }}</span
            ><span class="store-own-app-stat"
              ><strong>{{ app.downloads_count }}</strong
              ><small>descargas</small></span
            ><span class="store-price">{{ priceLabel(app) }}</span
            ><StoreIcon name="arrow"
          /></RouterLink>
        </div>
        <StorePagination :meta="bundle.applications.meta" @change="page" />
      </section> </template
  ></StoreShell>
</template>
