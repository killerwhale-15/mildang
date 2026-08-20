import { useEffect, useMemo, useState } from 'react'
import budgetFlexibility from '../img/budget-flexibility.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Budget.css'

function BudgetIllustration({ progress }) {
  const ballX = 42 + (progress / 100) * 56

  return (
    <svg
      className="budget-screen__illustration"
      viewBox="0 0 140.088 122.758"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 0H140.087V21.3177C140.087 60.0018 108.728 91.3614 70.0437 91.3614C31.3597 91.3614 0 60.0018 0 21.3177V0Z"
        fill="#212121"
      />
      <path
        d="M40 122.758H100.908V116.667C100.908 99.8481 87.2729 86.2134 70.4538 86.2134C53.6346 86.2134 40 99.8481 40 116.667V122.758Z"
        fill="#212121"
      />
      <circle
        className="budget-screen__ball"
        cx={ballX}
        cy="64.0421"
        r="16.8096"
        fill="#FFD900"
      />
    </svg>
  )
}

function Budget({ error, estimate, isLoading = false, onContinue }) {
  const range = useMemo(() => {
    if (estimate?.slider) {
      return {
        min: Number(estimate.slider.min),
        max: Number(estimate.slider.max),
        step: Number(estimate.slider.step),
        recommended: Number(estimate.slider.recommended),
      }
    }

    const options = estimate?.options ?? []

    const budgets = options
      .map((option) => Number(option?.budget))
      .filter(Number.isFinite)
      .sort((a, b) => a - b)

    if (!budgets.length) return null

    const asIsOption = options.find(
      (option) => option.key === 'AS_IS',
    )

    const asIsBudget = Number(asIsOption?.budget)

    return {
      min: budgets[0],
      max: budgets[budgets.length - 1],
      step: 5,
      recommended: Number.isFinite(asIsBudget)
        ? asIsBudget
        : budgets[Math.floor(budgets.length / 2)],
    }
  }, [estimate])

  const [budget, setBudget] = useState(0)

  useEffect(() => {
    if (!range) return

    setBudget(range.recommended)
  }, [range])

  if (!range) {
    return (
      <main
        className="budget-screen"
        aria-busy="true"
      >
        예산 제안을 불러오는 중…
      </main>
    )
  }

  const progress =
    range.max === range.min
      ? 0
      : ((budget - range.min) /
          (range.max - range.min)) *
        100

  const safeProgress = Math.max(
    0,
    Math.min(progress, 100),
  )

  return (
   <main
  className="budget-screen"
  aria-labelledby="budget-title"
  style={{
    height: '100dvh',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
  }}
>
      <img
        className="budget-screen__logo"
        src={mildangLogo}
        alt="밀당"
      />

      <section className="budget-screen__intro">
        <h1 id="budget-title">
          <span>예산을</span>
          <span>설정해볼까요?</span>
        </h1>

        <p>
          평소 밀가루 섭취량을 떠올려서 예산을 정해보세요
        </p>

        {error && (
          <p
            className="budget-screen__error"
            role="alert"
          >
            {error}
          </p>
        )}
      </section>

      <section
        className="budget-screen__controls"
        aria-label="예산 설정"
      >
        <BudgetIllustration progress={safeProgress} />

        <output className="budget-screen__value">
          {budget}밀
        </output>

        <div className="budget-screen__range-wrap">
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={budget}
            aria-label="예산 설정"
            aria-valuemin={range.min}
            aria-valuemax={range.max}
            aria-valuenow={budget}
            aria-valuetext={`${budget}밀`}
            style={{
              '--budget-progress': `${safeProgress}%`,
            }}
            onChange={(event) =>
              setBudget(Number(event.target.value))
            }
          />

          <div
            className="budget-screen__range-labels"
            aria-hidden="true"
          >
            <span>가볍게</span>
            <span>넉넉하게</span>
          </div>
        </div>

        <aside className="budget-screen__tip">
          <img src={budgetFlexibility} alt="" />
          <strong>
            예산이 높을수록 더 유연하게 관리할 수 있어요
          </strong>
          <span>
            나중에도 언제든지 조정할 수 있어요
          </span>
        </aside>

        <button
          className="budget-screen__submit"
          type="button"
          disabled={isLoading}
          onClick={() => onContinue({ budget })}
        >
          {isLoading ? '설정 중…' : '설정 하기'}
        </button>
      </section>
    </main>
  )
}

export default Budget
