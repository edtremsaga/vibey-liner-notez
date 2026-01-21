/**
 * Debug logging utility
 * Only logs in development mode
 */

const isDev = import.meta.env.DEV

export const debugLog = (...args) => {
  if (isDev) {
    console.log(...args)
  }
}

export const debugWarn = (...args) => {
  if (isDev) {
    console.warn(...args)
  }
}

// Error logging always works (for production debugging)
export const debugError = (...args) => {
  console.error(...args)
}
