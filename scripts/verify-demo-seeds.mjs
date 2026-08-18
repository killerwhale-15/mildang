import {
  applyDemoCompletedReportSeed,
  applyDemoDashboardSeed,
  DEMO_JUDGE_SEEDS,
  getDemoJudgeScenario,
} from '../src/api/demoAccounts.js'
import { getDemoMealsForDate, getDemoRecordView, getKstLogicalDate, getKstToday, getRecordedItemsView } from '../src/api/demoRecordView.js'

const expectedAccounts = Array.from({ length: 5 }, (_, index) => `demo-judge-0${index + 1}`)

for (const account of expectedAccounts) {
  if (!DEMO_JUDGE_SEEDS[account]) throw new Error(`${account} 시드 누락`)
  if (getDemoJudgeScenario(account) !== DEMO_JUDGE_SEEDS[account].scenario) {
    throw new Error(`${account} 로그인 시나리오 매핑 불일치`)
  }
}

for (const [account, seed] of Object.entries(DEMO_JUDGE_SEEDS)) {
  if (!seed.budget) continue

  const spent = seed.records.reduce(
    (total, record) => total + (record.adjustedPoints ?? record.points),
    0,
  )
  const prepaid = seed.prepaidItems.reduce((total, item) => total + item.points, 0)
  const balance = seed.challenge.budget - spent - prepaid

  if (spent !== seed.budget.spent || prepaid !== seed.budget.prepaid || balance !== seed.budget.balance) {
    throw new Error(`${account} 예산 항등식 불일치`)
  }
}

const completed = DEMO_JUDGE_SEEDS['demo-judge-03'].report
const completedResponse = applyDemoCompletedReportSeed({ challenge: { id: 'challenge-from-api' } })
if (
  completed.stats[0].value !== '78' ||
  completed.finding.sample.answeredDays !== 6 ||
  completed.haggleHighlight.totalSaved !== 132 ||
  completedResponse.challenge.id !== 'challenge-from-api' ||
  completedResponse.stats[0].value !== '78'
) {
  throw new Error('demo-judge-03 완주 리포트 명세 불일치')
}

for (const seed of Object.values(DEMO_JUDGE_SEEDS).filter((entry) => entry.budget)) {
  const dashboard = applyDemoDashboardSeed(
    { challenge: { id: 'challenge-from-api' }, budget: {}, pace: {}, prepaidItems: [] },
    seed.scenario,
  )
  if (
    dashboard.challenge.id !== 'challenge-from-api' ||
    dashboard.challenge.dayIndex !== seed.challenge.dayIndex ||
    dashboard.budget.balance !== seed.budget.balance
  ) {
    throw new Error(`${seed.token} 대시보드 시드 반영 실패`)
  }
}

const auditNow = new Date('2026-08-19T00:00:00Z')
const recordView = getDemoRecordView('demo-judge-04', auditNow)
const latestMeals = getDemoMealsForDate(recordView, new Date(2026, 7, 18))
if (
  recordView.initialDate.getFullYear() !== 2026 ||
  recordView.initialDate.getMonth() !== 7 ||
  recordView.initialDate.getDate() !== 19 ||
  latestMeals.length !== 1 ||
  latestMeals[0].name !== '된장찌개' ||
  recordView.records.length !== 3
) {
  throw new Error('demo-judge-04 상대 날짜 기록 변환 실패')
}

const dayFourRecordView = getDemoRecordView('demo-judge-02', auditNow)
if (dayFourRecordView.checkinDays.join(',') !== '1,2,3') {
  throw new Error('demo-judge-02 체크인 진행 날짜 변환 실패')
}

const beforeCutoff = getKstLogicalDate(new Date('2026-08-18T19:00:00Z'))
if (beforeCutoff.getFullYear() !== 2026 || beforeCutoff.getMonth() !== 7 || beforeCutoff.getDate() !== 18) {
  throw new Error('KST 05:00 논리일 경계 계산 실패')
}

const beforeCutoffToday = getKstToday(new Date('2026-08-18T19:00:00Z'))
if (beforeCutoffToday.getFullYear() !== 2026 || beforeCutoffToday.getMonth() !== 7 || beforeCutoffToday.getDate() !== 19) {
  throw new Error('KST 오늘 날짜 계산 실패')
}

const apiRecordView = getRecordedItemsView([
  {
    id: 'recorded-1',
    logicalDate: '2026-08-18',
    original: { name: '제육볶음', points: 15 },
    adjusted: { points: 8, turns: 3 },
    effective: { points: 8 },
  },
], {}, auditNow)
const apiMeals = getDemoMealsForDate(apiRecordView, new Date(2026, 7, 18))
if (
  apiRecordView.initialDate.getDate() !== 19 ||
  apiMeals.length !== 1 ||
  apiMeals[0].name !== '제육볶음' ||
  apiMeals[0].score !== 8
) {
  throw new Error('RECORDED 항목 날짜별 기록 변환 실패')
}

console.log('심사용 시드 계정 5개와 예산 항등식 확인 완료')
