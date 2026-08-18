import { useEffect, useId, useState } from 'react'
import { DEMO_JUDGE_ACCOUNTS } from '../api/demoAccounts.js'
import settingsIcon from '../img/material-settings.svg'
import '../css/DemoControls.css'

const scenarios = [
  { value: 'FRESH', label: 'FRESH' },
  { value: 'DAY4_ACTIVE', label: 'DAY4' },
  { value: 'W2_DAY8', label: 'W2' },
  { value: 'W4_DAY12', label: 'W4' },
  { value: 'COMPLETED', label: '완주' },
  { value: 'LOW_BALANCE', label: '잔액5' },
  { value: 'EXPIRED_CONFIRM', label: '만료확인' },
]

function DemoControls({
  account,
  backendConfirmed = false,
  isAuthenticated = false,
  isLoading = false,
  onCommand,
  onLogin,
}) {
  const [open, setOpen] = useState(false)
  const [accountInput, setAccountInput] = useState(account)
  const panelId = useId()

  useEffect(() => setAccountInput(account), [account])
  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const activeJudge = DEMO_JUDGE_ACCOUNTS.find(({ token }) => token === account)
  const accountLabel = activeJudge?.label.split(' · ')[0] ?? '데모 계정'

  function loginAccount(event) {
    event.preventDefault()
    const nextAccount = accountInput.trim()
    if (nextAccount) onLogin(nextAccount)
  }

  function loginJudge({ token, scenario }) {
    setAccountInput(token)
    onLogin(token, scenario)
  }

  return (
    <div className="demo-controls">
      <button
        className="demo-controls__trigger"
        type="button"
        aria-label={open ? '데모 도구 닫기' : '데모 도구 열기'}
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <img src={settingsIcon} alt="" />
      </button>

      {open && (
        <aside className="demo-controls__panel" id={panelId} role="dialog" aria-labelledby={`${panelId}-title`}>
          <header className="demo-controls__header">
            <div>
              <p className="demo-controls__eyebrow">공모전 제출 빌드</p>
              <h2 id={`${panelId}-title`}>데모 도구</h2>
            </div>
            <div className="demo-controls__header-actions">
              <span className="demo-controls__account-badge">{accountLabel}</span>
              <button className="demo-controls__close" type="button" onClick={() => setOpen(false)}>닫기</button>
            </div>
          </header>

          <section className="demo-controls__section" aria-labelledby={`${panelId}-login`}>
            <h3 id={`${panelId}-login`}>로그인</h3>
            <form className="demo-controls__login" onSubmit={loginAccount}>
              <label className="demo-controls__sr-only" htmlFor={`${panelId}-account`}>데모 계정 ID 토큰</label>
              <input
                id={`${panelId}-account`}
                type="text"
                value={accountInput}
                onChange={(event) => setAccountInput(event.target.value)}
                placeholder="demo-user-1"
                autoComplete="off"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !accountInput.trim()}>로그인</button>
            </form>
            <p className="demo-controls__help">임의 문자열은 별도 데모 계정으로 로그인됩니다.</p>

            <p className="demo-controls__subheading">심사위원 계정 — 로그인과 시연 상태 설정을 한 번에</p>
            <div className="demo-controls__pills">
              {DEMO_JUDGE_ACCOUNTS.map((judge) => (
                <button
                  className={judge.token === account ? 'is-active' : ''}
                  type="button"
                  key={judge.token}
                  onClick={() => loginJudge(judge)}
                  disabled={isLoading}
                >
                  {judge.label}
                </button>
              ))}
            </div>
          </section>

          <section className="demo-controls__section" aria-labelledby={`${panelId}-seed`}>
            <div className="demo-controls__section-title">
              <h3 id={`${panelId}-seed`}>시드</h3>
              <span>{backendConfirmed ? '데모 백엔드 확인됨' : isAuthenticated ? '로그인됨' : '로그인 후 사용'}</span>
            </div>
            <div className="demo-controls__pills">
              {scenarios.map(({ value, label }) => (
                <button type="button" key={value} onClick={() => onCommand('seed', value)} disabled={isLoading || !isAuthenticated}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="demo-controls__section" aria-labelledby={`${panelId}-time`}>
            <h3 id={`${panelId}-time`}>시간·배치</h3>
            <div className="demo-controls__pills">
              <button type="button" onClick={() => onCommand('advance')} disabled={isLoading || !isAuthenticated}>+1일</button>
              <button type="button" onClick={() => onCommand('batch')} disabled={isLoading || !isAuthenticated}>05:00 배치</button>
              <button type="button" onClick={() => onCommand('reset')} disabled={isLoading || !isAuthenticated}>계정 리셋</button>
            </div>
          </section>
        </aside>
      )}
    </div>
  )
}

export default DemoControls
