import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { profile } from '../data/portfolio'

export function BerniRushFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!loaded) {
        setShowFallback(true)
      }
    }, 6500)

    return () => window.clearTimeout(timeout)
  }, [loaded])

  return (
    <div className="berni-frame-shell">
      {!loaded ? (
        <div className="game-loader">
          <span />
          <strong>Loading Berni Rush</strong>
        </div>
      ) : null}
      <iframe
        ref={frameRef}
        title="Berni Rush"
        src={profile.berniRushUrl}
        onLoad={() => {
          setLoaded(true)
          frameRef.current?.focus()
        }}
        allow="fullscreen; gamepad"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
      />
      {showFallback && !loaded ? (
        <a className="game-fallback-link" href={profile.berniRushUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          Open in new tab
        </a>
      ) : null}
    </div>
  )
}
