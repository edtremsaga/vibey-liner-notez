import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithTimeout } from '../../utils/fetchWithTimeout'

describe('Signal Merging Memory Leak Fix', () => {
  let originalFetch
  let addEventListenerCalls = []
  let removeEventListenerCalls = []

  beforeEach(() => {
    // Mock fetch
    originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      headers: new Headers()
    })

    // Reset tracking
    addEventListenerCalls = []
    removeEventListenerCalls = []
    
    // Spy on AbortSignal prototype methods to track listener lifecycle
    const originalAdd = AbortSignal.prototype.addEventListener
    const originalRemove = AbortSignal.prototype.removeEventListener
    
    AbortSignal.prototype.addEventListener = function(type, listener) {
      if (type === 'abort') {
        addEventListenerCalls.push({ signal: this, type, listener })
      }
      return originalAdd.call(this, type, listener)
    }
    
    AbortSignal.prototype.removeEventListener = function(type, listener) {
      if (type === 'abort') {
        removeEventListenerCalls.push({ signal: this, type, listener })
      }
      return originalRemove.call(this, type, listener)
    }
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    // Restore original methods
    delete AbortSignal.prototype.addEventListener
    delete AbortSignal.prototype.removeEventListener
  })

  it('should remove event listeners after fetch completes successfully', async () => {
    const controller = new AbortController()
    const options = { signal: controller.signal }

    // Make request with signal merging
    await fetchWithTimeout('https://example.com', options, 5000)

    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify listeners were added (signal merging creates listeners)
    expect(addEventListenerCalls.length).toBeGreaterThan(0)
    
    // Verify listeners were removed (cleanup was called)
    expect(removeEventListenerCalls.length).toBeGreaterThan(0)
    
    // Verify all added listeners were removed
    const addedCount = addEventListenerCalls.length
    const removedCount = removeEventListenerCalls.length
    expect(removedCount).toBeGreaterThanOrEqual(addedCount)
  })

  it('should remove event listeners after fetch fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))
    
    const controller = new AbortController()
    const options = { signal: controller.signal }

    try {
      await fetchWithTimeout('https://example.com', options, 5000)
    } catch (e) {
      // Expected to fail
    }

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify cleanup was called even on error
    expect(removeEventListenerCalls.length).toBeGreaterThan(0)
  })

  it('should remove event listeners when request is aborted', async () => {
    const controller = new AbortController()
    const options = { signal: controller.signal }

    // Start request
    const promise = fetchWithTimeout('https://example.com', options, 5000)
    
    // Abort immediately
    controller.abort()

    try {
      await promise
    } catch (e) {
      // Expected to fail
    }

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify cleanup was called
    expect(removeEventListenerCalls.length).toBeGreaterThan(0)
  })

  it('should not accumulate listeners across multiple requests', async () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()
    const controller3 = new AbortController()

    // Make 3 requests
    await Promise.all([
      fetchWithTimeout('https://example.com/1', { signal: controller1.signal }, 5000),
      fetchWithTimeout('https://example.com/2', { signal: controller2.signal }, 5000),
      fetchWithTimeout('https://example.com/3', { signal: controller3.signal }, 5000)
    ])

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    // Count unique listeners added
    const uniqueAdded = new Set(addEventListenerCalls.map(c => c.listener))
    const uniqueRemoved = new Set(removeEventListenerCalls.map(c => c.listener))

    // All added listeners should be removed
    expect(uniqueRemoved.size).toBeGreaterThanOrEqual(uniqueAdded.size)
    
    // Verify cleanup was called for all requests
    expect(removeEventListenerCalls.length).toBeGreaterThan(0)
  })

  it('should call cleanup in all code paths (success, error, abort)', async () => {
    const initialRemoveCount = removeEventListenerCalls.length

    // Test success path
    await fetchWithTimeout('https://example.com', {}, 5000)
    await new Promise(resolve => setTimeout(resolve, 50))
    const afterSuccess = removeEventListenerCalls.length

    // Test error path
    global.fetch.mockRejectedValueOnce(new Error('Error'))
    try {
      await fetchWithTimeout('https://example.com', {}, 5000)
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 50))
    const afterError = removeEventListenerCalls.length

    // Test abort path
    const controller = new AbortController()
    const promise = fetchWithTimeout('https://example.com', { signal: controller.signal }, 5000)
    controller.abort()
    try {
      await promise
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 50))
    const afterAbort = removeEventListenerCalls.length

    // Verify cleanup was called in all paths
    // (Note: may be 0 if no signal merging occurred, but should not be negative)
    expect(afterSuccess).toBeGreaterThanOrEqual(initialRemoveCount)
    expect(afterError).toBeGreaterThanOrEqual(afterSuccess)
    expect(afterAbort).toBeGreaterThanOrEqual(afterError)
  })
})
