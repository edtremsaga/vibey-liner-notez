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

    // Load logs from global store (captured early in main.jsx)
    if (window.__chromeDebugLogs && Array.isArray(window.__chromeDebugLogs)) {
      setLogs([...window.__chromeDebugLogs].slice(-maxLogs))
    }

    // Also continue capturing new logs (in case main.jsx didn't set it up)
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

      // Add to both local state and global store
      setLogs(prev => {
        const newLogs = [...prev, { level, message, timestamp: new Date().toLocaleTimeString() }]
        const trimmed = newLogs.slice(-maxLogs)
        
        // Also update global store
        if (window.__chromeDebugLogs) {
          window.__chromeDebugLogs.push({ level, message, timestamp: new Date().toLocaleTimeString() })
          if (window.__chromeDebugLogs.length > 200) {
            window.__chromeDebugLogs = window.__chromeDebugLogs.slice(-200)
          }
        }
        
        return trimmed
      })
    }

    // Only override if not already overridden by main.jsx
    // Check if console.log has been overridden (it will have __chromeDebugLogs in closure)
    if (!window.__chromeDebugLogs) {
      // Override console methods as fallback
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
    } else {
      // main.jsx already set up capture, just sync with existing logs
      // Set up a listener to sync new logs from global store
      const syncInterval = setInterval(() => {
        if (window.__chromeDebugLogs && Array.isArray(window.__chromeDebugLogs)) {
          setLogs(prev => {
            const globalLogs = window.__chromeDebugLogs.slice(-maxLogs)
            // Only update if there are new logs
            if (globalLogs.length !== prev.length || 
                (globalLogs.length > 0 && globalLogs[globalLogs.length - 1].timestamp !== prev[prev.length - 1]?.timestamp)) {
              return globalLogs
            }
            return prev
          })
        }
      }, 200) // Check every 200ms for new logs
      
      return () => clearInterval(syncInterval)
    }
  }, []) // Only run once on mount

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
