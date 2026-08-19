import { useMemo, useState } from 'react'
import budgetFlexibility from '../img/budget-flexibility.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Budget.css'

const optionOrder = { HARD: 0, AS_IS: 1, EASY: 2 }

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
  const initialIndex = Math.max(0, options.findIndex((option) => option.key === 'AS_IS'))
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const lastIndex = Math.max(0, options.length - 1)
  const safeIndex = Math.min(selectedIndex, lastIndex)
  const selected = options[safeIndex]
  const budgetValue = Number(selected?.totalBudget ?? selected?.budget ?? 0)
  const progress = lastIndex === 0 ? 0 : (safeIndex / lastIndex) * 100

  if (!selected) {
    return <main className="budget-screen" aria-busy="true">예산 제안을 불러오는 중…</main>
  }

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
            min="0"
            max={lastIndex}
            step="1"
            value={safeIndex}
            aria-label="예산 단계"
            aria-valuetext={`${budgetValue}밀`}
            style={{ '--budget-progress': `${progress}%` }}
            onChange={(event) => setSelectedIndex(Number(event.target.value))}
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
          onClick={() => onContinue({ ...selected, optionKey: selected.key })}
        >
          {isLoading ? '설정 중…' : '설정 하기'}
        </button>
      </section>
    </main>
  )
}

export default Budget
