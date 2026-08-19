import { useState } from 'react'
import mildangLogo from '../img/onboarding_logo_3x.png'
import notch from '../img/mainboard-notch.svg'
import statusRight from '../img/mainboard-status-right.svg'
import statusTime from '../img/mainboard-status-time.svg'
import userIcon from '../img/mildangtalk-user.svg'
import '../css/5_mildangtalk.css'

function StatusBar() {
  return <div className="mildang-talk__status" aria-hidden="true"><img className="mildang-talk__time" src={statusTime} alt="" /><img className="mildang-talk__notch" src={notch} alt="" /><img className="mildang-talk__status-right" src={statusRight} alt="" /></div>
}

const FALLBACK_RECENT_ITEMS = ['라면 80', '빵 45', '떡볶이 55', '치킨 70']

function formatChatDate(value) {
  const rawDate = value ?? '2026-08-09'
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return String(rawDate)
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(date)
}

function MildangTalk({ error, onAbandon, onClose, onEnd, onSend, session }) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [localError, setLocalError] = useState('')
  const [turns, setTurns] = useState([])
  const [current, setCurrent] = useState(session)
  const recentItems = current?.recentItems ?? current?.recentMenus ?? current?.recent ?? current?.chips ?? current?.proposal?.chips ?? FALLBACK_RECENT_ITEMS
  const chatDate = formatChatDate(current?.createdAt ?? current?.startedAt ?? current?.date)

  async function handleSubmit(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text || isSending) return
    setIsSending(true)
    setLocalError('')
    try {
      const response = await onSend?.(text)
      setTurns((items) => [...items, { text, reply: response.reply?.text ?? response.reply }])
      setCurrent((value) => ({ ...value, ...response }))
      setMessage('')
    } catch (requestError) {
      setLocalError(requestError.message)
    } finally {
      setIsSending(false)
    }
  }

  async function handleClose() {
    setIsSending(true)
    setLocalError('')
    try { await onClose?.(); onEnd?.() } catch (requestError) { setLocalError(requestError.message) } finally { setIsSending(false) }
  }

  async function handleAbandon() {
    try { await onAbandon?.(); onEnd?.() } catch (requestError) { setLocalError(requestError.message) }
  }

  return (
    <main className="mildang-talk" aria-labelledby="mildang-talk-title">
      <h1 id="mildang-talk-title" className="mildang-talk__sr-only">밀당 대화</h1>
      <StatusBar />
      <header className="mildang-talk__topbar"><img src={mildangLogo} alt="밀당" /><button className="mildang-talk__leave" type="button" onClick={handleAbandon}>나가기</button></header>
      <p className="mildang-talk__intro">밀당이와 대화를 시작해보세요</p>
      <div className="mildang-talk__date-separator"><time dateTime={current?.createdAt ?? current?.startedAt ?? current?.date ?? '2026-08-09'}>{chatDate}</time><div className="mildang-talk__new-message"><span /><strong>새로운 메세지</strong><span /></div></div>
      <div className="mildang-talk__conversation">
        <section className="mildang-talk__message" aria-label="밀당이 메시지"><img src={userIcon} alt="" /><p>{current?.opening ?? '어떻게 줄일지 함께 정해볼까요?'}</p></section>
        {turns.map((turn, index) => <section className="mildang-talk__message" key={`${turn.text}-${index}`}><p><strong>나</strong><br />{turn.text}<br /><br /><strong>밀당이</strong><br />{turn.reply}</p></section>)}
        {current?.reply && turns.length === 0 && <section className="mildang-talk__message"><img src={userIcon} alt="" /><p>{current.reply?.text ?? current.reply}</p></section>}
        {current?.simulation && <section className="mildang-talk__message"><p><strong>{current.frame === 'REDUCE_OVERFLOW' ? '초과가 덜 깊어져요' : '이만큼 아껴요'}</strong><br />{current.simulation.original.row}: {current.simulation.original.balanceAfter} → {current.simulation.adjusted.row}: {current.simulation.adjusted.balanceAfter}</p></section>}
      </div>
      {(localError || error) && <p role="alert">{localError || error}</p>}
      <form className="mildang-talk__composer" onSubmit={handleSubmit}>
        <fieldset disabled={isSending}><legend>최근 내역</legend><div>{recentItems.map((chip) => <button type="button" key={chip} onClick={() => setMessage(chip)}>{chip}</button>)}</div></fieldset>
        <label className="mildang-talk__input"><span className="mildang-talk__sr-only">줄이고 싶은 방식</span><input type="text" maxLength="200" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="얼마나 줄일지 말해보세요" disabled={isSending || current?.status === 'CLOSED'} /></label>
        <button className="mildang-talk__send" type="submit" disabled={!message.trim() || isSending}>전송</button>
        <button className="mildang-talk__end" type="button" onClick={handleClose} disabled={isSending}>대화 종료</button>
      </form>
    </main>
  )
}

export default MildangTalk
