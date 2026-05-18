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
type GreenBounds = { minX: number; minY: number; maxX: number; maxY: number }

export function LaptopIntro() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLImageElement | null>(null)
  const replacementCanvasRef = useRef<HTMLCanvasElement | null>(null)
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

  const renderScene = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return
    }

    const width = CANVAS_WIDTH
    const height = Math.round((width * video.videoHeight) / video.videoWidth)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      return
    }

    context.drawImage(video, 0, 0, width, height)

    const frame = context.getImageData(0, 0, width, height)
    const bounds = findGreenBounds(frame.data, width, height)
    if (!bounds) {
      return
    }

    const replacement = getReplacementCanvas(
      replacementCanvasRef,
      bounds.maxX - bounds.minX + 1,
      bounds.maxY - bounds.minY + 1,
      replacementModeRef.current,
      avatarRef.current,
      phaseRef.current !== 'locked',
    )
    const replacementContext = replacement.getContext('2d')
    if (!replacementContext) {
      return
    }

    const replacementFrame = replacementContext.getImageData(0, 0, replacement.width, replacement.height)
    replaceGreenScreen(frame.data, replacementFrame.data, width, bounds, replacement.width)
    context.putImageData(frame, 0, 0)
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

    syncScreenToVideo(video.duration || SCREEN_TRACK_POINTS[SCREEN_TRACK_POINTS.length - 1].time)
    setPhaseState('desktop')
    setScreenModeState('desktop')
  }, [setPhaseState, setScreenModeState, syncScreenToVideo])

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
        syncScreenToVideo(activeVideo.duration)
      }
      replacementModeRef.current = 'lock'
      setPhaseState('locked')
      setScreenModeState('lock')
      stopRenderLoop()
      renderScene()
    }

    activeVideo.addEventListener('ended', handleEnded)
    void loadScene()

    return () => {
      cancelled = true
      activeVideo.removeEventListener('ended', handleEnded)
      stopReverse()
      stopRenderLoop()
    }
  }, [playForward, renderScene, setPhaseState, setScreenModeState, stopRenderLoop, stopReverse, syncScreenToVideo])

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

function findGreenBounds(data: Uint8ClampedArray, width: number, height: number): GreenBounds | null {
  const mask = new Uint8Array(width * height)
  const visited = new Uint8Array(width * height)

  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4
    if (isGreenScreenPixel(data[offset], data[offset + 1], data[offset + 2])) {
      mask[index] = 1
    }
  }

  let bestBounds: GreenBounds | null = null
  let bestArea = 0
  const stack: number[] = []

  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index] || visited[index]) {
      continue
    }

    stack.length = 0
    stack.push(index)
    visited[index] = 1

    let area = 0
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    while (stack.length) {
      const current = stack.pop()
      if (current === undefined) {
        continue
      }

      const x = current % width
      const y = Math.floor(current / width)
      area += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)

      const left = current - 1
      const right = current + 1
      const up = current - width
      const down = current + width

      if (x > 0 && mask[left] && !visited[left]) {
        visited[left] = 1
        stack.push(left)
      }
      if (x < width - 1 && mask[right] && !visited[right]) {
        visited[right] = 1
        stack.push(right)
      }
      if (y > 0 && mask[up] && !visited[up]) {
        visited[up] = 1
        stack.push(up)
      }
      if (y < height - 1 && mask[down] && !visited[down]) {
        visited[down] = 1
        stack.push(down)
      }
    }

    if (area > bestArea) {
      bestArea = area
      bestBounds = { minX, minY, maxX, maxY }
    }
  }

  if (!bestBounds || bestArea < 900) {
    return null
  }

  return expandBounds(bestBounds, width, height, 8)
}

function replaceGreenScreen(
  data: Uint8ClampedArray,
  replacement: Uint8ClampedArray,
  width: number,
  bounds: GreenBounds,
  replacementWidth: number,
) {
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const index = (y * width + x) * 4
      const replacementIndex = ((y - bounds.minY) * replacementWidth + (x - bounds.minX)) * 4
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

function getReplacementCanvas(
  ref: MutableRefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  mode: ReplacementMode,
  avatar: HTMLImageElement | null,
  showOpenButton: boolean,
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

  drawReplacementScreen(context, width, height, mode, avatar, showOpenButton)
  return canvas
}

function drawReplacementScreen(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: ReplacementMode,
  avatar: HTMLImageElement | null,
  showOpenButton: boolean,
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

  if (showOpenButton) {
    drawOpenButton(context, centerX, height * 0.72, Math.max(74, width * 0.28), Math.max(28, height * 0.11))
  }
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

function drawOpenButton(context: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number) {
  const x = centerX - width / 2
  const y = centerY - height / 2
  const radius = Math.min(12, height / 2)

  context.fillStyle = 'rgba(255, 255, 255, 0.1)'
  context.strokeStyle = 'rgba(255, 255, 255, 0.24)'
  context.lineWidth = 1
  roundRect(context, x, y, width, height, radius)
  context.fill()
  context.stroke()

  context.fillStyle = '#f8faf7'
  context.font = `700 ${Math.max(12, height * 0.42)}px Inter, Arial, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('Open', centerX, centerY + 1)
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

function expandBounds(bounds: GreenBounds, width: number, height: number, amount: number): GreenBounds {
  return {
    minX: Math.max(0, bounds.minX - amount),
    minY: Math.max(0, bounds.minY - amount),
    maxX: Math.min(width - 1, bounds.maxX + amount),
    maxY: Math.min(height - 1, bounds.maxY + amount),
  }
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
