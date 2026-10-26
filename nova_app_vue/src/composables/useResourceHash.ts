import { nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

/** Revisit a deep link once its asynchronous resource has actually rendered. */
export function useResourceHash(ready: () => boolean) {
  const route = useRoute()
  watch(
    () => [route.fullPath, ready()],
    async (_, __, onCleanup) => {
      if (!ready() || !route.hash) return
      const origin = route.fullPath
      let current = true
      onCleanup(() => {
        current = false
      })
      await nextTick()
      if (!current || !ready() || route.fullPath !== origin) return
      document
        .getElementById(decodeURIComponent(route.hash.slice(1)))
        ?.scrollIntoView({ block: 'start' })
    },
    { immediate: true, flush: 'post' },
  )
}
