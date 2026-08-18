import mildangMark from '../img/start_mildang_icon.png'
import '../css/StartScreen.css'

function StartScreen() {
  return (
    <main className="start-screen">
      <h1 className="start-screen__brand">
        <img src={mildangMark} alt={'\uBC00\uB2F9'} />
      </h1>
    </main>
  )
}

export default StartScreen
