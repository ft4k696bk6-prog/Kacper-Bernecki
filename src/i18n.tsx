/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { portfolioContent } from './data/portfolio'
import type { AppLanguage, PortfolioCopy } from './data/portfolio'

type LanguageContextValue = {
  lang: AppLanguage
  setLang: (lang: AppLanguage) => void
  t: PortfolioCopy
}

const LANGUAGE_KEY = 'macbook-portfolio-lang'

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: portfolioContent.en,
})

export function PortfolioLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') {
      return 'en'
    }
    const stored = localStorage.getItem(LANGUAGE_KEY)
    return stored === 'en' || stored === 'pl' ? stored : 'en'
  })

  function setLang(next: AppLanguage) {
    setLangState(next)
    localStorage.setItem(LANGUAGE_KEY, next)
    document.documentElement.lang = next
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: portfolioContent[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function usePortfolioLanguage() {
  return useContext(LanguageContext)
}
