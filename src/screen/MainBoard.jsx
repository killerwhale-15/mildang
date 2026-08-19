import checkBase from '../img/mainboard-check-base.svg'
import checkMark from '../img/mainboard-check-mark.svg'
import chevron from '../img/mainboard-chevron.svg'
import coachIcon from '../img/mainboard-coach.svg'
import notificationBell from '../img/mainboard-notification-bell.svg'
import progressThumb from '../img/mainboard-progress-thumb.svg'
import uncheckedBase from '../img/mainboard-unchecked-base.svg'
import uncheckedMark from '../img/mainboard-unchecked-mark.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import { getItemDisplay } from '../api/itemView.js'
import ChallengeCompletionButton from '../components/ChallengeCompletionButton.jsx'
import '../css/MainBoard.css'

const weekdayLabels = {
  MON: '월요일',
  TUE: '화요일',
  WED: '수요일',
  THU: '목요일',
  FRI: '금요일',
  SAT: '토요일',
  SUN: '일요일',
}

const figmaNoticeFallback = {
  date: '2026.08.17',
  message: '금요일 치킨 약속이 있어요',
}

function formatNoticeDate(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/)
  if (!match) return String(value)
  return `${match[1]}.${match[2].padStart(2, '0')}.${match[3].padStart(2, '0')}`
}

function getNoticeMessage(notice) {
  const suppliedMessage = notice?.message ?? notice?.text
  if (suppliedMessage) return suppliedMessage

  const weekday = weekdayLabels[notice?.weekday]
  let name = notice?.name?.trim()
  if (!name) return ''
  if (weekday && !name.includes(weekday)) name = `${weekday} ${name}`
  if (!name.includes('약속')) name = `${name} 약속`
  return `${name}이 있어요`
}


function getTodayItemView(item) {
  const display = getItemDisplay(item)
  return {
    label: item?.label ?? item?.name ?? display.name,
    points: item?.points ?? display.points,
  }
}

function getCompletedCheckinDays(value, currentChallengeDay) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') {
    return Array.from({ length: Math.max(0, currentChallengeDay - 1) }, (_, index) => index + 1)
  }
  return Array.from({ length: value.answered ?? 0 }, (_, index) => index + 1)
}

function ChallengeCheck({ completed }) {
  return <span className="challenge-check" aria-label={completed ? '완료' : '미완료'}><img src={completed ? checkBase : uncheckedBase} alt="" /><img src={completed ? checkMark : uncheckedMark} alt="" /></span>
}

function MainBoard({
  dashboard,
  onChallengeComplete,
  onConditionCheckin,
  onMealClick,
  onOpenRecords,
  onOpenPreSubtract,
}) {
  if (!dashboard) {
    return <main className="main-board" aria-busy="true">대시보드를 불러오는 중…</main>
  }

  const challenge = dashboard.challenge
  const budget = dashboard.budget
  const challengeWeeks = Number(String(challenge.period ?? 'W1').slice(1)) || 1
  const currentChallengeDay = challenge.dayIndex ?? challenge.currentDay ?? 1
  const currentWeek = Math.ceil(currentChallengeDay / 7)
  const currentDayOfWeek = ((currentChallengeDay - 1) % 7) + 1
  const totalChallengeDays = challengeWeeks * 7
  const isChallengeLastDay = currentChallengeDay >= totalChallengeDays
  const suppliedCheckinDays = dashboard?.checkin?.checkinDays
  const checkinDays = getCompletedCheckinDays(suppliedCheckinDays, currentChallengeDay)
  const completedDaySet = new Set(checkinDays)
  if (dashboard?.checkin?.doneToday) completedDaySet.add(currentChallengeDay)
  const isTodayCompleted = completedDaySet.has(currentChallengeDay)
  const firstDayOfWeek = (currentWeek - 1) * 7 + 1
  const challengeDays = Array.from({ length: 7 }, (_, index) => {
    const challengeDay = firstDayOfWeek + index
    return { challengeDay, day: `${index + 1}일차`, completed: completedDaySet.has(challengeDay) }
  })
  const gauge = budget.gaugePercent ?? 0
  const prepaid = dashboard?.prepaidItems?.[0]
  const notice = dashboard?.todayNotification ?? dashboard?.notification ?? prepaid
  const noticeDate = formatNoticeDate(
    notice?.date ?? notice?.logicalDate ?? notice?.scheduledDate,
  ) || figmaNoticeFallback.date
  const noticeMessage = getNoticeMessage(notice) || figmaNoticeFallback.message
  const tip = dashboard?.tip?.text?.trim() || (
    currentChallengeDay === 1
      ? '첫날이에요. 오늘 먹은 것부터 가볍게 기록해보세요.'
      : '오늘 기록을 남기면 내일 더 정확한 흐름을 알려드릴게요.'
  )
  const today = dashboard?.today
  const todayItemViews = (today?.items ?? []).map(getTodayItemView)
  const todayTotalPoints = today?.totalPoints
    ?? todayItemViews.reduce((sum, item) => sum + item.points, 0)
  const todaySummary = `${today?.count ?? todayItemViews.length}건 · ${todayTotalPoints}밀`

  return (
    <main className="main-board" aria-labelledby="main-board-title">
      <header className="main-board__header"><h1 id="main-board-title"><img src={mildangLogo} alt="밀당" /></h1></header>

      <section className="budget-summary" aria-labelledby="budget-summary-title">
        <div className="budget-summary__heading"><h2 id="budget-summary-title">남은 예산</h2><span>{currentWeek}주차 {currentDayOfWeek}일차</span></div>
        <p className="budget-summary__amount"><strong>{budget.balance}</strong><span>/{budget.total}</span></p>
        <div className="budget-summary__progress" role="progressbar" aria-label="남은 예산" aria-valuemin="0" aria-valuemax={budget.total} aria-valuenow={budget.balance}>
          <span className="budget-summary__progress-fill" style={{ width: `${gauge}%` }} />
          <img src={progressThumb} alt="" style={{ left: `${gauge}%` }} />
        </div>
        <p className={`budget-summary__caption${dashboard?.pace?.state === 'BEHIND' ? ' budget-summary__caption--behind' : ''}`}>{dashboard?.pace?.note}</p>
      </section>

      <section className="coach-message" aria-label="밀당 코치 메시지"><img src={coachIcon} alt="" /><p><span>{tip}</span></p></section>

      <section className="main-board__cards" aria-label="오늘의 일정">
        <button className="today-card today-card--notice" type="button" onClick={onOpenPreSubtract}>
          <strong>오늘의 알림</strong>
          <span>{noticeDate}</span>
          <span>{noticeMessage}</span>
          <img src={notificationBell} alt="" />
        </button>
        <button className="today-card today-card--promise" type="button" onClick={onOpenPreSubtract}>
          <strong>미리 약속을 잡았나요</strong>
          <span className="today-card__promise-copy">사전 결제하면 예산 관리가<br />더 쉬워져요</span>
          <img src={chevron} alt="" />
        </button>
      </section>

      <section className="main-board__actions" aria-label="오늘의 기록">
        <button className="main-action main-action--primary" type="button" onClick={onMealClick}>식사 기록하기</button>
        <button className={`main-action${isTodayCompleted ? ' main-action--completed' : ''}`} type="button" onClick={onConditionCheckin}>{isTodayCompleted ? '체크인 수정' : '컨디션 체크인'}</button>
      </section>

      <section className="today-meals" aria-labelledby="today-meals-title">
        <header><h2 id="today-meals-title">오늘 먹은 것</h2><span>{todaySummary}</span></header>
        {todayItemViews.length > 0
          ? <p>{todayItemViews.slice(0, 2).map((item) => `${item.label} ${item.points}밀`).join(' · ')}</p>
          : <p>아직 기록된 식사가 없어요.</p>}
      </section>

      <section className="challenge-progress" aria-labelledby="challenge-progress-title">
        <h2 id="challenge-progress-title">{currentWeek}주차 챌린지 진행률</h2>
        <ol>{challengeDays.map(({ challengeDay, day, completed }) => <li key={challengeDay}><span className="challenge-progress__day">{day}</span><ChallengeCheck completed={completed} /><span className="challenge-progress__weight" /></li>)}</ol>
      </section>

      <button className="main-board__records" type="button" onClick={onOpenRecords}>+ 기록 보기</button>
      {(challenge.status === 'COMPLETED' || (isChallengeLastDay && isTodayCompleted)) && <div className="main-board__completion"><ChallengeCompletionButton onClick={onChallengeComplete} /></div>}
    </main>
  )
}

export default MainBoard
