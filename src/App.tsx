import { useState } from 'react'
import './App.css'
import { LaptopIntro } from './components/LaptopIntro'
import { MacDesktop } from './components/MacDesktop'

function App() {
  const [entered, setEntered] = useState(false)

  return (
    <main className="app">
      {entered ? <MacDesktop /> : <LaptopIntro onComplete={() => setEntered(true)} />}
    </main>
  )
}

export default App
