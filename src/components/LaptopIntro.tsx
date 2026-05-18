import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { profile } from '../data/portfolio'
import { MacDesktop } from './MacDesktop'

const FORWARD_VIDEO_URL = '/videos/macbook-work-scene-clean.mp4?v=20260518-clean4'
const MOBILE_FORWARD_VIDEO_URL = '/videos/macbook-work-scene-clean-mobile.mp4?v=20260518-clean4'
const REVERSE_VIDEO_URL = '/videos/macbook-work-scene-reverse-clean.mp4?v=20260518-clean4'
const MOBILE_REVERSE_VIDEO_URL = '/videos/macbook-work-scene-reverse-clean-mobile.mp4?v=20260518-clean4'
const AVATAR_URL = '/images/github-avatar.png'
const CLOSE_FRAME_URL = '/images/macbook-close-frame-clean.png'
const SCREEN_WALLPAPER_URL = '/images/macbook-wallpaper-screen.png'
const DESKTOP_TRANSITION_MS = 1450
const LOCK_HUD_REVEAL_MS = 260
const CLOSE_FRAME_DESKTOP_SCALE = 1.55
const CLOSE_FRAME_MOBILE_SCALE = 2.22
const MIN_LOADER_TIME = 450
const VIDEO_SOURCE_WIDTH = 4096
const VIDEO_SOURCE_HEIGHT = 2024
const CLOSE_FRAME_WIDTH = 2944
const CLOSE_FRAME_HEIGHT = 1440
const FINAL_SCREEN_RECT = {
  x: 0.316,
  y: 0.16,
  width: 0.348,
  height: 0.5,
}
const CLOSE_SCREEN_RECT = {
  x: 0.2765,
  y: 0.1625,
  width: 0.4484,
  height: 0.5875,
}

type ScenePhase = 'loading' | 'intro' | 'enteringLock' | 'locked' | 'desktop' | 'exitingDesktop' | 'reversing'
type ScreenMode = 'hidden' | 'lock' | 'desktop'
type MediaFrame = { height: number; left: number; top: number; width: number }
type VideoSources = { forward: string; reverse: string }

export function LaptopIntro() {
  const forwardVideoRef = useRef<HTMLVideoElement>(null)
  const reverseVideoRef = useRef<HTMLVideoElement>(null)
  const closeFrameRef = useRef<HTMLImageElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const transitionTimeoutRef = useRef<number | null>(null)
  const hudRevealTimeoutRef = useRef<number | null>(null)
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

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }

    if (hudRevealTimeoutRef.current !== null) {
      window.clearTimeout(hudRevealTimeoutRef.current)
      hudRevealTimeoutRef.current = null
    }
  }, [])

  const syncScreenToFrame = useCallback((mediaFrame: MediaFrame | null, screenRect: typeof FINAL_SCREEN_RECT) => {
    const screen = screenRef.current
    if (!screen || !mediaFrame) {
      return false
    }

    const top = mediaFrame.top + screenRect.y * mediaFrame.height
    const left = mediaFrame.left + screenRect.x * mediaFrame.width
    const width = screenRect.width * mediaFrame.width
    const height = screenRect.height * mediaFrame.height

    screen.style.setProperty('--screen-top', `${top}px`)
    screen.style.setProperty('--screen-left', `${left}px`)
    screen.style.setProperty('--screen-width', `${width}px`)
    screen.style.setProperty('--screen-height', `${height}px`)
    return true
  }, [])

  const syncScreenToVideo = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!video) {
        return false
      }

      return syncScreenToFrame(getMediaCoverFrame(video), FINAL_SCREEN_RECT)
    },
    [syncScreenToFrame],
  )

  const syncScreenToCloseFrame = useCallback(() => {
    const image = closeFrameRef.current
    if (!image) {
      return false
    }

    return syncScreenToFrame(getCloseFrameTargetFrame(image), CLOSE_SCREEN_RECT)
  }, [syncScreenToFrame])

  const resetAfterReverse = useCallback(() => {
    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current

    clearTransitionTimer()
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
  }, [clearTransitionTimer, setPhaseState, setScreenModeState, syncScreenToVideo])

  const playForward = useCallback(async () => {
    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current
    if (!forwardVideo) {
      return
    }

    clearTransitionTimer()
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
  }, [clearTransitionTimer, setPhaseState, setScreenModeState, syncScreenToVideo])

  const openDesktop = useCallback(() => {
    if (phaseRef.current !== 'locked') {
      return
    }

    clearTransitionTimer()
    syncScreenToCloseFrame()
    setScreenModeState('desktop')
    setPhaseState('desktop')
  }, [clearTransitionTimer, setPhaseState, setScreenModeState, syncScreenToCloseFrame])

  const reverseToStart = useCallback(async () => {
    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current
    if (!reverseVideo || phaseRef.current !== 'desktop') {
      return
    }

    clearTransitionTimer()
    setScreenModeState('hidden')
    forwardVideo?.pause()
    if (forwardVideo && Number.isFinite(forwardVideo.duration)) {
      forwardVideo.currentTime = Math.max(forwardVideo.duration - 0.04, 0)
    }

    reverseVideo.pause()
    reverseVideo.playbackRate = 1
    reverseVideo.currentTime = 0
    setPhaseState('exitingDesktop')

    transitionTimeoutRef.current = window.setTimeout(async () => {
      setPhaseState('reversing')
      transitionTimeoutRef.current = null

      try {
        await waitForVideoFrame(reverseVideo)
        await reverseVideo.play()
      } catch {
        resetAfterReverse()
      }
    }, DESKTOP_TRANSITION_MS)
  }, [clearTransitionTimer, resetAfterReverse, setPhaseState, setScreenModeState])

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
      const closeFrame = new Image()
      const screenWallpaper = new Image()
      avatar.decoding = 'async'
      closeFrame.decoding = 'async'
      screenWallpaper.decoding = 'async'
      avatar.src = AVATAR_URL
      closeFrame.src = CLOSE_FRAME_URL
      screenWallpaper.src = SCREEN_WALLPAPER_URL

      await Promise.all([
        waitForVideoFrame(forwardElement),
        waitForVideoFrame(reverseElement),
        waitForImage(avatar),
        waitForImage(closeFrame),
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
        setScreenModeState('hidden')
        setPhaseState('enteringLock')

        window.requestAnimationFrame(() => {
          syncScreenToCloseFrame()
          hudRevealTimeoutRef.current = window.setTimeout(() => {
            setScreenModeState('lock')
            hudRevealTimeoutRef.current = null
          }, LOCK_HUD_REVEAL_MS)

          transitionTimeoutRef.current = window.setTimeout(() => {
            syncScreenToCloseFrame()
            setScreenModeState('lock')
            setPhaseState('locked')
            transitionTimeoutRef.current = null
          }, DESKTOP_TRANSITION_MS)
        })
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
      clearTransitionTimer()
      forwardElement.removeEventListener('ended', handleForwardEnded)
      reverseElement.removeEventListener('ended', handleReverseEnded)
    }
  }, [
    clearTransitionTimer,
    playForward,
    resetAfterReverse,
    setPhaseState,
    setScreenModeState,
    syncScreenToCloseFrame,
    syncScreenToVideo,
  ])

  useEffect(() => {
    function handleResize() {
      if (phaseRef.current === 'desktop' || phaseRef.current === 'locked' || phaseRef.current === 'enteringLock') {
        syncScreenToCloseFrame()
        return
      }

      const activeVideo = phaseRef.current === 'reversing' ? reverseVideoRef.current : forwardVideoRef.current
      syncScreenToVideo(activeVideo)
    }

    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [syncScreenToCloseFrame, syncScreenToVideo])

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
        <div className="close-frame-layer">
          <img ref={closeFrameRef} className="close-frame-image" src={CLOSE_FRAME_URL} alt="" />
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
            {phase === 'locked' || phase === 'enteringLock' ? (
              <button type="button" className="lock-open-button" aria-disabled={phase !== 'locked'} onClick={openDesktop}>
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

function getImageFrame(image: HTMLImageElement) {
  const rect = image.getBoundingClientRect()
  const sourceWidth = image.naturalWidth || CLOSE_FRAME_WIDTH
  const sourceHeight = image.naturalHeight || CLOSE_FRAME_HEIGHT

  if (!sourceWidth || !sourceHeight || !rect.width || !rect.height) {
    return null
  }

  return {
    height: rect.height,
    left: rect.left,
    top: rect.top,
    width: rect.width,
  }
}

function getCloseFrameTargetFrame(image: HTMLImageElement) {
  const parent = image.parentElement
  if (!parent) {
    return getImageFrame(image)
  }

  const measuringImage = image.cloneNode(false) as HTMLImageElement
  measuringImage.style.transition = 'none'
  measuringImage.style.transform = `translate(-50%, -50%) scale(${getCloseFrameTargetScale()})`
  measuringImage.style.visibility = 'hidden'
  measuringImage.style.pointerEvents = 'none'
  parent.appendChild(measuringImage)
  const frame = getImageFrame(measuringImage)
  measuringImage.remove()

  return frame
}

function getCloseFrameTargetScale() {
  return isMobileViewport() ? CLOSE_FRAME_MOBILE_SCALE : CLOSE_FRAME_DESKTOP_SCALE
}
