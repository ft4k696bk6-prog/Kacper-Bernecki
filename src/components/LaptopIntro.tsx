import { useCallback, useEffect, useRef, useState } from 'react'
import { MacDesktop } from './MacDesktop'

const INTRO_VIDEO_URL = '/videos/macbook-work-scene.mp4'
const REVERSE_SPEED = 1.35

type ScenePhase = 'intro' | 'ready' | 'reversing'

export function LaptopIntro() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reverseFrameRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<ScenePhase>('intro')

  const stopReverse = useCallback(() => {
    if (reverseFrameRef.current !== null) {
      window.cancelAnimationFrame(reverseFrameRef.current)
      reverseFrameRef.current = null
    }
  }, [])

  const playForward = useCallback(async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    stopReverse()
    setPhase('intro')
    video.pause()
    video.playbackRate = 1
    video.currentTime = 0

    try {
      await video.play()
    } catch {
      // Muted autoplay should work; if it does not, the next user tap starts it.
    }
  }, [stopReverse])

  const reverseToStart = useCallback(() => {
    const video = videoRef.current
    if (!video || phase !== 'ready') {
      return
    }

    stopReverse()
    setPhase('reversing')
    video.pause()

    const startTime = Math.min(video.currentTime || video.duration, Math.max(video.duration - 0.04, 0))
    let previousFrame = performance.now()

    function step(now: number) {
      const currentVideo = videoRef.current
      if (!currentVideo) {
        return
      }

      const delta = (now - previousFrame) / 1000
      previousFrame = now
      currentVideo.currentTime = Math.max(0, currentVideo.currentTime - delta * REVERSE_SPEED)

      if (currentVideo.currentTime <= 0.02) {
        currentVideo.currentTime = 0
        currentVideo.pause()
        reverseFrameRef.current = null
        setPhase('intro')
        return
      }

      reverseFrameRef.current = window.requestAnimationFrame(step)
    }

    video.currentTime = startTime
    reverseFrameRef.current = window.requestAnimationFrame(step)
  }, [phase, stopReverse])

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    function handleEnded() {
      if (!video) {
        return
      }

      video.pause()
      if (Number.isFinite(video.duration)) {
        video.currentTime = Math.max(video.duration - 0.04, 0)
      }
      setPhase('ready')
    }

    video.addEventListener('ended', handleEnded)
    void playForward()

    return () => {
      video.removeEventListener('ended', handleEnded)
      stopReverse()
    }
  }, [playForward, stopReverse])

  function handleScenePointerDown() {
    const video = videoRef.current
    if (!video || phase !== 'intro' || video.currentTime > 0.08 || !video.paused) {
      return
    }

    void playForward()
  }

  return (
    <section className={`intro-scene is-${phase}`} aria-label="Cinematic MacBook intro">
      <div className="video-stage" onPointerDown={handleScenePointerDown} aria-hidden="true">
        <div className="video-layer">
          <video ref={videoRef} src={INTRO_VIDEO_URL} muted playsInline preload="auto" />
        </div>
      </div>

      <div className={`laptop-screen-ui video-screen-ui ${phase === 'ready' ? 'is-active' : ''}`} aria-hidden={phase !== 'ready'}>
        <MacDesktop onShutdown={reverseToStart} />
      </div>
    </section>
  )
}
