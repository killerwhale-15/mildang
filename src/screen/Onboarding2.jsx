import { useEffect, useState } from 'react'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Onboarding2.css'

const badges = { W1: 'FREE', W2: 'PLUS', W4: 'PRO' }
const planCopy = {
  W1: { name: '맛보기', description: '최초 1회 무료' },
  W2: { name: '단기', description: '리포트가 뚜렷해지는 최소 기간' },
  W4: { name: '장기', description: '주차별로 예산을 나눠드려요' },
}

function Onboarding2({ error, isLoading = false, onContinue, plans = [] }) {
  const availablePlans = plans
  const [selectedPeriod, setSelectedPeriod] = useState('W1')

  useEffect(() => {
    if (!availablePlans.some((plan) => plan.period === selectedPeriod && plan.available !== false)) {
      setSelectedPeriod(availablePlans.find((plan) => plan.available !== false)?.period ?? 'W1')
    }
  }, [availablePlans, selectedPeriod])

  const selectedPlan = availablePlans.find((plan) => plan.period === selectedPeriod)

  return (
    <main className="onboarding-two" aria-labelledby="onboarding-two-title">
      <header className="onboarding-two__header">
        <img className="onboarding-two__logo" src={mildangLogo} alt="밀당" />
      </header>

      <section className="onboarding-two__intro">
        <h1 id="onboarding-two-title" className="onboarding-two__title">얼마 동안 밀당해볼까요?</h1>
        <p className="onboarding-two__description">처음이라면 1주부터 가볍게 추천해요.</p>
        {error && <p role="alert">{error}</p>}
      </section>

      <div className="onboarding-two__plans" role="radiogroup" aria-label="챌린지 기간">
        {!availablePlans.length && <p>플랜을 불러오는 중…</p>}
        {availablePlans.map((plan) => {
          const selected = selectedPeriod === plan.period
          const copy = planCopy[plan.period]
          return (
            <button
              className={`plan-card${selected ? ' plan-card--selected' : ''}`}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={plan.available === false}
              key={plan.period}
              onClick={() => setSelectedPeriod(plan.period)}
            >
              <span className="plan-card__weeks">{Number(plan.period.slice(1))}주</span>
              <span className="plan-card__copy">
                <strong className="plan-card__name">{copy?.name ?? plan.title}</strong>
                <span className="plan-card__description">
                  {plan.available === false ? plan.unavailableReason : (copy?.description ?? plan.subtitle)}
                </span>
              </span>
              <span className="plan-card__badge">{badges[plan.period]}</span>
            </button>
          )
        })}
      </div>

      <button
        className="onboarding-two__pay"
        type="button"
        disabled={!selectedPlan || selectedPlan.available === false || isLoading}
        onClick={() => onContinue(selectedPlan)}
      >
        {isLoading ? '처리 중…' : selectedPlan?.priceKrw ? '결제하기' : '시작하기'}
      </button>
    </main>
  )
}

export default Onboarding2
