import { useEffect, useState } from 'react'
import { getItemDisplay } from '../api/itemView.js'
import chevronLeft from '../img/chevron-left.svg'
import mildangLogo from '../img/onboarding_logo_3x.png'
import notch from '../img/mainboard-notch.svg'
import statusRight from '../img/mainboard-status-right.svg'
import statusTime from '../img/mainboard-status-time.svg'
import '../css/4b_scanResult.css'

function StatusBar() {
  return <div className="scan-result__status" aria-hidden="true"><img className="scan-result__time" src={statusTime} alt="" /><img className="scan-result__notch" src={notch} alt="" /><img className="scan-result__status-right" src={statusRight} alt="" /></div>
}

function normalizeScanMenu(menu) {
  const item = menu?.item
  return {
    ...menu,
    itemId: item?.id ?? menu?.itemId,
    name: item?.label ?? menu?.name ?? '메뉴',
    points: item ? item.points : menu?.points,
    basis: item?.basis ?? menu?.basis ?? '',
    haggled: item?.haggled === true,
  }
}

function toMenus(scan, manualItems) {
  return [
    ...(scan?.menus ?? []).map(normalizeScanMenu),
    ...manualItems.map((item) => ({
      ...getItemDisplay(item),
      id: `text-${item.id}`,
      itemId: item.id,
      item,
    })),
  ].sort((a, b) => (a.points ?? 0) - (b.points ?? 0))
}

function ScanResult({ error, isLoading = false, manualItems = [], onBack, onChat, onOpenDirectInput, onRecord, onRetake, onUpdateMenu, scan }) {
  const [menus, setMenus] = useState(() => toMenus(scan, manualItems))
  const [selectedId, setSelectedId] = useState(scan?.recommendation?.menuId ?? scan?.menus?.[0]?.id)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => setMenus(toMenus(scan, manualItems)), [manualItems, scan])
  const selected = menus.find((menu) => menu.id === selectedId) ?? menus[0]

  async function savePoints(menuId, value) {
    if (String(menuId).startsWith('text-')) return
    const points = Math.max(0, Math.min(999, Number.parseInt(value, 10) || 0))
    setMenus((items) => items.map((item) => item.id === menuId ? { ...item, points } : item))
    setEditingId(null)
    try {
      const updated = await onUpdateMenu?.(menuId, points)
      if (updated) setMenus((items) => items.map((item) => item.id === menuId ? normalizeScanMenu(updated) : item))
    } catch {
      setMenus(toMenus(scan, manualItems))
    }
  }

  return (
    <main className="scan-result" aria-labelledby="scan-result-store">
      <StatusBar />
      <header className="scan-result__brandbar"><img className="scan-result__logo" src={mildangLogo} alt="밀당" /><button className="scan-result__retake" type="button" onClick={onRetake}>재촬영</button></header>
      <section className="scan-result__store"><button className="scan-result__back" type="button" onClick={onBack} aria-label="식사 입력 화면으로 돌아가기"><img src={chevronLeft} alt="" /></button><div><h1 id="scan-result-store">{scan?.place ?? '메뉴판 분석 결과'}</h1><p>숫자를 탭하면 포인트를 직접 수정할 수 있어요.</p>{error && <p role="alert">{error}</p>}</div></section>
      {selected && <article className="scan-result__recommendation"><p className="scan-result__eyebrow">밀당이의 추천</p><h2>{selected.name} {selected.points}밀</h2><p className="scan-result__advice">{scan?.recommendation?.comment ?? selected.basis}</p><div className="scan-result__actions"><button type="button" disabled={isLoading} onClick={() => onRecord?.(selected)}>{selected.points}밀 기록하기</button><button type="button" disabled={isLoading} onClick={() => onChat?.(selected)}>밀당하기</button></div></article>}
      <section className="scan-result__menu-section" aria-labelledby="scan-result-menu-title"><h2 id="scan-result-menu-title">밀가루 포인트가 낮은 순</h2><div className="scan-result__menu-list">
        {menus.map((menu) => {
          const isSelected = menu.id === selectedId
          const isEditing = menu.id === editingId
          return <article className={`scan-result__menu${isSelected ? ' is-selected' : ''}`} key={menu.id} onClick={() => setSelectedId(menu.id)}>
            {isEditing ? <input className="scan-result__score-input" type="number" min="0" max="999" defaultValue={menu.points} autoFocus aria-label={`${menu.name} 포인트`} onClick={(event) => event.stopPropagation()} onBlur={(event) => savePoints(menu.id, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} /> : <button className="scan-result__score" type="button" disabled={Boolean(menu.itemId)} aria-label={`${menu.name} ${menu.points}밀, 수정`} onClick={(event) => { event.stopPropagation(); setSelectedId(menu.id); if (!menu.itemId) setEditingId(menu.id) }}>{menu.points}</button>}
            <div className="scan-result__menu-copy"><h3>{menu.name}</h3><p>{menu.basis}</p></div>
          </article>
        })}
      </div><div className="scan-result__manual-input"><span>인식이 이상해요?</span><button type="button" onClick={onOpenDirectInput}>직접 입력</button></div></section>
    </main>
  )
}

export default ScanResult
