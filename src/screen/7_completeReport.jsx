import accentCircle from '../img/complete-report-accent-circle.svg'
import chevronLeft from '../img/chevron-left.svg'
import gridHorizontal from '../img/complete-report-grid-horizontal.svg'
import gridVertical from '../img/complete-report-grid-vertical.svg'
import leaf from '../img/complete-report-leaf.svg'
import metricCircle from '../img/complete-report-metric-circle.svg'
import scale from '../img/complete-report-scale.svg'
import sparkle from '../img/complete-report-sparkle.svg'
import titleUnderline from '../img/complete-report-title-underline.svg'
import utensilLeft from '../img/complete-report-utensil-left.svg'
import utensilRight from '../img/complete-report-utensil-right.svg'
import '../css/7_completeReport.css'


const METRIC_ICON_BY_KEY = { WEIGHT: 'scale', BLOAT: 'sparkle', SKIN: 'leaf', DROWSY: 'utensils' }
const INTRO_BY_PERIOD = { W1: '1주간의 변화를 한 장에 담았어요', W2: '2주간의 변화를 한 장에 담았어요', W4: '4주간의 변화를 한 장에 담았어요' }

function MetricIcon({ type }) {
  return (
    <span className="report-metric__icon" aria-hidden="true">
      <img className="report-metric__icon-base" src={metricCircle} alt="" />
      {type === 'scale' && <img className="report-metric__scale" src={scale} alt="" />}
      {type === 'sparkle' && <img className="report-metric__sparkle" src={sparkle} alt="" />}
      {type === 'leaf' && <img className="report-metric__leaf" src={leaf} alt="" />}
      {type === 'utensils' && <span className="report-metric__utensils"><img src={utensilLeft} alt="" /><img src={utensilRight} alt="" /></span>}
    </span>
  )
}

function CompleteReport({ error, isLoading = false, isReportLoading = false, onBack, onShare, report, shareCard }) {
  const completion = report?.completion
  const bodyChanges = completion?.bodyChanges ?? []
  const usedPercent = completion?.usedPercent
  const introText = INTRO_BY_PERIOD[report?.challenge?.period] ?? '챌린지 기간의 변화를 한 장에 담았어요'

  return (
    <main className="complete-report" data-screen-name="7_completeReport" aria-labelledby="complete-report-title">
      <button className="complete-report__back" type="button" onClick={onBack} aria-label="메인보드로 돌아가기"><img src={chevronLeft} alt="" /></button>
      <header className="complete-report__intro"><h1 id="complete-report-title">당신의 결과를 공유해보세요</h1><p>{introText}</p>{error && <p role="alert">{error}</p>}</header>
      <section className="report-card" aria-labelledby="report-card-title" aria-busy={isReportLoading}>
        <div className="report-card__motif" aria-hidden="true"><span className="report-card__motif-dish" /><span className="report-card__motif-base" /><img src={accentCircle} alt="" /></div>
        <p className="report-card__brand" aria-label="밀당">밀당</p><p className="report-card__tag">#밀가루 끊기 챌린지</p>
        <div className="report-card__title-block"><p>{completion?.periodLabel ?? report?.challenge?.label ?? ''}</p><h2 id="report-card-title">{completion?.headline ?? report?.title ?? (isReportLoading ? '리포트를 불러오는 중이에요' : '')}</h2><img src={titleUnderline} alt="" /></div>
        {usedPercent != null && <div className="report-card__usage"><p>밀가루 예산의</p><span className="report-card__usage-value"><strong>{usedPercent}%</strong><span>{usedPercent > 100 ? '나 사용했어요' : '만 사용했어요'}</span></span></div>}
        {bodyChanges.length > 0 && <>
          <h3 className="report-card__metrics-title">내 몸의 변화</h3>
          <div className="report-card__metrics">
            <img className="report-card__grid-horizontal" src={gridHorizontal} alt="" aria-hidden="true" />
            <img className="report-card__grid-vertical" src={gridVertical} alt="" aria-hidden="true" />
            {bodyChanges.slice(0, 4).map((metric) => <article className="report-metric" key={metric.key}><MetricIcon type={METRIC_ICON_BY_KEY[metric.key]} /><h4>{metric.label}</h4><p>{metric.value ?? metric.note ?? '기록이 모자라요'}</p></article>)}
          </div>
        </>}
        {completion?.summaryLine && <p className="report-card__summary">{completion.summaryLine}</p>}
      </section>
      <button className="complete-report__share" type="button" onClick={onShare} disabled={isLoading || isReportLoading || !report}>{isLoading ? '공유 카드 생성 중…' : '스토리에 공유하기'}</button>
      {shareCard && <a href={shareCard.imageUrl} target="_blank" rel="noreferrer">공유 카드 열기 · {shareCard.hashtag}</a>}
    </main>
  )
}

export default CompleteReport
