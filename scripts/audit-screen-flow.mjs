import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

// Visual-audit fixture only. This script is not imported by the application and
// must not be used as the contest demo API: §14 requires analyses, haggles, and
// reports to run on the real backend while only external integrations are mocked.

const root = process.cwd()
const outputDir = path.join(root, 'audit', 'screen-review')
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
})

const logs = []
const context = await browser.newContext({
  viewport: { width: 402, height: 874 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  serviceWorkers: 'block',
})
const page = await context.newPage()
await page.addInitScript(() => {
  class AuditNotification {
    static permission = 'denied'
    static requestPermission = async () => 'denied'
    constructor() {}
  }
  Object.defineProperty(window, 'Notification', { configurable: true, value: AuditNotification })
})
page.on('console', (message) => {
  if (message.type() === 'error') logs.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`))

const mealItem = {
  id: 'item-meal-1',
  challengeId: 'challenge-1',
  kind: 'MEAL',
  status: 'PENDING',
  source: { type: 'TEXT', refId: 'analysis-1' },
  original: { name: '에그마요 샌드위치', unit: '1개', points: 46, pm: 5, confidence: 'HIGH', basis: '빵과 마요네즈를 포함한 일반적인 1개 분량 기준이에요.' },
  adjusted: null,
  effective: { points: 46, balanceAfter: 6, balanceIfOriginal: 6 },
}

const promiseItem = {
  id: 'item-promise-1',
  challengeId: 'challenge-1',
  kind: 'PROMISE',
  status: 'PENDING',
  weekday: 'FRI',
  source: { type: 'TEXT', refId: 'analysis-2' },
  original: { name: '마르게리타 피자', unit: '2조각', points: 58, pm: 5, confidence: 'HIGH', basis: '일반적인 화덕피자 2조각 분량을 기준으로 계산했어요.' },
  adjusted: null,
  effective: { points: 58, balanceAfter: -6, balanceIfOriginal: -6 },
}

const dashboard = {
  mocked: true,
  challenge: { id: 'challenge-1', period: 'W1', status: 'ACTIVE', dayIndex: 4, totalDays: 7, label: '1주 챌린지 · 4일차' },
  budget: { total: 85, balance: 52, spent: 13, prepaid: 20, gaugePercent: 61 },
  pace: { expectedBalance: 36, diff: 16, state: 'AHEAD', note: '페이스보다 +16 앞서 있어요' },
  tip: { id: 'tip-1', text: '어제 제육볶음 15를 8로 깎으셨죠. 그 페이스면 남은 3일은 넉넉합니다.', basis: 'RECENT_WIN' },
  prepaidItems: [{ id: 'item-prepaid-1', weekday: 'WED', name: '수요일 점심 약속', points: 20, note: '사전 결제 · 예산에서 미리 빼뒀어요' }],
  checkin: { doneToday: false, dueAt: '2026-08-18T13:00:00Z' },
  expiredConfirm: [],
}

const scan = {
  mocked: true,
  id: 'scan-1',
  status: 'DONE',
  place: '오늘의 브런치',
  recommendation: { menuId: 'menu-2', comment: '빵 비중이 낮고 채소가 함께 있어 이 메뉴를 추천해요.' },
  menus: [
    { id: 'menu-1', name: '바질 크림 파스타', points: 72, basis: '크림 소스와 면 1인분 기준이에요.' },
    { id: 'menu-2', name: '닭가슴살 샐러드', points: 18, basis: '밀가루 토핑이 거의 없는 구성이에요.' },
    { id: 'menu-3', name: '프렌치 토스트', points: 64, basis: '식빵 2장과 시럽을 포함한 기준이에요.' },
  ],
}

const completedReport = {
  mocked: true,
  title: '당신의 몸이 쓴 리포트',
  challenge: { id: 'challenge-complete', label: '1주 챌린지 · 완주', period: 'W1', completedAt: '2026-08-17T15:00:00Z' },
  stats: [
    { key: 'TOTAL_SPENT', label: '총 소비', value: '78', sub: '/85' },
    { key: 'VS_BUDGET', label: '예산 대비', value: '−7', sub: null },
    { key: 'PEAK_SLOT', label: '최다 소비', value: '금 저녁', sub: null },
  ],
  finding: { available: true, headline: '밀가루 40+ 섭취한 다음날, 더부룩함 보고율 2.4배', metric: { conditionKey: 'BLOAT', thresholdPoints: 40, ratio: 2.4 }, sampleNote: '응답 6/7일 · 표본이 작아 경향으로 읽어주세요', sample: { answeredDays: 6, totalDays: 7 } },
  haggleHighlight: { totalSaved: 132, best: { menu: '라면', originalLabel: '1봉지 80', adjustedLabel: '반봉지 + 계란 40', savedPoints: 40, when: '수요일 저녁' }, avgTurns: 4.2, longestTurns: 9 },
  disclaimer: '이 리포트는 의학적 진단이 아닌 본인 기록 기반 관찰입니다.',
  nextChallenge: { period: 'W1', optionKey: 'HARD', suggestedBudget: 75, ctaLabel: '재대결 받기 · 이번엔 75' },
  completion: {
    periodLabel: '1주 챌린지 완주 🎉',
    headline: '이번 판 밀당 성공 !',
    usedPercent: 92,
    totalBudget: 85,
    spent: 78,
    leftover: 7,
    summaryLine: '처음 85에서 시작해, 7을 남기고 완주했어요!',
    bodyChanges: [
      { key: 'WEIGHT', label: '체중 변화', value: '58kg → 54kg', note: '4.0kg 줄었어요' },
      { key: 'BLOAT', label: '붓기 효과', value: '보통 → 좋음', note: null },
      { key: 'SKIN', label: '피부 트러블', value: '3회 → 1회', note: null },
      { key: 'DROWSY', label: '식곤증 개선', value: '18% 개선', note: null },
    ],
  },
}

let createdKind = 'MEAL'
let currentMode = 'ACTIVE'

function json(body, status = 200) {
  return { status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) }
}

await page.route('**/v1/**', async (route) => {
  const request = route.request()
  const url = new URL(request.url())
  const p = url.pathname.replace(/^\/v1/, '')
  const method = request.method()
  let body = null
  try { body = request.postDataJSON() } catch { body = null }

  if (p === '/auth/social' && method === 'POST') return route.fulfill(json({ mocked: true, accessToken: 'audit-access', refreshToken: 'audit-refresh', user: { id: 'user-audit', nickname: '심사위원', isNew: true } }))
  if (p === '/plans') return route.fulfill(json({ mocked: true, plans: [
    { period: 'W1', title: '맛보기 한 판', subtitle: '최초 1회 무료 · 처음이라면 추천', priceKrw: 0, recommended: true, available: true, unavailableReason: null },
    { period: 'W2', title: '제대로 한 판', subtitle: '리포트가 뚜렷해지는 최소 기간', priceKrw: 2000, recommended: false, available: true, unavailableReason: null },
    { period: 'W4', title: '장기전', subtitle: '28일 한 판 · 리포트가 가장 뚜렷해요', priceKrw: 3500, recommended: false, available: true, unavailableReason: null },
  ], notice: '결제는 프리미엄이 아니라, 진짜 할 건지 확인하는 문턱이에요.' }))
  if (p === '/payments/checkout' && method === 'POST') return route.fulfill(json({ mocked: true, id: 'payment-1', status: 'PAID' }))
  if (p === '/challenges' && method === 'POST') return route.fulfill(json({ mocked: true, id: 'challenge-1', period: body?.period ?? 'W1', status: 'ONBOARDING' }))
  if (/^\/challenges\/[^/]+\/budget\/estimate$/.test(p)) return route.fulfill(json({ mocked: true, estimatedWeekly: 100, recommended: 85, cutRatePercent: 15, rationale: '평소 주 100 정도로 추정, 여기서 15%만 줄인 값이에요.', anchors: [
    { label: '라면 한 번', points: 80 }, { label: '김밥 한 줄', points: 20 }, { label: '삼겹살', points: 0 },
  ], options: [
    { key: 'HARD', label: '더 빡세게', budget: 75, totalBudget: 75, note: '빡세게 가고 싶으면 75까지 내려드릴 수 있어요.' },
    { key: 'AS_IS', label: '이대로 85', budget: 85, totalBudget: 85, note: null },
    { key: 'EASY', label: '여유있게', budget: 95, totalBudget: 95, note: null },
  ], totalBudget: 85 }))
  if (/^\/challenges\/[^/]+\/budget$/.test(p) && method === 'POST') return route.fulfill(json({ mocked: true, budget: { total: body?.budget ?? 300, balance: body?.budget ?? 300, gaugePercent: 100 } }))
  if (p === '/challenges/current') return route.fulfill(json(currentMode === 'COMPLETED' ? { ...dashboard, challenge: { ...dashboard.challenge, id: 'challenge-complete', status: 'COMPLETED', dayIndex: 7 }, checkin: { doneToday: true, checkinDays: [1, 2, 3, 4, 5, 6, 7] } } : dashboard))
  if (/^\/challenges\/[^/]+\/report$/.test(p)) return route.fulfill(json(completedReport))
  if (/^\/challenges\/[^/]+\/report\/share-card$/.test(p)) return route.fulfill(json({ mocked: true, imageUrl: 'https://example.test/share.png', hashtag: '#밀가루흥정챌린지' }))

  if (p === '/items' && method === 'GET') {
    const kind = url.searchParams.get('kind')
    if (kind === 'PROMISE') return route.fulfill(json({ mocked: true, items: [promiseItem] }))
    return route.fulfill(json({ mocked: true, items: [mealItem], summary: { count: 1, totalPoints: 46, balanceAfterAll: 6 } }))
  }
  if (p === '/items' && method === 'POST') {
    createdKind = body?.kind ?? 'MEAL'
    const source = createdKind === 'PROMISE' ? promiseItem : mealItem
    return route.fulfill(json({ mocked: true, item: { ...source, id: `item-created-${createdKind.toLowerCase()}`, weekday: body?.weekday ?? source.weekday } }))
  }
  if (/^\/items\/[^/]+\/record$/.test(p)) return route.fulfill(json({ mocked: true, item: { ...mealItem, status: 'RECORDED' }, budget: { total: 85, balance: 6, spent: 59, prepaid: 20, gaugePercent: 7 } }))
  if (/^\/items\/[^/]+\/prepay$/.test(p)) return route.fulfill(json({ mocked: true, item: { ...promiseItem, status: 'PREPAID' }, budget: { total: 85, balance: -6, spent: 13, prepaid: 78, gaugePercent: 0 } }))
  if (/^\/items\/[^/]+$/.test(p) && method === 'DELETE') return route.fulfill({ status: 204, body: '' })
  if (p === '/presets') return route.fulfill(json({ mocked: true, presets: [
    { id: 'preset-1', name: '식빵 1장', points: 22 },
    { id: 'preset-2', name: '라면 1봉', points: 55 },
    { id: 'preset-3', name: '만두 6개', points: 38 },
  ] }))
  if (p === '/analyses/recent') return route.fulfill(json({ mocked: true, recent: [{ name: '에그마요 샌드위치' }, { name: '잔치국수' }, { name: '크루아상' }] }))
  if (p === '/analyses/text' && method === 'POST') return route.fulfill(json({ mocked: true, id: 'analysis-1', name: body?.query ?? '메뉴', points: 46, unit: '1인분' }))
  if (p === '/scans' && method === 'POST') return route.fulfill(json({ mocked: true, id: 'scan-1', status: 'DONE' }))
  if (p === '/scans/scan-1' && method === 'GET') return route.fulfill(json(scan))
  if (/^\/scans\/scan-1\/menus\/[^/]+$/.test(p) && method === 'PATCH') {
    const menu = scan.menus.find((value) => p.endsWith(value.id)) ?? scan.menus[0]
    return route.fulfill(json({ ...menu, points: body?.points ?? menu.points }))
  }

  if (p === '/haggles' && method === 'POST') return route.fulfill(json({ mocked: true, id: 'haggle-1', itemId: body?.itemId, entryPoint: body?.entryPoint, status: 'OPEN', turn: 0, maxTurns: 10, target: { name: '에그마요 샌드위치', unit: '1개', points: 46, pm: 5, place: '집' }, agreed: null, balance: 52, frame: 'SAVE', opening: '에그마요 샌드위치 1개 46이요. 얼마나 먹을지만 함께 정해볼까요?', chips: ['반만 먹을게', '너무 적어', '더 깎아줘', '그대로 먹을래'] }))
  if (p === '/haggles/haggle-1/messages' && method === 'POST') return route.fulfill(json({ mocked: true, turn: 1, reply: { text: '좋아요. 빵을 한 장 빼면 약 14밀을 아낄 수 있어요.' }, chips: ['좋아요', '다른 방법'], simulation: { original: { row: '기존 46밀', balanceAfter: 142 }, adjusted: { row: '조정 32밀', balanceAfter: 156 } } }))
  if (p === '/haggles/haggle-1/close' && method === 'POST') {
    const source = createdKind === 'PROMISE' ? promiseItem : mealItem
    return route.fulfill(json({ mocked: true, item: { ...source, status: 'HAGGLED', adjusted: { label: '빵 한 장 빼기', points: 32, basis: '빵을 한 장 줄인 구성', haggleId: 'haggle-1', turns: 1 }, effective: { ...source.effective, points: 32 } } }))
  }
  if (p === '/haggles/haggle-1' && method === 'DELETE') return route.fulfill({ status: 204, body: '' })

  if (p === '/checkins/today' && method === 'GET') return route.fulfill(json({ mocked: true, date: '2026-08-18', dayIndex: 4, answers: {}, questions: [
    { key: 'BLOAT', label: '더부룩함', desc: '속과 몸의 붓기' },
    { key: 'SKIN', label: '피부', desc: '피부 트러블 정도' },
    { key: 'DROWSY', label: '식곤증', desc: '식사 후 졸림 정도' },
  ] }))
  if (p === '/checkins/today' && method === 'PUT') return route.fulfill(json({ mocked: true, date: '2026-08-18', dayIndex: 4, answers: body?.answers ?? {} }))

  if (p === '/demo/seed' && method === 'POST') {
    currentMode = body?.scenario === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE'
    return route.fulfill(json({ mocked: true, scenario: body?.scenario, challengeId: currentMode === 'COMPLETED' ? 'challenge-complete' : 'challenge-1' }))
  }
  if (p.startsWith('/demo/')) return route.fulfill(json({ mocked: true, challengeId: 'challenge-1' }))

  logs.push(`unhandled: ${method} ${p}`)
  return route.fulfill(json({ code: 'NOT_MOCKED', message: `${method} ${p}` }, 404))
})

async function shot(name, options = {}) {
  await page.waitForTimeout(250)
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: options.fullPage ?? false })
}

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
await page.waitForTimeout(1750)
await shot('01_onboarding_login')

await page.getByRole('button', { name: '카카오로 로그인' }).click()
await page.getByRole('heading', { name: /얼마 동안 밀당/ }).waitFor()
await shot('02_plan_selection')

await page.getByRole('radio', { name: /2주/ }).click()
await page.getByRole('button', { name: '결제하기' }).click()
await page.locator('h1#payment-title').waitFor()
await shot('03_payment')
await page.getByRole('button', { name: '기간 선택으로 돌아가기' }).click()
await page.getByRole('radio', { name: /1주/ }).click()
await page.getByRole('button', { name: '시작하기' }).click()
await page.getByRole('heading', { name: /평소 식습관/ }).waitFor()
await shot('04_habits')

await page.getByRole('button', { name: '예산 추천받기' }).click()
await page.getByRole('heading', { name: /1주 예산/ }).waitFor()
await shot('05_budget')
await page.getByRole('button', { name: '설정하기' }).click()
await page.getByRole('heading', { name: '남은 예산' }).waitFor()
await shot('06_main_board')

await page.getByRole('button', { name: '식사 기록하기' }).click()
await page.getByRole('heading', { name: /지금 뭐 드실/ }).waitFor()
await shot('07_meal')
await page.getByRole('button', { name: /메뉴 직접 입력/ }).click()
await page.getByRole('heading', { name: '직접 입력' }).waitFor()
await shot('08_direct_input_from_meal')
await page.getByRole('button', { name: '이전 화면으로 돌아가기' }).click()

await page.getByRole('button', { name: /메뉴판 찍기/ }).click()
await page.locator('main.camera-scan').waitFor()
await page.locator('input[type="file"]').setInputFiles(path.join(root, 'src', 'img', 'onboarding_logo_3x.png'))
await page.getByRole('heading', { name: '오늘의 브런치' }).waitFor()
await shot('09_scan_result')
await page.getByRole('button', { name: '직접 입력', exact: true }).click()
await page.getByText('스캔 결과', { exact: true }).first().waitFor()
await shot('10_direct_input_from_scan')
await page.getByRole('button', { name: '이전 화면으로 돌아가기' }).click()

await page.getByRole('button', { name: '밀당하기' }).first().click()
await page.getByRole('heading', { name: '밀당 대화' }).waitFor()
await shot('11_haggle')
await page.getByRole('button', { name: '나가기' }).evaluate((button) => button.click())
await page.getByRole('heading', { name: '오늘의 브런치' }).waitFor()
await page.getByRole('button', { name: '식사 입력 화면으로 돌아가기' }).click()
await page.getByRole('button', { name: '메인보드로 돌아가기' }).click()

await page.getByRole('button', { name: /미리 약속을 잡아보세요/ }).click()
await page.getByRole('heading', { name: '약속 사전 결제' }).waitFor()
await shot('12_promise')
await page.locator('.presubtract__menu-trigger').click()
await page.getByText('약속 사전 결제', { exact: true }).first().waitFor()
await shot('12b_direct_input_from_promise')
await page.getByRole('button', { name: '이전 화면으로 돌아가기' }).click()
await page.getByRole('button', { name: '메인보드로 돌아가기' }).click()
await page.getByRole('button', { name: '컨디션 체크인' }).click()
await page.getByRole('heading', { name: /오늘 몸/ }).waitFor()
await shot('13_checkin')
for (const label of ['더부룩함', '피부', '식곤증']) {
  await page.getByRole('radiogroup', { name: label }).getByRole('radio', { name: '좋음' }).click()
}
await shot('13b_checkin_all_selected')

await page.getByRole('button', { name: /데모 모드/ }).click()
await page.locator('aside select').selectOption('COMPLETED')
await page.getByRole('button', { name: '시나리오 적용' }).click()
await page.getByRole('heading', { name: /당신의 몸이 쓴 리포트/ }).waitFor()
await shot('14_report_demo_controls_open', { fullPage: true })
await page.getByRole('button', { name: /데모 모드 닫기/ }).click()
await shot('15_report', { fullPage: true })

const referenceContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ko-KR' })
const referencePage = await referenceContext.newPage()
await referencePage.goto('file:///C:/Users/user/Desktop/%EB%B0%80%EB%8B%B9_%EC%99%80%EC%9D%B4%EC%96%B4%ED%94%84%EB%A0%88%EC%9E%84_v2.html', { waitUntil: 'load' })
await referencePage.screenshot({ path: path.join(outputDir, '00_reference_wireframe.png'), fullPage: true })
await referenceContext.close()

console.log(JSON.stringify({ outputDir, logs }, null, 2))
await browser.close()
