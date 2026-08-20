const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(value) {
  const date = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getChallengeTotalDays(challenge) {
  if (challenge?.totalDays) return challenge.totalDays
  return (Number(String(challenge?.period ?? 'W1').slice(1)) || 1) * 7
}

export function getCurrentChallengeDay(challenge) {
  return challenge?.dayIndex ?? challenge?.currentDay ?? 1
}

export function getCompletedCheckinDays(value, currentChallengeDay = 1) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') {
    return Array.from({ length: Math.max(0, currentChallengeDay - 1) }, (_, index) => index + 1)
  }
  return Array.from({ length: value.answered ?? 0 }, (_, index) => index + 1)
}

export function getChallengeDayForDate(date, challenge, todayDate) {
  const currentDay = getCurrentChallengeDay(challenge)
  const offset = Math.round((startOfDay(date) - startOfDay(todayDate)) / DAY_MS)
  return Math.min(getChallengeTotalDays(challenge), Math.max(1, currentDay + offset))
}

export function getChallengeWeek({ challenge, checkinDays, doneToday, focusDay }) {
  const currentDay = getCurrentChallengeDay(challenge)
  const completedDays = new Set(getCompletedCheckinDays(checkinDays, currentDay))
  if (doneToday) completedDays.add(currentDay)
  const focusedDay = focusDay ?? currentDay
  const week = Math.ceil(focusedDay / 7)
  const firstDayOfWeek = (week - 1) * 7 + 1

  return {
    week,
    currentDay,
    focusedDay,
    isTodayCompleted: completedDays.has(currentDay),
    days: Array.from({ length: 7 }, (_, index) => {
      const challengeDay = firstDayOfWeek + index
      return {
        challengeDay,
        day: `${index + 1}일차`,
        completed: completedDays.has(challengeDay),
        isToday: challengeDay === currentDay,
        focused: challengeDay === focusedDay,
      }
    }),
  }
}
