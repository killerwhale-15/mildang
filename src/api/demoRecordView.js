import { DEMO_JUDGE_SEEDS } from './demoAccounts.js'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_START_HOUR = 5

function calendarDate(year, month, day) {
  return new Date(year, month - 1, day)
}

function addDays(date, offset) {
  const value = new Date(date)
  value.setDate(value.getDate() + offset)
  return value
}

export function getDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getKstLogicalDate(now = new Date()) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  let logicalDate = calendarDate(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth() + 1,
    kstNow.getUTCDate(),
  )
  if (kstNow.getUTCHours() < DAY_START_HOUR) logicalDate = addDays(logicalDate, -1)
  return logicalDate
}

export function getKstToday(now = new Date()) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  return calendarDate(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth() + 1,
    kstNow.getUTCDate(),
  )
}

function relativeDate(logicalDate, relativeDateLabel) {
  const match = String(relativeDateLabel).match(/^D-(\d+)$/)
  return addDays(logicalDate, match ? -Number(match[1]) : 0)
}

function recordDescription(record) {
  if (record.adjustedPoints != null) {
    return `${record.points} → ${record.adjustedPoints}밀 · 흥정 ${record.haggleTurns}턴`
  }
  return `${record.points}밀 기록`
}

function dateFromLogicalDate(value, recordedAt) {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return calendarDate(Number(match[1]), Number(match[2]), Number(match[3]))
  return recordedAt ? getKstLogicalDate(new Date(recordedAt)) : getKstLogicalDate()
}

function itemDescription(item) {
  if (item.adjusted) {
    return `${item.original?.points ?? item.effective?.points ?? 0} → ${item.effective?.points ?? item.adjusted.points}밀 · 흥정 ${item.adjusted.turns ?? 0}턴`
  }
  return `${item.effective?.points ?? item.original?.points ?? 0}밀 기록`
}

export function getDemoRecordView(account, now = new Date()) {
  const seed = DEMO_JUDGE_SEEDS[account]
  const today = getKstToday(now)
  if (!seed) return { initialDate: today, recordDates: [], records: [] }

  const records = seed.records.map((record, index) => {
    const date = relativeDate(today, record.date)
    return {
      ...record,
      id: `${account}-record-${index + 1}`,
      date,
      dateKey: getDateKey(date),
      score: record.adjustedPoints ?? record.points,
      name: record.menu,
      description: recordDescription(record),
    }
  })
  return {
    challenge: seed.challenge,
    checkinDays: (seed.checkins ?? []).map((checkin) => {
      const match = String(checkin.date).match(/^D-(\d+)$/)
      return Math.max(1, seed.challenge.dayIndex - (match ? Number(match[1]) : 0))
    }),
    initialDate: today,
    logicalDate: today,
    recordDates: records.map((record) => record.date),
    records,
  }
}

export function getDemoMealsForDate(recordView, selectedDate) {
  const selectedDateKey = getDateKey(selectedDate)
  return (recordView?.records ?? []).filter((record) => record.dateKey === selectedDateKey)
}

export function getRecordedItemsView(items, fallbackView = {}, now = new Date()) {
  const records = (Array.isArray(items) ? items : []).map((item, index) => {
    const date = dateFromLogicalDate(item.logicalDate, item.recordedAt)
    return {
      id: item.id ?? `recorded-item-${index + 1}`,
      date,
      dateKey: getDateKey(date),
      score: item.effective?.points ?? item.adjusted?.points ?? item.original?.points ?? 0,
      name: item.original?.name ?? item.adjusted?.label ?? '식사 기록',
      description: itemDescription(item),
    }
  })
  const today = getKstToday(now)

  return {
    ...fallbackView,
    initialDate: today,
    recordDates: records.map((record) => record.date),
    records,
  }
}
