import { useCallback, useEffect, useRef, useState } from 'react'
import { MacDesktop } from './MacDesktop'

const INTRO_VIDEO_URL = '/videos/macbook-work-scene.mp4'
const REVERSE_SPEED = 1.35
const SCREEN_REVEAL_TIME = 3.78
const SCREEN_TRACK_POINTS = [
  { time: 3.78, top: 38.15, left: 38.2, width: 22.6, height: 28.15 },
  { time: 4.1, top: 31.1, left: 35.35, width: 27.8, height: 35.1 },
  { time: 4.45, top: 23.9, left: 32.15, width: 33.6, height: 42.35 },
  { time: 4.75, top: 17.8, left: 29.6, width: 38.85, height: 48.6 },
  { time: 5.04, top: 14.92, left: 27.34, width: 42.42, height: 52.12 },
]

type ScenePhase = 'intro' | 'ready' | 'reversing'
type ScreenMode = 'hidden' | 'lock' | 'desktop'
type ScreenTrackPoint = (typeof SCREEN_TRACK_POINTS)[number]

export function LaptopIntro() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const reverseFrameRef = useRef<number | null>(null)
  const screenFrameRef = useRef<number | null>(null)
  const phaseRef = useRef<ScenePhase>('intro')
  const screenModeRef = useRef<ScreenMode>('hidden')
  const [phase, setPhase] = useState<ScenePhase>('intro')
  const [screenMode, setScreenMode] = useState<ScreenMode>('hidden')

  const setPhaseState = useCallback((nextPhase: ScenePhase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }, [])

  const setScreenModeState = useCallback((nextMode: ScreenMode) => {
    if (screenModeRef.current === nextMode) {
      return
    }

    screenModeRef.current = nextMode
    setScreenMode(nextMode)
  }, [])

  const syncScreenToVideo = useCallback((time: number) => {
    const screen = screenRef.current
    if (!screen) {
      return
    }

    const track = getScreenTrack(time)
    screen.style.setProperty('--screen-top', `${track.top}vh`)
    screen.style.setProperty('--screen-left', `${track.left}vw`)
    screen.style.setProperty('--screen-width', `${track.width}vw`)
    screen.style.setProperty('--screen-height', `${track.height}vh`)
  }, [])

  const stopReverse = useCallback(() => {
    if (reverseFrameRef.current !== null) {
      window.cancelAnimationFrame(reverseFrameRef.current)
      reverseFrameRef.current = null
    }
  }, [])

  const stopScreenWatch = useCallback(() => {
    if (screenFrameRef.current !== null) {
      window.cancelAnimationFrame(screenFrameRef.current)
      screenFrameRef.current = null
    }
  }, [])

  const startScreenWatch = useCallback(() => {
    if (screenFrameRef.current !== null) {
      return
    }

    function tick() {
      const video = videoRef.current
      if (!video || phaseRef.current !== 'intro') {
        screenFrameRef.current = null
        return
      }

      if (video.currentTime >= SCREEN_REVEAL_TIME) {
        setScreenModeState('lock')
        syncScreenToVideo(video.currentTime)
      }

      if (!video.paused && !video.ended) {
        screenFrameRef.current = window.requestAnimationFrame(tick)
        return
      }

      screenFrameRef.current = null
    }

    screenFrameRef.current = window.requestAnimationFrame(tick)
  }, [setScreenModeState, syncScreenToVideo])

  const playForward = useCallback(async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    stopReverse()
    stopScreenWatch()
    setPhaseState('intro')
    setScreenModeState('hidden')
    video.pause()
    video.playbackRate = 1
    video.currentTime = 0

    try {
      await video.play()
      startScreenWatch()
    } catch {
      // Muted autoplay should work; if it does not, the next user tap starts it.
    }
  }, [setPhaseState, setScreenModeState, startScreenWatch, stopReverse, stopScreenWatch])

  const reverseToStart = useCallback(() => {
    const video = videoRef.current
    if (!video || phaseRef.current !== 'ready') {
      return
    }

    stopReverse()
    stopScreenWatch()
    setPhaseState('reversing')
    setScreenModeState('lock')
    video.pause()

    const startTime = Math.min(video.currentTime || video.duration, Math.max(video.duration - 0.04, 0))
    syncScreenToVideo(startTime)
    let previousFrame = performance.now()

    function step(now: number) {
      const currentVideo = videoRef.current
      if (!currentVideo) {
        return
      }

      const delta = (now - previousFrame) / 1000
      previousFrame = now
      currentVideo.currentTime = Math.max(0, currentVideo.currentTime - delta * REVERSE_SPEED)
      syncScreenToVideo(currentVideo.duration || SCREEN_TRACK_POINTS[SCREEN_TRACK_POINTS.length - 1].time)

      if (currentVideo.currentTime <= 0.02) {
        currentVideo.currentTime = 0
        currentVideo.pause()
        reverseFrameRef.current = null
        setPhaseState('intro')
        setScreenModeState('hidden')
        return
      }

      reverseFrameRef.current = window.requestAnimationFrame(step)
    }

    video.currentTime = startTime
    reverseFrameRef.current = window.requestAnimationFrame(step)
  }, [setPhaseState, setScreenModeState, stopReverse, stopScreenWatch, syncScreenToVideo])

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
        syncScreenToVideo(video.duration)
      }
      stopScreenWatch()
      setScreenModeState('desktop')
      setPhaseState('ready')
    }

    function handleTimeUpdate() {
      const currentVideo = videoRef.current
      if (currentVideo && phaseRef.current === 'intro' && currentVideo.currentTime >= SCREEN_REVEAL_TIME) {
        setScreenModeState('lock')
        syncScreenToVideo(currentVideo.currentTime)
      }
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    void playForward()

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      stopReverse()
      stopScreenWatch()
    }
  }, [playForward, setPhaseState, setScreenModeState, stopReverse, stopScreenWatch, syncScreenToVideo])

  function handleScenePointerDown() {
    const video = videoRef.current
    if (!video || phase !== 'intro' || video.currentTime > 0.08 || !video.paused) {
      return
    }

    void playForward()
  }

  const screenIsActive = screenMode !== 'hidden'

  return (
    <section
      className={`intro-scene is-${phase} ${screenIsActive ? 'has-screen-ui' : ''}`}
      aria-label="Cinematic MacBook intro"
    >
      <div className="video-stage" onPointerDown={handleScenePointerDown} aria-hidden="true">
        <div className="video-layer">
          <video ref={videoRef} src={INTRO_VIDEO_URL} muted playsInline preload="auto" />
        </div>
      </div>

      <div
        ref={screenRef}
        className={`laptop-screen-ui video-screen-ui screen-${screenMode} ${screenIsActive ? 'is-active' : ''}`}
        aria-hidden={!screenIsActive}
      >
        <MacLockScreen />
        <div className="mac-desktop-layer" aria-hidden={screenMode !== 'desktop'}>
          {screenMode === 'desktop' ? <MacDesktop onShutdown={reverseToStart} /> : null}
        </div>
      </div>
    </section>
  )
}

function getScreenTrack(time: number): ScreenTrackPoint {
  const firstPoint = SCREEN_TRACK_POINTS[0]
  const lastPoint = SCREEN_TRACK_POINTS[SCREEN_TRACK_POINTS.length - 1]

  if (time <= firstPoint.time) {
    return firstPoint
  }

  if (time >= lastPoint.time) {
    return lastPoint
  }

  for (let index = 1; index < SCREEN_TRACK_POINTS.length; index += 1) {
    const previous = SCREEN_TRACK_POINTS[index - 1]
    const next = SCREEN_TRACK_POINTS[index]

    if (time <= next.time) {
      const progress = (time - previous.time) / (next.time - previous.time)
      return {
        time,
        top: interpolate(previous.top, next.top, progress),
        left: interpolate(previous.left, next.left, progress),
        width: interpolate(previous.width, next.width, progress),
        height: interpolate(previous.height, next.height, progress),
      }
    }
  }

  return lastPoint
}

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

function MacLockScreen() {
  return (
    <div className="mac-lock-screen" aria-hidden="true">
      <div className="lock-profile">
        <div className="lock-avatar">KB</div>
        <strong>Kacper Bernecki</strong>
        <span>Portfolio</span>
      </div>
    </div>
  )
}
