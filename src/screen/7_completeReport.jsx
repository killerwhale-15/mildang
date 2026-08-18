import notch from '../img/mainboard-notch.svg'
import statusRight from '../img/mainboard-status-right.svg'
import statusTime from '../img/mainboard-status-time.svg'
import accentCircle from '../img/complete-report-accent-circle.svg'
import titleUnderline from '../img/complete-report-title-underline.svg'
import '../css/7_completeReport.css'

function StatusBar() {
  return <div className="complete-report__status" aria-hidden="true"><img className="complete-report__time" src={statusTime} alt="" /><img className="complete-report__notch" src={notch} alt="" /><img className="complete-report__status-right" src={statusRight} alt="" /></div>
}

function CompleteReport({ error, isLoading = false, onShare, report, shareCard }) {
  const stats = report?.stats ?? []
  const finding = report?.finding
  const haggle = report?.haggleHighlight
  return (
    <main className="complete-report" data-screen-name="7_completeReport" aria-labelledby="complete-report-title">
      <StatusBar />
      <header className="complete-report__intro"><h1 id="complete-report-title">{report?.title ?? '당신의 몸이 쓴 리포트'}</h1><p>{report?.challenge?.label}</p>{error && <p role="alert">{error}</p>}</header>
      <section className="report-card" aria-labelledby="report-card-title">
        <div className="report-card__motif" aria-hidden="true"><span className="report-card__motif-dish" /><span className="report-card__motif-base" /><img src={accentCircle} alt="" /></div>
        <p className="report-card__brand" aria-label="밀당">밀당</p><p className="report-card__tag">#밀가루흥정챌린지</p>
        <div className="report-card__title-block"><p>{report?.challenge?.label}</p><h2 id="report-card-title">이번 챌린지 완주!</h2><img src={titleUnderline} alt="" /></div>
        <div className="report-card__usage"><p>{stats[0]?.label ?? '총 소비'}</p><strong>{stats[0]?.value ?? '-'}{stats[0]?.sub}</strong><span>{stats[1] ? `${stats[1].label} ${stats[1].value}` : ''}</span></div>
        <h3 className="report-card__metrics-title">내 기록에서 찾은 변화</h3>
        <div className="report-card__metrics">
          {stats.slice(1).map((stat) => <article className="report-metric" key={stat.key}><h4>{stat.label}</h4><p>{stat.value}{stat.sub}</p></article>)}
          <article className="report-metric"><h4>흥정으로 아낀 포인트</h4><p>{haggle?.totalSaved ?? 0}밀</p></article>
          <article className="report-metric"><h4>최고의 밀당</h4><p>{haggle?.best ? `${haggle.best.menu} −${haggle.best.savedPoints}` : '기록 없음'}</p></article>
        </div>
        <p className="report-card__summary">{finding?.available ? finding.headline : '아직 상관을 계산할 표본이 부족해요.'}</p>
        {finding?.sampleNote && <p>{finding.sampleNote}</p>}<p>{report?.disclaimer}</p>
      </section>
      <button className="complete-report__share" type="button" onClick={onShare} disabled={isLoading}>{isLoading ? '공유 카드 생성 중…' : '스토리에 공유하기'}</button>
      {shareCard && <a href={shareCard.imageUrl} target="_blank" rel="noreferrer">공유 카드 열기 · {shareCard.hashtag}</a>}
    </main>
  )
}

export default CompleteReport
