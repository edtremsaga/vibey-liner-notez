// Album cache utility for localStorage
// Caches album detail page data to improve performance on repeat views

const CACHE_PREFIX = 'album_cache_'
const CACHE_INDEX_KEY = 'album_cache_index'
const CACHE_TTL_DAYS = 30
const MAX_SIZE_MB = 5
const CLEANUP_THRESHOLD_MB = 4
const MIN_ALBUMS_TO_KEEP = 10
const BUFFER_KB = 500

// Convert days to milliseconds
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000

/**
 * Get cache key for a release group ID
 */
function getCacheKey(releaseGroupId) {
  return `${CACHE_PREFIX}${releaseGroupId}`
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Get approximate size of localStorage in MB
 */
function getStorageSizeMB() {
  if (!isLocalStorageAvailable()) return 0
  
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return total / (1024 * 1024) // Convert bytes to MB
}

/**
 * Get all cached album IDs from index
 */
function getCachedAlbumIds() {
  if (!isLocalStorageAvailable()) return []
  
  try {
    const index = localStorage.getItem(CACHE_INDEX_KEY)
    return index ? JSON.parse(index) : []
  } catch (e) {
    console.warn('Error reading cache index:', e)
    return []
  }
}

/**
 * Update cache index with album ID
 */
function updateCacheIndex(releaseGroupId) {
  if (!isLocalStorageAvailable()) return
  
  try {
    const ids = getCachedAlbumIds()
    if (!ids.includes(releaseGroupId)) {
      ids.push(releaseGroupId)
      localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(ids))
    }
  } catch (e) {
    console.warn('Error updating cache index:', e)
  }
}

/**
 * Remove album ID from cache index
 */
function removeFromCacheIndex(releaseGroupId) {
  if (!isLocalStorageAvailable()) return
  
  try {
    const ids = getCachedAlbumIds().filter(id => id !== releaseGroupId)
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(ids))
  } catch (e) {
    console.warn('Error removing from cache index:', e)
  }
}

/**
 * Check if cache entry is expired
 */
function isExpired(cachedAt) {
  if (!cachedAt) return true
  const cachedTime = new Date(cachedAt).getTime()
  const now = Date.now()
  return (now - cachedTime) > CACHE_TTL_MS
}

/**
 * Get cached album data
 * @param {string} releaseGroupId - MusicBrainz release group ID
 * @returns {Object|null} - Cached album data or null if not found/expired
 */
export function getCachedAlbum(releaseGroupId) {
  if (!isLocalStorageAvailable()) {
    return null
  }
  
  const key = getCacheKey(releaseGroupId)
  
  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      return null
    }
    
    const data = JSON.parse(cached)
    
    // Check if expired
    if (isExpired(data.cachedAt)) {
      // Remove expired entry
      removeCachedAlbum(releaseGroupId)
      return null
    }
    
    // Update last accessed time
    data.lastAccessed = new Date().toISOString()
    localStorage.setItem(key, JSON.stringify(data))
    
    return data.albumData
  } catch (e) {
    console.warn('Error reading from cache:', e)
    // Remove corrupted entry
    removeCachedAlbum(releaseGroupId)
    return null
  }
}

/**
 * Remove cached album
 */
function removeCachedAlbum(releaseGroupId) {
  if (!isLocalStorageAvailable()) return
  
  try {
    const key = getCacheKey(releaseGroupId)
    localStorage.removeItem(key)
    removeFromCacheIndex(releaseGroupId)
  } catch (e) {
    console.warn('Error removing from cache:', e)
  }
}

/**
 * Cleanup cache to make room for new entry
 * Removes expired entries first, then least-recently-used entries
 */
function cleanupCache() {
  if (!isLocalStorageAvailable()) return
  
  try {
    const albumIds = getCachedAlbumIds()
    const now = Date.now()
    
    // Step 1: Remove expired entries
    const expiredIds = []
    albumIds.forEach(id => {
      const key = getCacheKey(id)
      const cached = localStorage.getItem(key)
      if (cached) {
        try {
          const data = JSON.parse(cached)
          if (isExpired(data.cachedAt)) {
            expiredIds.push(id)
          }
        } catch (e) {
          // Corrupted entry, remove it
          expiredIds.push(id)
        }
      }
    })
    
    expiredIds.forEach(id => {
      removeCachedAlbum(id)
      console.log(`Removed expired cache entry: ${id}`)
    })
    
    // Step 2: Check storage size after removing expired entries
    let currentSize = getStorageSizeMB()
    
    // Step 3: If still above threshold, remove least-recently-used entries
    if (currentSize > CLEANUP_THRESHOLD_MB) {
      const remainingIds = getCachedAlbumIds()
      
      // Get all entries with their last accessed time
      const entries = remainingIds.map(id => {
        const key = getCacheKey(id)
        const cached = localStorage.getItem(key)
        if (cached) {
          try {
            const data = JSON.parse(cached)
            return {
              id,
              lastAccessed: new Date(data.lastAccessed || data.cachedAt).getTime()
            }
          } catch (e) {
            return { id, lastAccessed: 0 }
          }
        }
        return { id, lastAccessed: 0 }
      })
      
      // Sort by last accessed (oldest first)
      entries.sort((a, b) => a.lastAccessed - b.lastAccessed)
      
      // Remove oldest entries, but keep at least MIN_ALBUMS_TO_KEEP most recent
      const toRemove = entries.slice(0, Math.max(0, entries.length - MIN_ALBUMS_TO_KEEP))
      
      toRemove.forEach(entry => {
        removeCachedAlbum(entry.id)
        console.log(`Removed least-recently-used cache entry: ${entry.id}`)
        currentSize = getStorageSizeMB()
        
        // Stop if we're below threshold
        if (currentSize <= CLEANUP_THRESHOLD_MB) {
          return
        }
      })
    }
  } catch (e) {
    console.warn('Error during cache cleanup:', e)
  }
}

/**
 * Store album data in cache
 * @param {string} releaseGroupId - MusicBrainz release group ID
 * @param {Object} albumData - Album data object to cache
 */
export function setCachedAlbum(releaseGroupId, albumData) {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, skipping cache')
    return
  }
  
  try {
    // Check storage size and cleanup if needed (Trigger 1)
    const currentSize = getStorageSizeMB()
    if (currentSize > CLEANUP_THRESHOLD_MB) {
      console.log(`Storage at ${currentSize.toFixed(2)}MB, triggering cleanup...`)
      cleanupCache()
    }
    
    // Prepare cache entry
    const now = new Date().toISOString()
    const cacheEntry = {
      albumData,
      cachedAt: now,
      lastAccessed: now,
      version: 1
    }
    
    const key = getCacheKey(releaseGroupId)
    const dataString = JSON.stringify(cacheEntry)
    
    // Try to store, handle quota errors
    try {
      localStorage.setItem(key, dataString)
      updateCacheIndex(releaseGroupId)
      console.log(`Cached album: ${releaseGroupId}`)
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        // Storage full, try cleanup and retry once
        console.warn('Storage quota exceeded, attempting cleanup...')
        cleanupCache()
        
        // Retry once
        try {
          localStorage.setItem(key, dataString)
          updateCacheIndex(releaseGroupId)
          console.log(`Cached album after cleanup: ${releaseGroupId}`)
        } catch (e2) {
          console.warn('Failed to cache album after cleanup:', e2)
          // Give up, app still works without cache
        }
      } else {
        throw e
      }
    }
  } catch (e) {
    console.warn('Error caching album:', e)
    // Don't throw - caching is optional, app should still work
  }
}

/**
 * Clear all cached albums
 */
export function clearCache() {
  if (!isLocalStorageAvailable()) return
  
  try {
    const albumIds = getCachedAlbumIds()
    albumIds.forEach(id => {
      const key = getCacheKey(id)
      localStorage.removeItem(key)
    })
    localStorage.removeItem(CACHE_INDEX_KEY)
    console.log('Cache cleared')
  } catch (e) {
    console.warn('Error clearing cache:', e)
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats (count, size, etc.)
 */
export function getCacheStats() {
  if (!isLocalStorageAvailable()) {
    return { count: 0, sizeMB: 0, available: false }
  }
  
  const albumIds = getCachedAlbumIds()
  const sizeMB = getStorageSizeMB()
  
  return {
    count: albumIds.length,
    sizeMB: sizeMB.toFixed(2),
    available: true
  }
}

/**
 * Get list of all cached album IDs
 * @returns {string[]} - Array of release group IDs
 */
export function getCachedAlbums() {
  return getCachedAlbumIds()
}

