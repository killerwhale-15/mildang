import { useState } from 'react'
import { getItemDisplay } from '../api/itemView.js'
import chevronLeft from '../img/chevron-left.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import cardDivider from '../img/presubtract-card-divider.svg'
import scoreBackground from '../img/presubtract-score.svg'
import sectionDivider from '../img/presubtract-section-divider.svg'
import '../css/3a_presubtract.css'

const weekdays = [
  ['MON', '월요일'], ['TUE', '화요일'], ['WED', '수요일'], ['THU', '목요일'],
  ['FRI', '금요일'], ['SAT', '토요일'], ['SUN', '일요일'],
]


function PreSubtract({ error, isLoading = false, item, onBack, onOpenDirectInput, onPrepay, onStartChat }) {
  const [weekday, setWeekday] = useState(item?.weekday ?? 'FRI')
  const meal = item ? getItemDisplay(item) : null
  const mealMeta = meal ? [meal.unit, `${meal.points}밀`].filter(Boolean).join(' ') : ''

  return (
    <main className="presubtract" aria-labelledby="presubtract-title">
      <header className="presubtract__brand"><img src={mildangLogo} alt="밀당" /></header>
      <button className="presubtract__back" type="button" onClick={onBack} aria-label="메인보드로 돌아가기"><img src={chevronLeft} alt="" /></button>
      <section className="presubtract__intro"><h1 id="presubtract-title">약속 사전 결제</h1><p>피할 수 없는 약속은 미리 빼두세요.</p>{error && <p role="alert">{error}</p>}</section>

      <form className="presubtract__form" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="presubtract-date">언제예요?</label>
        <div className="presubtract__date-field">
          <select id="presubtract-date" value={weekday} onChange={(event) => setWeekday(event.target.value)}>
            {weekdays.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <img src={chevronLeft} alt="" />
        </div>
        <label id="presubtract-menu-label">뭘 먹기로 했어요?</label>
        <button className="presubtract__menu-trigger" type="button" onClick={() => onOpenDirectInput?.({ weekday })} aria-labelledby="presubtract-menu-label">
          <span>{meal?.name ?? '메뉴 입력하기'}</span><strong>직접 입력</strong>
        </button>
      </form>

      <img className="presubtract__section-divider" src={sectionDivider} alt="" />
      {item ? (
        <article className="presubtract__preview" aria-label="차감 예상 내역">
          <div className="presubtract__score" aria-label={`${meal?.points ?? 0}밀`}><img src={scoreBackground} alt="" /><strong>{meal?.points ?? 0}</strong></div>
          <div className="presubtract__meal"><h2>{meal?.name}</h2><span>{mealMeta}</span><p>{meal?.basis}</p></div>
          <img className="presubtract__card-divider" src={cardDivider} alt="" />
          <p className="presubtract__balance">
            {meal?.balanceAfter == null ? <>상태 <strong>{item.status}</strong></> : <>기록하면 잔액 <strong>{meal.balanceAfter}밀</strong></>}
          </p>
          <div className="presubtract__actions">
            <button type="button" onClick={() => onStartChat?.(item)}>밀당하기</button>
            <button className="presubtract__subtract" type="button" disabled={isLoading || item.status === 'PREPAID'} onClick={() => onPrepay?.(item)}>{item.status === 'PREPAID' ? '선결제 완료' : '미리 차감하기'}</button>
          </div>
        </article>
      ) : (
        <button className="presubtract__empty" type="button" onClick={() => onOpenDirectInput?.({ weekday })}><strong>+ 메뉴를 입력해주세요</strong><span>분석이 끝나면 약속 항목이 여기에 생겨요.</span></button>
      )}
    </main>
  )
}

export default PreSubtract
