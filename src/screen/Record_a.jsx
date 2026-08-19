import { useMemo, useState } from 'react'
import backChevron from '../img/chevron-left.svg'
import calendarArrows from '../img/record-calendar-arrows.svg'
import monthForward from '../img/record-month-forward.svg'
import '../css/Record_a.css'

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function validDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? new Date(value) : new Date()
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function getMonthDays(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
}

function isSameMonthAndDay(date, viewDate, day) {
  return (
    date.getFullYear() === viewDate.getFullYear() &&
    date.getMonth() === viewDate.getMonth() &&
    date.getDate() === day
  )
}


function Record_a({ initialDate, onBack, onNext, recordDates = [] }) {
  const [viewDate, setViewDate] = useState(() => validDate(initialDate))
  const [selectedDate, setSelectedDate] = useState(() => validDate(initialDate))
  const monthDays = useMemo(() => getMonthDays(viewDate), [viewDate])
  const recordDateKeys = useMemo(
    () => new Set(recordDates.filter((date) => date instanceof Date).map(dateKey)),
    [recordDates],
  )
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate)

  const moveMonth = (offset) => {
    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    )
  }

  const selectDay = (day) => {
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
  }

  return (
    <main className="record-a" aria-labelledby="record-a-title">

      <header className="record-a__topbar">
        <button type="button" onClick={onBack} aria-label="메인보드로 돌아가기">
          <img src={backChevron} alt="" />
        </button>
      </header>

      <section className="record-a__intro">
        <h1 id="record-a-title">기록 보기</h1>
        <p>확인하고 싶은 날짜를 선택해주세요</p>
      </section>

      <section className="record-a__calendar-shell" aria-label="기록 날짜 선택">
        <div className="record-a__calendar">
          <div className="record-a__month-picker">
            <div className="record-a__month-label">
              <strong>{monthLabel}</strong>
              <img src={monthForward} alt="" />
            </div>

            <div className="record-a__month-controls">
              <img src={calendarArrows} alt="" aria-hidden="true" />
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label="이전 달"
              />
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="다음 달"
              />
            </div>
          </div>

          <div className="record-a__weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="record-a__days">
            {monthDays.map((day, index) => {
              if (!day) return <span className="record-a__day record-a__day--empty" key={`empty-${index}`} />
              const selected = isSameMonthAndDay(selectedDate, viewDate, day)
              const hasRecord = recordDateKeys.has(dateKey(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)))
              return (
                <button
                  className={`record-a__day${selected ? ' record-a__day--selected' : ''}${hasRecord ? ' record-a__day--has-record' : ''}`}
                  type="button"
                  key={day}
                  onClick={() => selectDay(day)}
                  aria-pressed={selected}
                  aria-label={`${monthLabel} ${day}${hasRecord ? ', 기록 있음' : ''}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <button
        className="record-a__next"
        type="button"
        onClick={() => onNext?.(selectedDate)}
      >
        다음
      </button>
    </main>
  )
}

export default Record_a
