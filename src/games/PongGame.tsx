import { useEffect, useRef, useState } from 'react'

const width = 720
const height = 384
const paddleHeight = 74

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)
  const playerY = useRef(height / 2 - paddleHeight / 2)
  const aiY = useRef(height / 2 - paddleHeight / 2)
  const input = useRef({ up: false, down: false })
  const ball = useRef({ x: width / 2, y: height / 2, vx: 4.2, vy: 2.6 })
  const [score, setScore] = useState({ player: 0, ai: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return
    }

    function resetBall(direction: 1 | -1) {
      ball.current = {
        x: width / 2,
        y: height / 2,
        vx: 4.2 * direction,
        vy: (Math.random() > 0.5 ? 1 : -1) * 2.6,
      }
    }

    function draw() {
      if (!context) {
        return
      }

      context.fillStyle = '#07100e'
      context.fillRect(0, 0, width, height)
      context.strokeStyle = 'rgba(120, 255, 176, 0.16)'
      context.setLineDash([8, 10])
      context.beginPath()
      context.moveTo(width / 2, 0)
      context.lineTo(width / 2, height)
      context.stroke()
      context.setLineDash([])

      context.fillStyle = '#56f5a7'
      context.fillRect(24, aiY.current, 12, paddleHeight)
      context.fillStyle = '#d6ffe7'
      context.fillRect(width - 36, playerY.current, 12, paddleHeight)
      context.fillStyle = '#ffcf6b'
      context.fillRect(ball.current.x - 6, ball.current.y - 6, 12, 12)

      context.fillStyle = 'rgba(214, 255, 231, 0.68)'
      context.font = '24px ui-monospace, SFMono-Regular, Menlo, monospace'
      context.textAlign = 'center'
      context.fillText(`${score.ai} : ${score.player}`, width / 2, 34)
    }

    function step() {
      if (input.current.up) {
        playerY.current = Math.max(8, playerY.current - 6)
      }
      if (input.current.down) {
        playerY.current = Math.min(height - paddleHeight - 8, playerY.current + 6)
      }

      const aiTarget = ball.current.y - paddleHeight / 2
      aiY.current += (aiTarget - aiY.current) * 0.055
      aiY.current = Math.max(8, Math.min(height - paddleHeight - 8, aiY.current))

      ball.current.x += ball.current.vx
      ball.current.y += ball.current.vy

      if (ball.current.y < 12 || ball.current.y > height - 12) {
        ball.current.vy *= -1
      }

      const hitsAi =
        ball.current.x <= 42 &&
        ball.current.x >= 22 &&
        ball.current.y >= aiY.current &&
        ball.current.y <= aiY.current + paddleHeight
      const hitsPlayer =
        ball.current.x >= width - 42 &&
        ball.current.x <= width - 22 &&
        ball.current.y >= playerY.current &&
        ball.current.y <= playerY.current + paddleHeight

      if (hitsAi || hitsPlayer) {
        ball.current.vx *= -1.06
        ball.current.vy += (Math.random() - 0.5) * 0.9
      }

      if (ball.current.x < -20) {
        setScore((current) => ({ ...current, player: current.player + 1 }))
        resetBall(1)
      }

      if (ball.current.x > width + 20) {
        setScore((current) => ({ ...current, ai: current.ai + 1 }))
        resetBall(-1)
      }

      draw()
      frameRef.current = window.requestAnimationFrame(step)
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        input.current.up = true
      }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        input.current.down = true
      }
    }

    function handleKeyUp(event: globalThis.KeyboardEvent) {
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        input.current.up = false
      }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        input.current.down = false
      }
    }

    frameRef.current = window.requestAnimationFrame(step)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [score])

  function setTouchInput(direction: 'up' | 'down', pressed: boolean) {
    input.current[direction] = pressed
  }

  return (
    <div className="game-shell">
      <div className="game-meta">
        <span>
          ai {score.ai} / player {score.player}
        </span>
        <span>W/S or arrows</span>
      </div>
      <canvas ref={canvasRef} width={width} height={height} aria-label="Pong game" />
      <div className="game-controls game-controls-two" aria-label="Pong touch controls">
        <button
          type="button"
          onPointerDown={() => setTouchInput('up', true)}
          onPointerUp={() => setTouchInput('up', false)}
          onPointerLeave={() => setTouchInput('up', false)}
        >
          up
        </button>
        <button
          type="button"
          onPointerDown={() => setTouchInput('down', true)}
          onPointerUp={() => setTouchInput('down', false)}
          onPointerLeave={() => setTouchInput('down', false)}
        >
          down
        </button>
      </div>
    </div>
  )
}
