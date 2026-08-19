import { useState } from 'react'
import chevronLeft from '../img/chevron-left.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Onboarding3.css'

const foodTypes = [
  { key: 'noodle', label: '면류' },
  { key: 'bread', label: '빵류' },
  { key: 'snack', label: '과자·간식류' },
]
const frequencyOptions = [
  { value: '0-1', label: '적음' },
  { value: '2-3', label: '보통' },
  { value: '4+', label: '많음' },
]
const amountOptions = [
  { value: 'SMALL', label: '조금 먹어요' },
  { value: 'NORMAL', label: '보통이에요' },
  { value: 'LARGE', label: '많이 먹어요' },
]
const situationOptions = [
  { value: 'MEAL', label: '식사' },
  { value: 'SNACK', label: '간식' },
  { value: 'LATE_NIGHT', label: '야식' },
  { value: 'IRREGULAR', label: '불규칙' },
]

function ChoiceButton({ selected, children, onClick }) {
  return (
    <button
      className={`habit-choice${selected ? ' habit-choice--selected' : ''}`}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Onboarding3({ error, isLoading = false, onBack, onContinue }) {
  const [survey, setSurvey] = useState({ noodle: '4+', bread: '4+', snack: '4+' })
  const [details, setDetails] = useState({ amount: 'NORMAL', situation: 'MEAL', weight: '' })
  const [localError, setLocalError] = useState('')

  function submitSurvey() {
    const weightText = details.weight.trim()
    const weightKg = weightText === '' ? null : Number(weightText)
    if (weightText !== '' && (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300)) {
      setLocalError('체중은 20kg부터 300kg 사이로 입력해주세요.')
      return
    }

    setLocalError('')
    onContinue({
      ...survey,
      amount: details.amount,
      situation: details.situation,
      ...(weightKg == null ? {} : { weightKg }),
    })
  }

  return (
    <main className="habits-screen" aria-labelledby="habits-title">

      <nav className="habits-screen__nav" aria-label="온보딩 이동">
        <button type="button" onClick={onBack} aria-label="이전 화면">
          <img src={chevronLeft} alt="" />
        </button>
      </nav>

      <img className="habits-screen__logo" src={mildangLogo} alt="밀당" />

      <section className="habits-screen__intro">
        <h1 id="habits-title"><span>평소 식습관을</span><span>알려주세요</span></h1>
        <p>나에게 맞는 예산을 추천해드릴게요.</p>
        {(localError || error) && <p className="habits-screen__error" role="alert">{localError || error}</p>}
      </section>

      <section className="habits-screen__form" aria-label="식습관 입력">
        <fieldset className="frequency-fieldset">
          <legend>평소 일주일에 얼마나 자주 드세요?</legend>
          {foodTypes.map(({ key, label }) => (
            <div className="frequency-row" key={key} role="radiogroup" aria-label={label}>
              <span>{label}</span>
              <div>
                {frequencyOptions.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    selected={survey[key] === option.value}
                    onClick={() => setSurvey((current) => ({ ...current, [key]: option.value }))}
                  >
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          ))}
        </fieldset>

        <fieldset className="amount-fieldset">
          <legend>한 번 먹을 때 양은 어느 정도인가요?</legend>
          <div>
            {amountOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={details.amount === option.value}
                onClick={() => setDetails((current) => ({ ...current, amount: option.value }))}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>

        <fieldset className="situation-fieldset">
          <legend>밀가루를 가장 많이 먹는 상황은 언제인가요?</legend>
          <div>
            {situationOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={details.situation === option.value}
                onClick={() => setDetails((current) => ({ ...current, situation: option.value }))}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </fieldset>

        <fieldset className="weight-fieldset">
          <legend>체중은 어떻게 되나요?</legend>
          <label className="weight-input">
            <input
              type="number"
              aria-label="현재 체중"
              inputMode="decimal"
              min="20"
              max="300"
              step="0.1"
              value={details.weight}
              placeholder="현재 체중을 입력해주세요"
              onChange={(event) => setDetails((current) => ({ ...current, weight: event.target.value }))}
            />
            <span aria-hidden="true">kg</span>
          </label>
        </fieldset>
      </section>

      <button
        className="habits-screen__submit"
        type="button"
        disabled={isLoading}
        onClick={submitSurvey}
      >
        {isLoading ? '시작하는 중…' : '시작 하기'}
      </button>
    </main>
  )
}

export default Onboarding3
