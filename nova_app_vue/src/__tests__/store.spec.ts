import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { apiRequest, ApiError, initializeCsrf } from '@/lib/api'
import { useStore } from '@/stores/store'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { catalogueQuery, filtersFromQuery, imageError } from '@/lib/store'
import type {
  ApplicationDetailBundle,
  CatalogueBundle,
  DeveloperBundle,
  LibraryBundle,
  ProfileBundle,
  StoreApplication,
} from '@/types/store'
import StoreView from '@/views/StoreView.vue'
import ApplicationView from '@/views/ApplicationView.vue'
import PublicationForm from '@/components/store/PublicationForm.vue'
import ProfileView from '@/views/ProfileView.vue'
import LibraryView from '@/views/LibraryView.vue'
import DeveloperDashboardView from '@/views/DeveloperDashboardView.vue'
import DeveloperCreateView from '@/views/DeveloperCreateView.vue'

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
      public errors: Record<string, string[]> = {},
    ) {
      super(message)
    }
  },
  apiRequest: vi.fn<typeof apiRequest>(),
  initializeCsrf: vi.fn<typeof initializeCsrf>(),
}))

const user = {
  id: 7,
  name: 'Ana',
  email: 'ana@example.com',
  avatar_url: null,
  gender: 'female' as const,
  birth_date: '1990-01-01',
  role: 'user' as const,
  status: 'active' as const,
}
const app: StoreApplication = {
  id: 42,
  slug: 'notes',
  name: 'Notas',
  description: 'Tus ideas, ordenadas.',
  icon_url: null,
  minimum_age: 0,
  price: '0.00',
  is_free: true,
  status: 'approved',
  published_at: '2026-10-25T12:00:00Z',
  category: { id: 1, name: 'Productividad', slug: 'productividad' },
  developer: { id: 3, company_name: 'Estudio' },
  screenshots: [1, 2, 3, 4].map((position) => ({ position, url: `/image-${position}.png` })),
  downloads_count: 0,
  trending_downloads_count: 0,
  reviews_count: 0,
  average_rating: null,
  installed: false,
}
const meta = { current_page: 1, last_page: 1, per_page: 12, total: 1 }
function detail(installed = false): ApplicationDetailBundle {
  return {
    application: { ...app, installed },
    reviews: { data: [], meta: { ...meta, total: 0 } },
    own_review: null,
    similar: [],
    same_developer: [],
  }
}
function catalogue(name = 'Notas'): CatalogueBundle {
  return {
    applications: { data: [{ ...app, name }], meta },
    categories: [{ ...app.category, description: null }],
    filters: { search: '', category: null, free: null, sort: 'newest' },
  }
}
function developerBundle(): DeveloperBundle {
  return {
    ...catalogue(),
    applications: { data: [app], meta: { ...meta, last_page: 2, total: 13 } },
    summary: {
      applications_count: 13,
      published_count: 10,
      downloads_count: 1234,
      reviews_count: 0,
      average_rating: null,
    },
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function profileBundle(): ProfileBundle {
  return {
    profile: { ...user },
    reviews: { data: [], meta },
    summary: { downloads_count: 0, reviews_count: 0 },
  }
}
function libraryBundle(): LibraryBundle {
  return {
    library: {
      data: [
        {
          id: 1,
          application_id: 42,
          downloaded_at: '2026-10-25',
          application: { ...app, installed: true },
          available: true,
        },
        {
          id: 2,
          application_id: 99,
          downloaded_at: '2026-10-24',
          application: null,
          available: false,
        },
      ],
      meta: { ...meta, total: 13, last_page: 2 },
    },
    summary: { downloads_count: 13 },
  }
}
function mockPreviews() {
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn<(file: Blob) => string>().mockReturnValue('blob:preview')
      static revokeObjectURL = vi.fn<(url: string) => void>()
    },
  )
}
async function fillPublication(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('input').setValue('Mi aplicación')
  await wrapper.get('textarea').setValue('Una descripción real')
  await wrapper.get('select').setValue('1')
  for (const input of wrapper.findAll('input[type="file"]')) {
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [new File(['png'], 'image.png', { type: 'image/png' })],
    })
    await input.trigger('change')
  }
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.mocked(initializeCsrf).mockResolvedValue(undefined)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('contrato de tienda y orden de solicitudes', () => {
  it.each(['response', 'error'] as const)(
    'descarta biblioteca pendiente (%s) y limpia recursos al cambiar identidad',
    async (outcome) => {
      const auth = useAuthStore()
      auth.user = user
      const store = useStore()
      vi.mocked(apiRequest).mockResolvedValueOnce(libraryBundle())
      await store.loadLibrary()
      expect(store.library.data?.summary.downloads_count).toBe(13)
      const pending = deferred<LibraryBundle>()
      vi.mocked(apiRequest).mockReturnValueOnce(pending.promise)
      const old = store.loadLibrary('2')
      auth.user = { ...user, id: 8 }
      expect(store.library).toMatchObject({ data: null, loading: false, error: '' })
      const current = libraryBundle()
      current.library.data = []
      current.summary.downloads_count = 0
      vi.mocked(apiRequest).mockResolvedValueOnce(current)
      await store.loadLibrary()
      if (outcome === 'response') pending.resolve(libraryBundle())
      else pending.reject(new ApiError(401, 'Sesión anterior'))
      await old
      expect(store.library.data).toEqual(current)
      expect(store.library.error).toBe('')
      expect(auth.user?.id).toBe(8)
      auth.user = null
      expect(store.library).toMatchObject({ data: null, loading: false, error: '' })
    },
  )

  it('obtiene populares y tendencias mediante ordenaciones reales del backend', async () => {
    vi.mocked(apiRequest).mockResolvedValue(catalogue())
    const store = useStore()
    await Promise.all([store.loadPopular(), store.loadTrending()])
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/applications?sort=downloads')
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/applications?sort=trending')
    expect(store.popular.data?.applications.data[0]?.downloads_count).toBe(0)
    expect(store.trending.data?.applications.data[0]?.average_rating).toBeNull()
  })
  it('ignora las respuestas y errores anteriores al último filtro solicitado', async () => {
    const first = deferred<CatalogueBundle>(),
      second = deferred<CatalogueBundle>()
    vi.mocked(apiRequest).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const store = useStore()
    const old = store.loadCatalogue('search=old'),
      latest = store.loadCatalogue('free=1&sort=rating')
    second.resolve(catalogue('Última'))
    await latest
    first.reject(new ApiError(500, 'Error anterior'))
    await old
    expect(store.catalogue.data?.applications.data[0]?.name).toBe('Última')
    expect(store.catalogue.error).toBe('')
    expect(store.catalogue.loading).toBe(false)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/applications?free=1&sort=rating')
  })

  it('limpia datos privados y descarta cargas pendientes al cambiar de sesión', async () => {
    const auth = useAuthStore()
    auth.user = user
    const store = useStore(),
      pending = deferred<ProfileBundle>()
    vi.mocked(apiRequest).mockReturnValueOnce(pending.promise)
    const load = store.loadProfile()
    auth.user = null
    await nextTick()
    pending.resolve({ profile: user } as ProfileBundle)
    await load
    expect(store.profile.data).toBeNull()
  })

  it('descarta categorías pendientes y su error tras cambiar de sesión', async () => {
    const auth = useAuthStore()
    auth.user = { ...user, role: 'developer' }
    const store = useStore()
    const pending = deferred<{ categories: CatalogueBundle['categories'] }>()
    vi.mocked(apiRequest).mockReturnValueOnce(pending.promise)
    const loading = store.loadCategories()
    auth.user = null
    pending.reject(new ApiError(401, 'Sesión anterior'))
    await loading
    expect(store.categories).toMatchObject({ data: null, error: '', loading: false })
    expect(store.actionError).toBe('')
  })

  it('no permite que un detalle anterior sustituya otra aplicación', async () => {
    const old = deferred<ApplicationDetailBundle>(),
      current = deferred<ApplicationDetailBundle>()
    vi.mocked(apiRequest).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
    const store = useStore()
    const firstLoad = store.loadDetail('42'),
      nextLoad = store.loadDetail('99', '2')
    current.resolve({ ...detail(), application: { ...app, id: 99 } })
    await nextLoad
    old.resolve(detail())
    await firstLoad
    expect(store.detail.data?.application.id).toBe(99)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/applications/99?reviews_page=2')
  })

  it('requiere sesión para instalar y no envía una descarga anónima', async () => {
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined)
    const store = useStore()
    store.detail.data = detail()
    await store.install()
    expect(apiRequest).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ path: '/login' }))
    expect(store.progress).toBe(0)
  })

  it('persiste la instalación gratuita una sola vez y permite después una reseña', async () => {
    vi.useFakeTimers()
    useAuthStore().user = user
    const store = useStore()
    store.detail.data = detail()
    vi.mocked(apiRequest).mockResolvedValue({
      ...detail(true),
      download: { id: 9, application_id: 42, downloaded_at: '2026-10-25' },
    })
    const installing = store.install()
    await vi.advanceTimersByTimeAsync(700)
    await installing
    expect(initializeCsrf).toHaveBeenCalled()
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/applications/42/downloads', { method: 'POST' })
    expect(store.detail.data?.application.installed).toBe(true)
    expect(store.progress).toBe(100)
    await store.install()
    expect(apiRequest).toHaveBeenCalledTimes(1)
    vi.mocked(apiRequest).mockResolvedValue(detail(true))
    await store.saveReview({ rating: 4, body: 'Buena app' })
    expect(apiRequest).toHaveBeenLastCalledWith(
      '/api/v1/applications/42/review',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ rating: 4, body: 'Buena app' }),
      }),
    )
  })

  it('no instala aplicaciones de pago ni publica reseñas antes de instalar', async () => {
    useAuthStore().user = user
    const store = useStore()
    store.detail.data = detail()
    await store.saveReview({ rating: 5 })
    store.detail.data.application.is_free = false
    await store.install()
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('no muestra el resultado de una instalación en otra aplicación abierta durante la solicitud', async () => {
    vi.useFakeTimers()
    useAuthStore().user = user
    const store = useStore()
    store.detail.data = detail()
    const pending = deferred<ApplicationDetailBundle>()
    vi.mocked(apiRequest).mockReturnValueOnce(pending.promise)
    const installation = store.install()
    await vi.advanceTimersByTimeAsync(10)
    store.clearAction()
    vi.mocked(apiRequest).mockResolvedValueOnce({ ...detail(), application: { ...app, id: 99 } })
    await store.loadDetail('99')
    pending.resolve(detail(true))
    await vi.advanceTimersByTimeAsync(700)
    await installation
    expect(store.detail.data?.application.id).toBe(99)
    expect(store.detail.data?.application.installed).toBe(false)
    expect(store.progressApplicationId).toBe(42)
  })

  it('envía el estado deseado de me gusta y reemplaza la reseña con la del servidor', async () => {
    useAuthStore().user = user
    const store = useStore()
    store.detail.data = detail()
    const review = {
      id: 8,
      application_id: 42,
      author: { id: 99, name: 'Luis', avatar_url: null },
      rating: 4,
      body: 'Bien',
      likes_count: 1,
      liked: false,
      is_own: false,
      created_at: null,
      updated_at: null,
    }
    store.detail.data.reviews.data = [review]
    vi.mocked(apiRequest).mockResolvedValue({ review: { ...review, liked: true, likes_count: 2 } })
    await store.likeReview(8, true)
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/v1/reviews/8/like',
      expect.objectContaining({ method: 'PUT', body: '{"liked":true}' }),
    )
    expect(store.detail.data.reviews.data[0]?.likes_count).toBe(2)
    expect(store.liking).toEqual([])
  })

  it('envía el perfil multipart con _method PATCH y actualiza la identidad compartida', async () => {
    useAuthStore().user = { ...user }
    const store = useStore()
    vi.mocked(apiRequest).mockResolvedValue({
      profile: { ...user, name: 'Nuevo nombre' },
      reviews: { data: [], meta },
      summary: { downloads_count: 0, reviews_count: 0 },
    })
    const avatar = new File(['png'], 'avatar.png', { type: 'image/png' })
    expect(await store.saveProfile({ name: 'Nuevo nombre', avatar })).toBe(true)
    const options = vi.mocked(apiRequest).mock.calls[0]![1] as RequestInit
    const body = options.body as FormData
    expect(options.method).toBe('POST')
    expect(body.get('_method')).toBe('PATCH')
    expect(body.get('avatar')).toBe(avatar)
    expect(useAuthStore().user?.name).toBe('Nuevo nombre')
  })

  it('muestra los errores 422 y redirige a autenticación cuando expira la sesión', async () => {
    useAuthStore().user = user
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined)
    const store = useStore()
    store.detail.data = detail(true)
    vi.mocked(apiRequest).mockRejectedValueOnce(
      new ApiError(422, 'Revisa los datos', { rating: ['Valor inválido'] }),
    )
    expect(await store.saveReview({ rating: 0 })).toBe(false)
    expect(store.fieldErrors.rating).toEqual(['Valor inválido'])
    expect(store.saving).toBe(false)
    vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError(401, 'Unauthenticated'))
    await store.loadProfile()
    expect(useAuthStore().user).toBeNull()
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ path: '/login' }))
  })
})

describe('interacciones de las vistas', () => {
  it('pagina reseñas del perfil sin consultar instalaciones ni reenviar library_page', async () => {
    const pinia = createPinia()
    useAuthStore(pinia).user = user
    const bundle = profileBundle()
    bundle.summary.downloads_count = 13
    bundle.reviews.meta = { ...meta, last_page: 2, total: 13 }
    bundle.reviews.data = [
      {
        id: 8,
        application_id: 42,
        author: { id: user.id, name: user.name, avatar_url: null },
        rating: 4,
        body: 'Mi experiencia',
        likes_count: 0,
        liked: false,
        is_own: true,
        created_at: null,
        updated_at: null,
      },
    ]
    vi.mocked(apiRequest).mockResolvedValue(bundle)
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/profile', component: ProfileView }],
    })
    await viewRouter.push('/profile?library_page=9')
    const wrapper = mount(ProfileView, { global: { plugins: [pinia, viewRouter] } })
    await flushPromises()
    expect(wrapper.get('.store-profile-summary').text()).toContain('13')
    expect(wrapper.get('.store-review-list').text()).toContain('Mi experiencia')
    expect(wrapper.get('.store-edit-review').attributes('href')).toBe('/store/42#reviews')
    expect(wrapper.find('.store-library-item').exists()).toBe(false)
    await wrapper.findAll('.store-pagination button')[1]!.trigger('click')
    await flushPromises()
    expect(viewRouter.currentRoute.value.query.reviews_page).toBe('2')
    expect(vi.mocked(apiRequest).mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/profile',
      '/api/v1/profile?reviews_page=2',
    ])
    wrapper.unmount()
  })

  it.each(['guest', 'user', 'developer', 'admin'] as const)(
    'protege biblioteca para %s',
    async (role) => {
      const auth = useAuthStore()
      auth.user = role === 'guest' ? null : { ...user, role }
      auth.initialized = true
      await router.push('/store')
      await router.push('/library?library_page=2')
      expect(router.currentRoute.value.fullPath).toBe(
        role === 'guest'
          ? '/login?redirect=/library?library_page=2'
          : role === 'admin'
            ? '/admin/dashboard'
            : '/library?library_page=2',
      )
    },
  )

  it('redirige biblioteca antigua preservando su página', async () => {
    const auth = useAuthStore()
    auth.user = user
    auth.initialized = true
    await router.push('/profile?library_page=2&reviews_page=3#library')
    expect(router.currentRoute.value.fullPath).toBe('/library?library_page=2')
  })

  it.each(['user', 'developer'] as const)(
    'biblioteca %s carga solo instalaciones, reintenta y pagina',
    async (role) => {
      const pinia = createPinia()
      useAuthStore(pinia).user = { ...user, role }
      vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError(500, 'Biblioteca no disponible'))
      const viewRouter = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/library', component: LibraryView }],
      })
      await viewRouter.push('/library')
      const wrapper = mount(LibraryView, { global: { plugins: [pinia, viewRouter] } })
      await flushPromises()
      expect(wrapper.get('h1').text()).toBe('Mi biblioteca')
      expect(wrapper.text()).toContain('Biblioteca no disponible')
      vi.mocked(apiRequest).mockResolvedValueOnce(libraryBundle())
      await wrapper.get('.store-empty button').trigger('click')
      await flushPromises()
      const items = wrapper.findAll('.store-library-item')
      expect(items).toHaveLength(2)
      expect(items[0]!.get('h3').text()).toBe('Notas')
      expect(items[0]!.find('.store-app-icon').exists()).toBe(true)
      expect(items[0]!.get('.store-muted').text()).toContain('Instalada ·')
      expect(items[0]!.get('a').attributes('href')).toBe('/store/42')
      expect(items[0]!.get('.store-library-review').attributes('href')).toBe('/store/42#reviews')
      expect(items[1]!.text()).toContain('Aplicación no disponible')
      expect(items[1]!.find('a').exists()).toBe(false)
      expect(wrapper.get('.store-nav [aria-current="page"]').text()).toBe('Biblioteca')
      expect(wrapper.find('.store-profile-card').exists()).toBe(false)
      expect(wrapper.find('.store-review-list').exists()).toBe(false)
      const empty = libraryBundle()
      empty.library = { data: [], meta: { ...meta, current_page: 2, last_page: 2, total: 13 } }
      vi.mocked(apiRequest).mockResolvedValueOnce(empty)
      await wrapper.findAll('.store-pagination button')[1]!.trigger('click')
      await flushPromises()
      expect(viewRouter.currentRoute.value.fullPath).toBe('/library?library_page=2')
      expect(wrapper.text()).toContain('Tu biblioteca está por descubrir')
      expect(wrapper.findAll('.store-library-item')).toHaveLength(0)
      expect(vi.mocked(apiRequest).mock.calls.map(([path]) => path)).toEqual([
        '/api/v1/library?library_page=1',
        '/api/v1/library?library_page=1',
        '/api/v1/library?library_page=2',
      ])
      wrapper.unmount()
    },
  )

  it.each([
    ['/developer/applications?page=2', '/developer/dashboard?page=2'],
    ['/developer/applications?publish=1#publish', '/developer/applications/create'],
    ['/developer/dashboard?publish=1#publish', '/developer/applications/create'],
    [
      '/developer/dashboard?publish=1&source=legacy#publish',
      '/developer/applications/create?source=legacy',
    ],
  ])('redirige el enlace antiguo %s a %s sin hash', async (from, target) => {
    const auth = useAuthStore()
    auth.user = { ...user, role: 'developer' }
    auth.initialized = true
    await router.push(from)
    expect(router.currentRoute.value.fullPath).toBe(target)
    expect(router.currentRoute.value.params.id).toBeUndefined()
  })

  it.each(['guest', 'user', 'developer'] as const)(
    'protege la ruta create para %s',
    async (role) => {
      const auth = useAuthStore()
      auth.user = role === 'guest' ? null : { ...user, role }
      auth.initialized = true
      await router.push('/store')
      await router.push('/developer/applications/create')
      expect(router.currentRoute.value.path).toBe(
        role === 'guest' ? '/login' : role === 'user' ? '/store' : '/developer/applications/create',
      )
    },
  )

  it.each([null, 4.2])(
    'limita el dashboard a cuatro estadísticas reales (media %s) y la lista propia paginada',
    async (average) => {
      const pinia = createPinia()
      useAuthStore(pinia).user = { ...user, role: 'developer' }
      const bundle = developerBundle()
      bundle.summary.average_rating = average
      bundle.summary.reviews_count = average === null ? 0 : 7
      vi.mocked(apiRequest).mockResolvedValue(bundle)
      const viewRouter = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/developer/dashboard', component: DeveloperDashboardView }],
      })
      await viewRouter.push('/developer/dashboard')
      const wrapper = mount(DeveloperDashboardView, { global: { plugins: [pinia, viewRouter] } })
      await flushPromises()
      expect(wrapper.findAll('.store-stats article strong').map((node) => node.text())).toEqual([
        '13',
        '1234',
        average === null ? '—' : '4.2',
        '—',
      ])
      expect(wrapper.get('.store-stats').text()).toContain(
        average === null ? 'Sin valoraciones' : '7 reseñas recibidas',
      )
      expect(wrapper.get('.store-stats').text()).toContain('Próximamente')
      expect(wrapper.find('form').exists()).toBe(false)
      expect(wrapper.find('.store-payment-card').exists()).toBe(false)
      expect(wrapper.get('.store-own-app').text()).toContain('Notas')
      expect(wrapper.findAll('.store-nav a').map((node) => node.text())).toEqual([
        'Dashboard',
        'Publicar app',
        'Biblioteca',
        'Mi cuenta',
      ])
      expect(wrapper.get('.store-section-heading a').attributes('href')).toBe(
        '/developer/applications/create',
      )
      await wrapper.findAll('.store-pagination button')[1]!.trigger('click')
      await flushPromises()
      expect(viewRouter.currentRoute.value.query.page).toBe('2')
      expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/developer/applications?page=2')
      wrapper.unmount()
    },
  )

  it('carga solo categorías para crear y permite reintentar errores', async () => {
    const pinia = createPinia()
    useAuthStore(pinia).user = { ...user, role: 'developer' }
    vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError(500, 'Categorías no disponibles'))
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/developer/applications/create', component: DeveloperCreateView }],
    })
    await viewRouter.push('/developer/applications/create')
    const wrapper = mount(DeveloperCreateView, { global: { plugins: [pinia, viewRouter] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Categorías no disponibles')
    expect(wrapper.find('form').exists()).toBe(false)
    vi.mocked(apiRequest).mockResolvedValueOnce({ categories: catalogue().categories })
    await wrapper.get('.store-empty button').trigger('click')
    await flushPromises()
    expect(wrapper.get('select').text()).toContain('Productividad')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('.store-stats').exists()).toBe(false)
    expect(wrapper.find('.store-own-app-list').exists()).toBe(false)
    expect(wrapper.find('.store-payment-card').exists()).toBe(false)
    expect(vi.mocked(apiRequest).mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/categories',
      '/api/v1/categories',
    ])
    wrapper.unmount()
  })

  it.each(['user', 'developer'] as const)(
    'muestra PayPal desactivado solo en el perfil developer, no en %s',
    async (role) => {
      const pinia = createPinia()
      useAuthStore(pinia).user = { ...user, role }
      const bundle = profileBundle()
      bundle.profile.role = role
      if (role === 'developer')
        bundle.profile.developer_profile = {
          company_name: 'Estudio',
          payment_status: 'pending',
          activated_at: null,
        }
      vi.mocked(apiRequest).mockResolvedValue(bundle)
      const viewRouter = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/profile', component: ProfileView }],
      })
      await viewRouter.push('/profile')
      const wrapper = mount(ProfileView, { global: { plugins: [pinia, viewRouter] } })
      await flushPromises()
      expect(wrapper.find('.store-payment-card').exists()).toBe(role === 'developer')
      expect(
        wrapper.findAll('.store-payment-card button').map((node) => node.attributes('disabled')),
      ).toEqual(role === 'developer' ? [''] : [])
      expect(
        wrapper.findAll('.store-payment-card a').map((node) => node.attributes('href')),
      ).toEqual(role === 'developer' ? ['/developer/applications/create'] : [])
      expect(wrapper.get('.store-nav [aria-current="page"]').text()).toBe('Mi cuenta')
      expect(wrapper.find('.store-library-list').exists()).toBe(false)
      expect(wrapper.find('#library').exists()).toBe(false)
      expect(wrapper.get('.store-profile-summary a').attributes('href')).toBe('/library')
      expect(wrapper.find('#my-reviews').exists()).toBe(true)
      expect(apiRequest).toHaveBeenCalledTimes(1)
      expect(apiRequest).toHaveBeenCalledWith('/api/v1/profile')
      wrapper.unmount()
    },
  )
  it.each(['/store', '/store?search=notas&free=1&sort=rating&page=2'])(
    'recarga los recursos públicos al cerrar sesión sin cambiar %s e ignora la respuesta de la sesión anterior',
    async (path) => {
      const pinia = createPinia(),
        auth = useAuthStore(pinia)
      auth.user = { ...user }
      const old = deferred<CatalogueBundle>()
      let deferCatalogue = false
      vi.mocked(apiRequest).mockImplementation(async (url) => {
        if (url.endsWith('/auth/logout')) return { data: null }
        if (deferCatalogue && !url.includes('sort=downloads') && !url.endsWith('sort=trending')) {
          deferCatalogue = false
          return old.promise
        }
        const bundle = catalogue()
        bundle.applications.data[0]!.installed = !!auth.user
        return bundle
      })
      const viewRouter = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/store', component: StoreView }],
      })
      await viewRouter.push(path)
      const wrapper = mount(StoreView, { global: { plugins: [pinia, viewRouter] } })
      await flushPromises()
      expect(wrapper.get('.store-app-card').text()).toContain('Instalada')
      const store = useStore(pinia)
      deferCatalogue = true
      const stale = store.loadCatalogue(catalogueQuery(viewRouter.currentRoute.value.query))
      if (path === '/store') await wrapper.get('.store-logout').trigger('click')
      else await auth.logout()
      await flushPromises()
      expect(viewRouter.currentRoute.value.fullPath).toBe(path)
      expect(apiRequest).toHaveBeenCalledWith(
        `/api/v1/applications${path.includes('?') ? `?${path.split('?')[1]}` : ''}`,
      )
      expect(wrapper.get('.store-app-card').text()).toContain('Gratis')
      expect(store.catalogue.data?.applications.data[0]?.installed).toBe(false)
      expect(
        [store.popular.data, store.trending.data].map(
          (bundle) => bundle?.applications.data[0]?.installed ?? null,
        ),
      ).toEqual(path === '/store' ? [false, false] : [null, null])
      const staleBundle = catalogue()
      staleBundle.applications.data[0]!.installed = true
      old.resolve(staleBundle)
      await stale
      await flushPromises()
      expect(store.catalogue.data?.applications.data[0]?.installed).toBe(false)
      wrapper.unmount()
    },
  )

  it('recarga el detalle público al cambiar la identidad sin navegar', async () => {
    const pinia = createPinia(),
      auth = useAuthStore(pinia)
    auth.user = { ...user }
    vi.mocked(apiRequest).mockImplementation(async () => detail(!!auth.user))
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/store/:id', component: ApplicationView }],
    })
    await viewRouter.push('/store/42?reviews_page=2')
    const wrapper = mount(ApplicationView, { global: { plugins: [pinia, viewRouter] } })
    await flushPromises()
    expect(wrapper.get('.store-install-action button').text()).toContain('Instalada')
    auth.user = null
    await flushPromises()
    expect(wrapper.get('.store-install-action button').text()).toContain('Instalar gratis')
    expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/applications/42?reviews_page=2')
    wrapper.unmount()
  })

  it.each([
    { average: null, stars: null, label: '—' },
    { average: 1.2, stars: '★☆☆☆☆', label: '1.2' },
    { average: 3.6, stars: '★★★★☆', label: '3.6' },
  ])(
    'muestra la media real $average sin inventar cinco estrellas',
    async ({ average, stars, label }) => {
      const bundle = detail()
      bundle.application.average_rating = average
      vi.mocked(apiRequest).mockResolvedValue(bundle)
      const viewRouter = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/store/:id', component: ApplicationView }],
      })
      await viewRouter.push('/store/42')
      const wrapper = mount(ApplicationView, { global: { plugins: [createPinia(), viewRouter] } })
      await flushPromises()
      expect(wrapper.get('.store-rating-summary strong').text()).toBe(label)
      expect(wrapper.get('.store-rating-summary .store-muted').text()).toBe(
        average === null ? 'Sin valoraciones' : '0 reseñas',
      )
      expect(wrapper.get('.store-app-facts strong').text()).toBe(label)
      expect(wrapper.get('.store-app-facts span').text()).toBe(
        average === null ? 'Sin valoraciones' : '0 reseñas',
      )
      const visual = wrapper.find('.store-rating-summary .store-stars')
      expect(visual.exists() ? visual.text() : null).toBe(stars)
      wrapper.unmount()
    },
  )

  it.each([
    'No cumples la edad mínima de esta aplicación.',
    'Las aplicaciones de pago todavía no están disponibles.',
  ])('muestra el rechazo de adquisición junto al botón: %s', async (reason) => {
    const pinia = createPinia()
    useAuthStore(pinia).user = { ...user }
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(detail())
      .mockRejectedValueOnce(
        new ApiError(422, 'The given data was invalid.', { application: [reason] }),
      )
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/store/:id', component: ApplicationView }],
    })
    await viewRouter.push('/store/42')
    const wrapper = mount(ApplicationView, { global: { plugins: [pinia, viewRouter] } })
    await flushPromises()
    await wrapper.get('.store-install-action button').trigger('click')
    await flushPromises()
    const alert = wrapper.get('.store-install-action [role="alert"]')
    expect(alert.text()).toBe(reason)
    expect(wrapper.get('.store-install-action button').attributes('aria-describedby')).toBe(
      alert.attributes('id'),
    )
    wrapper.unmount()
  })

  it.each([
    {
      path: '/profile#my-reviews',
      target: 'my-reviews',
      component: ProfileView,
      response: profileBundle,
    },
    { path: '/store/42#reviews', target: 'reviews', component: ApplicationView, response: detail },
  ])(
    'desplaza $path solo cuando la carga diferida ha renderizado el destino',
    async ({ path, target, component, response }) => {
      const scroll = vi.fn<() => void>()
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value: scroll,
      })
      const pending = deferred<unknown>()
      vi.mocked(apiRequest).mockReturnValue(pending.promise)
      const viewRouter = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: path.split('#')[0]!, component }],
      })
      await viewRouter.push(path)
      const wrapper = mount(component, {
        attachTo: document.body,
        global: { plugins: [createPinia(), viewRouter] },
      })
      expect(document.getElementById(target)).toBeNull()
      expect(scroll).not.toHaveBeenCalled()
      pending.resolve(response())
      await flushPromises()
      await nextTick()
      expect(document.getElementById(target)).not.toBeNull()
      expect(scroll).toHaveBeenCalledTimes(1)
      expect(scroll.mock.contexts[0]).toBe(document.getElementById(target))
      await viewRouter.push(path.split('#')[0]!)
      await flushPromises()
      expect(scroll).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    },
  )

  it('no desplaza el hash anterior si el usuario lo cambia antes de completar la carga', async () => {
    const scroll = vi.fn<() => void>()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scroll,
    })
    const pending = deferred<ProfileBundle>()
    vi.mocked(apiRequest).mockReturnValue(pending.promise)
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/profile', component: ProfileView }],
    })
    await viewRouter.push('/profile#missing')
    const wrapper = mount(ProfileView, {
      attachTo: document.body,
      global: { plugins: [createPinia(), viewRouter] },
    })
    await viewRouter.push('/profile#my-reviews')
    pending.resolve(profileBundle())
    await flushPromises()
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('my-reviews'))
    wrapper.unmount()
  })

  it.each(['leave', 'leave-and-return', 'query', 'session'])(
    'una publicación pendiente no navega después de %s',
    async (change) => {
      mockPreviews()
      const pinia = createPinia(),
        auth = useAuthStore(pinia)
      auth.user = { ...user, role: 'developer' }
      const pending = deferred<ApplicationDetailBundle>()
      vi.mocked(apiRequest).mockReturnValue(pending.promise)
      const viewRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/publish',
            component: PublicationForm,
            props: { categories: [{ ...app.category, description: null }] },
          },
          { path: '/store', component: { template: '<p>Catálogo</p>' } },
          { path: '/developer/applications/:id', component: { template: '<p>Detalle</p>' } },
        ],
      })
      await viewRouter.push('/publish')
      const wrapper = mount(
        { template: '<RouterView />' },
        { global: { plugins: [pinia, viewRouter] } },
      )
      await flushPromises()
      await fillPublication(wrapper)
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      if (change === 'session') {
        auth.user = null
        auth.user = { ...user, role: 'developer' }
        await nextTick()
      } else if (change === 'query') await viewRouter.push('/publish?tab=other')
      else {
        await viewRouter.push('/store')
        if (change === 'leave-and-return') await viewRouter.push('/publish')
      }
      const origin = viewRouter.currentRoute.value.fullPath
      pending.resolve(detail())
      await flushPromises()
      expect(viewRouter.currentRoute.value.fullPath).toBe(origin)
      expect(useStore(pinia).publicationNotice).toEqual(
        change === 'session' ? null : { id: 42, name: 'Notas' },
      )
      wrapper.unmount()
    },
  )

  it('una respuesta tardía de reseña no modifica la URL de otra aplicación', async () => {
    const pinia = createPinia()
    useAuthStore(pinia).user = { ...user }
    const pending = deferred<ApplicationDetailBundle>()
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(detail(true))
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ ...detail(), application: { ...app, id: 99 } })
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/store/:id', component: ApplicationView }],
    })
    await viewRouter.push('/store/42?reviews_page=2')
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [pinia, viewRouter] } },
    )
    await flushPromises()
    await wrapper.get('.store-review-compose form').trigger('submit')
    await flushPromises()
    await viewRouter.push('/store/99?reviews_page=3')
    await flushPromises()
    pending.resolve(detail(true))
    await flushPromises()
    expect(viewRouter.currentRoute.value.fullPath).toBe('/store/99?reviews_page=3')
    expect(wrapper.find('.store-review-compose .store-success').exists()).toBe(false)
    wrapper.unmount()
  })

  it('una actualización tardía de perfil no elimina los filtros de la ruta a la que se ha navegado', async () => {
    const pinia = createPinia()
    useAuthStore(pinia).user = { ...user }
    const pending = deferred<ProfileBundle>()
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(profileBundle())
      .mockReturnValueOnce(pending.promise)
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/profile', component: ProfileView },
        { path: '/store', component: { template: '<div>Catálogo</div>' } },
      ],
    })
    await viewRouter.push('/profile?reviews_page=2')
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [pinia, viewRouter] } },
    )
    await flushPromises()
    await wrapper.get('.store-profile-card button').trigger('click')
    await wrapper.get('.store-profile-form').trigger('submit')
    await flushPromises()
    await viewRouter.push('/store?search=notas&free=1')
    pending.resolve(profileBundle())
    await flushPromises()
    expect(viewRouter.currentRoute.value.fullPath).toBe('/store?search=notas&free=1')
    wrapper.unmount()
  })

  it('publica desde create sin cargar el dashboard y permite su navegación de éxito', async () => {
    mockPreviews()
    const pinia = createPinia(),
      auth = useAuthStore(pinia)
    auth.user = { ...user, role: 'developer' }
    auth.initialized = true
    const developer = {
      ...catalogue(),
      summary: {
        applications_count: 1,
        published_count: 1,
        downloads_count: 0,
        reviews_count: 0,
        average_rating: null,
      },
    }
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ categories: developer.categories })
      .mockResolvedValueOnce(detail())
      .mockResolvedValueOnce({ application: app, categories: developer.categories })
    await router.push('/developer/applications?publish=1')
    const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [pinia, router] } })
    await flushPromises()
    await fillPublication(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/developer/applications/42?published=1'),
    )
    await flushPromises()
    expect(apiRequest).not.toHaveBeenCalledWith('/api/v1/developer/applications?page=1')
    expect(wrapper.get('.store-back').attributes('href')).toBe('/developer/dashboard')
    wrapper.unmount()
  })
  it('sincroniza búsqueda, categoría, precio, orden y paginación con la URL', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      ...catalogue(),
      applications: { ...catalogue().applications, meta: { ...meta, total: 20, last_page: 2 } },
    })
    const pinia = createPinia()
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/store', component: StoreView }],
    })
    await viewRouter.push('/store?search=idea&free=1&sort=rating')
    const wrapper = mount(StoreView, { global: { plugins: [pinia, viewRouter] } })
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('input[type="search"]').element.value).toBe('idea')
    expect(apiRequest).toHaveBeenLastCalledWith(
      '/api/v1/applications?search=idea&free=1&sort=rating',
    )
    await wrapper.get('input[type="search"]').setValue('notas')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(viewRouter.currentRoute.value.query.search).toBe('notas')
    const category = wrapper
      .findAll('.store-chip')
      .find((button) => button.text() === 'Productividad')!
    await category.trigger('click')
    await flushPromises()
    expect(viewRouter.currentRoute.value.query.category).toBe('productividad')
    await wrapper.findAll('.store-pagination button')[1]!.trigger('click')
    await flushPromises()
    expect(viewRouter.currentRoute.value.query.page).toBe('2')
    await viewRouter.push('/store?sort=downloads')
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('input[type="search"]').element.value).toBe('')
    expect(wrapper.findAll('select')[1]!.element.value).toBe('downloads')
    wrapper.unmount()
  })

  it('muestra exactamente cuatro capturas y bloquea compras y reseñas sin instalación', async () => {
    const bundle = detail()
    bundle.application = { ...app, is_free: false, price: '4.99' }
    vi.mocked(apiRequest).mockResolvedValue(bundle)
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/store/:id', component: ApplicationView }],
    })
    await viewRouter.push('/store/42')
    const wrapper = mount(ApplicationView, { global: { plugins: [createPinia(), viewRouter] } })
    await flushPromises()
    expect(wrapper.findAll('.store-screenshots img')).toHaveLength(4)
    expect(wrapper.get('.store-install-action button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Compras próximamente')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sin valoraciones')
    wrapper.unmount()
  })

  it('exige icono y cuatro imágenes antes de publicar y rechaza archivos no compatibles', async () => {
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: PublicationForm }],
    })
    await viewRouter.push('/')
    const wrapper = mount(PublicationForm, {
      props: { categories: [] },
      global: { plugins: [createPinia(), viewRouter] },
    })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('exactamente cuatro capturas')
    expect(apiRequest).not.toHaveBeenCalled()
    expect(wrapper.findAll('input[type="file"]')).toHaveLength(5)
    expect(imageError(new File(['svg'], 'icon.svg', { type: 'image/svg+xml' }))).toContain(
      'JPG, PNG o WebP',
    )
    expect(
      imageError(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
      ),
    ).toContain('5 MB')
    wrapper.unmount()
  })

  it('normaliza filtros y nunca envía booleanos como true/false', () => {
    expect(filtersFromQuery({ free: 'true', sort: 'invalid' })).toEqual({
      search: '',
      category: '',
      free: '',
      sort: 'newest',
    })
    expect(catalogueQuery({ free: '1', page: '2', publish: '1' })).toBe('free=1&page=2')
  })

  it('previsualiza y libera las cinco imágenes, publica multipart y abre el detalle propio', async () => {
    const createObjectURL = vi.fn<(file: Blob) => string>().mockReturnValue('blob:preview')
    const revokeObjectURL = vi.fn<(url: string) => void>()
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = createObjectURL
        static revokeObjectURL = revokeObjectURL
      },
    )
    const pinia = createPinia()
    useAuthStore(pinia).user = { ...user, role: 'developer' }
    vi.mocked(apiRequest).mockResolvedValue(detail())
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: PublicationForm },
        { path: '/developer/applications/:id', component: { template: '<div />' } },
      ],
    })
    await viewRouter.push('/')
    const wrapper = mount(PublicationForm, {
      props: { categories: [{ ...app.category, description: null }] },
      global: { plugins: [pinia, viewRouter] },
    })
    await wrapper.findAll('input')[0]!.setValue('Mi aplicación')
    await wrapper.get('textarea').setValue('Una descripción real')
    await wrapper.get('select').setValue('1')
    const files = [0, 1, 2, 3, 4].map(
      (index) => new File(['png'], `${index}.png`, { type: 'image/png' }),
    )
    for (const [index, input] of wrapper.findAll('input[type="file"]').entries()) {
      Object.defineProperty(input.element, 'files', { configurable: true, value: [files[index]] })
      await input.trigger('change')
    }
    expect(wrapper.findAll('.store-image-picker img')).toHaveLength(5)
    expect(createObjectURL).toHaveBeenCalledTimes(5)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const [path, options] = vi.mocked(apiRequest).mock.calls[0]!
    expect(path).toBe('/api/v1/developer/applications')
    const body = (options as RequestInit).body as FormData
    expect(body.get('name')).toBe('Mi aplicación')
    expect(body.get('icon')).toBe(files[0])
    expect(body.getAll('screenshots[]')).toEqual(files.slice(1))
    expect(body.has('status')).toBe(false)
    expect(viewRouter.currentRoute.value.fullPath).toBe('/developer/applications/42?published=1')
    wrapper.unmount()
    expect(revokeObjectURL).toHaveBeenCalledTimes(5)
  })
})
