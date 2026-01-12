/**
 * Fetch with timeout and AbortController support
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options (can include signal for AbortController)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Response>} - Fetch response
 */
export function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  // Merge signals if both exist
  let cleanupListeners = null
  const signal = options.signal 
    ? (() => {
        // If both signals exist, abort when either aborts
        const combinedController = new AbortController()
        const abort = () => combinedController.abort()
        controller.signal.addEventListener('abort', abort)
        options.signal.addEventListener('abort', abort)
        // Store cleanup function to remove listeners
        cleanupListeners = () => {
          controller.signal.removeEventListener('abort', abort)
          options.signal.removeEventListener('abort', abort)
        }
        return combinedController.signal
      })()
    : controller.signal
  
  const cleanup = () => {
    clearTimeout(timeoutId)
    if (cleanupListeners) cleanupListeners()
  }
  
  return fetch(url, { ...options, signal })
    .then(response => {
      cleanup()
      return response
    })
    .catch(error => {
      cleanup()
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`)
      }
      throw error
    })
}

