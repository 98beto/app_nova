<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@/stores/store'
import { useAuthStore } from '@/stores/auth'
import { catalogueQuery, filtersFromQuery } from '@/lib/store'
import StoreShell from '@/components/store/StoreShell.vue'
import StoreIcon from '@/components/store/StoreIcon.vue'
import AppCard from '@/components/store/AppCard.vue'
import StoreState from '@/components/store/StoreState.vue'
import StorePagination from '@/components/store/StorePagination.vue'
const store = useStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const filters = reactive(filtersFromQuery(route.query))
const home = computed(
  () =>
    !route.query.search &&
    !route.query.category &&
    !route.query.free &&
    !route.query.sort &&
    !route.query.page,
)
const bundle = computed(() => store.catalogue.data)
watch(
  () => [home.value, auth.user?.id],
  () => {
    if (home.value) {
      void store.loadPopular()
      void store.loadTrending()
    }
  },
  { immediate: true },
)
function load() {
  return store.loadCatalogue(catalogueQuery(route.query))
}
watch(
  () => [catalogueQuery(route.query), auth.user?.id],
  () => {
    Object.assign(filters, filtersFromQuery(route.query))
    void load()
  },
  { immediate: true },
)
function apply() {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters))
    if (value && (key !== 'sort' || value !== 'newest')) query[key] = value
  void router.push({ path: '/store', query })
}
function category(slug: string) {
  filters.category = slug
  apply()
}
function page(value: number) {
  void router.push({ query: { ...route.query, page: String(value) } })
}
</script>
<template>
  <StoreShell
    :title="home ? 'Descubre algo nuevo' : 'Encuentra tu próxima app'"
    :subtitle="
      home
        ? 'Ideas, herramientas y experiencias para tu día a día.'
        : 'Justo lo que buscas, a un paso de distancia.'
    "
  >
    <form class="store-search" role="search" @submit.prevent="apply">
      <StoreIcon name="search" /><input
        v-model="filters.search"
        aria-label="Buscar aplicaciones"
        placeholder="Buscar aplicaciones, juegos y más"
        type="search"
        maxlength="255"
      /><button type="submit" class="store-link">Buscar <StoreIcon name="arrow" /></button>
    </form>
    <section v-if="home" class="store-banner">
      <div class="store-banner-copy">
        <span class="store-banner-tag">TU PRÓXIMO DESCUBRIMIENTO</span>
        <h2>Pequeñas apps.<br />Grandes posibilidades.</h2>
        <p>
          Un espacio para aprender, crear<br class="store-desktop-only" />
          y hacer más de lo que te gusta.
        </p>
        <RouterLink to="/store?sort=trending"
          >Explora las tendencias <StoreIcon name="arrow"
        /></RouterLink>
      </div>
      <div class="store-banner-art" aria-hidden="true">
        <span class="store-orbit store-orbit-one" /><span class="store-orbit store-orbit-two" />
        <div class="store-art-tile store-art-tile-one"><StoreIcon name="spark" /></div>
        <div class="store-art-phone">
          <div class="store-phone-notch" />
          <StoreIcon name="spark" /><span>Tu próxima<br /><strong>gran idea.</strong></span>
          <div class="store-art-lines"><i /><i /><i /></div>
          <div class="store-art-dots"><i /><i /><i /></div>
        </div>
        <div class="store-art-tile store-art-tile-two"><StoreIcon name="heart" /></div>
      </div>
    </section>
    <template v-if="home">
      <section class="store-home-highlights">
        <div class="store-section-heading">
          <h2>Populares ahora</h2>
          <RouterLink class="store-link" to="/store?sort=downloads">Ver todas →</RouterLink>
        </div>
        <StoreState
          :loading="store.popular.loading"
          :error="store.popular.error"
          :empty="!!store.popular.data && !store.popular.data.applications.data.length"
          message="Las próximas favoritas están por llegar"
          @retry="store.loadPopular"
        />
        <div v-if="store.popular.data" class="store-app-grid">
          <AppCard
            v-for="app in store.popular.data.applications.data.slice(0, 4)"
            :key="app.id"
            :application="app"
          />
        </div>
      </section>
      <section
        v-if="
          store.trending.loading ||
          store.trending.error ||
          store.trending.data?.applications.data.length
        "
        class="store-home-highlights"
      >
        <div class="store-section-heading">
          <h2>En tendencia</h2>
          <RouterLink class="store-link" to="/store?sort=trending">Ver todas →</RouterLink>
        </div>
        <StoreState
          :loading="store.trending.loading"
          :error="store.trending.error"
          @retry="store.loadTrending"
        />
        <div v-if="store.trending.data" class="store-app-grid">
          <AppCard
            v-for="app in store.trending.data.applications.data.slice(0, 4)"
            :key="app.id"
            :application="app"
          />
        </div>
      </section>
    </template>
    <section class="store-discovery" aria-label="Filtros de aplicaciones">
      <div class="store-section-heading">
        <h2>{{ home ? 'Explora a tu manera' : 'Afinar la búsqueda' }}</h2>
        <button v-if="!home" class="store-link" @click="router.push('/store')">
          Limpiar filtros
        </button>
      </div>
      <div class="store-category-chips">
        <button
          :class="['store-chip', { 'store-chip-active': !filters.category }]"
          @click="category('')"
        >
          <StoreIcon name="grid" />Todas</button
        ><button
          v-for="item in bundle?.categories || []"
          :key="item.id"
          :class="['store-chip', { 'store-chip-active': filters.category === item.slug }]"
          @click="category(item.slug)"
        >
          {{ item.name }}
        </button>
      </div>
      <div class="store-filter-row">
        <label
          >Precio<select v-model="filters.free" @change="apply">
            <option value="">Todos los precios</option>
            <option value="1">Gratis</option>
            <option value="0">De pago</option>
          </select></label
        ><label
          >Ordenar por<select v-model="filters.sort" @change="apply">
            <option value="newest">Más recientes</option>
            <option value="rating">Mejor valoradas</option>
            <option value="downloads">Más descargadas</option>
            <option value="trending">En tendencia</option>
          </select></label
        >
      </div>
    </section>
    <StoreState :loading="store.catalogue.loading" :error="store.catalogue.error" @retry="load" />
    <section v-if="bundle && !store.catalogue.loading" class="store-catalogue">
      <div class="store-section-heading">
        <h2>{{ home ? 'Recién llegadas' : 'Aplicaciones para ti' }}</h2>
        <span class="store-muted store-small"
          >{{ bundle.applications.meta.total }}
          {{ bundle.applications.meta.total === 1 ? 'resultado' : 'resultados' }}</span
        >
      </div>
      <StoreState :empty="!bundle.applications.data.length" message="No encontramos aplicaciones"
        ><button class="store-button store-button-secondary" @click="router.push('/store')">
          Ver todas las aplicaciones
        </button></StoreState
      >
      <div class="store-app-grid">
        <AppCard v-for="app in bundle.applications.data" :key="app.id" :application="app" />
      </div>
      <StorePagination :meta="bundle.applications.meta" @change="page" />
    </section>
    <section v-if="home" class="store-discover-note">
      <span class="store-note-icon"><StoreIcon name="spark" /></span>
      <div>
        <h2>Tu próxima favorita está por aquí.</h2>
        <p>Explora nuevas ideas de desarrolladores independientes.</p>
      </div>
      <RouterLink to="/store?sort=rating" class="store-link"
        >Mejor valoradas <StoreIcon name="arrow"
      /></RouterLink>
    </section>
  </StoreShell>
</template>
