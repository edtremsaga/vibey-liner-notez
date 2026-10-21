import { describe, expect, it, vi } from 'vitest'
import { createMusicBrainzRequestClient as createWebClient } from '../musicbrainzRequest'
import { createMusicBrainzRequestClient as createIosClient } from '../../../apps/ios-liner-notez/src/services/musicbrainzRequest'

function response(status, retryAfter = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Service Unavailable',
    headers: {
      get: (name) => name.toLowerCase() === 'retry-after' ? retryAfter : null
    }
  }
}

describe.each([
  ['React', createWebClient],
  ['iOS', createIosClient]
])('%s MusicBrainz request client', (_name, createClient) => {
  it('retries 503 and 429 responses before succeeding', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(429))
      .mockResolvedValueOnce(response(200))
    let currentTime = 1000
    const sleep = vi.fn(async (ms) => {
      currentTime += ms
    })
    const client = createClient({
      fetchImpl,
      now: () => currentTime,
      sleep
    })

    const result = await client('https://musicbrainz.org/ws/2/release-group/example')

    expect(result.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([1100, 2200])
  })

  it('honors Retry-After and stops after two retries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(503, '3'))
    let currentTime = 1000
    const sleep = vi.fn(async (ms) => {
      currentTime += ms
    })
    const client = createClient({
      fetchImpl,
      now: () => currentTime,
      sleep
    })

    const result = await client('https://musicbrainz.org/ws/2/release/example')

    expect(result.status).toBe(503)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([3000, 3000])
  })

  it('does not retry a non-transient error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(500))
    const sleep = vi.fn()
    const client = createClient({ fetchImpl, sleep })

    const result = await client('https://musicbrainz.org/ws/2/release/example')

    expect(result.status).toBe(500)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('serializes concurrent requests', async () => {
    let resolveFirst
    const fetchImpl = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveFirst = resolve
      }))
      .mockResolvedValueOnce(response(200))
    let currentTime = 1000
    const sleep = vi.fn(async (ms) => {
      currentTime += ms
    })
    const client = createClient({
      fetchImpl,
      now: () => currentTime,
      sleep
    })

    const firstRequest = client('https://musicbrainz.org/ws/2/release-group/one')
    const secondRequest = client('https://musicbrainz.org/ws/2/release-group/two')
    await Promise.resolve()
    await Promise.resolve()

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    resolveFirst(response(200))
    await firstRequest
    await secondRequest

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(1100, undefined)
  })
})
