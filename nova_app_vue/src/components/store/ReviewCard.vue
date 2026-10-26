<script setup lang="ts">
import type { StoreReview } from '@/types/store'
import { dateLabel } from '@/lib/store'
import StoreIcon from './StoreIcon.vue'
defineProps<{ review: StoreReview; busy?: boolean; showLike?: boolean }>()
defineEmits<{ like: [id: number, liked: boolean] }>()
</script>
<template>
  <article class="store-review store-panel">
    <header>
      <span class="store-avatar"
        ><img v-if="review.author.avatar_url" :src="review.author.avatar_url" alt="" /><template
          v-else
          >{{ review.author.name.slice(0, 1) }}</template
        ></span
      >
      <div>
        <strong
          >{{ review.author.name
          }}<span v-if="review.is_own" class="store-own-label"> · Tú</span></strong
        >
        <p class="store-stars" :aria-label="`${review.rating} de 5 estrellas`">
          {{ '★'.repeat(review.rating) }}<span>{{ '★'.repeat(5 - review.rating) }}</span>
        </p>
      </div>
      <time :datetime="review.created_at || undefined">{{ dateLabel(review.created_at) }}</time>
    </header>
    <p v-if="review.body" class="store-review-body">{{ review.body }}</p>
    <button
      v-if="showLike && !review.is_own"
      class="store-like"
      :class="{ 'store-liked': review.liked }"
      :aria-pressed="review.liked"
      :disabled="busy"
      @click="$emit('like', review.id, !review.liked)"
    >
      <StoreIcon name="heart" />{{ review.likes_count }} · Me resulta útil</button
    ><span v-else class="store-muted store-small"
      >{{ review.likes_count }} personas encontraron útil esta reseña</span
    >
  </article>
</template>
