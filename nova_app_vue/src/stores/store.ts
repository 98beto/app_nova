import { defineStore } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { apiRequest, ApiError, initializeCsrf } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type {
  ApplicationDetailBundle,
  CatalogueBundle,
  Category,
  DeveloperApplicationBundle,
  DeveloperBundle,
  InstallBundle,
  LikeBundle,
  ProfileBundle,
  ProfileInput,
  PublicationInput,
  ReviewInput,
} from '@/types/store'

type Resource<T> = { data: T | null; loading: boolean; error: string; sequence: number }
function resource<T>(): Resource<T> {
  return { data: null, loading: false, error: '', sequence: 0 }
}

export const useStore = defineStore('store', () => {
  const auth = useAuthStore()
  const catalogue = reactive(resource<CatalogueBundle>())
  const popular = reactive(resource<CatalogueBundle>())
  const trending = reactive(resource<CatalogueBundle>())
  const detail = reactive(resource<ApplicationDetailBundle>())
  const developer = reactive(resource<DeveloperBundle>())
  const categories = reactive(resource<{ categories: Category[] }>())
  const developerDetail = reactive(resource<DeveloperApplicationBundle>())
  const profile = reactive(resource<ProfileBundle>())
  const saving = ref(false)
  const actionError = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})
  const progress = ref(0)
  const progressApplicationId = ref<number | null>(null)
  const liking = ref<number[]>([])
  const sessionVersion = ref(0)
  const publicationNotice = ref<{ id: number; name: string } | null>(null)
  let actionVersion = 0

  function reset() {
    sessionVersion.value++
    actionVersion++
    for (const state of [
      catalogue,
      popular,
      trending,
      detail,
      developer,
      categories,
      developerDetail,
      profile,
    ]) {
      state.sequence++
      state.data = null
      state.loading = false
      state.error = ''
    }
    actionError.value = ''
    fieldErrors.value = {}
    progress.value = 0
    progressApplicationId.value = null
    publicationNotice.value = null
  }
  watch(() => auth.user?.id, reset, { flush: 'sync' })

  function handleError(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        auth.user = null
        const redirect = router.currentRoute.value.fullPath
        void router.push({ path: '/login', query: { redirect } })
        return 'Tu sesión expiró. Inicia sesión para continuar.'
      }
      return error.message
    }
    return 'No se pudo conectar con AppNova. Inténtalo de nuevo.'
  }
  async function load<T>(state: Resource<T>, path: string, keepData = false) {
    const sequence = ++state.sequence
    state.loading = !keepData || state.data === null
    state.error = ''
    if (state.loading) state.data = null
    try {
      const result = await apiRequest<T>(path)
      if (state.sequence === sequence) state.data = result
    } catch (error) {
      if (state.sequence === sequence) state.error = handleError(error)
    } finally {
      if (state.sequence === sequence) state.loading = false
    }
  }
  function requireLogin() {
    if (auth.user) return true
    void router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return false
  }
  async function mutate<T>(action: () => Promise<T>): Promise<T | null> {
    if (saving.value || !requireLogin()) return null
    const currentSession = sessionVersion.value
    const version = actionVersion
    saving.value = true
    actionError.value = ''
    fieldErrors.value = {}
    try {
      await initializeCsrf()
      if (currentSession !== sessionVersion.value) return null
      const result = await action()
      return currentSession === sessionVersion.value ? result : null
    } catch (error) {
      if (currentSession === sessionVersion.value) {
        if (version === actionVersion) {
          actionError.value = handleError(error)
          fieldErrors.value = error instanceof ApiError ? error.errors : {}
        } else if (error instanceof ApiError && error.status === 401) handleError(error)
      }
      return null
    } finally {
      saving.value = false
    }
  }
  function json(method: string, value: unknown): RequestInit {
    return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }
  }
  function applyDetail(bundle: ApplicationDetailBundle, sequence: number) {
    if (sequence === detail.sequence && detail.data?.application.id === bundle.application.id) {
      detail.sequence++
      detail.data = bundle
      detail.loading = false
    }
    if (router.currentRoute.value.path === '/profile') {
      const query = new URLSearchParams()
      for (const key of ['library_page', 'reviews_page']) {
        const value = router.currentRoute.value.query[key]
        if (typeof value === 'string') query.set(key, value)
      }
      void load(profile, `/api/v1/profile?${query}`)
    }
    for (const state of [catalogue, popular, trending]) {
      if (state.data)
        state.data.applications.data = state.data.applications.data.map((app) =>
          app.id === bundle.application.id ? bundle.application : app,
        )
    }
  }
  async function install() {
    const app = detail.data?.application
    if (!app || !app.is_free || app.installed || saving.value || !requireLogin()) return
    const sequence = detail.sequence
    progress.value = 12
    progressApplicationId.value = app.id
    const timer = setInterval(() => {
      progress.value = Math.min(90, progress.value + 14)
    }, 120)
    const result = await mutate(async () => {
      const [bundle] = await Promise.all([
        apiRequest<InstallBundle>(`/api/v1/applications/${app.id}/downloads`, { method: 'POST' }),
        new Promise((resolve) => setTimeout(resolve, 650)),
      ])
      return bundle
    })
    clearInterval(timer)
    progress.value = result ? 100 : 0
    if (result) applyDetail(result, sequence)
  }
  async function saveReview(input: ReviewInput) {
    const app = detail.data?.application
    if (!app?.installed) return false
    const sequence = detail.sequence
    const result = await mutate(() =>
      apiRequest<ApplicationDetailBundle>(
        `/api/v1/applications/${app.id}/review`,
        json('PUT', input),
      ),
    )
    if (result) applyDetail(result, sequence)
    return !!result
  }
  async function likeReview(id: number, liked: boolean) {
    if (liking.value.includes(id) || !requireLogin()) return
    const sequence = detail.sequence
    const currentSession = sessionVersion.value
    liking.value.push(id)
    actionError.value = ''
    try {
      await initializeCsrf()
      const result = await apiRequest<LikeBundle>(
        `/api/v1/reviews/${id}/like`,
        json('PUT', { liked }),
      )
      if (sequence === detail.sequence && detail.data) {
        detail.data.reviews.data = detail.data.reviews.data.map((review) =>
          review.id === id ? result.review : review,
        )
      }
    } catch (error) {
      if (currentSession === sessionVersion.value && sequence === detail.sequence)
        actionError.value = handleError(error)
    } finally {
      liking.value = liking.value.filter((value) => value !== id)
    }
  }
  async function saveProfile(input: ProfileInput) {
    const form = new FormData()
    form.append('_method', 'PATCH')
    Object.entries(input).forEach(([key, value]) =>
      form.append(key, value instanceof File ? value : String(value)),
    )
    const sequence = profile.sequence
    const result = await mutate(() =>
      apiRequest<ProfileBundle>('/api/v1/profile', { method: 'POST', body: form }),
    )
    if (result) {
      if (sequence === profile.sequence) {
        profile.sequence++
        profile.data = result
        profile.loading = false
      }
      if (auth.user) Object.assign(auth.user, result.profile)
    }
    return !!result
  }
  async function publish(input: PublicationInput) {
    const form = new FormData()
    for (const key of ['name', 'description', 'category_id', 'minimum_age', 'price'] as const)
      form.append(key, String(input[key]))
    form.append('icon', input.icon)
    input.screenshots.forEach((file) => form.append('screenshots[]', file))
    const result = await mutate(() =>
      apiRequest<ApplicationDetailBundle>('/api/v1/developer/applications', {
        method: 'POST',
        body: form,
      }),
    )
    if (result) {
      developer.sequence++
      if (
        router.currentRoute.value.path === '/developer/dashboard' ||
        router.currentRoute.value.path === '/developer/applications'
      ) {
        void load(
          developer,
          `/api/v1/developer/applications?page=${encodeURIComponent(String(router.currentRoute.value.query.page || '1'))}`,
          true,
        )
      }
    }
    return result
  }
  function clearAction() {
    actionVersion++
    actionError.value = ''
    fieldErrors.value = {}
    progress.value = 0
  }
  return {
    catalogue,
    sessionVersion,
    publicationNotice,
    popular,
    trending,
    detail,
    developer,
    categories,
    developerDetail,
    profile,
    saving,
    actionError,
    fieldErrors,
    progress,
    progressApplicationId,
    liking,
    loadCatalogue: (query = '') =>
      load(catalogue, `/api/v1/applications${query ? `?${query}` : ''}`),
    loadPopular: () => load(popular, '/api/v1/applications?sort=downloads'),
    loadTrending: () => load(trending, '/api/v1/applications?sort=trending'),
    loadDetail: (id: string, page = '1') =>
      load(
        detail,
        `/api/v1/applications/${encodeURIComponent(id)}?reviews_page=${encodeURIComponent(page)}`,
      ),
    loadDeveloper: (page = '1') =>
      load(developer, `/api/v1/developer/applications?page=${encodeURIComponent(page)}`),
    loadCategories: () => load(categories, '/api/v1/categories'),
    loadDeveloperDetail: (id: string) =>
      load(developerDetail, `/api/v1/developer/applications/${encodeURIComponent(id)}`),
    loadProfile: (query = '') => load(profile, `/api/v1/profile${query ? `?${query}` : ''}`),
    install,
    saveReview,
    likeReview,
    saveProfile,
    publish,
    clearAction,
    reset,
  }
})
