<script setup lang="ts">
withDefaults(defineProps<{ name?: string }>(), { name: 'grid' })
const paths: Record<string, string> = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  download: 'M12 3v12 m-5-5 5 5 5-5 M3 16v5h18v-5',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  plus: 'M12 3v18 M3 12h18',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  logout: 'M9 21H3V3h6 M9 12h12 m-5-5 5 5-5 5',
  check: 'm5 12 4 4L20 5',
  image: 'M3 3h18v18H3z m0 13 5-5 5 5 3-3 5 5 M8 7h.01',
  spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  chart: 'M3 3v18h18 M7 16v-4 m5 4V8 m5 8V5',
}
</script>
<template>
  <svg
    class="store-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.grid" />
  </svg>
</template>
