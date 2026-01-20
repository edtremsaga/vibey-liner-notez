import { useState, useEffect } from 'react'
import AlbumPage from './pages/AlbumPage'
import AppShell from './layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import { HelpProvider, useHelp } from './contexts/HelpContext'
import './App.css'

// Test commit to verify Vercel auto-deployment with correct email - 2025-01-07

function AppHeader() {
  const { openHelp } = useHelp()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: isMobile ? 'space-between' : 'flex-start',
      width: '100%'
    }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)', fontWeight: 600, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span>liner notez</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 400, fontStyle: 'normal' }}>
          by Vibey Craft
        </span>
      </h1>
      {isMobile && (
        <button
          onClick={openHelp}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted2)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: '0.5rem',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--muted2)'}
        >
          Help
        </button>
      )}
    </div>
  )
}

function App() {
  const header = <AppHeader />

  return (
    <ErrorBoundary>
      <HelpProvider>
        <AppShell header={header}>
          <AlbumPage />
        </AppShell>
        <Analytics /> {/* Vercel Analytics tracking */}
      </HelpProvider>
    </ErrorBoundary>
  )
}

export default App
