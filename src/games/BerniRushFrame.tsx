import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { usePortfolioLanguage } from '../i18n'

export function BerniRushFrame() {
  const { t } = usePortfolioLanguage()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const url = t.profile.berniRushUrl

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
        src={url}
        onLoad={() => {
          setLoaded(true)
          frameRef.current?.focus()
        }}
        allow="fullscreen; gamepad"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
      />
      {showFallback && !loaded ? (
        <a className="game-fallback-link" href={url} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          {t.ui.actions.live}
        </a>
      ) : null}
    </div>
  )
}
