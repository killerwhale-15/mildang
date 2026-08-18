const REFRESH_TOKEN_KEY = 'mildang.refreshToken'
let accessToken = null

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveSession(session) {
  accessToken = session?.accessToken ?? null

  if (session?.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  }
}

export function clearSession() {
  accessToken = null
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}
