import './App.css'
import { LaptopIntro } from './components/LaptopIntro'
import { PortfolioLanguageProvider } from './i18n'

function App() {
  return (
    <PortfolioLanguageProvider>
      <main className="app">
        <LaptopIntro />
      </main>
    </PortfolioLanguageProvider>
  )
}

export default App
