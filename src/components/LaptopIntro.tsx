import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { profile } from '../data/portfolio'
import { MacDesktop } from './MacDesktop'

const FORWARD_VIDEO_URL = '/videos/macbook-work-scene-clean.mp4?v=20260518-clean2'
const MOBILE_FORWARD_VIDEO_URL = '/videos/macbook-work-scene-clean-mobile.mp4?v=20260518-clean2'
const REVERSE_VIDEO_URL = '/videos/macbook-work-scene-reverse-clean.mp4?v=20260518-clean2'
const MOBILE_REVERSE_VIDEO_URL = '/videos/macbook-work-scene-reverse-clean-mobile.mp4?v=20260518-clean2'
const AVATAR_URL = '/images/github-avatar.png'
const SCREEN_WALLPAPER_URL = '/images/macbook-wallpaper-screen.png'
const MIN_LOADER_TIME = 450
const VIDEO_SOURCE_WIDTH = 2048
const VIDEO_SOURCE_HEIGHT = 1012
const FINAL_SCREEN_RECT = {
  x: 0.319,
  y: 0.146,
  width: 0.344,
  height: 0.514,
}

type ScenePhase = 'loading' | 'intro' | 'locked' | 'desktop' | 'reversing'
type ScreenMode = 'hidden' | 'lock' | 'desktop'
type VideoSources = { forward: string; reverse: string }

export function LaptopIntro() {
  const forwardVideoRef = useRef<HTMLVideoElement>(null)
  const reverseVideoRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef<ScenePhase>('loading')
  const screenModeRef = useRef<ScreenMode>('hidden')
  const [phase, setPhase] = useState<ScenePhase>('loading')
  const [screenMode, setScreenMode] = useState<ScreenMode>('hidden')
  const sources = useMemo(() => getVideoSources(), [])

  const setPhaseState = useCallback((nextPhase: ScenePhase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }, [])

  const setScreenModeState = useCallback((nextMode: ScreenMode) => {
    screenModeRef.current = nextMode
    setScreenMode(nextMode)
  }, [])

  const syncScreenToVideo = useCallback((video: HTMLVideoElement | null) => {
    const screen = screenRef.current
    if (!screen || !video) {
      return false
    }

    const mediaFrame = getMediaCoverFrame(video)
    if (!mediaFrame) {
      return false
    }

    const top = mediaFrame.top + FINAL_SCREEN_RECT.y * mediaFrame.height
    const left = mediaFrame.left + FINAL_SCREEN_RECT.x * mediaFrame.width
    const width = FINAL_SCREEN_RECT.width * mediaFrame.width
    const height = FINAL_SCREEN_RECT.height * mediaFrame.height

    screen.style.setProperty('--screen-top', `${top}px`)
    screen.style.setProperty('--screen-left', `${left}px`)
    screen.style.setProperty('--screen-width', `${width}px`)
    screen.style.setProperty('--screen-height', `${height}px`)
    return true
  }, [])

  const resetAfterReverse = useCallback(() => {
    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current

    reverseVideo?.pause()
    if (reverseVideo) {
      reverseVideo.currentTime = 0
    }

    forwardVideo?.pause()
    if (forwardVideo) {
      forwardVideo.currentTime = 0
      syncScreenToVideo(forwardVideo)
    }

    setScreenModeState('hidden')
    setPhaseState('intro')
  }, [setPhaseState, setScreenModeState, syncScreenToVideo])

  const playForward = useCallback(async () => {
    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current
    if (!forwardVideo) {
      return
    }

    reverseVideo?.pause()
    if (reverseVideo) {
      reverseVideo.currentTime = 0
    }

    forwardVideo.pause()
    forwardVideo.playbackRate = 1
    forwardVideo.currentTime = 0
    syncScreenToVideo(forwardVideo)
    setScreenModeState('hidden')
    setPhaseState('intro')

    try {
      await forwardVideo.play()
    } catch {
      // User pointer/tap retries playback when autoplay is blocked.
    }
  }, [setPhaseState, setScreenModeState, syncScreenToVideo])

  const openDesktop = useCallback(() => {
    if (phaseRef.current !== 'locked') {
      return
    }

    syncScreenToVideo(forwardVideoRef.current)
    setScreenModeState('desktop')
    setPhaseState('desktop')
  }, [setPhaseState, setScreenModeState, syncScreenToVideo])

  const reverseToStart = useCallback(async () => {
    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current
    if (!reverseVideo || phaseRef.current !== 'desktop') {
      return
    }

    setScreenModeState('hidden')
    setPhaseState('reversing')
    forwardVideo?.pause()
    reverseVideo.pause()
    reverseVideo.playbackRate = 1
    reverseVideo.currentTime = 0

    try {
      await waitForVideoFrame(reverseVideo)
      await reverseVideo.play()
    } catch {
      resetAfterReverse()
    }
  }, [resetAfterReverse, setPhaseState, setScreenModeState])

  useEffect(() => {
    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current
    if (!forwardVideo || !reverseVideo) {
      return
    }
    const forwardElement = forwardVideo
    const reverseElement = reverseVideo

    let cancelled = false

    async function loadScene() {
      const avatar = new Image()
      const screenWallpaper = new Image()
      avatar.decoding = 'async'
      screenWallpaper.decoding = 'async'
      avatar.src = AVATAR_URL
      screenWallpaper.src = SCREEN_WALLPAPER_URL

      await Promise.all([
        waitForVideoFrame(forwardElement),
        waitForVideoFrame(reverseElement),
        waitForImage(avatar),
        waitForImage(screenWallpaper),
        wait(MIN_LOADER_TIME),
      ])

      if (cancelled) {
        return
      }

      syncScreenToVideo(forwardElement)
      void playForward()
    }

    function handleForwardEnded() {
      if (phaseRef.current !== 'intro') {
        return
      }

      forwardElement.pause()
      if (Number.isFinite(forwardElement.duration)) {
        forwardElement.currentTime = Math.max(forwardElement.duration - 0.04, 0)
      }

      window.requestAnimationFrame(() => {
        syncScreenToVideo(forwardElement)
        setPhaseState('locked')
        setScreenModeState('lock')
      })
    }

    function handleReverseEnded() {
      resetAfterReverse()
    }

    forwardElement.addEventListener('ended', handleForwardEnded)
    reverseElement.addEventListener('ended', handleReverseEnded)
    void loadScene()

    return () => {
      cancelled = true
      forwardElement.removeEventListener('ended', handleForwardEnded)
      reverseElement.removeEventListener('ended', handleReverseEnded)
    }
  }, [playForward, resetAfterReverse, setPhaseState, setScreenModeState, syncScreenToVideo])

  useEffect(() => {
    function handleResize() {
      const activeVideo = phaseRef.current === 'reversing' ? reverseVideoRef.current : forwardVideoRef.current
      syncScreenToVideo(activeVideo)
    }

    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [syncScreenToVideo])

  function handleScenePointerDown() {
    const forwardVideo = forwardVideoRef.current
    if (!forwardVideo || phase !== 'intro' || !forwardVideo.paused || forwardVideo.currentTime > 0.12) {
      return
    }

    void playForward()
  }

  const screenIsActive = screenMode !== 'hidden'
  const showForwardVideo = phase !== 'reversing'

  return (
    <section
      className={`intro-scene is-${phase} ${screenIsActive ? 'has-screen-ui' : ''}`}
      aria-label="Cinematic MacBook intro"
    >
      <div className="video-stage" onPointerDown={handleScenePointerDown} aria-hidden="true">
        <div className="video-layer">
          <video
            ref={forwardVideoRef}
            className={`scene-video scene-video-forward ${showForwardVideo ? 'is-visible' : ''}`}
            src={sources.forward}
            muted
            playsInline
            preload="auto"
          />
          <video
            ref={reverseVideoRef}
            className={`scene-video scene-video-reverse ${phase === 'reversing' ? 'is-visible' : ''}`}
            src={sources.reverse}
            muted
            playsInline
            preload="auto"
          />
        </div>
      </div>

      {phase === 'loading' ? (
        <div className="intro-loader" role="status" aria-live="polite">
          <span />
          <strong>Loading scene</strong>
        </div>
      ) : null}

      <div
        ref={screenRef}
        className={`laptop-screen-ui video-screen-ui screen-${screenMode} ${screenIsActive ? 'is-active' : ''}`}
        aria-hidden={!screenIsActive}
      >
        {screenMode === 'lock' ? (
          <div className="screen-content lock-screen-content">
            <img src={AVATAR_URL} alt="" />
            <strong>{profile.name}</strong>
            <span>Portfolio</span>
            {phase === 'locked' ? (
              <button type="button" className="lock-open-button" onClick={openDesktop}>
                Open
              </button>
            ) : null}
          </div>
        ) : null}
        {screenMode === 'desktop' ? (
          <div className="screen-content mac-desktop-layer" aria-hidden={false}>
            <MacDesktop onShutdown={reverseToStart} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function waitForVideoFrame(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    function handleReady() {
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplay', handleReady)
      resolve()
    }

    video.addEventListener('loadeddata', handleReady, { once: true })
    video.addEventListener('canplay', handleReady, { once: true })
    video.load()
  })
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => resolve(), { once: true })
  })
}

function wait(duration: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration)
  })
}

function getVideoSources(): VideoSources {
  return isMobileViewport()
    ? { forward: MOBILE_FORWARD_VIDEO_URL, reverse: MOBILE_REVERSE_VIDEO_URL }
    : { forward: FORWARD_VIDEO_URL, reverse: REVERSE_VIDEO_URL }
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 560px)').matches
}

function getMediaCoverFrame(video: HTMLVideoElement) {
  const rect = video.getBoundingClientRect()
  const sourceWidth = video.videoWidth || VIDEO_SOURCE_WIDTH
  const sourceHeight = video.videoHeight || VIDEO_SOURCE_HEIGHT

  if (!sourceWidth || !sourceHeight || !rect.width || !rect.height) {
    return null
  }

  const scale = Math.max(rect.width / sourceWidth, rect.height / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    height,
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2,
    width,
  }
}
