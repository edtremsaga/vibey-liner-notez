import AlbumPage from './pages/AlbumPage'
import AppShell from './layout/AppShell'
import './App.css'

function App() {
  try {
    // Placeholder header content
    const header = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)', fontWeight: 600 }}>liner notez</h1>
      </div>
    )

    return (
      <AppShell header={header}>
        <AlbumPage />
      </AppShell>
    )
  } catch (error) {
    console.error('Error rendering App:', error)
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1 style={{ color: '#c33' }}>Error Rendering App</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    )
  }
}

export default App
