import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedAlbum,
  setCachedAlbum,
  clearCache,
  getCacheStats,
  getCachedAlbums
} from '../albumCache'

describe('albumCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache()
  })

  describe('getCachedAlbum', () => {
    it('should return null when album is not cached', () => {
      const result = getCachedAlbum('test-id-123')
      expect(result).toBeNull()
    })

    it('should return cached album data when it exists', () => {
      const releaseGroupId = 'test-id-123'
      const albumData = {
        albumId: releaseGroupId,
        title: 'Test Album',
        artistName: 'Test Artist',
        releaseYear: 2024
      }

      setCachedAlbum(releaseGroupId, albumData)
      const result = getCachedAlbum(releaseGroupId)

      expect(result).toEqual(albumData)
    })

    it('should return null for expired cache entries', () => {
      const releaseGroupId = 'test-id-123'
      const albumData = {
        albumId: releaseGroupId,
        title: 'Test Album'
      }

      // Set cache
      setCachedAlbum(releaseGroupId, albumData)

      // Manually expire the cache entry
      const key = `album_cache_${releaseGroupId}`
      const cached = JSON.parse(localStorage.getItem(key))
      cached.cachedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString() // 31 days ago
      localStorage.setItem(key, JSON.stringify(cached))

      const result = getCachedAlbum(releaseGroupId)
      expect(result).toBeNull()
    })

    it('should update lastAccessed when retrieving from cache', () => {
      const releaseGroupId = 'test-id-123'
      const albumData = { albumId: releaseGroupId, title: 'Test' }

      setCachedAlbum(releaseGroupId, albumData)
      
      const key = `album_cache_${releaseGroupId}`
      const before = JSON.parse(localStorage.getItem(key))
      const beforeTime = before.lastAccessed

      // Wait a bit
      return new Promise(resolve => {
        setTimeout(() => {
          getCachedAlbum(releaseGroupId)
          const after = JSON.parse(localStorage.getItem(key))
          expect(new Date(after.lastAccessed).getTime()).toBeGreaterThan(new Date(beforeTime).getTime())
          resolve()
        }, 10)
      })
    })
  })

  describe('setCachedAlbum', () => {
    it('should store album data in cache', () => {
      const releaseGroupId = 'test-id-123'
      const albumData = {
        albumId: releaseGroupId,
        title: 'Test Album',
        artistName: 'Test Artist'
      }

      setCachedAlbum(releaseGroupId, albumData)
      const result = getCachedAlbum(releaseGroupId)

      expect(result).toEqual(albumData)
    })

    it('should handle multiple albums', () => {
      const album1 = { albumId: 'id-1', title: 'Album 1' }
      const album2 = { albumId: 'id-2', title: 'Album 2' }

      setCachedAlbum('id-1', album1)
      setCachedAlbum('id-2', album2)

      expect(getCachedAlbum('id-1')).toEqual(album1)
      expect(getCachedAlbum('id-2')).toEqual(album2)
    })

    it('should update existing cache entry', () => {
      const releaseGroupId = 'test-id-123'
      const album1 = { albumId: releaseGroupId, title: 'Album 1' }
      const album2 = { albumId: releaseGroupId, title: 'Album 2' }

      setCachedAlbum(releaseGroupId, album1)
      setCachedAlbum(releaseGroupId, album2)

      const result = getCachedAlbum(releaseGroupId)
      expect(result.title).toBe('Album 2')
    })
  })

  describe('clearCache', () => {
    it('should remove all cached albums', () => {
      setCachedAlbum('id-1', { albumId: 'id-1', title: 'Album 1' })
      setCachedAlbum('id-2', { albumId: 'id-2', title: 'Album 2' })

      expect(getCachedAlbums().length).toBe(2)

      clearCache()

      expect(getCachedAlbums().length).toBe(0)
      expect(getCachedAlbum('id-1')).toBeNull()
      expect(getCachedAlbum('id-2')).toBeNull()
    })
  })

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      setCachedAlbum('id-1', { albumId: 'id-1', title: 'Album 1' })
      setCachedAlbum('id-2', { albumId: 'id-2', title: 'Album 2' })

      const stats = getCacheStats()

      expect(stats.count).toBe(2)
      expect(stats.available).toBe(true)
      expect(typeof stats.sizeMB).toBe('string')
    })
  })

  describe('getCachedAlbums', () => {
    it('should return list of cached album IDs', () => {
      setCachedAlbum('id-1', { albumId: 'id-1', title: 'Album 1' })
      setCachedAlbum('id-2', { albumId: 'id-2', title: 'Album 2' })

      const albums = getCachedAlbums()

      expect(albums).toContain('id-1')
      expect(albums).toContain('id-2')
      expect(albums.length).toBe(2)
    })

    it('should return empty array when cache is empty', () => {
      const albums = getCachedAlbums()
      expect(albums).toEqual([])
    })
  })

  describe('cleanup behavior', () => {
    it('should handle localStorage quota errors gracefully', () => {
      // Mock localStorage to throw quota error
      const originalSetItem = localStorage.setItem
      let callCount = 0
      
      localStorage.setItem = vi.fn((key, value) => {
        callCount++
        if (callCount === 1) {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError')
        }
        originalSetItem.call(localStorage, key, value)
      })

      const releaseGroupId = 'test-id'
      const albumData = { albumId: releaseGroupId, title: 'Test' }

      // Should not throw, should handle gracefully
      expect(() => {
        setCachedAlbum(releaseGroupId, albumData)
      }).not.toThrow()

      // Restore
      localStorage.setItem = originalSetItem
    })
  })
})

