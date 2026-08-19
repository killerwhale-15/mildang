import { useEffect, useState } from 'react'
import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/6_conditionCheckin.css'

const defaultQuestions = [
  { key: 'BLOAT', label: '더부룩함', description: '속과 몸의 붓기' },
  { key: 'SKIN', label: '피부', description: '피부 트러블 정도' },
  { key: 'DROWSY', label: '식곤증', description: '식사 후 졸림 정도' },
]
const options = [
  { value: 'GOOD', label: '좋음' },
  { value: 'MID', label: '보통' },
  { value: 'BAD', label: '나쁨' },
]


function ConditionCheckin({ checkin, error, isFetching = false, isLoading = false, onComplete }) {
  const questions = checkin?.questions?.length ? checkin.questions : defaultQuestions
  const [answers, setAnswers] = useState(checkin?.answers ?? {})
  const [weight, setWeight] = useState('')
  const [localError, setLocalError] = useState('')
  const complete = ['BLOAT', 'SKIN', 'DROWSY'].every((key) => answers[key])
  const answeredCount = Object.values(answers).filter(Boolean).length

  useEffect(() => {
    if (!checkin) return
    setAnswers(checkin.answers ?? {})
    const latestWeight = checkin.weightKg ?? checkin.lastWeightKg
    setWeight(latestWeight == null ? '' : String(latestWeight))
    setLocalError('')
  }, [checkin])

  function submitCheckin() {
    const weightText = weight.trim()
    const weightKg = weightText === '' ? null : Number(weightText)
    if (weightText !== '' && (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300)) {
      setLocalError('체중은 20kg부터 300kg 사이로 입력해주세요.')
      return
    }

    setLocalError('')
    onComplete?.({
      answers,
      ...(weightKg == null ? {} : { weightKg }),
    })
  }

  return (
    <main className="condition-checkin" aria-labelledby="condition-checkin-title" aria-busy={isFetching || isLoading}>
      <header className="condition-checkin__header"><img src={mildangLogo} alt="밀당" /></header>
      <section className="condition-checkin__intro"><p>{checkin?.date} · {checkin?.dayIndex}일차 체크인</p><h1 id="condition-checkin-title">오늘 몸은 어땠어요?</h1><span>오늘의 기록은 리포트에 반영돼요.</span>{(localError || error) && <p role="alert">{localError || error}</p>}</section>
      <section className="condition-checkin__form" aria-label="오늘의 컨디션">
        {questions.map((question) => <article className="condition-card" key={question.key}><header><h2>{question.label}</h2><p>{question.desc ?? question.description}</p></header><div className="condition-card__choices" role="radiogroup" aria-label={question.label}>
          {options.map((option) => <button className={`condition-choice${answers[question.key] === option.value ? ' condition-choice--selected' : ''}`} type="button" role="radio" aria-checked={answers[question.key] === option.value} disabled={isFetching || isLoading || !checkin} key={option.value} onClick={() => setAnswers((value) => ({ ...value, [question.key]: option.value }))}>{option.label}</button>)}
        </div></article>)}
      </section>
      <label className="condition-checkin__weight">
        <span>오늘 체중</span>
        <input
          type="number"
          aria-label="오늘 체중"
          inputMode="decimal"
          min="20"
          max="300"
          step="0.1"
          value={weight}
          placeholder="선택 입력"
          disabled={isFetching || isLoading || !checkin}
          onChange={(event) => setWeight(event.target.value)}
        />
        <strong aria-hidden="true">kg</strong>
      </label>
      <button className="condition-checkin__submit" type="button" disabled={!checkin || !complete || isFetching || isLoading} onClick={submitCheckin}>{isFetching ? '불러오는 중…' : isLoading ? '저장 중…' : complete ? '체크인 저장하기' : `${answeredCount}/3 선택`}</button>
    </main>
  )
}

export default ConditionCheckin
