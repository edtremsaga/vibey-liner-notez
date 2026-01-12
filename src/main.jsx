import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/theme.css'

// Set up global log capture for Chrome debug panel (must happen BEFORE any other console.log calls)
// This allows the debug panel to capture logs that happen before React components mount
if (typeof window !== 'undefined') {
  // Detect if we're on mobile
  const userAgent = navigator.userAgent || ''
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent)
  
  if (isMobile) {
    // Create global log store
    window.__chromeDebugLogs = window.__chromeDebugLogs || []
    
    // Override console methods to capture [History] logs
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    
    const captureLog = (level, args) => {
      // Check ALL arguments for [History]
      const allArgsString = args.map(arg => {
        if (typeof arg === 'string') return arg
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
      
      // Capture both [History] and [ChromeDebugPanel] logs
      if (allArgsString.includes('[History]') || allArgsString.includes('[ChromeDebugPanel]')) {
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2)
            } catch (e) {
              return String(arg)
            }
          }
          return String(arg)
        }).join(' ')
        
        window.__chromeDebugLogs.push({
          level,
          message,
          timestamp: new Date().toLocaleTimeString()
        })
        
        // Keep only last 200 logs
        if (window.__chromeDebugLogs.length > 200) {
          window.__chromeDebugLogs = window.__chromeDebugLogs.slice(-200)
        }
      }
    }
    
    console.log = (...args) => {
      originalLog.apply(console, args)
      captureLog('log', args)
    }
    
    console.warn = (...args) => {
      originalWarn.apply(console, args)
      captureLog('warn', args)
    }
    
    console.error = (...args) => {
      originalError.apply(console, args)
      captureLog('error', args)
    }
    
    // Log that capture is initialized
    console.log('[History] Global log capture initialized (early)')
  }
}

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
