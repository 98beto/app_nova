import { defineStore } from 'pinia'
import { apiRequest, ApiError, initializeCsrf } from '@/lib/api'
import type { ApiResponse, LoginPayload, RegisterPayload, User, UserRole } from '@/types/auth'

let initialization: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    initialized: false,
    loading: false,
    errors: {} as Record<string, string[]>,
    message: '',
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    async initialize() {
      if (this.initialized) return
      if (initialization) return initialization

      initialization = (async () => {
        try {
          const response = await apiRequest<ApiResponse<User>>('/api/v1/auth/user')
          this.user = response.data
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) {
            this.message = 'No se pudo restaurar la sesión.'
          }
          this.user = null
        } finally {
          this.initialized = true
          initialization = null
        }
      })()

      return initialization
    },
    async login(payload: LoginPayload) {
      await this.run(async () => {
        await initializeCsrf()
        const response = await apiRequest<ApiResponse<User>>('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        this.user = response.data
      })
    },
    async register(payload: RegisterPayload) {
      await this.run(async () => {
        await initializeCsrf()
        const form = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (value instanceof File) form.append(key, value)
          else if (value !== null) form.append(key, String(value))
        })
        const response = await apiRequest<ApiResponse<User>>('/api/v1/auth/register', {
          method: 'POST',
          body: form,
        })
        this.user = response.data
      })
    },
    async logout() {
      await this.run(async () => {
        await initializeCsrf()
        await apiRequest<ApiResponse<null>>('/api/v1/auth/logout', { method: 'POST' })
        this.user = null
      })
    },
    async run(action: () => Promise<void>) {
      this.loading = true
      this.errors = {}
      this.message = ''
      try {
        await action()
      } catch (error) {
        if (error instanceof ApiError) {
          this.errors = error.errors
          this.message = error.status === 401 ? 'Tu sesión expiró.' : error.message
          if (error.status === 401) this.user = null
        } else {
          this.message = 'No se pudo conectar con AppNova.'
        }
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})

export function homeForRole(role: UserRole): string {
  if (role === 'developer') return '/developer/dashboard'
  if (role === 'admin') return '/admin/dashboard'
  return '/store'
}
