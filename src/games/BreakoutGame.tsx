import { useEffect, useRef, useState } from 'react'
import { usePortfolioLanguage } from '../i18n'

const width = 720
const height = 384
const paddleWidth = 96

export function BreakoutGame() {
  const { lang } = usePortfolioLanguage()
  const isPl = lang === 'pl'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)
  const paddleX = useRef(width / 2 - paddleWidth / 2)
  const input = useRef({ left: false, right: false })
  const ball = useRef({ x: width / 2, y: height - 74, vx: 3.2, vy: -3.7 })
  const bricks = useRef(
    Array.from({ length: 35 }, (_, index) => ({
      x: 58 + (index % 7) * 88,
      y: 48 + Math.floor(index / 7) * 28,
      alive: true,
    })),
  )
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return
    }

    function reset() {
      ball.current = { x: width / 2, y: height - 74, vx: 3.2, vy: -3.7 }
      paddleX.current = width / 2 - paddleWidth / 2
    }

    function draw() {
      if (!context) {
        return
      }

      context.fillStyle = '#07100e'
      context.fillRect(0, 0, width, height)

      bricks.current.forEach((brick, index) => {
        if (!brick.alive) {
          return
        }
        context.fillStyle = index % 2 === 0 ? '#56f5a7' : '#ffcf6b'
        context.fillRect(brick.x, brick.y, 70, 15)
      })

      context.fillStyle = '#d6ffe7'
      context.fillRect(paddleX.current, height - 34, paddleWidth, 12)
      context.fillStyle = '#ffffff'
      context.beginPath()
      context.arc(ball.current.x, ball.current.y, 7, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = 'rgba(214, 255, 231, 0.72)'
      context.font = '22px ui-monospace, SFMono-Regular, Menlo, monospace'
      context.fillText(`${isPl ? 'wynik' : 'score'} ${score}`, 24, 28)
    }

    function step() {
      if (input.current.left) {
        paddleX.current = Math.max(12, paddleX.current - 7)
      }
      if (input.current.right) {
        paddleX.current = Math.min(width - paddleWidth - 12, paddleX.current + 7)
      }

      ball.current.x += ball.current.vx
      ball.current.y += ball.current.vy

      if (ball.current.x < 10 || ball.current.x > width - 10) {
        ball.current.vx *= -1
      }
      if (ball.current.y < 12) {
        ball.current.vy *= -1
      }

      const hitPaddle =
        ball.current.y > height - 48 &&
        ball.current.x >= paddleX.current &&
        ball.current.x <= paddleX.current + paddleWidth

      if (hitPaddle) {
        ball.current.vy = -Math.abs(ball.current.vy)
        const offset = (ball.current.x - (paddleX.current + paddleWidth / 2)) / (paddleWidth / 2)
        ball.current.vx = offset * 4.2
      }

      bricks.current.forEach((brick) => {
        if (
          brick.alive &&
          ball.current.x >= brick.x &&
          ball.current.x <= brick.x + 70 &&
          ball.current.y >= brick.y &&
          ball.current.y <= brick.y + 15
        ) {
          brick.alive = false
          ball.current.vy *= -1
          setScore((current) => current + 5)
        }
      })

      if (ball.current.y > height + 20 || bricks.current.every((brick) => !brick.alive)) {
        if (bricks.current.every((brick) => !brick.alive)) {
          bricks.current = bricks.current.map((brick) => ({ ...brick, alive: true }))
        }
        reset()
      }

      draw()
      frameRef.current = window.requestAnimationFrame(step)
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        input.current.left = true
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        input.current.right = true
      }
    }

    function handleKeyUp(event: globalThis.KeyboardEvent) {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        input.current.left = false
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        input.current.right = false
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
  }, [isPl, score])

  function setTouchInput(direction: 'left' | 'right', pressed: boolean) {
    input.current[direction] = pressed
  }

  return (
    <div className="game-shell">
      <div className="game-meta">
        <span>{isPl ? 'wynik' : 'score'} {score}</span>
        <span>{isPl ? 'A/D albo strzałki' : 'A/D or arrows'}</span>
      </div>
      <canvas ref={canvasRef} width={width} height={height} aria-label="Breakout game" />
      <div className="game-controls game-controls-two" aria-label="Breakout touch controls">
        <button
          type="button"
          onPointerDown={() => setTouchInput('left', true)}
          onPointerUp={() => setTouchInput('left', false)}
          onPointerLeave={() => setTouchInput('left', false)}
        >
          {isPl ? 'lewo' : 'left'}
        </button>
        <button
          type="button"
          onPointerDown={() => setTouchInput('right', true)}
          onPointerUp={() => setTouchInput('right', false)}
          onPointerLeave={() => setTouchInput('right', false)}
        >
          {isPl ? 'prawo' : 'right'}
        </button>
      </div>
    </div>
  )
}
