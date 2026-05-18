import { useCallback, useEffect, useRef, useState } from 'react'
import { profile } from '../data/portfolio'
import { MacDesktop } from './MacDesktop'

const INTRO_VIDEO_URL = '/videos/macbook-work-scene.mp4'
const REVERSE_VIDEO_URL = '/videos/macbook-work-scene-reverse-off.mp4'
const AVATAR_URL = '/images/github-avatar.png'
const WALLPAPER_URL = '/images/macbook-wallpaper.png'
const ANALYSIS_WIDTH = 1280
const MIN_LOADER_TIME = 450
const SCREEN_TRACK_POINTS = [
  { time: 3.78, top: 38.15, left: 38.2, width: 22.6, height: 28.15 },
  { time: 4.1, top: 31.1, left: 35.35, width: 27.8, height: 35.1 },
  { time: 4.45, top: 23.9, left: 32.15, width: 33.6, height: 42.35 },
  { time: 4.75, top: 17.8, left: 29.6, width: 38.85, height: 48.6 },
  { time: 5.04, top: 14.92, left: 27.34, width: 42.42, height: 52.12 },
]

type ScenePhase = 'loading' | 'intro' | 'locked' | 'desktop' | 'reversing'
type ScreenMode = 'hidden' | 'lock' | 'desktop' | 'off'
type ScreenTrackPoint = (typeof SCREEN_TRACK_POINTS)[number]
type ScreenBounds = { minX: number; minY: number; maxX: number; maxY: number }
type ScreenSpan = { y: number; minX: number; maxX: number }
type ScreenMask = {
  bounds: ScreenBounds
  coverClipPath: string
  uiClipPath: string
}

export function LaptopIntro() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const lastMaskRef = useRef<ScreenMask | null>(null)
  const frameRef = useRef<number | null>(null)
  const sourceRef = useRef(INTRO_VIDEO_URL)
  const phaseRef = useRef<ScenePhase>('loading')
  const screenModeRef = useRef<ScreenMode>('hidden')
  const [phase, setPhase] = useState<ScenePhase>('loading')
  const [screenMode, setScreenMode] = useState<ScreenMode>('hidden')
  const [videoSource, setVideoSource] = useState(INTRO_VIDEO_URL)

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
    screen.style.setProperty('--screen-clip', 'inset(0)')
    screen.style.setProperty('--screen-ui-clip', 'inset(3% 2.5% 4% 2.5%)')
  }, [])

  const syncScreenToMask = useCallback((mask: ScreenMask | null) => {
    const screen = screenRef.current
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!screen || !video || !canvas || !mask) {
      return false
    }

    const frame = getMediaCoverFrame(video, canvas.width, canvas.height)
    if (!frame) {
      return false
    }

    const { bounds } = mask
    const left = frame.left + bounds.minX * frame.scale
    const top = frame.top + bounds.minY * frame.scale
    const width = (bounds.maxX - bounds.minX + 1) * frame.scale
    const height = (bounds.maxY - bounds.minY + 1) * frame.scale

    screen.style.setProperty('--screen-top', `${top}px`)
    screen.style.setProperty('--screen-left', `${left}px`)
    screen.style.setProperty('--screen-width', `${width}px`)
    screen.style.setProperty('--screen-height', `${height}px`)
    screen.style.setProperty('--screen-clip', mask.coverClipPath)
    screen.style.setProperty('--screen-ui-clip', mask.uiClipPath)
    return true
  }, [])

  const syncScreenToLatestMask = useCallback(() => {
    const video = videoRef.current
    if (syncScreenToMask(lastMaskRef.current)) {
      return
    }

    syncScreenToVideo(video?.duration || SCREEN_TRACK_POINTS[SCREEN_TRACK_POINTS.length - 1].time)
  }, [syncScreenToMask, syncScreenToVideo])

  const analyzeScene = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return null
    }

    const width = ANALYSIS_WIDTH
    const height = Math.round((width * video.videoHeight) / video.videoWidth)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      return null
    }

    context.drawImage(video, 0, 0, width, height)
    const frame = context.getImageData(0, 0, width, height)
    const mask = findScreenMask(frame.data, width, height)
    if (!mask) {
      return null
    }

    lastMaskRef.current = mask
    syncScreenToMask(mask)

    if (phaseRef.current === 'intro' && screenModeRef.current === 'hidden') {
      setScreenModeState('lock')
    }

    return mask
  }, [setScreenModeState, syncScreenToMask])

  const stopFrameLoop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  const startFrameLoop = useCallback(() => {
    if (frameRef.current !== null) {
      return
    }

    function tick() {
      analyzeScene()

      if (phaseRef.current === 'intro' || phaseRef.current === 'reversing') {
        frameRef.current = window.requestAnimationFrame(tick)
        return
      }

      frameRef.current = null
    }

    frameRef.current = window.requestAnimationFrame(tick)
  }, [analyzeScene])

  const setPlaybackSource = useCallback(
    async (source: string) => {
      const video = videoRef.current
      if (!video) {
        return
      }

      if (sourceRef.current !== source) {
        sourceRef.current = source
        setVideoSource(source)
        video.src = source
        video.load()
      }

      await waitForVideoFrame(video)
    },
    [],
  )

  const playForward = useCallback(async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    stopFrameLoop()
    setPhaseState('intro')
    setScreenModeState('hidden')
    await setPlaybackSource(INTRO_VIDEO_URL)
    video.pause()
    video.playbackRate = 1
    video.currentTime = 0
    analyzeScene()

    try {
      await video.play()
      startFrameLoop()
    } catch {
      // Muted autoplay should start the cinematic scene; a user tap retries when the browser blocks it.
    }
  }, [analyzeScene, setPhaseState, setPlaybackSource, setScreenModeState, startFrameLoop, stopFrameLoop])

  const openDesktop = useCallback(() => {
    if (phaseRef.current !== 'locked') {
      return
    }

    syncScreenToLatestMask()
    setPhaseState('desktop')
    setScreenModeState('desktop')
  }, [setPhaseState, setScreenModeState, syncScreenToLatestMask])

  const resetAfterReverse = useCallback(async () => {
    const video = videoRef.current
    stopFrameLoop()
    setScreenModeState('hidden')
    setPhaseState('intro')
    lastMaskRef.current = null

    if (!video) {
      return
    }

    await setPlaybackSource(INTRO_VIDEO_URL)
    video.pause()
    video.currentTime = 0
    syncScreenToVideo(0)
  }, [setPhaseState, setPlaybackSource, setScreenModeState, stopFrameLoop, syncScreenToVideo])

  const reverseToStart = useCallback(async () => {
    const video = videoRef.current
    if (!video || phaseRef.current !== 'desktop') {
      return
    }

    stopFrameLoop()
    setPhaseState('reversing')
    setScreenModeState('off')
    await setPlaybackSource(REVERSE_VIDEO_URL)
    video.pause()
    video.playbackRate = 1
    video.currentTime = 0
    setScreenModeState('hidden')

    try {
      await video.play()
    } catch {
      void resetAfterReverse()
    }
  }, [resetAfterReverse, setPhaseState, setPlaybackSource, setScreenModeState, stopFrameLoop])

  useEffect(() => {
      const sceneVideo = videoRef.current
      if (!sceneVideo) {
        return
      }
      const activeVideo: HTMLVideoElement = sceneVideo

    let cancelled = false

    async function loadScene() {
      const avatar = new Image()
      const wallpaper = new Image()
      const reverseVideo = document.createElement('video')
      avatar.decoding = 'async'
      wallpaper.decoding = 'async'
      avatar.src = AVATAR_URL
      wallpaper.src = WALLPAPER_URL
      reverseVideo.muted = true
      reverseVideo.playsInline = true
      reverseVideo.preload = 'auto'
      reverseVideo.src = REVERSE_VIDEO_URL

      await Promise.all([
        waitForVideoFrame(activeVideo),
        waitForVideoFrame(reverseVideo),
        waitForImage(avatar),
        waitForImage(wallpaper),
        wait(MIN_LOADER_TIME),
      ])

      if (cancelled) {
        return
      }

      analyzeScene()
      void playForward()
    }

    function handleEnded() {
      if (phaseRef.current === 'reversing') {
        void resetAfterReverse()
        return
      }

      activeVideo.pause()
      if (Number.isFinite(activeVideo.duration)) {
        activeVideo.currentTime = Math.max(activeVideo.duration - 0.04, 0)
      }

      const mask = analyzeScene()
      if (!syncScreenToMask(mask)) {
        syncScreenToVideo(activeVideo.duration || SCREEN_TRACK_POINTS[SCREEN_TRACK_POINTS.length - 1].time)
      }
      setPhaseState('locked')
      setScreenModeState('lock')
      stopFrameLoop()
    }

    activeVideo.addEventListener('ended', handleEnded)
    void loadScene()

    return () => {
      cancelled = true
      activeVideo.removeEventListener('ended', handleEnded)
      stopFrameLoop()
    }
  }, [
    analyzeScene,
    playForward,
    resetAfterReverse,
    setPhaseState,
    setScreenModeState,
    stopFrameLoop,
    syncScreenToMask,
    syncScreenToVideo,
  ])

  useEffect(() => {
    function handleResize() {
      if (screenModeRef.current !== 'hidden') {
        syncScreenToLatestMask()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [syncScreenToLatestMask])

  function handleScenePointerDown() {
    const video = videoRef.current
    if (!video || phase !== 'intro' || video.currentTime > 0.08 || !video.paused) {
      return
    }

    void playForward()
  }

  const screenIsActive = screenMode !== 'hidden'
  const showOpen = screenMode === 'lock' && phase === 'locked'

  return (
    <section
      className={`intro-scene is-${phase} ${screenIsActive ? 'has-screen-ui' : ''}`}
      aria-label="Cinematic MacBook intro"
    >
      <div className="video-stage" onPointerDown={handleScenePointerDown} aria-hidden="true">
        <div className="video-layer">
          <video ref={videoRef} src={videoSource} muted playsInline preload="auto" />
          <canvas ref={canvasRef} />
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
            {showOpen ? (
              <button type="button" className="lock-open-button" onClick={openDesktop}>
                Open
              </button>
            ) : null}
          </div>
        ) : null}
        {screenMode === 'off' ? <div className="screen-content off-screen-content" /> : null}
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

function findScreenMask(data: Uint8ClampedArray, width: number, height: number): ScreenMask | null {
  const candidateMask = new Uint8Array(width * height)
  const strictMask = new Uint8Array(width * height)
  const visited = new Uint8Array(width * height)

  for (let index = 0; index < candidateMask.length; index += 1) {
    const offset = index * 4
    if (isGreenScreenPixel(data[offset], data[offset + 1], data[offset + 2])) {
      candidateMask[index] = 1
      strictMask[index] = 1
    } else if (isGreenScreenEdgePixel(data[offset], data[offset + 1], data[offset + 2])) {
      candidateMask[index] = 1
    }
  }

  let bestComponent: { bounds: ScreenBounds; spans: ScreenSpan[]; strictArea: number } | null = null
  const stack: number[] = []

  for (let index = 0; index < candidateMask.length; index += 1) {
    if (!candidateMask[index] || visited[index]) {
      continue
    }

    stack.length = 0
    stack.push(index)
    visited[index] = 1

    let strictArea = 0
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    const rowRanges = new Map<number, { minX: number; maxX: number }>()

    while (stack.length) {
      const current = stack.pop()
      if (current === undefined) {
        continue
      }

      const x = current % width
      const y = Math.floor(current / width)
      if (strictMask[current]) {
        strictArea += 1
      }
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      const row = rowRanges.get(y)
      if (row) {
        row.minX = Math.min(row.minX, x)
        row.maxX = Math.max(row.maxX, x)
      } else {
        rowRanges.set(y, { minX: x, maxX: x })
      }

      const left = current - 1
      const right = current + 1
      const up = current - width
      const down = current + width

      if (x > 0 && candidateMask[left] && !visited[left]) {
        visited[left] = 1
        stack.push(left)
      }
      if (x < width - 1 && candidateMask[right] && !visited[right]) {
        visited[right] = 1
        stack.push(right)
      }
      if (y > 0 && candidateMask[up] && !visited[up]) {
        visited[up] = 1
        stack.push(up)
      }
      if (y < height - 1 && candidateMask[down] && !visited[down]) {
        visited[down] = 1
        stack.push(down)
      }
    }

    if (strictArea > (bestComponent?.strictArea ?? 0)) {
      const spans = Array.from(rowRanges, ([y, range]) => ({ y, minX: range.minX, maxX: range.maxX })).sort(
        (a, b) => a.y - b.y,
      )
      bestComponent = { bounds: { minX, minY, maxX, maxY }, spans, strictArea }
    }
  }

  if (!bestComponent || bestComponent.strictArea < 900) {
    return null
  }

  const coverSpans = normalizeScreenSpans(bestComponent.spans, bestComponent.bounds, width, height)
  const coverBounds = getBoundsFromSpans(coverSpans)
  if (!coverBounds) {
    return null
  }

  const safeInset = clamp(Math.round((coverBounds.maxX - coverBounds.minX) * 0.018), 4, 14)
  const uiSpans = coverSpans
    .map((span) => ({
      y: span.y,
      minX: span.minX + safeInset,
      maxX: span.maxX - safeInset,
    }))
    .filter((span) => span.maxX > span.minX)

  return {
    bounds: coverBounds,
    coverClipPath: 'inset(0)',
    uiClipPath: getScreenClipPath(uiSpans, coverBounds),
  }
}

function isGreenScreenPixel(red: number, green: number, blue: number) {
  const maxOtherChannel = Math.max(red, blue)
  return green > 118 && green - maxOtherChannel > 38 && green > red * 1.22 && green > blue * 1.18
}

function isGreenScreenEdgePixel(red: number, green: number, blue: number) {
  const maxOtherChannel = Math.max(red, blue)
  return green > 42 && green - maxOtherChannel > 7 && green > red * 1.06 && green > blue * 1.06
}

function normalizeScreenSpans(rawSpans: ScreenSpan[], bounds: ScreenBounds, canvasWidth: number, canvasHeight: number) {
  const spansByY = new Map(rawSpans.map((span) => [span.y, span]))
  const normalized: ScreenSpan[] = []
  const maskHeight = bounds.maxY - bounds.minY + 1
  const verticalBleed = clamp(Math.round(maskHeight * 0.012), 3, 8)
  const firstY = clamp(bounds.minY - verticalBleed, 0, canvasHeight - 1)
  const lastY = clamp(bounds.maxY + verticalBleed, 0, canvasHeight - 1)

  for (let y = firstY; y <= lastY; y += 1) {
    const span = spansByY.get(y) ?? interpolateMissingSpan(y, spansByY, bounds.minY, bounds.maxY)
    if (!span) {
      continue
    }

    const spanWidth = span.maxX - span.minX + 1
    const edgeBleed = clamp(Math.round(spanWidth * 0.008), 2, 6)
    normalized.push({
      y,
      minX: clamp(span.minX - edgeBleed, 0, canvasWidth - 1),
      maxX: clamp(span.maxX + edgeBleed, 0, canvasWidth - 1),
    })
  }

  return normalized
}

function interpolateMissingSpan(y: number, spansByY: Map<number, ScreenSpan>, minY: number, maxY: number) {
  let previous = y - 1
  while (previous >= minY && !spansByY.has(previous)) {
    previous -= 1
  }

  let next = y + 1
  while (next <= maxY && !spansByY.has(next)) {
    next += 1
  }

  const previousSpan = spansByY.get(previous)
  const nextSpan = spansByY.get(next)

  if (previousSpan && nextSpan) {
    const progress = (y - previous) / (next - previous)
    return {
      y,
      minX: Math.round(interpolate(previousSpan.minX, nextSpan.minX, progress)),
      maxX: Math.round(interpolate(previousSpan.maxX, nextSpan.maxX, progress)),
    }
  }

  if (previousSpan) {
    return { ...previousSpan, y }
  }

  if (nextSpan) {
    return { ...nextSpan, y }
  }

  return null
}

function getBoundsFromSpans(spans: ScreenSpan[]): ScreenBounds | null {
  if (!spans.length) {
    return null
  }

  return spans.reduce<ScreenBounds>(
    (bounds, span) => ({
      minX: Math.min(bounds.minX, span.minX),
      minY: Math.min(bounds.minY, span.y),
      maxX: Math.max(bounds.maxX, span.maxX),
      maxY: Math.max(bounds.maxY, span.y),
    }),
    { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: -1, maxY: -1 },
  )
}

function getScreenClipPath(spans: ScreenSpan[], bounds: ScreenBounds) {
  const sampleCount = Math.min(7, spans.length)
  const top = getAverageSpan(spans.slice(0, sampleCount))
  const bottom = getAverageSpan(spans.slice(-sampleCount))
  const width = Math.max(bounds.maxX - bounds.minX, 1)
  const height = Math.max(bounds.maxY - bounds.minY, 1)
  const point = (x: number, y: number) =>
    `${formatPercent(((x - bounds.minX) / width) * 100)} ${formatPercent(((y - bounds.minY) / height) * 100)}`

  return `polygon(${point(top.minX, top.y)}, ${point(top.maxX, top.y)}, ${point(bottom.maxX, bottom.y)}, ${point(
    bottom.minX,
    bottom.y,
  )})`
}

function getAverageSpan(spans: ScreenSpan[]) {
  const total = spans.reduce(
    (sum, span) => ({
      y: sum.y + span.y,
      minX: sum.minX + span.minX,
      maxX: sum.maxX + span.maxX,
    }),
    { y: 0, minX: 0, maxX: 0 },
  )

  return {
    y: total.y / spans.length,
    minX: total.minX / spans.length,
    maxX: total.maxX / spans.length,
  }
}

function getMediaCoverFrame(element: HTMLElement, sourceWidth: number, sourceHeight: number) {
  const rect = element.getBoundingClientRect()
  if (!sourceWidth || !sourceHeight || !rect.width || !rect.height) {
    return null
  }

  const scale = Math.max(rect.width / sourceWidth, rect.height / sourceHeight)
  const renderedWidth = sourceWidth * scale
  const renderedHeight = sourceHeight * scale

  return {
    left: rect.left + (rect.width - renderedWidth) / 2,
    top: rect.top + (rect.height - renderedHeight) / 2,
    scale,
  }
}

function formatPercent(value: number) {
  return `${clamp(Number(value.toFixed(2)), -8, 108)}%`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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
