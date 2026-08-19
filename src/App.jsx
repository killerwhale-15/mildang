import { useEffect, useState } from 'react'
import { DEMO_ACCOUNT, IS_DEMO, PAYMENT_PROVIDER } from './api/config.js'
import {
  applyDemoCompletedReportSeed,
  applyDemoDashboardSeed,
  getDemoJudgeScenario,
} from './api/demoAccounts.js'
import { getDemoMealsForDate, getDemoRecordView, getRecordedItemsView } from './api/demoRecordView.js'
import { renderDemoShareCard } from './api/demoShareCard.js'
import { mildangApi } from './api/mildangApi.js'
import { prepareLocalNotifications, sendLocalNotification } from './api/notifications.js'
import { saveSession } from './api/session.js'
import DemoControls from './components/DemoControls.jsx'
import Budget from './screen/Budget.jsx'
import PreSubtract from './screen/3a_presubtract.jsx'
import MealScreen from './screen/3b_meal.jsx'
import DirectInputScreen from './screen/3c_directInput.jsx'
import CameraScan from './screen/4a_cameraScan.jsx'
import ScanResult from './screen/4b_scanResult.jsx'
import MildangTalk from './screen/5_mildangtalk.jsx'
import ConditionCheckin from './screen/6_conditionCheckin.jsx'
import CompleteReport from './screen/7_completeReport.jsx'
import MainBoard from './screen/MainBoard.jsx'
import Onboarding1 from './screen/Onboarding1.jsx'
import Onboarding2 from './screen/Onboarding2.jsx'
import Onboarding2_1 from './screen/Onboarding2_1.jsx'
import Onboarding2_2 from './screen/Onboarding2_2.jsx'
import Onboarding3 from './screen/Onboarding3.jsx'
import RecordA from './screen/Record_a.jsx'
import RecordB from './screen/Record_b.jsx'
import StartScreen from './screen/StartScreen.jsx'

const DEVICE_ID_KEY = 'mildang.deviceId'

function getDeviceId() {
  const saved = window.localStorage.getItem(DEVICE_ID_KEY)
  if (saved) return saved
  const value = window.crypto.randomUUID()
  window.localStorage.setItem(DEVICE_ID_KEY, value)
  return value
}

async function getKakaoIdToken(demoAccount) {
  if (IS_DEMO) {
    return demoAccount
  }
  if (!window.MildangAuth?.signInWithKakao) {
    throw new Error('운영 카카오 인증 브리지(window.MildangAuth)가 설정되지 않았습니다.')
  }
  return window.MildangAuth.signInWithKakao()
}

async function getPaymentReceipt(period) {
  if (IS_DEMO) return ''
  if (!window.MildangPayments?.checkout) {
    throw new Error('운영 인앱 결제 브리지(window.MildangPayments)가 설정되지 않았습니다.')
  }
  return window.MildangPayments.checkout(period)
}

async function getPushToken() {
  if (IS_DEMO) return null
  return window.MildangNotifications?.getPushToken?.() ?? null
}

function App() {
  const [isStarting, setIsStarting] = useState(true)
  const [screen, setScreen] = useState('onboarding1')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [hasMockedResponse, setHasMockedResponse] = useState(false)
  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState(false)
  const [demoAccount, setDemoAccount] = useState(
    () => new URLSearchParams(window.location.search).get('demoAccount') ?? DEMO_ACCOUNT,
  )
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [challengeId, setChallengeId] = useState(null)
  const [survey, setSurvey] = useState(null)
  const [budgetEstimate, setBudgetEstimate] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [promiseItems, setPromiseItems] = useState([])
  const [mealItems, setMealItems] = useState([])
  const [mealSummary, setMealSummary] = useState(null)
  const [presets, setPresets] = useState([])
  const [directInputRequest, setDirectInputRequest] = useState({ source: '3b_meal', kind: 'MEAL' })
  const [scan, setScan] = useState(null)
  const [scanManualItems, setScanManualItems] = useState([])
  const [haggle, setHaggle] = useState(null)
  const [checkin, setCheckin] = useState(null)
  const [report, setReport] = useState(null)
  const [recordHistory, setRecordHistory] = useState(null)
  const [selectedRecordDate, setSelectedRecordDate] = useState(null)
  const [shareCard, setShareCard] = useState(null)
  const [invite, setInvite] = useState(null)

  function remember(response) {
    if (response?.mocked === true) setHasMockedResponse(true)
    return response
  }

  function fail(requestError) {
    setError(requestError?.message ?? '요청을 처리하지 못했습니다.')
  }

  function updateBudget(nextBudget) {
    if (!nextBudget) return
    setDashboard((current) => current ? { ...current, budget: nextBudget } : current)
  }

  function replaceItem(nextItem) {
    if (!nextItem) return
    const setter = nextItem.kind === 'PROMISE' ? setPromiseItems : setMealItems
    setter((items) => items.map((item) => item.id === nextItem.id ? nextItem : item))
    setScanManualItems((items) => items.map((item) => item.id === nextItem.id ? nextItem : item))
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIsStarting(false), 1500)
    const pathCode = window.location.pathname.match(/\/c\/([^/]+)/)?.[1]
    const inviteCode = pathCode ?? new URLSearchParams(window.location.search).get('invite')
    if (inviteCode) mildangApi.invites.get(inviteCode).then((response) => setInvite(remember(response))).catch(fail)
    return () => window.clearTimeout(timer)
  }, [])

  async function handleLogin(accountOverride, seedScenario) {
    setBusy('login'); setError('')
    try {
      const selectedDemoAccount = IS_DEMO && typeof accountOverride === 'string' && accountOverride.trim()
        ? accountOverride.trim()
        : demoAccount
      if (IS_DEMO) {
        setDemoAccount(selectedDemoAccount)
        const url = new URL(window.location.href)
        url.searchParams.set('demoAccount', selectedDemoAccount)
        window.history.replaceState(null, '', url)
      }
      const idToken = await getKakaoIdToken(selectedDemoAccount)
      await prepareLocalNotifications()
      const pushToken = await getPushToken()
      const auth = remember(await mildangApi.auth.social({ provider: 'KAKAO', idToken, deviceId: getDeviceId(), pushToken }))
      saveSession(auth)
      if (IS_DEMO) setIsDemoAuthenticated(true)
      const planResponse = remember(await mildangApi.plans.list())
      setPlans(planResponse.plans ?? [])

      const loginScenario = seedScenario ?? getDemoJudgeScenario(idToken)
      if (IS_DEMO && loginScenario) {
        await applyDemoScenario(loginScenario)
      } else if (auth.user?.isNew) {
        setScreen('onboarding2')
      } else {
        try {
          const current = remember(await mildangApi.challenges.current())
          setDashboard(current)
          setChallengeId(current.challenge.id)
          setScreen(current.challenge.status === 'COMPLETED' ? '7_completeReport' : 'mainBoard')
          if (current.challenge.status === 'COMPLETED') await loadReport(current.challenge.id)
        } catch (currentError) {
          if (currentError.status === 404) setScreen('onboarding2')
          else throw currentError
        }
      }
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function createChallenge(plan, paymentId = null) {
    const challenge = remember(await mildangApi.challenges.create({ period: plan.period, paymentId }))
    setChallengeId(challenge.id)
    setScreen('onboarding3')
    return challenge
  }

  async function handlePlan(plan) {
    setSelectedPlan(plan); setError('')
    if (plan.period !== 'W1') {
      setScreen(plan.period === 'W2' ? 'onboarding2_1' : 'onboarding2_2')
      return
    }
    setBusy('challenge')
    try { await createChallenge(plan, null) } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handlePayment() {
    setBusy('payment'); setError('')
    try {
      const receipt = await getPaymentReceipt(selectedPlan.period)
      const payment = remember(await mildangApi.payments.checkout({ period: selectedPlan.period, provider: PAYMENT_PROVIDER, receipt }))
      await createChallenge(selectedPlan, payment.id)
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handleBudgetEstimate(nextSurvey) {
    setBusy('estimate'); setError('')
    try {
      const estimate = remember(await mildangApi.challenges.estimateBudget(challengeId, nextSurvey))
      setSurvey(nextSurvey); setBudgetEstimate(estimate); setScreen('budget')
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handleBudgetConfirm(option) {
    setBusy('budget'); setError('')
    try {
      remember(await mildangApi.challenges.setBudget(challengeId, { survey, optionKey: option.optionKey, budget: option.budget }))
      await loadDashboard()
      setScreen('mainBoard')
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function loadDashboard(seedScenario) {
    const current = remember(await mildangApi.challenges.current())
    const dashboardResponse = IS_DEMO && seedScenario
      ? applyDemoDashboardSeed(current, seedScenario)
      : current
    setDashboard(dashboardResponse); setChallengeId(dashboardResponse.challenge.id)
    return dashboardResponse
  }

  async function openMeal() {
    setScreen('3b_meal'); setBusy('meal'); setError('')
    try {
      const [itemsResponse, presetsResponse] = await Promise.all([
        mildangApi.items.list({ kind: 'MEAL', status: ['PENDING', 'HAGGLED'] }),
        mildangApi.presets.list(),
      ])
      remember(itemsResponse); remember(presetsResponse)
      setMealItems(itemsResponse.items ?? []); setMealSummary(itemsResponse.summary ?? null); setPresets(presetsResponse.presets ?? [])
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function refreshTodayMeals() {
    try {
      const current = remember(await mildangApi.challenges.current())
      setDashboard((dashboardState) => dashboardState ? { ...dashboardState, today: current.today } : dashboardState)
    } catch { /* 기록은 이미 확정됐으므로 배너 갱신 실패는 화면을 막지 않습니다 */ }
  }

  async function reloadMealItems() {
    const response = remember(await mildangApi.items.list({ kind: 'MEAL', status: ['PENDING', 'HAGGLED'] }))
    setMealItems(response.items ?? []); setMealSummary(response.summary ?? null)
    return response
  }

  async function openPromise() {
    setScreen('3a_presubtract'); setBusy('promise'); setError('')
    try {
      const response = remember(await mildangApi.items.list({ kind: 'PROMISE' }))
      setPromiseItems(response.items ?? [])
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function openRecords() {
    setBusy('records'); setError('')
    try {
      const response = remember(await mildangApi.items.list({ kind: 'MEAL', status: ['RECORDED'], limit: 50 }))
      const nextRecordHistory = getRecordedItemsView(response.items, demoRecordView)
      setRecordHistory(nextRecordHistory)
      setSelectedRecordDate(nextRecordHistory.initialDate)
      setScreen('record_a')
    } catch (requestError) {
      fail(requestError)
      if (demoRecordView) {
        setRecordHistory(demoRecordView)
        setSelectedRecordDate(demoRecordView.initialDate)
        setScreen('record_a')
      }
    } finally { setBusy('') }
  }

  function openDirectInput(source, options = {}) {
    setDirectInputRequest({ source, kind: source === '3a_presubtract' ? 'PROMISE' : 'MEAL', ...options })
    setScreen('3c_directInput'); setError('')
  }

  async function handleDirectInputAnalyze(query) {
    const analysis = remember(await mildangApi.analyses.text({ query, context: { challengeId, kind: directInputRequest.kind } }))
    const payload = { kind: directInputRequest.kind, analysisId: analysis.id }
    if (directInputRequest.kind === 'PROMISE') payload.weekday = directInputRequest.weekday
    const created = remember(await mildangApi.items.create(payload))
    const item = created.item ?? created

    if (item.kind === 'PROMISE') setPromiseItems((items) => [item, ...items.filter((value) => value.id !== item.id)])
    else await reloadMealItems()
    if (directInputRequest.source === '4b_scanResult') setScanManualItems((items) => [item, ...items])
    setScreen(directInputRequest.source)
    return item
  }

  async function handlePreset(preset) {
    setBusy('preset'); setError('')
    try {
      remember(await mildangApi.items.create({ kind: 'MEAL', presetId: preset.id }))
      await reloadMealItems()
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handleRecord(item) {
    setBusy('record'); setError('')
    try {
      const response = remember(await mildangApi.items.record(item.id))
      replaceItem(response.item); updateBudget(response.budget)
      setDashboard((current) => current ? { ...current, expiredConfirm: current.expiredConfirm?.filter((value) => value.id !== response.item?.id) } : current)
      if (response.item?.kind === 'MEAL') { await reloadMealItems(); await refreshTodayMeals() }
      if (response.overflow?.note) setError(response.overflow.note)
      sendLocalNotification('약속 선결제 완료', `${response.item?.original?.name ?? '약속 메뉴'}를 미리 반영했어요.`)
      if (screen === '4b_scanResult') setScreen('mainBoard')
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handlePrepay(item) {
    setBusy('prepay'); setError('')
    try {
      const response = remember(await mildangApi.items.prepay(item.id))
      replaceItem(response.item); updateBudget(response.budget)
      if (response.overflow?.note) setError(response.overflow.note)
      setScreen('mainBoard')
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handleDelete(item) {
    setBusy('delete'); setError('')
    try {
      await mildangApi.items.remove(item.id)
      setMealItems((items) => items.filter((value) => value.id !== item.id))
      setPromiseItems((items) => items.filter((value) => value.id !== item.id))
      if (item.kind !== 'PROMISE') await reloadMealItems()
      setDashboard((current) => current ? { ...current, expiredConfirm: current.expiredConfirm?.filter((value) => value.id !== item.id) } : current)
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function startHaggle(item, entryPoint, origin) {
    setBusy('haggle'); setError('')
    try {
      const session = remember(await mildangApi.haggles.start({ itemId: item.id, entryPoint }))
      setHaggle({ session, origin, itemId: item.id }); setScreen('5_mildangtalk')
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handleScan(file) {
    const created = remember(await mildangApi.scans.create(file, challengeId))
    const response = remember(await mildangApi.scans.get(created.id))
    setScan(response); setScanManualItems([]); setScreen('4b_scanResult')
    return response
  }

  async function handleScanMenuUpdate(menuId, points) {
    const updated = remember(await mildangApi.scans.updateMenu(scan.id, menuId, points))
    setScan((current) => ({ ...current, menus: current.menus.map((menu) => menu.id === menuId ? updated : menu) }))
    return updated
  }

  async function createScanItem(menu) {
    if (menu.item?.id) return menu.item
    if (menu.itemId) return scanManualItems.find((item) => item.id === menu.itemId) ?? { id: menu.itemId, kind: 'MEAL' }
    const created = remember(await mildangApi.items.create({ kind: 'MEAL', scanId: scan.id, menuId: menu.id }))
    const item = created.item ?? created
    setMealItems((items) => [item, ...items])
    return item
  }

  async function handleScanRecord(menu) {
    setBusy('scan-record'); setError('')
    try { await handleRecord(await createScanItem(menu)) } catch (requestError) { fail(requestError); setBusy('') }
  }

  async function handleScanHaggle(menu) {
    setBusy('scan-haggle'); setError('')
    try { await startHaggle(await createScanItem(menu), 'SCAN', '4b_scanResult') } catch (requestError) { fail(requestError); setBusy('') }
  }

  async function handleHaggleMessage(text) {
    const response = remember(await mildangApi.haggles.message(haggle.session.id, text))
    setHaggle((current) => ({ ...current, session: { ...current.session, ...response } }))
    return response
  }

  async function handleHaggleClose() {
    const response = remember(await mildangApi.haggles.close(haggle.session.id))
    replaceItem(response.item)
    if (response.item?.kind === 'MEAL') await reloadMealItems()
    return response
  }

  async function handleHaggleAbandon() {
    await mildangApi.haggles.abandon(haggle.session.id)
  }

  async function openCheckin() {
    setCheckin(null); setScreen('6_conditionCheckin'); setBusy('checkin'); setError('')
    try { setCheckin(remember(await mildangApi.checkins.today())) } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handleCheckin(answers) {
    setBusy('checkin-save'); setError('')
    try {
      const saved = remember(await mildangApi.checkins.save(answers))
      setCheckin(saved)
      setDashboard((current) => current ? { ...current, checkin: { ...current.checkin, doneToday: true } } : current)
      setScreen('mainBoard')
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function loadReport(id = challengeId, seedScenario) {
    const reportResponse = remember(await mildangApi.challenges.report(id))
    const response = IS_DEMO && seedScenario === 'COMPLETED'
      ? applyDemoCompletedReportSeed(reportResponse)
      : reportResponse
    setReport(response); return response
  }

  async function openReport() {
    setScreen('7_completeReport'); setBusy('report'); setError('')
    try { await loadReport() } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function handleShare() {
    setBusy('share'); setError('')
    try {
      const metadata = remember(await mildangApi.challenges.shareCard(challengeId, { mentions: [], format: 'PNG' }))
      setShareCard(IS_DEMO ? await renderDemoShareCard(report, metadata) : metadata)
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  async function applyDemoScenario(scenario) {
    const seeded = remember(await mildangApi.demo.seed(scenario))
    setChallengeId(seeded.challengeId ?? null)
    setRecordHistory(null)
    setSelectedRecordDate(null)
    if (scenario === 'FRESH') {
      setDashboard(null); setScreen('onboarding2')
    } else if (scenario === 'COMPLETED') {
      await loadReport(seeded.challengeId, scenario); setScreen('7_completeReport')
    } else {
      await loadDashboard(scenario); setScreen('mainBoard')
    }
  }

  async function handleDemoCommand(command, scenario) {
    setBusy('demo'); setError('')
    try {
      if (command === 'reset') {
        await mildangApi.demo.reset()
        setDashboard(null); setChallengeId(null); setScreen('onboarding2')
        return
      }
      if (command === 'seed') {
        await applyDemoScenario(scenario)
        return
      }
      if (command === 'advance') remember(await mildangApi.demo.advanceDay(1))
      if (command === 'batch') remember(await mildangApi.demo.runBatch())
      await loadDashboard(); setScreen('mainBoard')
    } catch (requestError) { fail(requestError) } finally { setBusy('') }
  }

  if (isStarting) return <StartScreen />

  const demoRecordView = IS_DEMO ? getDemoRecordView(demoAccount) : null
  const currentRecordView = recordHistory ?? demoRecordView
  let content
  if (screen === 'onboarding1') content = <Onboarding1 error={error} invite={invite} isDemo={IS_DEMO} isLoading={busy === 'login'} onStart={() => handleLogin()} />
  else if (screen === 'onboarding2') content = <Onboarding2 error={error} isLoading={busy === 'challenge'} plans={plans} onContinue={handlePlan} />
  else if (screen === 'onboarding2_1') content = <Onboarding2_1 error={error} isDemo={IS_DEMO} isLoading={busy === 'payment'} plan={selectedPlan} onBack={() => setScreen('onboarding2')} onContinue={handlePayment} />
  else if (screen === 'onboarding2_2') content = <Onboarding2_2 error={error} isDemo={IS_DEMO} isLoading={busy === 'payment'} plan={selectedPlan} onBack={() => setScreen('onboarding2')} onContinue={handlePayment} />
  else if (screen === 'onboarding3') content = <Onboarding3 error={error} isLoading={busy === 'estimate'} onBack={() => setScreen(selectedPlan?.period === 'W1' ? 'onboarding2' : selectedPlan?.period === 'W2' ? 'onboarding2_1' : 'onboarding2_2')} onContinue={handleBudgetEstimate} />
  else if (screen === 'budget') content = <Budget error={error} estimate={budgetEstimate} isLoading={busy === 'budget'} onContinue={handleBudgetConfirm} />
  else if (screen === '3c_directInput') content = <DirectInputScreen source={directInputRequest.source} initialMenuName={directInputRequest.initialMenuName} onBack={() => setScreen(directInputRequest.source)} onLoadRecent={mildangApi.analyses.recent} onAnalyze={handleDirectInputAnalyze} />
  else if (screen === '3b_meal') content = <MealScreen error={error} isLoading={Boolean(busy)} mealItems={mealItems} presets={presets} summary={mealSummary} onBack={() => setScreen('mainBoard')} onBargain={(item) => startHaggle(item, 'FREE', '3b_meal')} onDelete={handleDelete} onOpenDirectInput={(initialMenuName) => openDirectInput('3b_meal', { initialMenuName })} onOpenCameraScan={() => setScreen('4a_cameraScan')} onPreset={handlePreset} onRecord={handleRecord} />
  else if (screen === '4a_cameraScan') content = <CameraScan onBack={() => setScreen('3b_meal')} onCapture={handleScan} />
  else if (screen === '4b_scanResult') content = <ScanResult error={error} isLoading={Boolean(busy)} manualItems={scanManualItems} scan={scan} onBack={() => setScreen('3b_meal')} onChat={handleScanHaggle} onOpenDirectInput={() => openDirectInput('4b_scanResult')} onRecord={handleScanRecord} onRetake={() => setScreen('4a_cameraScan')} onUpdateMenu={handleScanMenuUpdate} />
  else if (screen === '3a_presubtract') content = <PreSubtract error={error} isLoading={Boolean(busy)} item={promiseItems[0]} onBack={() => setScreen('mainBoard')} onOpenDirectInput={(options) => openDirectInput('3a_presubtract', options)} onPrepay={handlePrepay} onStartChat={(item) => startHaggle(item, 'PROMISE', '3a_presubtract')} />
  else if (screen === '5_mildangtalk') content = <MildangTalk error={error} session={haggle?.session} onAbandon={handleHaggleAbandon} onClose={handleHaggleClose} onEnd={() => setScreen(haggle?.origin ?? 'mainBoard')} onSend={handleHaggleMessage} />
  else if (screen === '6_conditionCheckin') content = <ConditionCheckin checkin={checkin} error={error} isFetching={busy === 'checkin'} isLoading={busy === 'checkin-save'} onBack={() => setScreen('mainBoard')} onComplete={handleCheckin} />
  else if (screen === '7_completeReport') content = <CompleteReport error={error} isLoading={busy === 'share'} onBack={() => setScreen('mainBoard')} onShare={handleShare} report={report} shareCard={shareCard} />
  else if (screen === 'record_a') content = <RecordA initialDate={selectedRecordDate ?? currentRecordView?.initialDate} recordDates={currentRecordView?.recordDates} onBack={() => setScreen('mainBoard')} onNext={(date) => { setSelectedRecordDate(date); setScreen('record_b') }} />
  else if (screen === 'record_b') content = <RecordB challenge={dashboard?.challenge ?? currentRecordView?.challenge} checkinDays={dashboard?.checkin?.checkinDays ?? currentRecordView?.checkinDays} mealRecords={getDemoMealsForDate(currentRecordView, selectedRecordDate)} selectedDate={selectedRecordDate} onBack={() => setScreen('record_a')} />
  else content = <><MainBoard dashboard={dashboard} onMealClick={openMeal} onOpenPreSubtract={openPromise} onOpenRecords={openRecords} onConditionCheckin={openCheckin} onChallengeComplete={openReport} />{dashboard?.expiredConfirm?.[0] && <aside role="dialog" aria-modal="true" style={{ position: 'fixed', zIndex: 9998, left: 20, right: 20, bottom: 20, padding: 20, borderRadius: 20, background: '#fff', boxShadow: '0 8px 40px #0004' }}><p>{dashboard.expiredConfirm[0].question}</p><button type="button" onClick={() => handleRecord({ id: dashboard.expiredConfirm[0].id })}>드셨어요</button><button type="button" onClick={() => handleDelete({ id: dashboard.expiredConfirm[0].id })}>안 먹었어요</button></aside>}</>

  return <>{IS_DEMO && <DemoControls account={demoAccount} backendConfirmed={hasMockedResponse} isAuthenticated={isDemoAuthenticated} isLoading={busy === 'demo' || busy === 'login'} onCommand={handleDemoCommand} onLogin={handleLogin} />}{screen === 'mainBoard' && error && <div role="status" style={{ position: 'fixed', zIndex: 9997, right: 20, bottom: 120, left: 20, padding: 12, borderRadius: 12, background: '#212121', color: '#fff', textAlign: 'center' }}>{error}</div>}{content}</>
}

export default App
