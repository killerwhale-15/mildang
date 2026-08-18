import mildangLogo from '../img/onboarding_logo_3x.png'
import '../css/Onboarding1.css'

function Onboarding1({ error, invite, isDemo = false, isLoading = false, onStart }) {
  return (
    <main className="onboarding" aria-labelledby="onboarding-title">
      <header className="onboarding__header">
        <img className="onboarding__logo" src={mildangLogo} alt="밀당" />
      </header>

      <section className="onboarding__intro">
        <h1 id="onboarding-title" className="onboarding__title">
          <span>밀가루,</span>
          <span>참지 말고</span>
          <span>밀당하세요.</span>
        </h1>
        <p className="onboarding__description">
          <span>밀가루 예산을 설정하고,</span>
          <span>먹는 걸 기록하면 AI가 균형을 알려드려요.</span>
        </p>
        {invite && <p><strong>{invite.inviterNickname}</strong>님의 도전: {invite.finding}<br />{invite.ctaLabel}</p>}
      </section>

      <section className="onboarding__actions" aria-label="로그인">
        {error && <p className="onboarding__error" role="alert">{error}</p>}
        <button
          className="onboarding__start"
          type="button"
          onClick={onStart}
          disabled={isLoading}
        >
          {isLoading ? '로그인 중…' : '카카오로 시작하기'}
        </button>
        {isDemo && (
          <p className="onboarding__demo-notice" role="status">
            데모 모드 — 실제 카카오 인증은 생략됩니다
          </p>
        )}
      </section>
    </main>
  )
}

export default Onboarding1
