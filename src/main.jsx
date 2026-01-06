import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/theme.css'

console.log('🚀 Starting liner notez app...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found!')
  throw new Error('Root element #root not found in HTML')
}

// Temporarily disable StrictMode to avoid double-render issues during debugging
ReactDOM.createRoot(rootElement).render(
  <App />
)
