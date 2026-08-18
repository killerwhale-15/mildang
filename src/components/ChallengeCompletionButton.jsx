import '../css/ChallengeCompletionButton.css'

function ChallengeCompletionButton({ onClick }) {
  return (
    <button
      className="challenge-completion-button"
      type="button"
      onClick={onClick}
    >
      완주 성공
    </button>
  )
}

export default ChallengeCompletionButton
