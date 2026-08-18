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

function MildangTalk({ error, onAbandon, onClose, onEnd, onSend, session }) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [localError, setLocalError] = useState('')
  const [turns, setTurns] = useState([])
  const [current, setCurrent] = useState(session)
  const chips = current?.chips ?? current?.proposal?.chips ?? []

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
      <header className="mildang-talk__topbar"><img src={mildangLogo} alt="밀당" /><button type="button" onClick={handleAbandon}>나가기</button></header>
      <p className="mildang-talk__intro">최대 {current?.maxTurns ?? 10}턴 안에서 같은 메뉴의 양이나 구성을 조정해요.</p>
      <div className="mildang-talk__date-separator"><div className="mildang-talk__new-message"><span /><strong>{current?.turn ?? 0} / {current?.maxTurns ?? 10}턴</strong><span /></div></div>
      <div className="mildang-talk__conversation">
        <section className="mildang-talk__message" aria-label="밀당이 메시지"><img src={userIcon} alt="" /><p>{current?.opening ?? '어떻게 줄일지 함께 정해볼까요?'}</p></section>
        {turns.map((turn, index) => <section className="mildang-talk__message" key={`${turn.text}-${index}`}><p><strong>나</strong><br />{turn.text}<br /><br /><strong>밀당이</strong><br />{turn.reply}</p></section>)}
        {current?.reply && turns.length === 0 && <section className="mildang-talk__message"><img src={userIcon} alt="" /><p>{current.reply?.text ?? current.reply}</p></section>}
        {current?.simulation && <section className="mildang-talk__message"><p><strong>{current.frame === 'REDUCE_OVERFLOW' ? '초과가 덜 깊어져요' : '이만큼 아껴요'}</strong><br />{current.simulation.original.row}: {current.simulation.original.balanceAfter} → {current.simulation.adjusted.row}: {current.simulation.adjusted.balanceAfter}</p></section>}
      </div>
      {(localError || error) && <p role="alert">{localError || error}</p>}
      <form className="mildang-talk__composer" onSubmit={handleSubmit}>
        <fieldset disabled={isSending}><legend>추천 답변</legend><div>{chips.map((chip) => <button type="button" key={chip} onClick={() => setMessage(chip)}>{chip}</button>)}</div></fieldset>
        <label className="mildang-talk__input"><span className="mildang-talk__sr-only">줄이고 싶은 방식</span><input type="text" maxLength="200" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="양이나 구성을 말해보세요" disabled={isSending || current?.status === 'CLOSED'} /></label>
        <button type="submit" disabled={!message.trim() || isSending}>보내기</button>
        <button className="mildang-talk__end" type="button" onClick={handleClose} disabled={isSending}>{current?.closeButtonLabel ?? '이대로 정하기'}</button>
      </form>
    </main>
  )
}

export default MildangTalk
