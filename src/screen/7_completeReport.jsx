import accentCircle from '../img/complete-report-accent-circle.svg'
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
import chevronLeft from '../img/chevron-left.svg'

const bodyMetrics = [
  { key: 'weight', label: '몸무게 변화', value: '59kg → 53kg', icon: 'scale' },
  { key: 'bloat', label: '붓기 효과', value: '보통 → 좋음', icon: 'sparkle' },
  { key: 'skin', label: '피부 트러블', value: '3회 → 1회', icon: 'leaf' },
  { key: 'drowsy', label: '식곤증 개선', value: '18% 감소', icon: 'utensils' },
]

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

function CompleteReport({ error, isLoading = false, onBack, onShare, report, shareCard }) {
  return (
    <main className="complete-report" data-screen-name="7_completeReport" aria-labelledby="complete-report-title">
      <button
  className="complete-report__back"
  type="button"
  onClick={onBack}
  aria-label="메인보드로 돌아가기"
>
  <img src={chevronLeft} alt="" />
</button>
      <header className="complete-report__intro"><h1 id="complete-report-title">당신의 결과를 공유해보세요</h1><p>2주간의 변화를 한 장에 담았어요</p>{error && <p role="alert">{error}</p>}</header>
      <section className="report-card" aria-labelledby="report-card-title">
        <div className="report-card__motif" aria-hidden="true"><span className="report-card__motif-dish" /><span className="report-card__motif-base" /><img src={accentCircle} alt="" /></div>
        <p className="report-card__brand" aria-label="밀당">밀당</p><p className="report-card__tag">#밀가루 끊기 챌린지</p>
        <div className="report-card__title-block"><p>2주 챌린지 완주 🎉</p><h2 id="report-card-title">이번 주 밀당 성공 !</h2><img src={titleUnderline} alt="" /></div>
        <div className="report-card__usage"><p>밀가루 예산의</p><strong>70%</strong><span>만 사용했어요</span></div>
        <h3 className="report-card__metrics-title">내 몸의 변화</h3>
        <div className="report-card__metrics">
          <img className="report-card__grid-horizontal" src={gridHorizontal} alt="" aria-hidden="true" />
          <img className="report-card__grid-vertical" src={gridVertical} alt="" aria-hidden="true" />
          {bodyMetrics.map((metric) => <article className="report-metric" key={metric.key}><MetricIcon type={metric.icon} /><h4>{metric.label}</h4><p>{metric.value}</p></article>)}
        </div>
        <p className="report-card__summary">처음 52에서 시작해, 30을 남기고 완주했어요!</p>
      </section>
      <button className="complete-report__share" type="button" onClick={onShare} disabled={isLoading}>{isLoading ? '공유 카드 생성 중…' : '스토리에 공유하기'}</button>
      {shareCard && <a href={shareCard.imageUrl} target="_blank" rel="noreferrer">공유 카드 열기 · {shareCard.hashtag}</a>}
    </main>
  )
}

export default CompleteReport
