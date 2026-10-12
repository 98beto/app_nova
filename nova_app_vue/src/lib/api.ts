const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message)
  }
}

function xsrfToken(): string | undefined {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('XSRF-TOKEN='))
    ?.split('=')
    .slice(1)
    .join('=')

  return cookie ? decodeURIComponent(cookie) : undefined
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) throw new ApiError(response.status, 'No se pudo iniciar una sesión segura.')
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retryAfterCsrf = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Requested-With', 'XMLHttpRequest')

  const token = xsrfToken()
  if (token && options.method && options.method !== 'GET') headers.set('X-XSRF-TOKEN', token)

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 419 && retryAfterCsrf) {
    await initializeCsrf()
    return apiRequest<T>(path, options, false)
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string
    errors?: Record<string, string[]>
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload.message ?? 'No se pudo completar la solicitud.', payload.errors)
  }

  return payload as T
}
