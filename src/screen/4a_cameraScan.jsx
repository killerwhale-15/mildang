import { useEffect, useRef, useState } from 'react'
import backChevron from '../img/chevron-left.svg'
import scanCamera from '../img/figma-scan-09.svg'
import scanFrame from '../img/figma-scan-03.svg'
import scanGallery from '../img/figma-scan-02.svg'
import scanShutter from '../img/figma-scan-08.svg'
import '../css/4a_cameraScan.css'

function stopMediaStream(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

function CameraScan({ onBack, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const galleryInputRef = useRef(null)
  const [cameraAttempt, setCameraAttempt] = useState(0)
  const [cameraStatus, setCameraStatus] = useState('requesting')
  const [cameraMessage, setCameraMessage] = useState('카메라를 준비하고 있어요')
  const [previewUrl, setPreviewUrl] = useState('')
  const [scanError, setScanError] = useState('')

  useEffect(() => {
    let isCancelled = false

    async function startCamera() {
      setCameraStatus('requesting')
      setCameraMessage('카메라를 준비하고 있어요')

      if (!window.isSecureContext) {
        setCameraStatus('unavailable')
        setCameraMessage('카메라는 HTTPS 또는 localhost에서 사용할 수 있어요')
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unavailable')
        setCameraMessage('이 브라우저에서는 카메라를 사용할 수 없어요')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })

        if (isCancelled) {
          stopMediaStream(stream)
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setCameraStatus('ready')
        setCameraMessage('메뉴판 촬영 준비 완료')
      } catch (error) {
        if (isCancelled) return

        stopMediaStream(streamRef.current)
        streamRef.current = null

        if (error?.name === 'NotAllowedError') {
          setCameraStatus('denied')
          setCameraMessage('메뉴판을 찍으려면 카메라 권한을 허용해주세요')
        } else if (error?.name === 'NotFoundError') {
          setCameraStatus('unavailable')
          setCameraMessage('사용할 수 있는 카메라를 찾지 못했어요')
        } else {
          setCameraStatus('error')
          setCameraMessage('카메라를 열지 못했어요. 다시 시도해주세요')
        }
      }
    }

    startCamera()

    return () => {
      isCancelled = true
      stopMediaStream(streamRef.current)
      streamRef.current = null
    }
  }, [cameraAttempt])

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  async function showPreview(file) {
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setScanError('이미지는 10MB 이하만 업로드할 수 있어요.')
      return
    }

    stopMediaStream(streamRef.current)
    streamRef.current = null
    setPreviewUrl(URL.createObjectURL(file))
    setCameraStatus('analyzing')
    setCameraMessage('메뉴판 사진을 촬영했어요')
    setScanError('')
    try {
      await onCapture?.(file)
    } catch (error) {
      setScanError(error.message)
      setCameraStatus('captured')
    }
  }

  function handleCapture() {
    if (cameraStatus === 'captured') {
      setPreviewUrl('')
      setCameraAttempt((attempt) => attempt + 1)
      return
    }

    const video = videoRef.current

    if (!video || cameraStatus !== 'ready' || !video.videoWidth) return

    const canvas = document.createElement('canvas')
    const targetRatio = 352 / 530
    const sourceRatio = video.videoWidth / video.videoHeight
    const outputWidth = 1056
    const outputHeight = Math.round(outputWidth / targetRatio)
    let sourceX = 0
    let sourceY = 0
    let sourceWidth = video.videoWidth
    let sourceHeight = video.videoHeight

    if (sourceRatio > targetRatio) {
      sourceWidth = video.videoHeight * targetRatio
      sourceX = (video.videoWidth - sourceWidth) / 2
    } else {
      sourceHeight = video.videoWidth / targetRatio
      sourceY = (video.videoHeight - sourceHeight) / 2
    }

    canvas.width = outputWidth
    canvas.height = outputHeight
    canvas
      .getContext('2d')
      ?.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      )

    canvas.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], `menu-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })
      showPreview(file)
    }, 'image/jpeg', 0.9)
  }

  function handleGalleryChange(event) {
    const [file] = event.target.files ?? []
    showPreview(file)
    event.target.value = ''
  }

  const canRetry = ['denied', 'unavailable', 'error'].includes(cameraStatus)
  const captureDisabled = !['ready', 'captured'].includes(cameraStatus)

  return (
    <main className="camera-scan" aria-labelledby="camera-scan-title">

      <header className="camera-scan__topbar">
        <button type="button" onClick={onBack} aria-label="뒤로가기">
          <img src={backChevron} alt="" />
        </button>
      </header>

      <div className="camera-scan__guide" id="camera-scan-title">
        <p>메뉴판이 프레임 안에 들어오게</p>
        <p>촬영하면 3초 안에 가격표가 나와요</p>
      </div>

      <section className="camera-scan__viewport" aria-label="메뉴판 카메라 미리보기">
        <img className="camera-scan__placeholder" src={scanFrame} alt="" />
        <video
          className={cameraStatus === 'ready' ? 'is-visible' : ''}
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="카메라 미리보기"
        />
        {previewUrl && (
          <img
            className="camera-scan__preview is-visible"
            src={previewUrl}
            alt="촬영한 메뉴판"
          />
        )}

        {cameraStatus !== 'ready' && cameraStatus !== 'captured' && (
          <div className="camera-scan__notice" role="status" aria-live="polite">
            <span>{cameraMessage}</span>
            {canRetry && (
              <button
                type="button"
                onClick={() => setCameraAttempt((attempt) => attempt + 1)}
              >
                다시 시도
              </button>
            )}
          </div>
        )}
      </section>

      <div className="camera-scan__controls">
        {scanError && <p role="alert">{scanError}</p>}
        <button
          className="camera-scan__gallery"
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          aria-label="앨범에서 메뉴판 선택"
        >
          <img src={scanGallery} alt="" />
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic"
          onChange={handleGalleryChange}
          tabIndex="-1"
          aria-hidden="true"
        />

        <button
          className="camera-scan__capture"
          type="button"
          onClick={handleCapture}
          disabled={captureDisabled}
          aria-label={cameraStatus === 'captured' ? '다시 촬영' : '메뉴판 촬영'}
        >
          <img className="camera-scan__shutter" src={scanShutter} alt="" />
          <img className="camera-scan__camera" src={scanCamera} alt="" />
        </button>
      </div>
    </main>
  )
}

export default CameraScan
