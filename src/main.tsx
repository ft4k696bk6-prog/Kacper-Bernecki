import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initGoogleAnalytics } from './lib/google-analytics'
import './index.css'
import App from './App.tsx'

initGoogleAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID, import.meta.env.VITE_GOOGLE_TAG_ID)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
