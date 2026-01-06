import './AppShell.css'

function AppShell({ header, children }) {
  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="app-header">
          {header}
        </div>
        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppShell

