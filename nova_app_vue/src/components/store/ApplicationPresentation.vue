<script setup lang="ts">
import { computed } from 'vue'
import type { StoreApplication } from '@/types/store'
import { priceLabel, ratingLabel, statusLabels } from '@/lib/store'
import AppIcon from './AppIcon.vue'
import StoreIcon from './StoreIcon.vue'
const props = defineProps<{ application: StoreApplication; own?: boolean }>()
const screenshots = computed(() =>
  [...props.application.screenshots].sort((a, b) => a.position - b.position),
)
</script>
<template>
  <section class="store-presentation">
    <div class="store-app-hero">
      <AppIcon :url="application.icon_url" :name="application.name" :id="application.id" />
      <div class="store-app-heading">
        <p class="store-eyebrow">{{ application.category.name }}</p>
        <h2>{{ application.name }}</h2>
        <p class="store-developer-name">{{ application.developer.company_name }}</p>
      </div>
      <div class="store-install-action"><slot name="action" /></div>
    </div>
    <div class="store-app-facts">
      <div>
        <strong
          ><StoreIcon name="star" />{{
            application.average_rating === null ? '—' : ratingLabel(application.average_rating)
          }}</strong
        ><span>{{
          application.average_rating === null
            ? 'Sin valoraciones'
            : `${application.reviews_count} reseñas`
        }}</span>
      </div>
      <div>
        <strong
          ><StoreIcon name="download" />{{
            application.downloads_count.toLocaleString('es')
          }}</strong
        ><span>Descargas</span>
      </div>
      <div>
        <strong>{{ application.minimum_age }}+</strong><span>Edad mínima</span>
      </div>
      <div>
        <strong>{{ priceLabel(application) }}</strong
        ><span>{{ own ? statusLabels[application.status] : 'Precio' }}</span>
      </div>
    </div>
    <div v-if="screenshots.length" class="store-screenshots">
      <img
        v-for="image in screenshots"
        :key="image.position"
        :src="image.url"
        :alt="`${application.name} — captura ${image.position}`"
        loading="lazy"
      />
    </div>
    <section class="store-about">
      <h2>Acerca de esta app</h2>
      <p>{{ application.description }}</p>
    </section>
  </section>
</template>
