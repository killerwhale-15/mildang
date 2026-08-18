import { IS_DEMO } from './config.js'

export async function prepareLocalNotifications() {
  if (!IS_DEMO || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

export function sendLocalNotification(title, body) {
  if (!IS_DEMO || !('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag: 'mildang-demo' })
  } catch {
    // 일부 모바일 브라우저는 서비스 워커 알림만 지원합니다.
  }
}
