function drawCentered(context, text, y, size, weight = 700, color = '#212121') {
  context.fillStyle = color
  context.font = `${weight} ${size}px system-ui, sans-serif`
  context.textAlign = 'center'
  context.fillText(text, 540, y)
}

export function renderDemoShareCard(report, metadata) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const context = canvas.getContext('2d')

  context.fillStyle = '#fffdf2'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#ffd900'
  context.beginPath()
  context.arc(540, 330, 210, 0, Math.PI * 2)
  context.fill()

  drawCentered(context, '밀당', 180, 64, 900)
  drawCentered(context, report?.challenge?.label ?? '밀가루 흥정 챌린지', 345, 42, 800)
  drawCentered(context, report?.title ?? '당신의 몸이 쓴 리포트', 500, 66, 900)

  ;(report?.stats ?? []).forEach((stat, index) => {
    const y = 760 + index * 210
    drawCentered(context, stat.label, y, 36, 600, '#757575')
    drawCentered(context, `${stat.value}${stat.sub ?? ''}`, y + 85, 72, 900)
  })

  if (report?.finding?.available) {
    drawCentered(context, report.finding.headline, 1510, 36, 700)
  }
  drawCentered(context, metadata?.hashtag ?? '#밀가루흥정챌린지', 1760, 34, 700, '#757575')

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('공유 카드를 만들지 못했습니다.'))
        return
      }
      resolve({
        ...metadata,
        imageUrl: URL.createObjectURL(blob),
        width: 1080,
        height: 1920,
        clientRendered: true,
      })
    }, 'image/png')
  })
}
