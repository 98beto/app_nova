<script setup lang="ts">
import type { StoreApplication } from '@/types/store'
import { priceLabel, ratingLabel } from '@/lib/store'
import AppIcon from './AppIcon.vue'
import StoreIcon from './StoreIcon.vue'
defineProps<{ application: StoreApplication }>()
</script>
<template>
  <RouterLink :to="`/store/${application.id}`" class="store-app-card"
    ><AppIcon :url="application.icon_url" :name="application.name" :id="application.id" />
    <div class="store-app-card-info">
      <h3>{{ application.name }}</h3>
      <p>{{ application.category.name }}</p>
      <div class="store-app-card-meta">
        <span class="store-rating"
          ><StoreIcon name="star" />{{ ratingLabel(application.average_rating) }}</span
        ><span :class="application.is_free ? 'store-free' : 'store-price'">{{
          application.installed ? 'Instalada' : priceLabel(application)
        }}</span>
      </div>
    </div>
    <StoreIcon class="store-card-arrow" name="arrow"
  /></RouterLink>
</template>
