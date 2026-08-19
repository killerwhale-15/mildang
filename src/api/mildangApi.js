import { request } from './httpClient.js'

function queryString(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return
    query.set(key, Array.isArray(value) ? value.join(',') : String(value))
  })
  const value = query.toString()
  return value ? `?${value}` : ''
}

export const mildangApi = {
  auth: {
    social: (payload) =>
      request('/auth/social', { method: 'POST', auth: false, body: payload }),
    refresh: (refreshToken) =>
      request('/auth/refresh', {
        method: 'POST',
        auth: false,
        body: { refreshToken },
      }),
  },

  plans: {
    list: () => request('/plans'),
  },

  payments: {
    checkout: (payload) =>
      request('/payments/checkout', { method: 'POST', body: payload }),
  },

  challenges: {
    create: (payload) =>
      request('/challenges', { method: 'POST', body: payload }),
    current: () => request('/challenges/current'),
    estimateBudget: (challengeId, survey) =>
      request(`/challenges/${challengeId}/budget/estimate`, {
        method: 'POST',
        body: { survey },
      }),
    setBudget: (challengeId, payload) =>
      request(`/challenges/${challengeId}/budget`, {
        method: 'POST',
        body: payload,
      }),
    report: (challengeId) => request(`/challenges/${challengeId}/report`),
    shareCard: (challengeId, payload) =>
      request(`/challenges/${challengeId}/report/share-card`, {
        method: 'POST',
        body: payload,
      }),
  },

  analyses: {
    recent: () => request('/analyses/recent'),
    text: (payload) =>
      request('/analyses/text', { method: 'POST', body: payload }),
  },

  scans: {
    create: (image, challengeId) => {
      const body = new FormData()
      body.append('image', image)
      body.append('challengeId', challengeId)
      return request('/scans', { method: 'POST', body, timeoutMs: 30000 })
    },
    get: (scanId) => request(`/scans/${scanId}`),
    updateMenu: (scanId, menuId, points) =>
      request(`/scans/${scanId}/menus/${menuId}`, {
        method: 'PATCH',
        body: { points },
      }),
  },

  items: {
    list: (params = {}) => request(`/items${queryString(params)}`),
    create: (payload) => request('/items', { method: 'POST', body: payload }),
    record: (itemId) =>
      request(`/items/${itemId}/record`, { method: 'POST' }),
    prepay: (itemId) =>
      request(`/items/${itemId}/prepay`, { method: 'POST' }),
    remove: (itemId) => request(`/items/${itemId}`, { method: 'DELETE' }),
  },

  presets: {
    list: () => request('/presets'),
  },

  haggles: {
    start: (payload) =>
      request('/haggles', { method: 'POST', body: payload }),
    message: (haggleId, text) =>
      request(`/haggles/${haggleId}/messages`, {
        method: 'POST',
        body: { text },
      }),
    close: (haggleId) =>
      request(`/haggles/${haggleId}/close`, { method: 'POST' }),
    abandon: (haggleId) =>
      request(`/haggles/${haggleId}`, { method: 'DELETE' }),
  },

  checkins: {
    today: () => request('/checkins/today'),
    save: (payload) => {
      const body = payload?.answers ? payload : { answers: payload }
      return request('/checkins/today', {
        method: 'PUT',
        body,
      })
    },
  },

  invites: {
    get: (code) =>
      request(`/invites/${encodeURIComponent(code)}`, { auth: false }),
  },

  demo: {
    seed: (scenario) =>
      request('/demo/seed', { method: 'POST', body: { scenario } }),
    reset: () => request('/demo/reset', { method: 'POST' }),
    advanceDay: (days = 1) =>
      request('/demo/advance-day', { method: 'POST', body: { days } }),
    runBatch: (jobs = ['PREPAID_CONVERT', 'ITEM_EXPIRY']) =>
      request('/demo/run-batch', { method: 'POST', body: { jobs } }),
  },
}
