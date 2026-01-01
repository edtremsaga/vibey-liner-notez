import AlbumPage from './pages/AlbumPage'
import './App.css'

function App() {
  try {
    return <AlbumPage />
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
