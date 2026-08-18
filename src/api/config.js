export const APP_ENV = import.meta.env.VITE_APP_ENV ?? 'demo'
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.mildang.app/v1'
).replace(/\/$/, '')
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000)
export const IS_DEMO = APP_ENV === 'demo' || APP_ENV === 'local'
export const IS_PRODUCTION = APP_ENV === 'prod'

export const DEMO_ACCOUNT =
  import.meta.env.VITE_DEMO_ID_TOKEN ?? 'demo-judge-01'

export const PAYMENT_PROVIDER = IS_DEMO
  ? 'MOCK'
  : (import.meta.env.VITE_PAYMENT_PROVIDER ?? 'IAP_GOOGLE')

export const DEMO_NOTICE =
  '데모 모드 — 실제 카카오 인증과 결제는 생략됩니다.'
