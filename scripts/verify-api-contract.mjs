import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/api/mildangApi.js', import.meta.url), 'utf8')
const requiredRoutes = [
  '/auth/social',
  '/auth/refresh',
  '/plans',
  '/payments/checkout',
  '/challenges/current',
  '/budget/estimate',
  '/analyses/recent',
  '/analyses/text',
  '/scans',
  '/menus/',
  '/items',
  '/record',
  '/prepay',
  '/presets',
  '/haggles',
  '/messages',
  '/close',
  '/checkins/today',
  '/report',
  '/report/share-card',
  '/invites/',
  '/demo/seed',
  '/demo/reset',
  '/demo/advance-day',
  '/demo/run-batch',
]

const missing = requiredRoutes.filter((route) => !source.includes(route))
if (missing.length) {
  throw new Error(`API 명세 경로 누락: ${missing.join(', ')}`)
}

console.log(`API 계약 경로 ${requiredRoutes.length}개 확인 완료`)
