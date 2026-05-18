import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { profile } from '../data/portfolio'
import { MacDesktop } from './MacDesktop'

const INTRO_VIDEO_URL = '/videos/macbook-work-scene.mp4'
const AVATAR_URL = '/images/github-avatar.png'
const REVERSE_SPEED = 1.35
const CANVAS_WIDTH = 1280
const MIN_LOADER_TIME = 450
const SCREEN_TRACK_POINTS = [
  { time: 3.78, top: 38.15, left: 38.2, width: 22.6, height: 28.15 },
  { time: 4.1, top: 31.1, left: 35.35, width: 27.8, height: 35.1 },
  { time: 4.45, top: 23.9, left: 32.15, width: 33.6, height: 42.35 },
  { time: 4.75, top: 17.8, left: 29.6, width: 38.85, height: 48.6 },
  { time: 5.04, top: 14.92, left: 27.34, width: 42.42, height: 52.12 },
]

type ScenePhase = 'loading' | 'intro' | 'locked' | 'desktop' | 'reversing'
type ScreenMode = 'hidden' | 'lock' | 'desktop'
type ReplacementMode = 'lock' | 'off'
type ScreenTrackPoint = (typeof SCREEN_TRACK_POINTS)[number]
type ScreenBounds = { minX: number; minY: number; maxX: number; maxY: number }
type ScreenSpan = { y: number; minX: number; maxX: number }
type ScreenMask = { bounds: ScreenBounds; spans: ScreenSpan[]; clipPath: string }

export function LaptopIntro() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLImageElement | null>(null)
  const replacementCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastMaskRef = useRef<ScreenMask | null>(null)
  const renderFrameRef = useRef<number | null>(null)
  const reverseFrameRef = useRef<number | null>(null)
  const phaseRef = useRef<ScenePhase>('loading')
  const screenModeRef = useRef<ScreenMode>('hidden')
  const replacementModeRef = useRef<ReplacementMode>('lock')
  const [phase, setPhase] = useState<ScenePhase>('loading')
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

  const syncScreenToMask = useCallback((mask: ScreenMask | null) => {
    const screen = screenRef.current
    const canvas = canvasRef.current
    if (!screen || !canvas || !mask) {
      return false
    }

    const frame = getCanvasCoverFrame(canvas)
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
    screen.style.setProperty('--screen-clip', mask.clipPath)
    return true
  }, [])

  const syncScreenToLatestMask = useCallback(() => {
    const video = videoRef.current
    if (syncScreenToMask(lastMaskRef.current)) {
      return
    }

    syncScreenToVideo(video?.duration || SCREEN_TRACK_POINTS[SCREEN_TRACK_POINTS.length - 1].time)
  }, [syncScreenToMask, syncScreenToVideo])

  const renderScene = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return null
    }

    const width = CANVAS_WIDTH
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
    const replacement = getReplacementCanvas(
      replacementCanvasRef,
      mask.bounds.maxX - mask.bounds.minX + 1,
      mask.bounds.maxY - mask.bounds.minY + 1,
      replacementModeRef.current,
      avatarRef.current,
    )
    const replacementContext = replacement.getContext('2d')
    if (!replacementContext) {
      return mask
    }

    const replacementFrame = replacementContext.getImageData(0, 0, replacement.width, replacement.height)
    replaceGreenScreen(frame.data, replacementFrame.data, width, mask, replacement.width)
    context.putImageData(frame, 0, 0)
    return mask
  }, [])

  const stopRenderLoop = useCallback(() => {
    if (renderFrameRef.current !== null) {
      window.cancelAnimationFrame(renderFrameRef.current)
      renderFrameRef.current = null
    }
  }, [])

  const stopReverse = useCallback(() => {
    if (reverseFrameRef.current !== null) {
      window.cancelAnimationFrame(reverseFrameRef.current)
      reverseFrameRef.current = null
    }
  }, [])

  const startRenderLoop = useCallback(() => {
    if (renderFrameRef.current !== null) {
      return
    }

    function tick() {
      renderScene()

      if (phaseRef.current === 'intro' || phaseRef.current === 'reversing') {
        renderFrameRef.current = window.requestAnimationFrame(tick)
        return
      }

      renderFrameRef.current = null
    }

    renderFrameRef.current = window.requestAnimationFrame(tick)
  }, [renderScene])

  const playForward = useCallback(async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    stopReverse()
    stopRenderLoop()
    replacementModeRef.current = 'lock'
    setPhaseState('intro')
    setScreenModeState('hidden')
    video.pause()
    video.playbackRate = 1
    video.currentTime = 0
    renderScene()

    try {
      await video.play()
      startRenderLoop()
    } catch {
      // Muted autoplay should work; if it does not, the next user tap starts it.
    }
  }, [renderScene, setPhaseState, setScreenModeState, startRenderLoop, stopRenderLoop, stopReverse])

  const openDesktop = useCallback(() => {
    const video = videoRef.current
    if (!video || phaseRef.current !== 'locked') {
      return
    }

    syncScreenToLatestMask()
    setPhaseState('desktop')
    setScreenModeState('desktop')
  }, [setPhaseState, setScreenModeState, syncScreenToLatestMask])

  const reverseToStart = useCallback(() => {
    const video = videoRef.current
    if (!video || phaseRef.current !== 'desktop') {
      return
    }

    stopReverse()
    stopRenderLoop()
    replacementModeRef.current = 'off'
    setPhaseState('reversing')
    setScreenModeState('hidden')
    video.pause()

    const startTime = Math.min(video.currentTime || video.duration, Math.max(video.duration - 0.04, 0))
    video.currentTime = startTime
    renderScene()
    startRenderLoop()

    let previousFrame = performance.now()

    function step(now: number) {
      const currentVideo = videoRef.current
      if (!currentVideo) {
        return
      }

      const delta = (now - previousFrame) / 1000
      previousFrame = now
      currentVideo.currentTime = Math.max(0, currentVideo.currentTime - delta * REVERSE_SPEED)
      renderScene()

      if (currentVideo.currentTime <= 0.02) {
        currentVideo.currentTime = 0
        currentVideo.pause()
        reverseFrameRef.current = null
        stopRenderLoop()
        replacementModeRef.current = 'lock'
        renderScene()
        setPhaseState('intro')
        setScreenModeState('hidden')
        return
      }

      reverseFrameRef.current = window.requestAnimationFrame(step)
    }

    reverseFrameRef.current = window.requestAnimationFrame(step)
  }, [renderScene, setPhaseState, setScreenModeState, startRenderLoop, stopRenderLoop, stopReverse])

  useEffect(() => {
    const sceneVideo = videoRef.current
    if (!sceneVideo) {
      return
    }
    const activeVideo: HTMLVideoElement = sceneVideo

    let cancelled = false

    async function loadScene() {
      const avatar = new Image()
      avatar.decoding = 'async'
      avatar.src = AVATAR_URL

      await Promise.all([waitForVideoFrame(activeVideo), waitForImage(avatar), wait(MIN_LOADER_TIME)])

      if (cancelled) {
        return
      }

      avatarRef.current = avatar
      renderScene()
      void playForward()
    }

    function handleEnded() {
      activeVideo.pause()
      if (Number.isFinite(activeVideo.duration)) {
        activeVideo.currentTime = Math.max(activeVideo.duration - 0.04, 0)
      }
      replacementModeRef.current = 'lock'
      const mask = renderScene()
      if (!syncScreenToMask(mask)) {
        syncScreenToVideo(activeVideo.duration || SCREEN_TRACK_POINTS[SCREEN_TRACK_POINTS.length - 1].time)
      }
      setPhaseState('locked')
      setScreenModeState('lock')
      stopRenderLoop()
    }

    activeVideo.addEventListener('ended', handleEnded)
    void loadScene()

    return () => {
      cancelled = true
      activeVideo.removeEventListener('ended', handleEnded)
      stopReverse()
      stopRenderLoop()
    }
  }, [
    playForward,
    renderScene,
    setPhaseState,
    setScreenModeState,
    stopRenderLoop,
    stopReverse,
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

  return (
    <section
      className={`intro-scene is-${phase} ${screenIsActive ? 'has-screen-ui' : ''}`}
      aria-label="Cinematic MacBook intro"
    >
      <div className="video-stage" onPointerDown={handleScenePointerDown} aria-hidden="true">
        <div className="video-layer">
          <canvas ref={canvasRef} />
          <video ref={videoRef} src={INTRO_VIDEO_URL} muted playsInline preload="auto" />
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
          <button type="button" className="lock-open-button" onClick={openDesktop}>
            Open
          </button>
        ) : null}
        {screenMode === 'desktop' ? (
          <div className="mac-desktop-layer" aria-hidden={false}>
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

  const spans = normalizeScreenSpans(bestComponent.spans, bestComponent.bounds, width, height)
  const bounds = getBoundsFromSpans(spans)
  if (!bounds) {
    return null
  }

  return {
    bounds,
    spans,
    clipPath: getScreenClipPath(spans, bounds),
  }
}

function replaceGreenScreen(
  data: Uint8ClampedArray,
  replacement: Uint8ClampedArray,
  width: number,
  mask: ScreenMask,
  replacementWidth: number,
) {
  const { bounds, spans } = mask
  const replacementHeight = bounds.maxY - bounds.minY + 1

  for (const span of spans) {
    const rowWidth = Math.max(span.maxX - span.minX, 1)
    const replacementY = clamp(
      Math.round(((span.y - bounds.minY) / Math.max(replacementHeight - 1, 1)) * (replacementHeight - 1)),
      0,
      replacementHeight - 1,
    )

    for (let x = span.minX; x <= span.maxX; x += 1) {
      const index = (span.y * width + x) * 4
      const replacementX = clamp(Math.round(((x - span.minX) / rowWidth) * (replacementWidth - 1)), 0, replacementWidth - 1)
      const replacementIndex = (replacementY * replacementWidth + replacementX) * 4
      data[index] = replacement[replacementIndex]
      data[index + 1] = replacement[replacementIndex + 1]
      data[index + 2] = replacement[replacementIndex + 2]
      data[index + 3] = 255
    }
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

function getCanvasCoverFrame(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  if (!canvas.width || !canvas.height || !rect.width || !rect.height) {
    return null
  }

  const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height)
  const renderedWidth = canvas.width * scale
  const renderedHeight = canvas.height * scale

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

function getReplacementCanvas(
  ref: MutableRefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  mode: ReplacementMode,
  avatar: HTMLImageElement | null,
) {
  if (!ref.current) {
    ref.current = document.createElement('canvas')
  }

  const canvas = ref.current
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return canvas
  }

  drawReplacementScreen(context, width, height, mode, avatar)
  return canvas
}

function drawReplacementScreen(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: ReplacementMode,
  avatar: HTMLImageElement | null,
) {
  context.clearRect(0, 0, width, height)

  const wallpaper = context.createLinearGradient(0, 0, width, height)
  if (mode === 'off') {
    wallpaper.addColorStop(0, '#020202')
    wallpaper.addColorStop(0.62, '#050505')
    wallpaper.addColorStop(1, '#000000')
    context.fillStyle = wallpaper
    context.fillRect(0, 0, width, height)
    return
  }

  wallpaper.addColorStop(0, '#030405')
  wallpaper.addColorStop(0.48, '#101114')
  wallpaper.addColorStop(1, '#030303')
  context.fillStyle = wallpaper
  context.fillRect(0, 0, width, height)
  drawScreenNotch(context, width, height)

  const glow = context.createRadialGradient(width * 0.46, height * 0.32, 0, width * 0.46, height * 0.32, width * 0.52)
  glow.addColorStop(0, 'rgba(96, 108, 124, 0.2)')
  glow.addColorStop(0.45, 'rgba(24, 28, 31, 0.14)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)

  const avatarSize = Math.max(30, Math.min(width, height) * 0.18)
  const centerX = width / 2
  const avatarY = height * 0.33
  const textY = avatarY + avatarSize * 0.85

  drawAvatar(context, avatar, centerX, avatarY, avatarSize)

  context.fillStyle = '#f6f7f2'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `700 ${Math.max(13, height * 0.05)}px Inter, Arial, sans-serif`
  context.fillText(profile.name, centerX, textY)

  context.fillStyle = 'rgba(246, 247, 242, 0.66)'
  context.font = `500 ${Math.max(10, height * 0.035)}px Inter, Arial, sans-serif`
  context.fillText('Portfolio', centerX, textY + height * 0.07)

}

function drawAvatar(
  context: CanvasRenderingContext2D,
  avatar: HTMLImageElement | null,
  centerX: number,
  centerY: number,
  size: number,
) {
  context.save()
  context.beginPath()
  context.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
  context.clip()

  if (avatar?.complete && avatar.naturalWidth > 0) {
    context.drawImage(avatar, centerX - size / 2, centerY - size / 2, size, size)
  } else {
    const fallback = context.createLinearGradient(centerX - size / 2, centerY - size / 2, centerX + size / 2, centerY + size / 2)
    fallback.addColorStop(0, '#3a4149')
    fallback.addColorStop(1, '#080808')
    context.fillStyle = fallback
    context.fillRect(centerX - size / 2, centerY - size / 2, size, size)
    context.fillStyle = '#ffffff'
    context.font = `800 ${size * 0.34}px Inter, Arial, sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('KB', centerX, centerY)
  }

  context.restore()
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)'
  context.lineWidth = Math.max(1, size * 0.025)
  context.beginPath()
  context.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
  context.stroke()
}

function drawScreenNotch(context: CanvasRenderingContext2D, width: number, height: number) {
  const notchWidth = width * 0.16
  const notchHeight = Math.max(7, height * 0.045)
  const x = width / 2 - notchWidth / 2
  const y = -notchHeight * 0.18

  context.fillStyle = '#020202'
  roundRect(context, x, y, notchWidth, notchHeight, notchHeight * 0.36)
  context.fill()
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
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
