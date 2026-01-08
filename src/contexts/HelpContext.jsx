import { createContext, useContext, useState } from 'react'

const HelpContext = createContext(null)

export function HelpProvider({ children }) {
  const [showHelp, setShowHelp] = useState(false)

  const openHelp = () => setShowHelp(true)
  const closeHelp = () => setShowHelp(false)

  return (
    <HelpContext.Provider value={{ showHelp, openHelp, closeHelp }}>
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp() {
  const context = useContext(HelpContext)
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider')
  }
  return context
}
