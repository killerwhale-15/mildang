import { useEffect, useRef, useState } from 'react'
import chevronLeft from '../img/chevron-left.svg'
import loadingCircle from '../img/meal-loading-circle.svg'
import loadingMark from '../img/meal-loading-mark.svg'
import notch from '../img/mainboard-notch.svg'
import statusRight from '../img/mainboard-status-right.svg'
import statusTime from '../img/mainboard-status-time.svg'
import '../css/3c_directInput.css'

const sourceCopy = {
  '3a_presubtract': { eyebrow: '약속 사전 결제', title: '뭘 먹기로 했어요?', description: '분석이 끝나면 약속 항목으로 추가해드려요.' },
  '3b_meal': { eyebrow: '식사 기록', title: '지금 뭐 드실 거예요?', description: '분석이 끝나면 식사 후보로 추가해드려요.' },
  '4b_scanResult': { eyebrow: '스캔 결과', title: '인식하지 못한 메뉴가 있나요?', description: '직접 분석한 식사 후보를 추가해드려요.' },
}

function StatusBar() {
  return <div className="direct-input-screen__status" aria-hidden="true"><img className="direct-input-screen__time" src={statusTime} alt="" /><img className="direct-input-screen__notch" src={notch} alt="" /><img className="direct-input-screen__status-right" src={statusRight} alt="" /></div>
}

function DirectInputScreen({ initialMenuName = '', onAnalyze, onBack, onLoadRecent, source = '3b_meal' }) {
  const [menuName, setMenuName] = useState(initialMenuName)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recentMenus, setRecentMenus] = useState([])
  const [candidates, setCandidates] = useState([])
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const copy = sourceCopy[source] ?? sourceCopy['3b_meal']

  useEffect(() => {
    inputRef.current?.focus()
    onLoadRecent?.().then((response) => setRecentMenus(response?.recent ?? [])).catch(() => setRecentMenus([]))
  }, [onLoadRecent])

  async function handleSubmit(event) {
    event.preventDefault()
    const query = menuName.trim()
    if (!query || isAnalyzing) return
    setIsAnalyzing(true)
    setError('')
    setCandidates([])
    try {
      await onAnalyze?.(query)
    } catch (requestError) {
      setError(requestError.message)
      setCandidates(requestError.detail?.candidates ?? [])
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="direct-input-screen" aria-labelledby="direct-input-title">
      <StatusBar />
      <header className="direct-input-screen__header"><button type="button" onClick={onBack} disabled={isAnalyzing} aria-label="이전 화면으로 돌아가기"><img src={chevronLeft} alt="" /></button><strong>{copy.eyebrow}</strong></header>
      <section className="direct-input-screen__context"><p>{copy.eyebrow}</p><h1 id="direct-input-title">{copy.title}</h1><span>{copy.description}</span></section>
      <section className="direct-input-sheet" aria-label="메뉴 직접 입력">
        <form onSubmit={handleSubmit}>
          <h2>직접 입력</h2>
          <label className="direct-input-sheet__input" htmlFor="direct-menu-name"><span className="direct-input-screen__sr-only">메뉴 이름</span><input ref={inputRef} id="direct-menu-name" type="text" maxLength="40" value={menuName} placeholder="예: 에그마요 샌드위치" onChange={(event) => setMenuName(event.target.value)} autoComplete="off" disabled={isAnalyzing} /></label>
          <p className="direct-input-sheet__hint">메뉴 이름만 적어도 괜찮아요.</p>
          <fieldset className="direct-input-sheet__history" disabled={isAnalyzing}><legend>최근 내역</legend><div>{recentMenus.map((menu) => <button type="button" key={menu.name} onClick={() => setMenuName(menu.name)}>{menu.name}</button>)}</div></fieldset>
          {candidates.length > 0 && <fieldset className="direct-input-sheet__history"><legend>혹시 이 메뉴인가요?</legend><div>{candidates.map((candidate) => <button type="button" key={candidate.name} onClick={() => setMenuName(candidate.name)}>{candidate.name}</button>)}</div></fieldset>}
          {error && <p role="alert">{error}</p>}
          <div className={`direct-input-sheet__loading${isAnalyzing ? ' is-analyzing' : ''}`} role="status" aria-live="polite"><span className="direct-input-sheet__loading-icon" aria-hidden="true"><img src={loadingCircle} alt="" /><img src={loadingMark} alt="" /></span><strong>{isAnalyzing ? '밀당이가 메뉴를 살펴보고 있어요.' : '메뉴를 입력하면 바로 분석해드려요.'}</strong><span>{isAnalyzing ? '보통 2초면 끝나요.' : '밀가루 포인트와 근거를 함께 알려드려요.'}</span></div>
          <button className="direct-input-sheet__analyze" type="submit" disabled={!menuName.trim() || isAnalyzing}>{isAnalyzing ? '분석 중…' : '분석하기'}</button>
        </form>
      </section>
    </main>
  )
}

export default DirectInputScreen
