import { onScopeDispose, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from '@/stores/store'

/** A completion may affect navigation/form state only in its original route and session. */
export function useRouteOperation() {
  const route = useRoute()
  const store = useStore()
  let active = true
  let revision = 0
  watch(
    () => route.fullPath,
    () => {
      revision++
    },
    { flush: 'sync' },
  )
  onScopeDispose(() => {
    active = false
  })
  return () => {
    const origin = revision
    const session = store.sessionVersion
    return () => active && revision === origin && store.sessionVersion === session
  }
}
