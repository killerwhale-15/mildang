import { API_BASE_URL, API_TIMEOUT_MS } from './config.js'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from './session.js'

export class ApiError extends Error {
  constructor(status, payload) {
    const error = payload?.error ?? {}
    super(error.message ?? `API 요청에 실패했습니다. (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = error.code ?? 'UNKNOWN_ERROR'
    this.field = error.field
    this.detail = error.detail
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()

  const text = await response.text()
  return text ? { value: text } : null
}

async function rawRequest(path, options = {}) {
  const {
    auth = true,
    body,
    headers: customHeaders,
    timeoutMs = API_TIMEOUT_MS,
    ...fetchOptions
  } = options
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const headers = new Headers(customHeaders)
  const token = getAccessToken()

  if (auth && token) headers.set('Authorization', `Bearer ${token}`)

  let requestBody = body
  if (body != null && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      body: requestBody,
      signal: options.signal ?? controller.signal,
    })
    const payload = await parseResponse(response)

    if (!response.ok) throw new ApiError(response.status, payload)
    return payload
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError(408, {
        error: { code: 'REQUEST_TIMEOUT', message: '요청 시간이 초과되었습니다.' },
      })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

let refreshPromise = null

async function refreshSession() {
  if (refreshPromise) return refreshPromise

  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshPromise = rawRequest('/auth/refresh', {
    method: 'POST',
    auth: false,
    body: { refreshToken },
  })
    .then((session) => {
      saveSession(session)
      return session
    })
    .catch((error) => {
      clearSession()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function request(path, options = {}) {
  try {
    return await rawRequest(path, options)
  } catch (error) {
    if (
      options.auth !== false &&
      options.retryAuth !== false &&
      error instanceof ApiError &&
      error.code === 'TOKEN_EXPIRED'
    ) {
      const refreshed = await refreshSession()
      if (!refreshed) {
        clearSession()
        throw error
      }
      return rawRequest(path, { ...options, retryAuth: false })
    }
    throw error
  }
}
