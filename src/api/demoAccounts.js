export const DEMO_JUDGE_SEEDS = {
  'demo-judge-01': {
    token: 'demo-judge-01',
    label: '심사위원1 · 신규',
    scenario: 'FRESH',
    challenge: null,
    records: [],
    prepaidItems: [],
  },
  'demo-judge-02': {
    token: 'demo-judge-02',
    label: '심사위원2 · 4일차',
    scenario: 'DAY4_ACTIVE',
    challenge: { period: 'W1', optionKey: 'AS_IS', budget: 85, dayIndex: 4, totalDays: 7, status: 'ACTIVE' },
    records: [
      { date: 'D-2', menu: '된장찌개', points: 5, adjustedPoints: null, haggleTurns: 0, overflow: false },
      { date: 'D-1', menu: '제육볶음', points: 15, adjustedPoints: 8, haggleTurns: 3, overflow: false },
    ],
    prepaidItems: [
      { name: '수요일 점심 약속', points: 20, weekday: 'WED' },
    ],
    checkins: [
      { date: 'D-3', BLOAT: 'BAD', SKIN: 'MID', DROWSY: 'BAD' },
      { date: 'D-2', BLOAT: 'MID', SKIN: 'GOOD', DROWSY: 'MID' },
      { date: 'D-1', BLOAT: 'GOOD', SKIN: 'GOOD', DROWSY: 'GOOD' },
    ],
    budget: { total: 85, spent: 13, prepaid: 20, balance: 52, gaugePercent: 61 },
    pace: { expectedBalance: 36, diff: 16, state: 'AHEAD' },
  },
  'demo-judge-03': {
    token: 'demo-judge-03',
    label: '심사위원3 · 완주',
    scenario: 'COMPLETED',
    challenge: { period: 'W1', optionKey: 'AS_IS', budget: 85, dayIndex: 7, totalDays: 7, status: 'COMPLETED' },
    records: [],
    prepaidItems: [],
    report: {
      challenge: { period: 'W1', label: '1주 챌린지 · 완주' },
      title: '당신의 몸이 쓴 리포트',
      stats: [
        { key: 'TOTAL_SPENT', label: '총 소비', value: '78', sub: '/85' },
        { key: 'VS_BUDGET', label: '예산 대비', value: '−7', sub: null },
        { key: 'PEAK_SLOT', label: '최다 소비', value: '금 저녁', sub: null },
      ],
      finding: {
        available: true,
        headline: '밀가루 40+ 섭취한 다음날, 더부룩함 보고율 2.4배',
        metric: { conditionKey: 'BLOAT', thresholdPoints: 40, ratio: 2.4 },
        sampleNote: '응답 6/7일 · 표본이 작아 경향으로 읽어주세요',
        sample: { answeredDays: 6, totalDays: 7 },
      },
      haggleHighlight: {
        totalSaved: 132,
        best: { menu: '라면', originalLabel: '1봉지 80', adjustedLabel: '반봉지 + 계란 40', savedPoints: 40, when: '수요일 저녁' },
        avgTurns: 4.2,
        longestTurns: 9,
      },
      disclaimer: '이 리포트는 의학적 진단이 아닌 본인 기록 기반 관찰입니다.',
      nextChallenge: { period: 'W1', optionKey: 'HARD', suggestedBudget: 75, ctaLabel: '재대결 받기 · 이번엔 75' },
    },
  },
  'demo-judge-04': {
    token: 'demo-judge-04',
    label: '심사위원4 · W4 12일차',
    scenario: 'W4_DAY12',
    challenge: { period: 'W4', optionKey: 'AS_IS', budget: 340, dayIndex: 12, totalDays: 28, status: 'ACTIVE' },
    records: [
      { date: 'D-9', menu: '칼국수', points: 80, adjustedPoints: 40, haggleTurns: 5 },
      { date: 'D-4', menu: '제육볶음', points: 15, adjustedPoints: null, haggleTurns: 0 },
      { date: 'D-1', menu: '된장찌개', points: 5, adjustedPoints: null, haggleTurns: 0 },
    ],
    prepaidItems: [],
    budget: { total: 340, spent: 60, prepaid: 0, balance: 280, gaugePercent: 82 },
    pace: { expectedBalance: 194, diff: 86, state: 'AHEAD' },
  },
  'demo-judge-05': {
    token: 'demo-judge-05',
    label: '심사위원5 · W2 8일차',
    scenario: 'W2_DAY8',
    challenge: { period: 'W2', optionKey: 'AS_IS', budget: 170, dayIndex: 8, totalDays: 14, status: 'ACTIVE' },
    records: [
      { date: 'D-5', menu: '칼국수', points: 80, adjustedPoints: 40, haggleTurns: 4 },
      { date: 'D-3', menu: '김밥', points: 20, adjustedPoints: null, haggleTurns: 0 },
      { date: 'D-1', menu: '제육볶음', points: 15, adjustedPoints: null, haggleTurns: 0 },
    ],
    prepaidItems: [
      { name: '토요일 저녁 약속', points: 5, weekday: 'SAT' },
    ],
    budget: { total: 170, spent: 75, prepaid: 5, balance: 90, gaugePercent: 53 },
    pace: { expectedBalance: 73, diff: 17, state: 'AHEAD' },
  },
}

export const DEMO_JUDGE_ACCOUNTS = Object.values(DEMO_JUDGE_SEEDS).map(
  ({ token, label, scenario }) => ({ token, label, scenario }),
)

const DEMO_SCENARIO_BY_ACCOUNT = new Map(
  DEMO_JUDGE_ACCOUNTS.map(({ token, scenario }) => [token, scenario]),
)

export function getDemoJudgeScenario(token) {
  return DEMO_SCENARIO_BY_ACCOUNT.get(token) ?? null
}

export function applyDemoDashboardSeed(dashboard, scenario) {
  const seed = Object.values(DEMO_JUDGE_SEEDS).find((entry) => entry.scenario === scenario)
  if (!dashboard || !seed?.budget) return dashboard

  return {
    ...dashboard,
    challenge: {
      ...dashboard.challenge,
      period: seed.challenge.period,
      status: seed.challenge.status,
      dayIndex: seed.challenge.dayIndex,
      totalDays: seed.challenge.totalDays,
    },
    budget: { ...dashboard.budget, ...seed.budget },
    pace: { ...dashboard.pace, ...seed.pace },
    prepaidItems: seed.prepaidItems.map((item, index) => ({
      id: dashboard.prepaidItems?.[index]?.id ?? `${scenario.toLowerCase()}-prepaid-${index + 1}`,
      note: '사전 결제 · 예산에서 미리 빼뒀어요',
      ...item,
    })),
  }
}

export function applyDemoCompletedReportSeed(report) {
  const seededReport = DEMO_JUDGE_SEEDS['demo-judge-03'].report
  return {
    ...report,
    ...seededReport,
    challenge: { ...report?.challenge, ...seededReport.challenge },
  }
}
