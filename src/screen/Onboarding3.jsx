import { useState } from 'react'
import chevronLeft from '../img/chevron-left.svg'
import notch from '../img/mainboard-notch.svg'
import statusRight from '../img/mainboard-status-right.svg'
import statusTime from '../img/mainboard-status-time.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Onboarding3.css'

const foodTypes = [
  { key: 'noodle', label: '면류' },
  { key: 'bread', label: '빵류' },
  { key: 'snack', label: '과자·간식류' },
]
const frequencyOptions = [
  { value: '2-3', label: '보통' },
  { value: '4+', label: '많음' },
  { value: '0-1', label: '적음' },
]
const amountOptions = [
  { value: 'small', label: '조금 먹어요' },
  { value: 'normal', label: '보통이에요' },
  { value: 'large', label: '많이 먹어요' },
]
const situationOptions = [
  { value: 'meal', label: '식사' },
  { value: 'snack', label: '간식' },
  { value: 'late-night', label: '야식' },
  { value: 'irregular', label: '불규칙' },
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
  const [details, setDetails] = useState({ amount: 'small', situation: 'meal', weight: '' })

  function submitSurvey() {
    onContinue(survey)
  }

  return (
    <main className="habits-screen" aria-labelledby="habits-title">
      <div className="habits-screen__status" aria-hidden="true">
        <img className="habits-screen__time" src={statusTime} alt="" />
        <img className="habits-screen__notch" src={notch} alt="" />
        <img className="habits-screen__status-right" src={statusRight} alt="" />
      </div>

      <nav className="habits-screen__nav" aria-label="온보딩 이동">
        <button type="button" onClick={onBack} aria-label="이전 화면">
          <img src={chevronLeft} alt="" />
        </button>
      </nav>

      <img className="habits-screen__logo" src={mildangLogo} alt="밀당" />

      <section className="habits-screen__intro">
        <h1 id="habits-title"><span>평소 식습관을</span><span>알려주세요</span></h1>
        <p>나에게 맞는 1주 예산을 추천해드릴게요.</p>
        {error && <p className="habits-screen__error" role="alert">{error}</p>}
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
              min="1"
              max="999"
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
