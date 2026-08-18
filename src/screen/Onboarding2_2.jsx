import calendarIcon from '../img/calendar.svg'
import chevronLeft from '../img/chevron-left.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Onboarding2_2.css'

const benefits = [
  { label: '이용 기간', value: '4주' },
  { label: '주차별 기록·회고', value: '포함' },
  { label: '최종 리포트', value: '포함' },
  { label: 'AI 밀당 대화', value: '무제한' },
]

function Onboarding2_2({ error, isDemo = false, isLoading = false, onBack, onContinue, plan }) {
  const price = plan?.priceKrw ?? 0
  return (
    <main className="payment-screen payment-screen--four-week" aria-labelledby="payment-title">
      <header className="payment-screen__header">
        <button className="payment-screen__back" type="button" onClick={onBack} aria-label="기간 선택으로 돌아가기">
          <img src={chevronLeft} alt="" />
        </button>
        <img className="payment-screen__logo" src={mildangLogo} alt="밀당" />
      </header>
      <section className="payment-screen__intro">
        <h1 id="payment-title" className="payment-screen__title"><span>4주 밀당으로</span><span>시작해볼까요?</span></h1>
        <p className="payment-screen__description"><span>4주 동안 기록하고</span><span>나의 밀가루 패턴을 확인해요.</span></p>
      </section>
      <section className="payment-card" aria-label="4주 결제 정보">
        <div className="payment-card__heading"><h2>4주 챌린지</h2><span className="payment-card__badge">PRO</span><strong>장기</strong><p>4주 동안 예산 관리해요</p></div>
        <div className="payment-card__benefits">
          {benefits.map((benefit) => <div className="payment-card__benefit" key={benefit.label}><img src={calendarIcon} alt="" /><span>{benefit.label}</span><strong>{benefit.value}</strong></div>)}
        </div>
        <div className="payment-card__total"><span>결제 금액</span><strong>{price.toLocaleString()}원</strong></div>
      </section>
      <button className="payment-screen__submit" type="button" onClick={onContinue} disabled={isLoading}>
        {isLoading ? '결제 확인 중…' : `${price.toLocaleString()}원 결제하고 시작하기`}
      </button>
      {(isDemo || error) && (
        <div className="payment-screen__message">
          {error
            ? <p className="payment-screen__error" role="alert">{error}</p>
            : <p className="payment-screen__demo-notice" role="status">데모 결제입니다. 실제 청구는 발생하지 않습니다.</p>}
        </div>
      )}
    </main>
  )
}

export default Onboarding2_2
