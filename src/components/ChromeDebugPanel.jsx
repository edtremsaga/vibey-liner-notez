import { useState, useEffect, useRef } from 'react'
import './ChromeDebugPanel.css'

/**
 * Chrome Debug Panel - Shows console logs on the page for Chrome on iPhone
 * where Safari Web Inspector doesn't show Chrome's console logs
 */
export default function ChromeDebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [logs, setLogs] = useState([])
  const [isChrome, setIsChrome] = useState(false)
  const logsEndRef = useRef(null)
  const maxLogs = 100 // Keep last 100 logs

  useEffect(() => {
    // Detect if we're on mobile (show panel on all mobile browsers for debugging)
    const userAgent = navigator.userAgent || ''
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent)
    
    // Check for Chrome (especially mobile Chrome)
    const isChromeMobile = /CriOS/.test(userAgent) || 
                          (/Chrome/.test(userAgent) && /Mobile/.test(userAgent)) ||
                          (/Chrome/.test(userAgent) && !/Safari/.test(userAgent) && /iPhone|iPad|iPod/.test(userAgent))
    
    // Show panel on mobile (for debugging) or Chrome specifically
    if (isMobile || isChromeMobile) {
      setIsChrome(true)
      // Auto-show on mobile for debugging
      setIsVisible(true)
    }

    // Override console.log to capture logs EARLY
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const addLog = (level, args) => {
      // Check ALL arguments for [History] - more robust
      const allArgsString = args.map(arg => {
        if (typeof arg === 'string') {
          return arg
        } else if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
      
      // Only capture logs that contain [History] anywhere in the message
      if (!allArgsString.includes('[History]')) {
        return
      }

      // Build the full message with better formatting
      const message = args.map((arg, index) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')

      setLogs(prev => {
        const newLogs = [...prev, { level, message, timestamp: new Date().toLocaleTimeString() }]
        return newLogs.slice(-maxLogs) // Keep last 100 logs
      })
    }

    // Override console methods
    console.log = (...args) => {
      originalLog.apply(console, args)
      addLog('log', args)
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      addLog('warn', args)
    }

    console.error = (...args) => {
      originalError.apply(console, args)
      addLog('error', args)
    }

    // Add a test log to verify capture is working
    console.log('[History] Debug panel initialized and ready to capture logs')

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  // Don't render if not mobile/Chrome (for debugging, show on all mobile)
  if (!isChrome) {
    return null
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        className="chrome-debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Toggle debug panel"
      >
        {isVisible ? '▼' : '▲'} Debug
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="chrome-debug-panel">
          <div className="chrome-debug-header">
            <h3>Chrome Debug Logs (History Events)</h3>
            <div className="chrome-debug-controls">
              <button onClick={() => setLogs([])}>Clear</button>
              <button onClick={() => setIsVisible(false)}>Close</button>
            </div>
          </div>
          <div className="chrome-debug-content">
            {logs.length === 0 ? (
              <div className="chrome-debug-empty">
                No [History] logs yet. Navigate the app to see history events.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`chrome-debug-log chrome-debug-log-${log.level}`}>
                  <span className="chrome-debug-time">{log.timestamp}</span>
                  <span className="chrome-debug-level">{log.level}</span>
                  <pre className="chrome-debug-message">{log.message}</pre>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  )
}
