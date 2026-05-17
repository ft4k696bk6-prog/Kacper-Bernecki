import { useEffect, useRef, useState } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right'
type Point = { x: number; y: number }

const columns = 24
const rows = 16
const cellSize = 24
const canvasWidth = columns * cellSize
const canvasHeight = rows * cellSize

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const directionRef = useRef<Direction>('right')
  const nextDirectionRef = useRef<Direction>('right')
  const snakeRef = useRef<Point[]>([
    { x: 7, y: 8 },
    { x: 6, y: 8 },
    { x: 5, y: 8 },
  ])
  const foodRef = useRef<Point>({ x: 16, y: 8 })
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('running')

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return
    }

    function draw() {
      if (!context) {
        return
      }

      context.fillStyle = '#07100e'
      context.fillRect(0, 0, canvasWidth, canvasHeight)
      context.strokeStyle = 'rgba(120, 255, 176, 0.08)'
      context.lineWidth = 1

      for (let x = 0; x <= columns; x += 1) {
        context.beginPath()
        context.moveTo(x * cellSize, 0)
        context.lineTo(x * cellSize, canvasHeight)
        context.stroke()
      }

      for (let y = 0; y <= rows; y += 1) {
        context.beginPath()
        context.moveTo(0, y * cellSize)
        context.lineTo(canvasWidth, y * cellSize)
        context.stroke()
      }

      context.fillStyle = '#ffcf6b'
      context.fillRect(foodRef.current.x * cellSize + 5, foodRef.current.y * cellSize + 5, 14, 14)

      snakeRef.current.forEach((part, index) => {
        context.fillStyle = index === 0 ? '#d6ffe7' : '#56f5a7'
        context.fillRect(part.x * cellSize + 3, part.y * cellSize + 3, 18, 18)
      })

      if (status === 'crashed') {
        context.fillStyle = 'rgba(7, 16, 14, 0.82)'
        context.fillRect(0, 0, canvasWidth, canvasHeight)
        context.fillStyle = '#ff6b6b'
        context.font = '24px ui-monospace, SFMono-Regular, Menlo, monospace'
        context.textAlign = 'center'
        context.fillText('CRASHED - PRESS RESET', canvasWidth / 2, canvasHeight / 2)
      }
    }

    function placeFood() {
      let nextFood: Point
      do {
        nextFood = {
          x: Math.floor(Math.random() * columns),
          y: Math.floor(Math.random() * rows),
        }
      } while (snakeRef.current.some((part) => part.x === nextFood.x && part.y === nextFood.y))
      foodRef.current = nextFood
    }

    function tick() {
      if (status === 'crashed') {
        draw()
        return
      }

      directionRef.current = nextDirectionRef.current
      const head = snakeRef.current[0]
      const nextHead = { ...head }

      if (directionRef.current === 'up') nextHead.y -= 1
      if (directionRef.current === 'down') nextHead.y += 1
      if (directionRef.current === 'left') nextHead.x -= 1
      if (directionRef.current === 'right') nextHead.x += 1

      const hitWall =
        nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= columns || nextHead.y >= rows
      const hitSelf = snakeRef.current.some((part) => part.x === nextHead.x && part.y === nextHead.y)

      if (hitWall || hitSelf) {
        setStatus('crashed')
        draw()
        return
      }

      snakeRef.current = [nextHead, ...snakeRef.current]

      if (nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y) {
        setScore((current) => current + 10)
        placeFood()
      } else {
        snakeRef.current.pop()
      }

      draw()
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'ArrowUp') changeDirection('up')
      if (event.key === 'ArrowDown') changeDirection('down')
      if (event.key === 'ArrowLeft') changeDirection('left')
      if (event.key === 'ArrowRight') changeDirection('right')
    }

    draw()
    const timer = window.setInterval(tick, 120)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [status])

  function changeDirection(direction: Direction) {
    const current = directionRef.current
    const blocked =
      (current === 'up' && direction === 'down') ||
      (current === 'down' && direction === 'up') ||
      (current === 'left' && direction === 'right') ||
      (current === 'right' && direction === 'left')

    if (!blocked) {
      nextDirectionRef.current = direction
    }
  }

  function reset() {
    snakeRef.current = [
      { x: 7, y: 8 },
      { x: 6, y: 8 },
      { x: 5, y: 8 },
    ]
    foodRef.current = { x: 16, y: 8 }
    directionRef.current = 'right'
    nextDirectionRef.current = 'right'
    setScore(0)
    setStatus('running')
  }

  return (
    <div className="game-shell">
      <div className="game-meta">
        <span>score {score}</span>
        <button type="button" onClick={reset}>
          reset
        </button>
      </div>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} aria-label="Snake game" />
      <div className="game-controls" aria-label="Snake touch controls">
        <button type="button" onClick={() => changeDirection('up')}>
          up
        </button>
        <button type="button" onClick={() => changeDirection('left')}>
          left
        </button>
        <button type="button" onClick={() => changeDirection('down')}>
          down
        </button>
        <button type="button" onClick={() => changeDirection('right')}>
          right
        </button>
      </div>
    </div>
  )
}
