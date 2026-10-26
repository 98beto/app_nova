<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@/stores/store'
import { dateLabel } from '@/lib/store'
import StoreShell from '@/components/store/StoreShell.vue'
import StoreState from '@/components/store/StoreState.vue'
import StorePagination from '@/components/store/StorePagination.vue'
import AppIcon from '@/components/store/AppIcon.vue'
import StoreIcon from '@/components/store/StoreIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()
const bundle = computed(() => store.library.data)
function load() {
  return store.loadLibrary(String(route.query.library_page || '1'))
}
watch(() => route.query.library_page, load, { immediate: true })
function page(value: number) {
  void router.push({ query: { ...route.query, library_page: String(value) } })
}
</script>

<template>
  <StoreShell title="Mi biblioteca">
    <StoreState :loading="store.library.loading" :error="store.library.error" @retry="load" />
    <section v-if="bundle && !store.library.loading" class="store-library">
      <div class="store-section-heading">
        <RouterLink to="/store" class="store-link">Descubrir más →</RouterLink>
      </div>
      <div class="store-library-list">
        <StoreState :empty="!bundle.library.data.length" message="Tu biblioteca está por descubrir">
          <RouterLink class="store-link" to="/store">Explora el catálogo →</RouterLink>
        </StoreState>
        <article
          v-for="item in bundle.library.data"
          :key="item.id"
          class="store-panel store-library-item"
        >
          <template v-if="item.application && item.available">
            <AppIcon
              :url="item.application.icon_url"
              :name="item.application.name"
              :id="item.application.id"
            />
            <div>
              <RouterLink :to="`/store/${item.application_id}`"
                ><h3>{{ item.application.name }}</h3></RouterLink
              >
              <p class="store-muted">Instalada · {{ dateLabel(item.downloaded_at) }}</p>
            </div>
            <span class="store-badge store-status-approved">INSTALADA</span>
            <RouterLink
              :to="`/store/${item.application_id}#reviews`"
              class="store-link store-library-review"
              >Escribir reseña →</RouterLink
            >
          </template>
          <template v-else>
            <span class="store-stat-icon"><StoreIcon name="grid" /></span>
            <div>
              <h3>Aplicación no disponible</h3>
              <p class="store-muted">Instalada el {{ dateLabel(item.downloaded_at) }}</p>
            </div>
            <span class="store-badge">NO DISPONIBLE</span>
          </template>
        </article>
      </div>
      <StorePagination :meta="bundle.library.meta" label="Páginas de biblioteca" @change="page" />
    </section>
  </StoreShell>
</template>
