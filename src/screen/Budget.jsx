import { useEffect, useMemo, useState } from 'react'
import budgetFlexibility from '../img/budget-flexibility.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Budget.css'

const optionOrder = { HARD: 0, AS_IS: 1, EASY: 2 }

/**
 * 예산 슬라이더 범위. 서버가 주는 `estimate.slider`가 정본이다.
 *
 * options 3개(HARD·AS_IS·EASY)는 슬라이더 도입(2026-08-17) 전의 잔재로 하위 호환을 위해
 * 남아 있는 값이다. 그걸로 3단 슬라이더를 만들면 그 사이 값들을 고를 수 없다.
 *
 * ⚠ step을 10으로 잡으면 안 된다. 추천값이 10의 배수가 아닌 경우가 많아서(예: 225)
 * 서버가 추천한 값을 화면이 만들지 못하게 된다. 서버가 주는 step(=5)을 그대로 쓴다.
 */
function resolveSlider(estimate, options) {
  const slider = estimate?.slider
  if (slider && Number.isFinite(slider.min) && Number.isFinite(slider.max) && slider.max > slider.min) {
    return {
      min: slider.min,
      max: slider.max,
      step: slider.step > 0 ? slider.step : 5,
      recommended: slider.recommended ?? estimate?.recommended ?? slider.min,
    }
  }
  // slider를 안 주는 서버를 만나도 화면이 죽지 않게 — options 양 끝으로 범위를 만든다
  const budgets = options.map((option) => Number(option.budget)).filter(Number.isFinite)
  if (!budgets.length) return null
  const min = Math.min(...budgets)
  const max = Math.max(...budgets)
  return {
    min,
    max: max > min ? max : min + 20,
    step: 5,
    recommended: Number(estimate?.recommended) || budgets[Math.floor(budgets.length / 2)],
  }
}

const clampToStep = (value, { min, max, step }) => {
  const stepped = Math.round((value - min) / step) * step + min
  return Math.min(max, Math.max(min, stepped))
}

function BudgetIllustration({ progress }) {
  const ballX = 42 + (progress / 100) * 56

  return (
    <svg className="budget-screen__illustration" viewBox="0 0 140.088 122.758" fill="none" aria-hidden="true">
      <path d="M0 0H140.087V21.3177C140.087 60.0018 108.728 91.3614 70.0437 91.3614C31.3597 91.3614 0 60.0018 0 21.3177V0Z" fill="#212121" />
      <path d="M40 122.758H100.908V116.667C100.908 99.8481 87.2729 86.2134 70.4538 86.2134C53.6346 86.2134 40 99.8481 40 116.667V122.758Z" fill="#212121" />
      <circle className="budget-screen__ball" cx={ballX} cy="64.0421" r="16.8096" fill="#FFD900" />
    </svg>
  )
}

function Budget({ error, estimate, isLoading = false, onContinue }) {
  const options = useMemo(() => [...(estimate?.options ?? [])].sort(
    (left, right) => (optionOrder[left.key] ?? 99) - (optionOrder[right.key] ?? 99),
  ), [estimate])
  const slider = useMemo(() => resolveSlider(estimate, options), [estimate, options])

  // 서버에 보내는 값과 화면에 띄우는 값은 같아야 한다 — 둘 다 «주간값»이다.
  // 예전엔 totalBudget(기간 총액)을 보여줘서, 4주에서 화면엔 2000이 뜨고 서버엔 500이
  // 갔다(제보 2026-08-19). W1은 곱수가 1이라 이 어긋남이 안 보인다.
  const [budgetValue, setBudgetValue] = useState(slider?.recommended ?? 0)

  // estimate는 나중에 도착한다. 도착하면 손잡이를 추천값 자리로 옮긴다.
  useEffect(() => {
    if (slider) setBudgetValue(clampToStep(slider.recommended, slider))
  }, [slider])

  if (!slider) {
    return <main className="budget-screen" aria-busy="true">예산 제안을 불러오는 중…</main>
  }

  const progress = ((budgetValue - slider.min) / (slider.max - slider.min)) * 100

  return (
    <main className="budget-screen" aria-labelledby="budget-title">

      <img className="budget-screen__logo" src={mildangLogo} alt="밀당" />

      <section className="budget-screen__intro">
        <h1 id="budget-title"><span>예산을</span><span>설정해볼까요?</span></h1>
        <p>평소 밀가루 섭취량을 떠올려서 예산을 정해보세요</p>
        {error && <p className="budget-screen__error" role="alert">{error}</p>}
      </section>

      <section className="budget-screen__controls" aria-label="예산 설정">
        <BudgetIllustration progress={progress} />
        <output className="budget-screen__value">{budgetValue}밀</output>

        <div className="budget-screen__range-wrap">
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={budgetValue}
            aria-label="주간 예산"
            aria-valuetext={`${budgetValue}밀`}
            style={{ '--budget-progress': `${progress}%` }}
            onChange={(event) => setBudgetValue(Number(event.target.value))}
          />
          <div className="budget-screen__range-labels" aria-hidden="true">
            <span>가볍게</span>
            <span>넉넉하게</span>
          </div>
        </div>

        <aside className="budget-screen__tip">
          <img src={budgetFlexibility} alt="" />
          <strong>예산이 높을수록 더 유연하게 관리할 수 있어요</strong>
          <span>나중에도 언제든지 조정할 수 있어요</span>
        </aside>

        <button
          className="budget-screen__submit"
          type="button"
          disabled={isLoading}
          onClick={() => onContinue({ budget: budgetValue })}
        >
          {isLoading ? '설정 중…' : '설정 하기'}
        </button>
      </section>
    </main>
  )
}

export default Budget
