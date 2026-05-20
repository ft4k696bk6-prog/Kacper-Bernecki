import { usePortfolioLanguage } from '../i18n'

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = usePortfolioLanguage()

  return (
    <div className={`language-toggle ${className}`} aria-label={t.ui.language}>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
        ENG
      </button>
      <button type="button" aria-pressed={lang === 'pl'} onClick={() => setLang('pl')}>
        PL
      </button>
    </div>
  )
}
