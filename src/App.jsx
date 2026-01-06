import AlbumPage from './pages/AlbumPage'
import AppShell from './layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import './App.css'

function App() {
  // Placeholder header content
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)', fontWeight: 600, fontStyle: 'italic' }}>liner notez</h1>
    </div>
  )

  return (
    <ErrorBoundary>
      <AppShell header={header}>
        <AlbumPage />
      </AppShell>
      <Analytics />
    </ErrorBoundary>
  )
}

export default App
