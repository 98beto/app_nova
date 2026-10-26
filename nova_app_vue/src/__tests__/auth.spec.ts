import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ApiError, apiRequest, initializeCsrf } from '@/lib/api'
import { homeForRole, useAuthStore } from '@/stores/auth'
import router from '@/router'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    status: number
    errors: Record<string, string[]>

    constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
      super(message)
      this.status = status
      this.errors = errors
    }
  },
  apiRequest: vi.fn<typeof apiRequest>(),
  initializeCsrf: vi.fn<typeof initializeCsrf>(),
}))

const user = {
  id: 7,
  name: 'Ana Nova',
  email: 'ana@example.com',
  avatar_url: null,
  gender: 'female' as const,
  birth_date: '1990-01-01',
  role: 'user' as const,
  status: 'active' as const,
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.mocked(initializeCsrf).mockResolvedValue(undefined)
})

describe('almacén de autenticación e interfaz de autenticación', () => {
  it('restaura una sesión autenticada durante la inicialización', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: 'ok', data: user })
    const auth = useAuthStore()

    await auth.initialize()

    expect(auth.user).toEqual(user)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.initialized).toBe(true)
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/user')
  })

  it('trata una sesión caducada como anónima sin mostrar un error de restauración', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError(401, 'Unauthenticated'))
    const auth = useAuthStore()

    await auth.initialize()

    expect(auth.user).toBeNull()
    expect(auth.message).toBe('')
    expect(auth.initialized).toBe(true)
  })

  it('inicia sesión con protección CSRF y almacena el usuario recibido', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: 'ok', data: user })
    const auth = useAuthStore()
    const payload = { email: user.email, password: 'secret', remember: true }

    await auth.login(payload)

    expect(initializeCsrf).toHaveBeenCalledOnce()
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(auth.user).toEqual(user)
    expect(auth.loading).toBe(false)
  })

  it('registra con datos multiparte, incluida la selección de un perfil de desarrollador', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      message: 'created',
      data: { ...user, role: 'developer' },
    })
    const auth = useAuthStore()
    const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const payload = {
      name: 'Ana Nova',
      email: user.email,
      gender: 'female' as const,
      birth_date: '1990-01-01',
      password: 'secret',
      password_confirmation: 'secret',
      role: 'developer' as const,
      company_name: 'Nova Labs',
      avatar,
    }

    await auth.register(payload)

    const request = vi.mocked(apiRequest).mock.calls[0]!
    expect(request[0]).toBe('/api/v1/auth/register')
    const body = (request[1] as RequestInit).body as FormData
    expect(body.get('role')).toBe('developer')
    expect(body.get('company_name')).toBe('Nova Labs')
    expect(body.get('avatar')).toBe(avatar)
    expect(auth.user?.role).toBe('developer')
  })

  it('cierra la sesión y elimina el usuario actual del almacén', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: 'ok', data: null })
    const auth = useAuthStore()
    auth.user = user

    await auth.logout()

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/logout', { method: 'POST' })
    expect(auth.user).toBeNull()
  })

  it('expone los errores de validación y desactiva el estado de carga tras un inicio de sesión fallido', async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new ApiError(422, 'Datos inválidos', { email: ['Correo inválido'] }),
    )
    const auth = useAuthStore()

    await expect(
      auth.login({ email: 'bad', password: 'x', remember: false }),
    ).rejects.toBeInstanceOf(ApiError)

    expect(auth.errors).toEqual({ email: ['Correo inválido'] })
    expect(auth.message).toBe('Datos inválidos')
    expect(auth.loading).toBe(false)
  })

  it('envía el formulario de inicio de sesión y navega al inicio del rol recibido', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: 'ok', data: { ...user, role: 'developer' } })
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await viewRouter.push('/')
    const push = vi.spyOn(viewRouter, 'push').mockResolvedValue(undefined)
    const wrapper = mount(LoginView, { global: { plugins: [viewRouter, createPinia()] } })

    await wrapper.get('#email').setValue(user.email)
    await wrapper.get('#password').setValue('secret')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(push).toHaveBeenCalledWith('/store')
    push.mockRestore()
  })

  it('muestra el campo de empresa del desarrollador y envía los datos de registro', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      message: 'created',
      data: { ...user, role: 'developer' },
    })
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await viewRouter.push('/')
    const push = vi.spyOn(viewRouter, 'push').mockResolvedValue(undefined)
    const wrapper = mount(RegisterView, { global: { plugins: [viewRouter, createPinia()] } })

    await wrapper.find('input[value="developer"]').setValue(true)
    await nextTick()
    expect(wrapper.find('#company_name').exists()).toBe(true)
    await wrapper.get('#name').setValue('Ana Nova')
    await wrapper.get('#birth_date').setValue('1990-01-01')
    await wrapper.get('#email').setValue(user.email)
    await wrapper.get('#password').setValue('secret')
    await wrapper.get('#password_confirmation').setValue('secret')
    await wrapper.get('#company_name').setValue('Nova Labs')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(apiRequest).toHaveBeenCalledWith(
      '/api/v1/auth/register',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(push).toHaveBeenCalledWith('/store')
    push.mockRestore()
  })

  it('redirige a los usuarios no autenticados desde las rutas protegidas conservando la ruta original', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError(401, 'Unauthenticated'))

    await router.push('/profile')

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/profile')
  })

  it('redirige a un usuario autenticado cuando accede a una ruta de otro rol', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: 'ok', data: { ...user, role: 'developer' } })

    await router.push('/admin/dashboard')

    expect(router.currentRoute.value.path).toBe(homeForRole('developer'))
  })

  it('permite consultar el catálogo y su detalle sin sesión', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError(401, 'Unauthenticated'))
    await router.push('/store?free=1')
    expect(router.currentRoute.value.fullPath).toBe('/store?free=1')
    await router.push('/store/42')
    expect(router.currentRoute.value.path).toBe('/store/42')
  })

  it('permite al desarrollador explorar la misma tienda sin redirigirlo a su panel', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ data: { ...user, role: 'developer' } })
    await router.push('/store')
    expect(router.currentRoute.value.path).toBe('/store')
    expect(homeForRole('developer')).toBe('/store')
    expect(homeForRole('admin')).toBe('/admin/dashboard')
  })

  it('vuelve al detalle solicitado después del inicio de sesión', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ data: user })
    const viewRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/login', component: LoginView }],
    })
    await viewRouter.push('/login?redirect=/store/42')
    const push = vi.spyOn(viewRouter, 'push').mockResolvedValue(undefined)
    const wrapper = mount(LoginView, { global: { plugins: [viewRouter, createPinia()] } })
    await wrapper.get('#email').setValue(user.email)
    await wrapper.get('#password').setValue('secret')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(push).toHaveBeenCalledWith('/store/42')
    push.mockRestore()
  })
})
