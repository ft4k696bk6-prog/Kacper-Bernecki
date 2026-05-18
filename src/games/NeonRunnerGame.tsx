import { useEffect, useRef, useState } from 'react'

const width = 720
const height = 384
const groundY = 318

type Obstacle = { x: number; width: number; height: number; scored: boolean }
type RunnerStatus = 'ready' | 'running' | 'crashed'

export function NeonRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)
  const playerRef = useRef({ y: groundY - 46, vy: 0 })
  const obstaclesRef = useRef<Obstacle[]>([])
  const distanceRef = useRef(0)
  const spawnRef = useRef(0)
  const statusRef = useRef<RunnerStatus>('ready')
  const scoreRef = useRef(0)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState<RunnerStatus>('ready')

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return
    }

    function setRunnerStatus(nextStatus: RunnerStatus) {
      statusRef.current = nextStatus
      setStatus(nextStatus)
    }

    function jump() {
      if (statusRef.current === 'crashed') {
        reset()
        return
      }

      if (statusRef.current === 'ready') {
        setRunnerStatus('running')
      }

      if (playerRef.current.y >= groundY - 47) {
        playerRef.current.vy = -11.8
      }
    }

    function reset() {
      playerRef.current = { y: groundY - 46, vy: 0 }
      obstaclesRef.current = []
      distanceRef.current = 0
      spawnRef.current = 0
      scoreRef.current = 0
      setScore(0)
      setRunnerStatus('ready')
    }

    function draw() {
      if (!context) {
        return
      }

      context.fillStyle = '#05090e'
      context.fillRect(0, 0, width, height)

      const gradient = context.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, 'rgba(39, 198, 255, 0.18)')
      gradient.addColorStop(0.52, 'rgba(12, 22, 27, 0.1)')
      gradient.addColorStop(1, 'rgba(255, 207, 107, 0.12)')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)

      context.strokeStyle = 'rgba(119, 235, 255, 0.18)'
      context.lineWidth = 1
      for (let x = -((distanceRef.current * 2) % 48); x < width; x += 48) {
        context.beginPath()
        context.moveTo(x, groundY)
        context.lineTo(x + 38, height)
        context.stroke()
      }

      context.strokeStyle = 'rgba(255, 207, 107, 0.6)'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(0, groundY)
      context.lineTo(width, groundY)
      context.stroke()

      context.fillStyle = '#f7efe1'
      context.shadowColor = 'rgba(119, 235, 255, 0.65)'
      context.shadowBlur = 14
      context.fillRect(86, playerRef.current.y, 34, 46)
      context.shadowBlur = 0

      obstaclesRef.current.forEach((obstacle) => {
        context.fillStyle = '#ffcf6b'
        context.shadowColor = 'rgba(255, 207, 107, 0.65)'
        context.shadowBlur = 12
        context.fillRect(obstacle.x, groundY - obstacle.height, obstacle.width, obstacle.height)
        context.shadowBlur = 0
      })

      context.fillStyle = 'rgba(247, 239, 225, 0.82)'
      context.font = '22px ui-monospace, SFMono-Regular, Menlo, monospace'
      context.fillText(`score ${scoreRef.current}`, 24, 34)

      if (statusRef.current === 'ready' || statusRef.current === 'crashed') {
        context.fillStyle = 'rgba(5, 9, 14, 0.78)'
        context.fillRect(0, 0, width, height)
        context.fillStyle = '#ffcf6b'
        context.font = '28px ui-monospace, SFMono-Regular, Menlo, monospace'
        context.textAlign = 'center'
        context.fillText(
          statusRef.current === 'ready' ? 'TAP / SPACE TO START' : 'CRASHED - TAP TO RESET',
          width / 2,
          height / 2,
        )
        context.textAlign = 'left'
      }
    }

    function crash() {
      setRunnerStatus('crashed')
    }

    function step() {
      if (statusRef.current === 'running') {
        distanceRef.current += 1
        spawnRef.current += 1
        playerRef.current.vy += 0.58
        playerRef.current.y = Math.min(groundY - 46, playerRef.current.y + playerRef.current.vy)

        if (spawnRef.current > 78 + Math.random() * 52) {
          spawnRef.current = 0
          obstaclesRef.current.push({
            x: width + 24,
            width: 24 + Math.random() * 18,
            height: 34 + Math.random() * 34,
            scored: false,
          })
        }

        obstaclesRef.current = obstaclesRef.current
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - 6.4 - Math.min(distanceRef.current / 520, 3.2) }))
          .filter((obstacle) => obstacle.x > -80)

        obstaclesRef.current.forEach((obstacle) => {
          const playerLeft = 86
          const playerRight = 120
          const playerBottom = playerRef.current.y + 46
          const obstacleLeft = obstacle.x
          const obstacleRight = obstacle.x + obstacle.width
          const obstacleTop = groundY - obstacle.height

          if (playerRight > obstacleLeft && playerLeft < obstacleRight && playerBottom > obstacleTop) {
            crash()
          }

          if (!obstacle.scored && obstacleRight < playerLeft) {
            obstacle.scored = true
            scoreRef.current += 10
            setScore(scoreRef.current)
          }
        })
      }

      draw()
      frameRef.current = window.requestAnimationFrame(step)
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.code === 'Space' || event.key === 'ArrowUp') {
        event.preventDefault()
        jump()
      }
    }

    canvas.addEventListener('pointerdown', jump)
    window.addEventListener('keydown', handleKeyDown)
    frameRef.current = window.requestAnimationFrame(step)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      canvas.removeEventListener('pointerdown', jump)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="game-shell neon-runner-shell">
      <div className="game-meta">
        <span>score {score}</span>
        <span>{status === 'ready' ? 'tap to start' : status === 'running' ? 'space / tap' : 'tap to reset'}</span>
      </div>
      <canvas ref={canvasRef} width={width} height={height} aria-label="Neon Runner game" />
    </div>
  )
}
