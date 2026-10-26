<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from '@/stores/store'
import { dateLabel, statusLabels } from '@/lib/store'
import StoreShell from '@/components/store/StoreShell.vue'
import StoreState from '@/components/store/StoreState.vue'
import ApplicationPresentation from '@/components/store/ApplicationPresentation.vue'
const store = useStore()
const route = useRoute()
const app = computed(() => store.developerDetail.data?.application)
function load() {
  return store.loadDeveloperDetail(String(route.params.id))
}
watch(() => route.params.id, load, { immediate: true })
</script>
<template>
  <StoreShell title="Tu aplicación" subtitle="Todos los detalles de tu creación, en un solo lugar."
    ><RouterLink class="store-back" to="/developer/dashboard"
      >← Volver a mis aplicaciones</RouterLink
    ><StoreState
      :loading="store.developerDetail.loading"
      :error="store.developerDetail.error"
      @retry="load"
    /><template v-if="app && !store.developerDetail.loading"
      ><p v-if="route.query.published === '1'" class="store-success store-panel" role="status">
        Tu aplicación se ha publicado correctamente.
      </p>
      <section class="store-publication-status store-panel">
        <div>
          <p class="store-eyebrow">ESTADO ACTUAL</p>
          <h2>{{ statusLabels[app.status] }}</h2>
          <p class="store-muted">
            {{
              app.published_at
                ? `Publicada el ${dateLabel(app.published_at)}`
                : 'Esta aplicación no está publicada en el catálogo.'
            }}
          </p>
        </div>
        <RouterLink
          v-if="app.status === 'approved' && app.published_at"
          :to="`/store/${app.id}`"
          class="store-button"
          >Ver en la tienda →</RouterLink
        >
      </section>
      <ApplicationPresentation :application="app" own
        ><template #action
          ><span class="store-badge" :class="`store-status-${app.status}`">{{
            statusLabels[app.status]
          }}</span></template
        ></ApplicationPresentation
      ></template
    ></StoreShell
  >
</template>
