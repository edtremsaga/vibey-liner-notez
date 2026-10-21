const DEFAULT_MINIMUM_INTERVAL_MS = 1100
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_TIMEOUT_MS = 15000
const MAX_RETRY_DELAY_MS = 10000

function defaultSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Request aborted'))
      return
    }
    const handleTimeout = () => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }
    const timeoutId = setTimeout(handleTimeout, ms)
    const handleAbort = () => {
      clearTimeout(timeoutId)
      reject(new Error('Request aborted'))
    }
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function getRetryAfterMs(response, now, fallbackMs) {
  const retryAfter = response.headers?.get?.('retry-after')
  if (!retryAfter) return fallbackMs

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS)
  }

  const retryAt = Date.parse(retryAfter)
  if (Number.isNaN(retryAt)) return fallbackMs
  return Math.min(Math.max(retryAt - now(), 0), MAX_RETRY_DELAY_MS)
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController()
  const externalSignal = options.signal
  const handleExternalAbort = () => controller.abort()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  externalSignal?.addEventListener('abort', handleExternalAbort, { once: true })

  try {
    return await fetchImpl(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
    externalSignal?.removeEventListener('abort', handleExternalAbort)
  }
}

export function createMusicBrainzRequestClient({
  fetchImpl = (...args) => fetch(...args),
  now = () => Date.now(),
  sleep = defaultSleep,
  minimumIntervalMs = DEFAULT_MINIMUM_INTERVAL_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  let lastRequestAt = 0
  let requestQueue = Promise.resolve()

  async function execute(url, options) {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const elapsed = now() - lastRequestAt
      if (lastRequestAt > 0 && elapsed < minimumIntervalMs) {
        await sleep(minimumIntervalMs - elapsed, options.signal)
      }
      if (options.signal?.aborted) throw new Error('Request aborted')

      lastRequestAt = now()
      const response = await fetchWithTimeout(fetchImpl, url, options, timeoutMs)
      const shouldRetry = response.status === 429 || response.status === 503
      if (!shouldRetry || attempt === maxRetries) return response

      const fallbackMs = minimumIntervalMs * (2 ** attempt)
      await sleep(getRetryAfterMs(response, now, fallbackMs), options.signal)
    }
    throw new Error('MusicBrainz retry loop ended unexpectedly')
  }

  return function fetchMusicBrainzRequest(url, options = {}) {
    const request = requestQueue.then(
      () => execute(url, options),
      () => execute(url, options)
    )
    requestQueue = request.then(() => undefined, () => undefined)
    return request
  }
}

export const fetchMusicBrainzRequest = createMusicBrainzRequestClient()
