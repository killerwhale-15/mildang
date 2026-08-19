import backChevron from '../img/chevron-left.svg'
import checkedBase from '../img/record-check-base-white.svg'
import checkedOverlay from '../img/record-check-overlay-yellow.svg'
import uncheckedBase from '../img/record-check-base-gray.svg'
import uncheckedOverlay from '../img/record-check-overlay-white.svg'
import '../css/Record_b.css'

function formatRecordDate(date) {
  const value = date instanceof Date && !Number.isNaN(date.getTime())
    ? date
    : new Date()

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('.')
}


function ProgressIndicator({ completed, current }) {
  return (
    <span className={`record-b__progress-indicator${current ? ' record-b__progress-indicator--current' : ''}`} aria-label={completed ? '완료' : current ? '오늘' : '미완료'}>
      <img src={completed ? checkedBase : uncheckedBase} alt="" />
      <img src={completed ? checkedOverlay : uncheckedOverlay} alt="" />
    </span>
  )
}

function getCompletedCheckinDays(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  return Array.from({ length: value.answered ?? 0 }, (_, index) => index + 1)
}

function Record_b({
  challenge,
  checkinDays = [],
  onBack,
  selectedDate,
  mealRecords = [],
}) {
  const records = Array.isArray(mealRecords) ? mealRecords : []
  const currentDay = challenge?.dayIndex ?? 1
  const currentWeek = Math.ceil(currentDay / 7)
  const firstDayOfWeek = (currentWeek - 1) * 7 + 1
  const completedDays = new Set(getCompletedCheckinDays(checkinDays))
  const challengeDays = Array.from({ length: 7 }, (_, index) => ({
    day: index + 1,
    challengeDay: firstDayOfWeek + index,
    completed: completedDays.has(firstDayOfWeek + index),
    current: firstDayOfWeek + index === currentDay,
  }))

  return (
    <main className="record-b" aria-labelledby="record-b-title">

      <header className="record-b__topbar">
        <button type="button" onClick={onBack} aria-label="날짜 선택으로 돌아가기">
          <img src={backChevron} alt="" />
        </button>
      </header>

      <section className="record-b__intro">
        <h1 id="record-b-title">기록 보기</h1>
        <p>이 날의 식사 기록을 모아봤어요</p>
      </section>

      <section className="record-b__progress" aria-labelledby="record-progress-title">
        <h2 id="record-progress-title">{currentWeek}주차 챌린지 진행률</h2>
        <ol>
          {challengeDays.map(({ day, challengeDay, completed, current }) => (
            <li className={current ? 'record-b__progress-day--current' : ''} key={challengeDay}>
              <span className="record-b__day-label">{day}일차</span>
              <ProgressIndicator completed={completed} current={current} />
              {current && <span className="record-b__today">오늘</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="record-b__records" aria-labelledby="record-date-title">
        <h2 id="record-date-title">{formatRecordDate(selectedDate)}</h2>
        <p className="record-b__sort">최근 입력한 순</p>

        <div className="record-b__meal-list">
          {!records.length && <p className="record-b__empty">이 날의 식사 기록이 없어요.</p>}
          {records.map((record, index) => (
            <article className="record-b__meal" key={record.id ?? `${record.name}-${index}`}>
              <strong className="record-b__meal-score">{record.score ?? 0}</strong>
              <div className="record-b__meal-copy">
                <h3>{record.name}</h3>
                <p>{record.description}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="record-b__total">총 {records.length}건</p>
      </section>
    </main>
  )
}

export default Record_b
