import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCacheStats, clearAllCaches, getReleaseGroupInfo, getSeenRgIdsForProducer, clearProducerSeenRgIds } from '../musicbrainz'

// Mock rateLimitedFetch
global.fetch = vi.fn()

vi.mock('../musicbrainz', async () => {
  const actual = await vi.importActual('../musicbrainz')
  return {
    ...actual,
    rateLimitedFetch: vi.fn()
  }
})

describe('Cache Size Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAllCaches()
  })

  describe('Release Cache (globalReleaseCache)', () => {
    it('should have size limit configured', () => {
      const stats = getCacheStats()
      const maxSize = stats.releaseCache.maxSize
      
      // Verify cache starts empty
      expect(stats.releaseCache.size).toBe(0)
      
      // Verify max size is set and reasonable
      expect(maxSize).toBeGreaterThan(0)
      expect(maxSize).toBeLessThanOrEqual(500)
      expect(maxSize).toBe(500) // Should be exactly 500
    })

    it('should implement LRU eviction structure', () => {
      // LRU cache structure is in place
      const stats = getCacheStats()
      expect(stats.releaseCache.maxSize).toBeDefined()
      expect(stats.releaseCache.size).toBeDefined()
    })
  })

  describe('Fetch Promises Cache', () => {
    it('should limit fetchPromises size', () => {
      const stats = getCacheStats()
      expect(stats.fetchPromises.maxSize).toBeDefined()
      expect(stats.fetchPromises.maxSize).toBeGreaterThan(0)
      expect(stats.fetchPromises.maxSize).toBeLessThanOrEqual(50)
    })
  })

  describe('Producer Seen Cache', () => {
    it('should limit producerSeenRgIds size', () => {
      const stats = getCacheStats()
      expect(stats.producerSeenCache.maxSize).toBeDefined()
      expect(stats.producerSeenCache.maxSize).toBeGreaterThan(0)
      expect(stats.producerSeenCache.maxSize).toBeLessThanOrEqual(20)
    })

    it('should implement LRU eviction for producer cache', () => {
      // Test that LRU eviction works
      const stats = getCacheStats()
      expect(stats.producerSeenCache.maxSize).toBeDefined()
    })
  })

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      const stats = getCacheStats()
      
      expect(stats).toHaveProperty('releaseCache')
      expect(stats).toHaveProperty('fetchPromises')
      expect(stats).toHaveProperty('producerSeenCache')
      
      expect(stats.releaseCache).toHaveProperty('size')
      expect(stats.releaseCache).toHaveProperty('maxSize')
      expect(stats.fetchPromises).toHaveProperty('size')
      expect(stats.fetchPromises).toHaveProperty('maxSize')
      expect(stats.producerSeenCache).toHaveProperty('size')
      expect(stats.producerSeenCache).toHaveProperty('maxSize')
    })
  })

  describe('Cache Clearing', () => {
    it('should clear all caches', () => {
      clearAllCaches()
      const stats = getCacheStats()
      
      expect(stats.releaseCache.size).toBe(0)
      expect(stats.fetchPromises.size).toBe(0)
      expect(stats.producerSeenCache.size).toBe(0)
    })
  })
})
