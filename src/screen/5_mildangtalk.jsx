import { useEffect, useRef, useState } from 'react'
import mildangLogo from '../img/onboarding_logo_3x.png'
import userIcon from '../img/mildangtalk-user.svg'
import '../css/5_mildangtalk.css'


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

function BotMessage({ children }) {
  return (
    <article className="mildang-talk__row mildang-talk__row--bot">
      <img className="mildang-talk__avatar" src={userIcon} alt="" />
      <div className="mildang-talk__stack">
        <span className="mildang-talk__name">밀당이</span>
        <p className="mildang-talk__bubble mildang-talk__bubble--bot">{children}</p>
      </div>
    </article>
  )
}

function UserMessage({ children }) {
  return (
    <article className="mildang-talk__row mildang-talk__row--user">
      <div className="mildang-talk__stack">
        <span className="mildang-talk__name mildang-talk__name--user">나</span>
        <p className="mildang-talk__bubble mildang-talk__bubble--user">{children}</p>
      </div>
    </article>
  )
}

function SavingCard({ frame, simulation }) {
  const { adjusted, original } = simulation
  return (
    <article className="mildang-talk__row mildang-talk__row--summary" aria-label="합의 결과 요약">
      <div className="mildang-talk__summary">
        <p className="mildang-talk__summary-title">{frame === 'REDUCE_OVERFLOW' ? '초과가 덜 깊어져요' : '이만큼 아껴요'}</p>
        <dl className="mildang-talk__summary-rows">
          <div className="mildang-talk__summary-row mildang-talk__summary-row--before">
            <dt>원래</dt>
            <dd>
              <span className="mildang-talk__summary-label">{original.row}</span>
              {original.balanceAfter != null && <span className={`mildang-talk__summary-balance${original.overflow ? ' is-overflow' : ''}`}>잔액 {original.balanceAfter}</span>}
            </dd>
          </div>
          <div className="mildang-talk__summary-arrow" aria-hidden="true">↓</div>
          <div className="mildang-talk__summary-row mildang-talk__summary-row--after">
            <dt>합의</dt>
            <dd>
              <span className="mildang-talk__summary-label">{adjusted.row}</span>
              {adjusted.balanceAfter != null && <span className={`mildang-talk__summary-balance${adjusted.overflow ? ' is-overflow' : ''}`}>잔액 {adjusted.balanceAfter}</span>}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

function MildangTalk({ error, onAbandon, onClose, onEnd, onSend, session }) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [localError, setLocalError] = useState('')
  const [turns, setTurns] = useState([])
  const [current, setCurrent] = useState(session)
  const conversationRef = useRef(null)
  const recentItems = current?.recentItems ?? current?.recentMenus ?? current?.recent ?? current?.chips ?? current?.proposal?.chips ?? FALLBACK_RECENT_ITEMS
  const chatDate = formatChatDate(current?.createdAt ?? current?.startedAt ?? current?.date)

  useEffect(() => {
    const node = conversationRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [turns.length])

  async function handleSubmit(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text || isSending) return
    setIsSending(true)
    setLocalError('')
    try {
      const response = await onSend?.(text)
      setTurns((items) => [...items, {
        frame: response.frame,
        reply: response.reply?.text ?? response.reply,
        simulation: response.simulation ?? null,
        text,
      }])
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
      <header className="mildang-talk__topbar"><img src={mildangLogo} alt="밀당" /><button className="mildang-talk__leave" type="button" onClick={handleAbandon}>나가기</button></header>
      <p className="mildang-talk__intro">밀당이와 대화를 시작해보세요</p>
      <div className="mildang-talk__date-separator"><time dateTime={current?.createdAt ?? current?.startedAt ?? current?.date ?? '2026-08-09'}>{chatDate}</time><div className="mildang-talk__new-message"><span /><strong>새로운 메세지</strong><span /></div></div>
      <div className="mildang-talk__conversation" ref={conversationRef}>
        <BotMessage>{current?.opening ?? '어떻게 줄일지 함께 정해볼까요?'}</BotMessage>
        {turns.map((turn, index) => (
          <div className="mildang-talk__turn" key={`${turn.text}-${index}`}>
            <UserMessage>{turn.text}</UserMessage>
            {turn.reply && <BotMessage>{turn.reply}</BotMessage>}
            {turn.simulation && <SavingCard frame={turn.frame ?? current?.frame} simulation={turn.simulation} />}
          </div>
        ))}
        {current?.reply && turns.length === 0 && <BotMessage>{current.reply?.text ?? current.reply}</BotMessage>}
        {current?.simulation && turns.length === 0 && <SavingCard frame={current.frame} simulation={current.simulation} />}
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
