import backChevron from '../img/chevron-left.svg'
import { getItemDisplay } from '../api/itemView.js'
import cameraIcon from '../img/meal-camera.svg'
import pencilIcon from '../img/meal-pencil.svg'
import resultBadge from '../img/meal-result-badge.svg'
import resultDivider from '../img/meal-result-divider.svg'
import '../css/3b_meal.css'


function MealOption({ icon, title, description, onClick }) {
  return <button className="meal-option" type="button" onClick={onClick}><img className="meal-option__icon" src={icon} alt="" /><span className="meal-option__copy"><strong>{title}</strong><span>{description}</span></span><img className="meal-option__chevron" src={backChevron} alt="" /></button>
}

const ITEM_STATUS_LABELS = {
  HAGGLED: '조정 완료',
  PENDING: '기록 대기',
  PREPAID: '미리 차감됨',
  RECORDED: '기록 완료',
}

function MealResultCard({ item, onBargain, onDelete, onRecord }) {
  const meal = getItemDisplay(item)
  const statusLabel = ITEM_STATUS_LABELS[item.status] ?? '확인 필요'
  return (
    <article className="meal-result-card">
      <div className="meal-result-card__score" aria-label={`${meal.points ?? 0}밀`}><img src={resultBadge} alt="" /><strong>{meal.points ?? 0}</strong></div>
      <div className="meal-result-card__heading"><h2>{meal.name}</h2><span>{meal.unit} · 신뢰도 {meal.confidence}</span></div>
      <p className="meal-result-card__description">{meal.basis}</p><img className="meal-result-card__divider" src={resultDivider} alt="" />
      <p className="meal-result-card__balance">{meal.balanceAfter == null ? <>상태 <strong>{statusLabel}</strong></> : <>기록하면 잔액 <strong>{meal.balanceAfter}밀</strong></>}</p>
      <div className="meal-result-card__actions">
        <button type="button" disabled={!['PENDING', 'HAGGLED'].includes(item.status)} onClick={() => onBargain?.(item)}>밀당하기</button>
        <button className="meal-result-card__record" type="button" disabled={!['PENDING', 'HAGGLED'].includes(item.status)} onClick={() => onRecord?.(item)}>기록하기</button>
        {['PENDING', 'HAGGLED'].includes(item.status) && <button type="button" onClick={() => onDelete?.(item)}>삭제</button>}
      </div>
    </article>
  )
}

function MealScreen({ error, isLoading = false, mealItems = [], onBack, onBargain, onDelete, onOpenCameraScan, onOpenDirectInput, onPreset, onRecord, presets = [], summary }) {
  const items = Array.isArray(mealItems) ? mealItems : []
  const hasMealItems = items.length > 0
  return (
    <main className={`meal-screen${hasMealItems ? ' meal-screen--with-results' : ''}`} aria-labelledby="meal-screen-title">
      <header className="meal-screen__topbar"><button type="button" onClick={onBack} aria-label="메인보드로 돌아가기"><img src={backChevron} alt="" /></button></header>
      <section className="meal-screen__intro"><h1 id="meal-screen-title">지금 뭐 드실 거예요?</h1><p>{hasMealItems ? '분석한 식사 후보예요.' : '사진을 찍거나 메뉴를 입력해주세요.'}</p>{error && <p role="alert">{error}</p>}</section>
      <section className="meal-screen__options" aria-label="식사 입력 방법">
        <MealOption icon={cameraIcon} title="메뉴판 찍기" description="식당·카페" onClick={onOpenCameraScan} />
        <MealOption icon={pencilIcon} title="메뉴 직접 입력" description="집밥·편의점·배달" onClick={() => onOpenDirectInput?.()} />
      </section>
      <section className="meal-screen__favorites" aria-labelledby="favorites-title"><h2 id="favorites-title">자주 먹는 것</h2><div>
        {presets.map((preset) => <button type="button" key={preset.id} disabled={isLoading} onClick={() => onPreset?.(preset)}>{preset.name} {preset.points}밀</button>)}
      </div></section>
      {hasMealItems && <section className="meal-screen__results" aria-label="식사 후보">{items.map((item) => <MealResultCard item={item} key={item.id} onBargain={onBargain} onDelete={onDelete} onRecord={onRecord} />)}{summary && <p className="meal-screen__summary">미기록 {summary.count}건 · 합계 {summary.totalPoints}밀 · 전부 기록 시 {summary.balanceAfterAll}밀</p>}</section>}
    </main>
  )
}

export default MealScreen
