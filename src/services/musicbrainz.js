// MusicBrainz API service
// Fetches data from MusicBrainz and transforms to album.v1.json schema
// No data invention - only uses values from MusicBrainz API responses

const MB_API_BASE = 'https://musicbrainz.org/ws/2'
const COVER_ART_BASE = 'https://coverartarchive.org'

// Rate limiter: MusicBrainz requires max 1 request per second
let lastRequestTime = 0
async function rateLimitedFetch(url, options = {}) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  // Add timeout for iOS compatibility (15 seconds)
  const timeoutMs = 15000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  // Merge signals if both exist
  const signal = options.signal 
    ? (() => {
        const combinedController = new AbortController()
        const abort = () => combinedController.abort()
        controller.signal.addEventListener('abort', abort)
        options.signal.addEventListener('abort', abort)
        return combinedController.signal
      })()
    : controller.signal
  
  if (timeSinceLastRequest < 1000) {
    // Check if request was aborted during delay
    if (signal.aborted) {
      clearTimeout(timeoutId)
      throw new Error('Request aborted')
    }
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest))
    // Check again after delay
    if (signal.aborted) {
      clearTimeout(timeoutId)
      throw new Error('Request aborted')
    }
  }
  lastRequestTime = Date.now()
  
  try {
    // iOS Safari fix: Ensure proper fetch options
    const fetchOptions = {
      ...options,
      signal,
      mode: 'cors', // Explicitly request CORS
      credentials: 'omit', // Don't send credentials
      cache: 'default' // Use default cache
    }
    
    const response = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    // iOS Safari specific: "Load failed" usually means network/CORS issue
    if (error.message?.includes('Load failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Network request failed on iOS: ${error.message}. URL: ${url}`)
    }
    throw error
  }
}

// Helper to extract artist name from artist-credit array
function extractArtistName(artistCredit) {
  if (!artistCredit) return null
  
  // Handle array format
  if (Array.isArray(artistCredit)) {
    const names = artistCredit.map(ac => {
      // Try name field first (formatted name)
      if (ac.name) return ac.name
      // Then try artist.name
      if (ac.artist?.name) return ac.artist.name
      return null
    }).filter(Boolean)
    
    return names.length > 0 ? names.join(', ') : null
  }
  
  // Handle single object format
  if (typeof artistCredit === 'object') {
    return artistCredit.name || artistCredit.artist?.name || null
  }
  
  return null
}

// Helper to parse track position from track number and medium
function parsePosition(track, medium) {
  if (!track.number) return null
  // Multi-disc: format as "disc-track"
  if (medium && medium.position && medium.position > 1) {
    return `${medium.position}-${track.number}`
  }
  // Single disc: just track number
  return track.number.toString()
}

// Search for release groups by artist name and optional album name
// If albumName is provided, searches for specific album
// If only artistName, returns releases by that artist (filtered by releaseType if provided)
// releaseType: Album, EP, Single, Live, Compilation, Soundtrack, or null for all types
export async function searchReleaseGroups(artistName, albumName = null, releaseType = null, offset = 0) {
  if (!artistName) {
    throw new Error('Artist name is required')
  }
  
  // Define query patterns for each release type
  // Some types use primarytype only, others use primarytype + secondarytype
  // For "Album", we need to exclude albums with secondary types (Live, Compilation, Soundtrack)
  // to get only studio albums
  function buildTypeQuery(releaseType) {
    const typeQueries = {
      'Album': 'primarytype:album NOT secondarytype:live NOT secondarytype:compilation NOT secondarytype:soundtrack',
      'EP': 'primarytype:ep',
      'Single': 'primarytype:single',
      'Live': 'primarytype:album AND secondarytype:live',
      'Compilation': 'primarytype:album AND secondarytype:compilation',
      'Soundtrack': 'primarytype:album AND secondarytype:soundtrack'
    }
    return typeQueries[releaseType] || null
  }
  
  let query
  let limit = 20
  
  if (albumName) {
    // Specific album search: artist:"name" AND release:"name"
    query = `artist:"${artistName}" AND release:"${albumName}"`
  } else {
    // Artist-only search: filter by release type if specified
    if (releaseType) {
      const typeQuery = buildTypeQuery(releaseType)
      if (typeQuery) {
        query = `artist:"${artistName}" AND ${typeQuery}`
      } else {
        // Fallback to primarytype if type not in mapping
        query = `artist:"${artistName}" AND primarytype:${releaseType}`
      }
    } else {
      // No type filter - get all release types
      query = `artist:"${artistName}"`
    }
    limit = 100 // Increase limit for artist-only searches
  }
  
  // Include releases in search to check for bootleg status
  const url = `${MB_API_BASE}/release-group?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&inc=releases&fmt=json`
  
  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const releaseGroups = data['release-groups'] || []
    const totalCount = data.count || releaseGroups.length
    
    // Transform to simple result format
    let results = releaseGroups.map(rg => {
      // Check if all releases are bootlegs
      // A release group is considered bootleg if ALL its releases are bootlegs
      const releases = rg.releases || []
      let isBootleg = false
      
      if (releases.length > 0) {
        // Check if all releases have bootleg status
        // Bootleg status-id: 1156806e-d06a-38bd-83f0-cf2284a808b9
        const bootlegStatusId = '1156806e-d06a-38bd-83f0-cf2284a808b9'
        isBootleg = releases.every(release => {
          const statusId = release['status-id']
          return statusId === bootlegStatusId
        })
      }
      // If no releases, default to false (not bootleg)
      
      return {
        releaseGroupId: rg.id,
        title: rg.title,
        artistName: extractArtistName(rg['artist-credit']),
        releaseYear: rg['first-release-date'] 
          ? parseInt(rg['first-release-date'].substring(0, 4)) 
          : null,
        isBootleg: isBootleg
      }
    })
    
    // For artist-only searches, sort by year (newest first), then by title
    if (!albumName) {
      results.sort((a, b) => {
        // Sort by year (newest first), then by title
        if (a.releaseYear && b.releaseYear) {
          if (b.releaseYear !== a.releaseYear) {
            return b.releaseYear - a.releaseYear
          }
        } else if (a.releaseYear && !b.releaseYear) {
          return -1
        } else if (!a.releaseYear && b.releaseYear) {
          return 1
        }
        // If years are equal or both null, sort by title
        return (a.title || '').localeCompare(b.title || '')
      })
    }
    
    return {
      results,
      totalCount,
      isArtistOnly: !albumName
    }
  } catch (error) {
    console.error('Error searching release groups:', error)
    throw error
  }
}

// Search for producer by name to get MBID(s)
// Returns array of matching producers with their MBIDs
// @param {string} producerName - Producer name to search for
async function findProducerMBIDs(producerName) {
  if (!producerName || !producerName.trim()) {
    throw new Error('Producer name is required')
  }
  
  const trimmedName = producerName.trim()
  const query = `artist:"${trimmedName}"`
  const url = `${MB_API_BASE}/artist?query=${encodeURIComponent(query)}&limit=25&fmt=json`
  
  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const artists = data.artists || []
    
    // Return array of matching producers with their MBIDs
    return artists.map(artist => ({
      mbid: artist.id,
      name: artist.name || trimmedName,
      disambiguation: artist.disambiguation || null, // e.g., "US" vs "UK"
      type: artist.type || null
    }))
  } catch (error) {
    console.error('Error finding producer MBIDs:', error)
    throw error
  }
}

// ============================================================================
// Release → RG Cache System (3-layer cache)
// ============================================================================

// Global cache: releaseId → rgInfo (persists across searches until page refresh)
const globalReleaseCache = new Map() // releaseId → rgInfo object

// Promise memoization: releaseId → Promise<rgInfo> (prevents duplicate in-flight fetches)
const fetchPromises = new Map() // releaseId → Promise<rgInfo>

// Per-producer seenRgIds: producerMBID → Set<rgId> (deduplication per search session)
const producerSeenRgIds = new Map() // producerMBID → Set<rgId>

/**
 * Get Release Group info for a release ID using 3-layer cache
 * @param {string} releaseId - MusicBrainz release ID
 * @returns {Promise<Object|null>} - rgInfo object or null if not found/invalid
 */
async function getReleaseGroupInfo(releaseId) {
  // Layer 1: Check value cache (instant return if already fetched)
  if (globalReleaseCache.has(releaseId)) {
    return globalReleaseCache.get(releaseId)
  }
  
  // Layer 2: Check Promise cache (return existing promise if already fetching)
  if (fetchPromises.has(releaseId)) {
    return fetchPromises.get(releaseId)
  }
  
  // Layer 3: Start new fetch
  const promise = (async () => {
    try {
      const releaseUrl = `${MB_API_BASE}/release/${releaseId}?inc=release-groups+artist-credits&fmt=json`
      const releaseResponse = await rateLimitedFetch(releaseUrl, {
        headers: {
          'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
          'Accept': 'application/json'
        }
      })
      
      if (!releaseResponse.ok) {
        fetchPromises.delete(releaseId) // Clean up on error
        return null
      }
      
      const releaseData = await releaseResponse.json()
      const releaseGroup = releaseData['release-group']
      
      if (!releaseGroup || !releaseGroup.id) {
        fetchPromises.delete(releaseId) // Clean up on invalid data
        return null
      }
      
      // Build rgInfo object (not just rgId)
      const rgInfo = {
        releaseGroupId: releaseGroup.id,
        title: releaseGroup.title || releaseData.title || '',
        artistName: extractArtistName(releaseGroup['artist-credit']),
        releaseYear: releaseGroup['first-release-date']
          ? parseInt(releaseGroup['first-release-date'].substring(0, 4))
          : null,
        isBootleg: releaseData.status === 'Bootleg',
        primaryType: releaseGroup['primary-type'] || null,
        releaseId: releaseId // Include release ID for reference
      }
      
      // Store in value cache
      globalReleaseCache.set(releaseId, rgInfo)
      fetchPromises.delete(releaseId) // Clean up promise cache
      
      return rgInfo
    } catch (error) {
      fetchPromises.delete(releaseId) // Clean up on error
      console.warn(`[Release Cache] Error fetching release ${releaseId}:`, error.message)
      return null
    }
  })()
  
  fetchPromises.set(releaseId, promise)
  return promise
}

/**
 * Get or create seenRgIds Set for a producer
 * @param {string} producerMBID - Producer MBID
 * @returns {Set<string>} - Set of seen Release Group IDs
 */
function getSeenRgIdsForProducer(producerMBID) {
  if (!producerSeenRgIds.has(producerMBID)) {
    producerSeenRgIds.set(producerMBID, new Set())
  }
  return producerSeenRgIds.get(producerMBID)
}

/**
 * Clear seenRgIds for a producer (called when starting new search)
 * @param {string} producerMBID - Producer MBID
 */
export function clearProducerSeenRgIds(producerMBID) {
  if (producerMBID) {
    producerSeenRgIds.delete(producerMBID)
  }
}

// POC TEST: Check if Release Group IDs are available in relationships payload (cheap, no extra fetches)
function testReleaseGroupAvailability(artistJson) {
  const rels = artistJson?.relations ?? [];

  // Relationships that reference a release
  const releaseRels = rels.filter(r => r && r.release && r.release.id);

  // See if release has nested release-group info
  const withRgNested = releaseRels.filter(
    r => r.release && (r.release["release-group"]?.id || r.release.release_group?.id)
  );

  // Sometimes the relation itself contains RG-ish keys (rare, but worth checking)
  const withRgOnRelation = releaseRels.filter(
    r => r["release-group"]?.id || r.release_group?.id
  );

  const sampleRelease = releaseRels[0]?.release ?? null;

  console.log("[RG Cheap Check]", {
    totalRelations: rels.length,
    releaseRelations: releaseRels.length,
    releaseRelationsWithNestedRG: withRgNested.length,
    releaseRelationsWithRGOnRelation: withRgOnRelation.length,
    sampleReleaseKeys: sampleRelease ? Object.keys(sampleRelease) : null,
    sampleNestedRG: withRgNested[0]?.release?.["release-group"] ?? withRgNested[0]?.release?.release_group ?? null,
    sampleReleaseId: releaseRels[0]?.release?.id ?? null,
    sampleReleaseTitle: releaseRels[0]?.release?.title ?? null,
  });

  // "Cheap" means RG IDs exist in the relationships payload (no extra fetches)
  return withRgNested.length > 0 || withRgOnRelation.length > 0;
}

// Search for albums by producer using graph-walk approach via artist relationships
// KEY INSIGHT: Producer credits are stored as RELATIONSHIPS on the ARTIST entity, not searchable via release search
// This approach queries the artist's relationships directly (ChatGPT-suggested approach)
// @param {string} producerName - Producer name to search for
// @param {string} producerMBID - Optional: specific producer MBID (if multiple matches, user selected one)
// @param {number} offset - Optional: pagination offset (default 0)
// @param {Function} onProgress - Optional: progress callback
// @param {Array} cachedReleaseRelations - Optional: cached release relations to avoid re-fetching (for pagination performance)
// @param {Set} seenRgIds - Optional: Set of already-seen Release Group IDs (for deduplication)
export async function searchByProducer(producerName, producerMBID = null, offset = 0, onProgress = null, cachedReleaseRelations = null, seenRgIds = null) {
  if (!producerName || !producerName.trim()) {
    throw new Error('Producer name is required')
  }
  
  const trimmedName = producerName.trim()
  
  // Step 1: Find producer MBID(s) if not provided
  let producerMBIDs = []
  
  if (producerMBID) {
    // User selected a specific producer from multiple matches
    producerMBIDs = [{ mbid: producerMBID, name: trimmedName }]
  } else {
    // Search for producers matching the name
    producerMBIDs = await findProducerMBIDs(trimmedName)
    
    if (producerMBIDs.length === 0) {
      throw new Error('No producer found. Try a different name or check spelling.')
    }
    
    // If multiple matches, return them for user selection
    if (producerMBIDs.length > 1) {
      return {
        multipleMatches: true,
        matches: producerMBIDs,
        results: [],
        totalCount: 0
      }
    }
  }
  
  const producer = producerMBIDs[0]
  const producerMBIDToUse = producer.mbid
  
  // Get or create seenRgIds Set for this producer (for deduplication)
  if (!seenRgIds) {
    seenRgIds = getSeenRgIdsForProducer(producerMBIDToUse)
  }
  
  // Start total timing
  const totalStartTime = performance.now()
  
  try {
    // Step 2: Fetch artist with recording-rels and release-rels (or use cached)
    // KEY INSIGHT: Get ALL relationships where this artist is involved directly from the artist entity
    // This is a graph-walk approach - MusicBrainz doesn't support direct producer search
    let releaseRelations
    let recordingRelations
    let artistRelsDuration = null // Track actual fetch time, null if cached
    
    if (cachedReleaseRelations) {
      // Use cached release relations (for pagination performance)
      console.log(`[Producer Search] Using cached release relations (${cachedReleaseRelations.length} releases)`)
      releaseRelations = cachedReleaseRelations
      // For pagination, we don't need recording relations (they're slow and we skip them anyway)
      recordingRelations = []
    } else {
      // Fetch artist relationships (initial search only)
      const artistRelsStartTime = performance.now()
      console.log(`[Producer Search] Fetching artist relationships for ${producerMBIDToUse}...`)
      const artistRelsUrl = `${MB_API_BASE}/artist/${producerMBIDToUse}?inc=recording-rels+release-rels&fmt=json`
      const artistRelsResponse = await rateLimitedFetch(artistRelsUrl, {
        headers: {
          'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
          'Accept': 'application/json'
        }
      })
      
      if (!artistRelsResponse.ok) {
        throw new Error(`MusicBrainz API error: ${artistRelsResponse.status} ${artistRelsResponse.statusText}`)
      }
      
      const artistRelsData = await artistRelsResponse.json()
      const relations = artistRelsData.relations || []
      artistRelsDuration = ((performance.now() - artistRelsStartTime) / 1000).toFixed(2)
      
      console.log(`[Producer Search] Found ${relations.length} total relationships (took ${artistRelsDuration}s)`)
      
      // POC TEST: Check if Release Group IDs are available in the relationships payload (cheap, no extra fetches)
      testReleaseGroupAvailability(artistRelsData)
      
      // Step 3: Filter for producer relationships only
      const producerRelations = relations.filter(rel => {
        const type = (rel.type || '').toLowerCase()
        return type.includes('producer')
      })
      
      console.log(`[Producer Search] Found ${producerRelations.length} producer relationships`)
      
      if (producerRelations.length === 0) {
        throw new Error(`No albums found for this producer. The producer exists but no production credits are documented.`)
      }
      
      // Step 4: Split into release-level and recording-level producer credits
      releaseRelations = producerRelations.filter(r => r['target-type'] === 'release' && r.release)
      recordingRelations = producerRelations.filter(r => r['target-type'] === 'recording' && r.recording)
      
      console.log(`[Producer Search] Release-level: ${releaseRelations.length}, Recording-level: ${recordingRelations.length}`)
    }
    
    // Step 5: Process release-level producer credits (strong signal - prioritize these)
    // Process releases starting from offset to support pagination
    // Initial search (offset === 0): Continue until we find 10 albums OR reach 50 releases
    // Pagination (offset > 0): Process next batch of 10 releases
    const releaseGroupMap = new Map()
    const MIN_ALBUMS_TARGET = 10 // Minimum albums to find before stopping (initial search only)
    const MAX_RELEASES_INITIAL = 50 // Maximum releases to process in initial search
    const RELEASES_PER_BATCH = 10 // Process 10 releases per batch (for pagination)
    
    const isInitialSearch = offset === 0
    const startIndex = offset || 0
    
    // For initial search: process up to MAX_RELEASES_INITIAL or until we find MIN_ALBUMS_TARGET
    // For pagination: process RELEASES_PER_BATCH releases
    let endIndex
    let totalToProcess
    let releaseRelationsToProcess
    
    if (isInitialSearch) {
      // Initial search: process releases until we find 10 albums or reach 50 releases
      endIndex = Math.min(startIndex + MAX_RELEASES_INITIAL, releaseRelations.length)
      releaseRelationsToProcess = releaseRelations.slice(startIndex, endIndex)
      totalToProcess = releaseRelationsToProcess.length
    } else {
      // Pagination: process next batch of 10 releases
      endIndex = startIndex + RELEASES_PER_BATCH
      releaseRelationsToProcess = releaseRelations.slice(startIndex, endIndex)
      totalToProcess = releaseRelationsToProcess.length
    }
    
    const releasesStartTime = performance.now()
    const maxProgress = isInitialSearch ? MAX_RELEASES_INITIAL : totalToProcess
    console.log(`[Producer Search] Processing ${totalToProcess} release-level producer credits (out of ${releaseRelations.length} total)...`)
    if (isInitialSearch) {
      console.log(`[Producer Search] Initial search: will continue until ${MIN_ALBUMS_TARGET} albums found or ${MAX_RELEASES_INITIAL} releases processed`)
    }
    
    let actuallyProcessed = 0
    for (let i = 0; i < releaseRelationsToProcess.length; i++) {
      const rel = releaseRelationsToProcess[i]
      const current = i + 1
      actuallyProcessed = current // Track how many we've processed
      const releaseStartTime = performance.now()
      
      // Report progress (show X/50 for initial search, X/10 for pagination)
      if (onProgress) {
        onProgress({ current: actuallyProcessed, total: maxProgress })
      }
      
      try {
        const releaseId = rel.release.id
        
        // Use 3-layer cache to get RG info
        const rgInfo = await getReleaseGroupInfo(releaseId)
        const releaseDuration = ((performance.now() - releaseStartTime) / 1000).toFixed(2)
        
        if (!rgInfo) {
          console.log(`[Producer Search] Release ${current}/${totalToProcess} skipped (no RG info) - took ${releaseDuration}s`)
          continue
        }
        
        // Check if it's an Album type
        if (rgInfo.primaryType !== 'Album') {
          console.log(`[Producer Search] Release ${current}/${totalToProcess} skipped (not Album type) - took ${releaseDuration}s`)
          continue
        }
        
        // Check if we've already seen this Release Group (using seenRgIds Set)
        const releaseGroupId = rgInfo.releaseGroupId
        if (seenRgIds.has(releaseGroupId)) {
          console.log(`[Producer Search] Release ${current}/${totalToProcess} skipped (duplicate RG) - took ${releaseDuration}s`)
          continue
        }
        
        // Mark as seen
        seenRgIds.add(releaseGroupId)
        
        // Add to results map
        releaseGroupMap.set(releaseGroupId, {
          releaseGroupId: rgInfo.releaseGroupId,
          title: rgInfo.title,
          artistName: rgInfo.artistName,
          releaseYear: rgInfo.releaseYear,
          isBootleg: rgInfo.isBootleg
        })
        
        // Log cache hit/miss for debugging
        const cacheStatus = globalReleaseCache.has(releaseId) ? 'cache hit' : 'cache miss'
        console.log(`[Producer Search] Release ${current}/${totalToProcess}: Found album "${rgInfo.title}" - took ${releaseDuration}s (${cacheStatus}, total albums: ${releaseGroupMap.size})`)
        
        // Early exit for initial search: stop if we found MIN_ALBUMS_TARGET albums
        if (isInitialSearch && releaseGroupMap.size >= MIN_ALBUMS_TARGET) {
          console.log(`[Producer Search] Found ${releaseGroupMap.size} albums (target: ${MIN_ALBUMS_TARGET}) - stopping early`)
          // Report final progress showing completion
          if (onProgress) {
            onProgress({ current: actuallyProcessed, total: actuallyProcessed })
          }
          break
        }
      } catch (err) {
        const releaseDuration = ((performance.now() - releaseStartTime) / 1000).toFixed(2)
        console.warn(`[Producer Search] Error processing release ${current}/${totalToProcess} (took ${releaseDuration}s):`, err.message)
        continue
      }
    }
    
    // Calculate timing after loop completes (whether we broke early or processed all)
    const releasesDuration = ((performance.now() - releasesStartTime) / 1000).toFixed(2)
    if (isInitialSearch && releaseGroupMap.size >= MIN_ALBUMS_TARGET && actuallyProcessed < totalToProcess) {
      console.log(`[Producer Search] Found ${releaseGroupMap.size} albums (target: ${MIN_ALBUMS_TARGET}) - stopped early (processed ${actuallyProcessed} releases in ${releasesDuration}s)`)
    } else if (isInitialSearch && actuallyProcessed >= MAX_RELEASES_INITIAL) {
      console.log(`[Producer Search] Reached maximum releases (${MAX_RELEASES_INITIAL}) - processed ${actuallyProcessed} releases in ${releasesDuration}s, found ${releaseGroupMap.size} unique albums`)
    } else {
      const batchInfo = offset > 0 ? ` (batch starting at offset ${offset})` : ''
      console.log(`[Producer Search] Processed ${actuallyProcessed} releases${batchInfo} in ${releasesDuration}s, found ${releaseGroupMap.size} unique albums`)
    }
    
    // Step 6: Process recording-level producer credits ONLY if we don't have enough release-level results
    // NOTE: Recording-level processing is very slow (requires fetching each recording), so we skip it for now
    // For now, only use release-level producer credits for speed (30 seconds vs potentially hours)
    // TODO: Implement smart pagination for recording-level credits if needed
    
    // Only try recording-level if this is initial search (offset === 0) and we have no results
    // For pagination (offset > 0), it's expected to sometimes get 0 results (we've reached the end)
    // IMPORTANT: Skip recording-level for pagination (offset > 0) - we've reached the end
    if (releaseGroupMap.size === 0 && offset === 0 && recordingRelations && recordingRelations.length > 0) {
      console.log(`[Producer Search] No albums found from release-level, trying recording-level credits...`)
      console.log(`[Producer Search] WARNING: This may take a long time (${recordingRelations.length} recording relations found)`)
      
      // Limit to first 10 recording relations to keep it reasonably fast (10 seconds with rate limiting)
      // This is a fallback only if release-level returns nothing
      const recordingReleaseGroupMap = new Map()
      const recordingRelationsToProcess = recordingRelations.slice(0, 10) // Very limited for speed
      
      console.log(`[Producer Search] Processing ${recordingRelationsToProcess.length} recording-level producer credits...`)
      
      for (const rel of recordingRelationsToProcess) {
        try {
          const recordingUrl = `${MB_API_BASE}/recording/${rel.recording.id}?inc=releases+release-groups+artist-credits&fmt=json`
          const recordingResponse = await rateLimitedFetch(recordingUrl, {
            headers: {
              'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
              'Accept': 'application/json'
            }
          })
          
          if (!recordingResponse.ok) continue
          
          const recordingData = await recordingResponse.json()
          const releases = recordingData.releases || []
          
          // Get release-groups from releases
          for (const release of releases) {
            const releaseGroup = release['release-group']
            if (!releaseGroup || !releaseGroup.id) continue
            if (releaseGroup['primary-type'] !== 'Album') continue
            
            const releaseGroupId = releaseGroup.id
            
            // Check if we've already seen this RG (using seenRgIds Set)
            if (!recordingReleaseGroupMap.has(releaseGroupId) && !seenRgIds.has(releaseGroupId)) {
              const artistName = extractArtistName(releaseGroup['artist-credit'])
              recordingReleaseGroupMap.set(releaseGroupId, {
                releaseGroupId: releaseGroupId,
                title: releaseGroup.title || '',
                artistName: artistName || null,
                releaseYear: releaseGroup['first-release-date']
                  ? parseInt(releaseGroup['first-release-date'].substring(0, 4))
                  : null,
                isBootleg: release.status === 'Bootleg'
              })
              seenRgIds.add(releaseGroupId) // Mark as seen
            }
          }
        } catch (err) {
          console.warn(`[Producer Search] Error processing recording relation:`, err.message)
          continue
        }
      }
      
      // Merge recording-level results into main map
      for (const [releaseGroupId, rg] of recordingReleaseGroupMap.entries()) {
        releaseGroupMap.set(releaseGroupId, {
          releaseGroupId: rg.releaseGroupId,
          title: rg.title,
          artistName: rg.artistName,
          releaseYear: rg.releaseYear,
          isBootleg: rg.isBootleg
        })
      }
      
      console.log(`[Producer Search] Added ${recordingReleaseGroupMap.size} albums from recording-level credits`)
    } else if (releaseGroupMap.size === 0 && offset > 0) {
      // Pagination reached the end (no new albums found) - this is expected, not an error
      console.log(`[Producer Search] Pagination: No new albums found at offset ${offset} (reached end of available releases)`)
      // Don't try recording-level for pagination - just return empty results below
    } else {
      console.log(`[Producer Search] Found ${releaseGroupMap.size} albums from release-level credits - skipping recording-level for speed`)
      if (recordingRelations && recordingRelations.length > 0) {
        console.log(`[Producer Search] Note: ${recordingRelations.length} recording-level producer credits exist but were skipped to keep search fast`)
      }
    }
    
    // Convert map to array
    let results = Array.from(releaseGroupMap.values())
    
    // Calculate total available releases (needed for early return case)
    const totalAvailableReleases = releaseRelations.length
    
    // If still no albums found:
    // - For initial search (offset === 0): throw error (no albums found at all)
    // - For pagination (offset > 0): return empty results (we've reached the end, which is expected)
    if (results.length === 0) {
      if (offset === 0) {
        throw new Error(`No albums found for this producer. The producer exists but no production credits are documented.`)
      } else {
        // Pagination reached the end - return empty results (this is expected, not an error)
        console.log(`[Producer Search] Pagination: No new albums found at offset ${offset} (reached end of available releases)`)
        return {
          results: [],
          totalCount: totalAvailableReleases,
          isProducerSearch: true,
          producerName: producer.name,
          producerMBID: producerMBIDToUse,
          hasMore: false,
          releasesProcessed: actuallyProcessed,
          releaseRelations: releaseRelations,
          seenRgIds: seenRgIds
        }
      }
    }
    
    // Sort by year (newest first), then by title
    results.sort((a, b) => {
      if (a.releaseYear && b.releaseYear) {
        if (b.releaseYear !== a.releaseYear) {
          return b.releaseYear - a.releaseYear
        }
      } else if (a.releaseYear && !b.releaseYear) {
        return -1
      } else if (!a.releaseYear && b.releaseYear) {
        return 1
      }
      return (a.title || '').localeCompare(b.title || '')
    })
    
    const totalDuration = ((performance.now() - totalStartTime) / 1000).toFixed(2)
    const batchInfo = offset > 0 ? ` (batch offset: ${offset})` : ''
    console.log(`[Producer Search] ✅ COMPLETE: Found ${results.length} albums with producer credits${batchInfo} in ${totalDuration}s total`)
    if (cachedReleaseRelations && artistRelsDuration === null) {
      // Estimate saved time based on typical fetch (usually ~1s)
      console.log(`[Producer Search] Performance breakdown: Using cached relations (saved ~1.0s), Releases processing: ${releasesDuration}s`)
    } else {
      console.log(`[Producer Search] Performance breakdown: Artist fetch: ${artistRelsDuration || '0.00'}s, Releases processing: ${releasesDuration}s`)
    }
    
    // Return total available count (total release relations available for this producer)
    // This allows the UI to show "X of Y" and enable pagination
    // For pagination: totalCount should represent total releases available (for calculating pages)
    // Note: totalAvailableReleases is already calculated above (before early return check)
    
    return {
      results,
      totalCount: totalAvailableReleases, // Always return total releases available for pagination calculation
      isProducerSearch: true,
      producerName: producer.name,
      producerMBID: producerMBIDToUse,
      hasMore: endIndex < releaseRelations.length, // Indicate if more releases are available to process
      releasesProcessed: actuallyProcessed, // How many releases were actually processed (important for pagination offset)
      releaseRelations: releaseRelations, // Return release relations for caching (to avoid re-fetching during pagination)
      seenRgIds: seenRgIds // Return seenRgIds Set so it can be passed to next pagination call
    }
  } catch (error) {
    // Re-throw specific errors (no match, no albums) as-is
    if (error.message.includes('No producer found') || error.message.includes('No albums found')) {
      throw error
    }
    
    console.error('Error searching by producer:', error)
    throw error
  }
}

// Fetch release group by MBID
// @param {string} releaseGroupId - MusicBrainz release group ID
// @param {AbortSignal} signal - Optional AbortSignal for request cancellation
async function fetchReleaseGroup(releaseGroupId, signal = null) {
  const url = `${MB_API_BASE}/release-group/${releaseGroupId}?inc=releases+artist-credits+release-group-rels+artist-rels+url-rels&fmt=json`
  
  const response = await rateLimitedFetch(url, {
    headers: {
      'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
      'Accept': 'application/json'
    },
    signal: signal || undefined
  })
  
  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

// Fetch release by MBID with full details
async function fetchRelease(releaseId) {
  // Use recording-level-rels to get relations at recording level
  // Note: place-rels may require individual recording fetches
  const url = `${MB_API_BASE}/release/${releaseId}?inc=recordings+artist-credits+recording-level-rels+release-rels+labels+artist-rels&fmt=json`
  
  const response = await rateLimitedFetch(url, {
    headers: {
      'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

// Fetch individual recording with place relations (for studio/location info)
async function fetchRecordingWithPlaces(recordingId) {
  const url = `${MB_API_BASE}/recording/${recordingId}?inc=artist-credits+place-rels&fmt=json`
  
  const response = await rateLimitedFetch(url, {
    headers: {
      'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) {
    return null // Fail gracefully - recording info is optional
  }
  
  return await response.json()
}

// Helper function to test if an image URL loads (iOS Safari workaround)
function testImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000)
  })
}

// Fetch cover art for release group or release
export async function fetchCoverArt(releaseGroupId, releaseId = null) {
  // iOS Safari workaround: Try direct image URLs first (they often work when fetch() doesn't)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  if (isIOS) {
    // Try release-level direct image URL first (more specific)
    if (releaseId) {
      const directReleaseUrl = `${COVER_ART_BASE}/release/${releaseId}/front`
      const releaseImageWorks = await testImageUrl(directReleaseUrl)
      if (releaseImageWorks) {
        return directReleaseUrl
      }
    }
    
    // Try release-group direct image URL
    const directReleaseGroupUrl = `${COVER_ART_BASE}/release-group/${releaseGroupId}/front`
    const releaseGroupImageWorks = await testImageUrl(directReleaseGroupUrl)
    if (releaseGroupImageWorks) {
      return directReleaseGroupUrl
    }
  }
  
  // Try release group first (standard API approach)
  try {
    const releaseGroupUrl = `${COVER_ART_BASE}/release-group/${releaseGroupId}`
    const response = await rateLimitedFetch(releaseGroupUrl, {
      headers: {
        'User-Agent': 'liner-notez/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await response.json()
        const frontImage = data.images?.find(img => img.front === true)
        if (frontImage && frontImage.image) {
          return frontImage.image.replace('http://', 'https://')
        }
        // If no front image, try first image
        if (data.images && data.images.length > 0 && data.images[0].image) {
          return data.images[0].image.replace('http://', 'https://')
        }
      }
    }
  } catch (e) {
    console.warn('Error fetching cover art from release group:', e)
    // Continue to try release-level
  }
  
  // If release group doesn't have cover art, try the specific release
  if (releaseId) {
    try {
      const releaseUrl = `${COVER_ART_BASE}/release/${releaseId}`
      const response = await rateLimitedFetch(releaseUrl, {
        headers: {
          'User-Agent': 'liner-notez/1.0'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await response.json()
          const frontImage = data.images?.find(img => img.front === true)
          if (frontImage && frontImage.image) {
            return frontImage.image
          }
          // If no front image, try first image
          if (data.images && data.images.length > 0 && data.images[0].image) {
            return data.images[0].image
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching cover art from release:', e)
      // Cover art is optional
    }
  }
  
  return null // Cover art is optional
}

// Fetch all album art images for a release group
// Returns array of image objects with metadata, limited to 20 images
// @param {string} releaseGroupId - MusicBrainz release group ID
// @param {AbortSignal} signal - Optional AbortSignal for request cancellation
export async function fetchAllAlbumArt(releaseGroupId, signal = null) {
  const url = `${COVER_ART_BASE}/release-group/${releaseGroupId}`
  console.log('[Gallery Debug] fetchAllAlbumArt called with releaseGroupId:', releaseGroupId)
  console.log('[Gallery Debug] URL:', url)
  console.log('[Gallery Debug] Signal aborted?', signal?.aborted)
  
  // Detect mobile for User-Agent header fix
  const isMobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || window.innerWidth <= 480
  
  try {
    console.log('[Gallery Debug] Calling rateLimitedFetch...')
    // Remove User-Agent header on mobile - causes CORS error: "Request header field User-Agent is not allowed by Access-Control-Allow-Headers"
    const fetchHeaders = isMobile ? {} : { 'User-Agent': 'liner-notez/1.0' }
    console.log('[Gallery Debug] Fetch headers:', fetchHeaders)
    const response = await rateLimitedFetch(url, {
      headers: fetchHeaders,
      signal: signal || undefined
    })
    
    console.log('[Gallery Debug] rateLimitedFetch completed')
    console.log('[Gallery Debug] Response ok?', response.ok)
    console.log('[Gallery Debug] Response status:', response.status)
    console.log('[Gallery Debug] Response statusText:', response.statusText)
    
    // Check if request was aborted (timeout or manual abort)
    if (signal && signal.aborted) {
      console.log('[Gallery Debug] Signal was aborted - throwing error')
      throw new Error('Request aborted')
    }
    
    // If response is not ok, throw error
    if (!response.ok) {
      console.log('[Gallery Debug] Response not ok - throwing error')
      throw new Error(`Failed to fetch album art: ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type') || ''
    console.log('[Gallery Debug] Content-Type:', contentType)
    
    if (!contentType.includes('application/json')) {
      console.log('[Gallery Debug] Invalid content type - throwing error')
      throw new Error('Invalid response format from album art API')
    }
    
    console.log('[Gallery Debug] Parsing JSON response...')
    const data = await response.json()
    console.log('[Gallery Debug] JSON parsed successfully')
    console.log('[Gallery Debug] Data.images length:', data.images?.length || 0)
    
    const images = data.images || []
    
    // Limit to first 20 images and return (even if empty - this is valid)
    const limitedImages = images.slice(0, 20).map(img => ({
      id: img.id || null,
      image: img.image ? img.image.replace('http://', 'https://') : null,
      thumbnails: img.thumbnails ? {
        small: img.thumbnails.small ? img.thumbnails.small.replace('http://', 'https://') : null,
        large: img.thumbnails.large ? img.thumbnails.large.replace('http://', 'https://') : null,
        '250': img.thumbnails['250'] ? img.thumbnails['250'].replace('http://', 'https://') : null,
        '500': img.thumbnails['500'] ? img.thumbnails['500'].replace('http://', 'https://') : null,
        '1200': img.thumbnails['1200'] ? img.thumbnails['1200'].replace('http://', 'https://') : null
      } : null,
      front: img.front || false,
      back: img.back || false,
      types: img.types || [],
      approved: img.approved || false
    }))
    
    console.log('[Gallery Debug] Returning', limitedImages.length, 'images')
    // Return empty array only if API returned valid response with no images
    return limitedImages
  } catch (e) {
    console.log('[Gallery Debug] fetchAllAlbumArt CATCH block - error:', e)
    console.log('[Gallery Debug] Error name:', e.name)
    console.log('[Gallery Debug] Error message:', e.message)
    console.log('[Gallery Debug] Error stack:', e.stack)
    
    // Re-throw abort errors (timeout or manual abort)
    if (e.name === 'AbortError' || e.message === 'Request aborted' || (signal && signal.aborted)) {
      console.log('[Gallery Debug] AbortError detected - throwing timeout error')
      throw new Error('Gallery loading timed out. Please try again.')
    }
    
    // Re-throw network errors - preserve more error details for debugging
    if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('Network') || e.message.includes('Load failed'))) {
      console.log('[Gallery Debug] Network error detected - original error:', e.message)
      // Preserve the original error message which may have more details
      const errorMsg = e.message.includes('Network request failed on iOS') 
        ? e.message 
        : `Network error: ${e.message}. Please check your connection.`
      console.log('[Gallery Debug] Throwing network error:', errorMsg)
      throw new Error(errorMsg)
    }
    
    // Re-throw all other errors
    console.warn('Error fetching all album art from release group:', e)
    console.log('[Gallery Debug] Re-throwing original error')
    throw e
  }
}

// Extract songwriting info from recording relations
function extractSongwriting(recording) {
  if (!recording.relations) return null
  
  const writers = []
  const composers = []
  const lyricists = []
  
  for (const relation of recording.relations) {
    if (relation['target-type'] !== 'artist') continue
    
    const role = (relation.type || '').toLowerCase()
    const name = relation.artist?.name || relation['target-credit'] || null
    
    if (!name) continue
    
    if (role.includes('lyricist')) {
      lyricists.push(name)
    } else if (role.includes('composer')) {
      composers.push(name)
    } else if (role.includes('writer') || role.includes('songwriter')) {
      writers.push(name)
    }
  }
  
  // Only return if we have at least one
  if (writers.length === 0 && composers.length === 0 && lyricists.length === 0) {
    return null
  }
  
  return {
    writers: writers.length > 0 ? writers : null,
    composers: composers.length > 0 ? composers : null,
    lyricists: lyricists.length > 0 ? lyricists : null
  }
}

// Extract publishing info from recording relations
function extractPublishing(recording) {
  if (!recording.relations) return null
  
  const publishers = []
  
  for (const relation of recording.relations) {
    if (relation['target-type'] === 'label' && relation.type?.toLowerCase().includes('publisher')) {
      const name = relation.label?.name || relation['target-credit'] || null
      if (name) publishers.push(name)
    }
  }
  
  return publishers.length > 0 ? { publishers } : null
}

// Extract track credits from recording
function extractTrackCredits(recording) {
  const credits = []
  
  // Artist credits (performers)
  if (recording['artist-credit']) {
    const artistCredits = Array.isArray(recording['artist-credit']) 
      ? recording['artist-credit'] 
      : [recording['artist-credit']]
    
    for (const ac of artistCredits) {
      if (ac && (ac.artist || ac.name)) {
        const name = ac.name || ac.artist?.name || null
        if (!name) continue
        
        // Check for instrument in attributes
        const instrument = ac.attributes?.[0] || null
        const role = instrument || 'Performer'
        
        credits.push({
          personName: name,
          role: role,
          instrument: instrument || null,
          notes: null
        })
      }
    }
  }
  
  // Relations (producers, engineers, etc.) - exclude songwriting roles
  if (recording.relations) {
    for (const relation of recording.relations) {
      if (relation.type && relation['target-type'] === 'artist') {
        const role = relation.type
        const lowerRole = role.toLowerCase()
        
        // Skip songwriting roles (handled separately)
        if (lowerRole.includes('writer') || 
            lowerRole.includes('composer') || 
            lowerRole.includes('lyricist')) {
          continue
        }
        
        const name = relation.artist?.name || relation['target-credit'] || null
        if (!name) continue
        
        credits.push({
          personName: name,
          role: role,
          instrument: null,
          notes: null
        })
      }
    }
  }
  
  return credits
}

// Extract album-level credits from release
function extractAlbumCredits(release) {
  const credits = []
  
  // Debug: Log release structure to understand what we're working with
  console.log('Release object for album credits:', release)
  console.log('Release relations:', release.relations)
  
  if (release.relations) {
    console.log(`Processing ${release.relations.length} relations`)
    for (let i = 0; i < release.relations.length; i++) {
      const relation = release.relations[i]
      console.log(`Relation ${i}:`, relation)
      console.log(`  - type: ${relation.type}`)
      console.log(`  - target-type: ${relation['target-type']}`)
      console.log(`  - artist:`, relation.artist)
      console.log(`  - attributes:`, relation.attributes)
      
      if (relation.type && relation['target-type'] === 'artist') {
        const name = relation.artist?.name || relation['target-credit'] || null
        console.log(`  - extracted name: ${name}`)
        if (!name) {
          console.log(`  - Skipping: no name found`)
          continue
        }
        
        const relationType = relation.type
        
        // Handle instrument relations - attributes contain instrument names
        if (relationType === 'instrument' && relation.attributes && relation.attributes.length > 0) {
          console.log(`  - Processing instrument relation with attributes:`, relation.attributes)
          // Create one credit per instrument
          for (const instrument of relation.attributes) {
            credits.push({
              personName: name,
              role: instrument, // Use instrument name as role (e.g., "bass", "guitar")
              instrument: null,
              notes: null
            })
          }
        } else if (relationType === 'vocal') {
          // Handle vocal relations
          const vocalType = relation.attributes && relation.attributes.length > 0
            ? relation.attributes[0] // e.g., "background vocals"
            : 'Vocals'
          credits.push({
            personName: name,
            role: vocalType,
            instrument: null,
            notes: null
          })
        } else {
          // Other relation types (producer, engineer, etc.)
          console.log(`  - Processing other relation type: ${relationType}`)
          credits.push({
            personName: name,
            role: relationType,
            instrument: null,
            notes: null
          })
        }
      } else {
        console.log(`  - Skipping: type=${relation.type}, target-type=${relation['target-type']}`)
      }
    }
  } else {
    console.log('No relations array found in release object')
  }
  
  console.log('Extracted album credits:', credits)
  return credits
}

// Extract recording info (studios/locations) from recording
function extractRecordingInfo(recording) {
  if (!recording.relations) return null
  
  const studios = []
  const locations = []
  
  for (const relation of recording.relations) {
    if (relation.type === 'recorded at' && relation['target-type'] === 'place') {
      const place = relation.place
      if (!place) continue
      
      const placeName = place.name || null
      const placeType = place.type || null
      
      if (placeName) {
        if (placeType === 'Studio') {
          studios.push(placeName)
        } else {
          locations.push(placeName)
        }
      }
    }
  }
  
  // Only return if we have data
  if (studios.length === 0 && locations.length === 0) {
    return null
  }
  
  return {
    studios: studios.length > 0 ? studios : null,
    locations: locations.length > 0 ? locations : null,
    recordingDates: null // Not available in this relation type
  }
}

// Extract Wikidata URL from release group relations
function extractWikidataUrl(releaseGroup) {
  // Check url-rels first (most common)
  if (releaseGroup['url-rels']) {
    for (const relation of releaseGroup['url-rels']) {
      if (relation.type === 'wikidata' && relation.url) {
        return relation.url.resource || null
      }
    }
  }
  
  // Fallback to relations array
  if (releaseGroup.relations) {
    for (const relation of releaseGroup.relations) {
      // Look for Wikidata relation
      if (relation.type === 'wikidata' && relation.url) {
        return relation.url.resource || null
      }
      // Also check for target-type wikidata
      if (relation['target-type'] === 'url' && relation.url) {
        const url = relation.url.resource || ''
        if (url.includes('wikidata.org')) {
          return url
        }
      }
    }
  }
  
  return null
}

// Extract Wikidata ID from Wikidata URL
function extractWikidataId(wikidataUrl) {
  if (!wikidataUrl) return null
  // Extract Q-number from URLs like https://www.wikidata.org/wiki/Q123456
  const match = wikidataUrl.match(/\/Q(\d+)/)
  return match ? `Q${match[1]}` : null
}

// Fetch Wikipedia page title from Wikidata ID
// @param {string} wikidataId - Wikidata entity ID
// @param {AbortSignal} signal - Optional AbortSignal for request cancellation
async function fetchWikipediaTitleFromWikidata(wikidataId, signal = null) {
  if (!wikidataId) return null
  
  try {
    // Wikidata API: Get sitelinks to find Wikipedia article
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=sitelinks&format=json&origin=*`
    
    // Use rateLimitedFetch for iOS Safari compatibility (better error handling and timeout)
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      },
      signal: signal || undefined
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const entities = data.entities || {}
    const entity = entities[wikidataId]
    
    if (entity && entity.sitelinks && entity.sitelinks.enwiki) {
      // Extract page title from sitelink
      return entity.sitelinks.enwiki.title || null
    }
  } catch (error) {
    console.warn('Error fetching Wikipedia title from Wikidata:', error)
  }
  
  return null
}

// Fetch Wikipedia content (intro/summary) for a page title
// @param {string} pageTitle - Wikipedia page title
// @param {AbortSignal} signal - Optional AbortSignal for request cancellation
export async function fetchWikipediaContent(pageTitle, signal = null) {
  if (!pageTitle) return null
  
  // iOS Safari workaround: Try alternative API endpoints if the REST API fails
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  // Try REST API first (standard approach)
  try {
    // Wikipedia REST API: Get page extract (intro text)
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`
    
    // Use rateLimitedFetch for iOS Safari compatibility (better error handling and timeout)
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      },
      signal: signal || undefined
    })
    
    if (!response.ok) {
      throw new Error(`REST API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Return extract (intro text) and full URL
    return {
      extract: data.extract || null,
      title: data.title || pageTitle,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`
    }
  } catch (error) {
    // iOS Safari fallback: Try older Wikipedia API format (might have different CORS settings)
    if (isIOS && error.message?.includes('Load failed')) {
      try {
        // Try the older Wikipedia API format with JSONP-style origin parameter
        const oldApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&origin=*`
        
        const oldResponse = await rateLimitedFetch(oldApiUrl, {
          headers: {
            'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
            'Accept': 'application/json'
          },
          signal: signal || undefined
        })
        
        if (oldResponse.ok) {
          const oldData = await oldResponse.json()
          const pages = oldData.query?.pages || {}
          const page = Object.values(pages)[0]
          
          if (page && page.extract) {
            return {
              extract: page.extract || null,
              title: page.title || pageTitle,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title || pageTitle)}`
            }
          }
        }
      } catch (oldError) {
        // Old API also failed, continue to return null
      }
    }
    
    console.warn('Error fetching Wikipedia content:', error)
    return null
  }
}

// Fetch Wikipedia content via MusicBrainz → Wikidata → Wikipedia
// @param {string} releaseGroupId - MusicBrainz release group ID
// @param {AbortSignal} signal - Optional AbortSignal for request cancellation
export async function fetchWikipediaContentFromMusicBrainz(releaseGroupId, signal = null) {
  try {
    // Fetch release group to get relations
    const releaseGroup = await fetchReleaseGroup(releaseGroupId, signal)
    
    // Step 1: Extract Wikidata URL from release group
    const wikidataUrl = extractWikidataUrl(releaseGroup)
    if (!wikidataUrl) {
      console.log('No Wikidata URL found in MusicBrainz relations')
      return null
    }
    
    // Step 2: Extract Wikidata ID
    const wikidataId = extractWikidataId(wikidataUrl)
    if (!wikidataId) {
      console.log('Could not extract Wikidata ID from URL:', wikidataUrl)
      return null
    }
    
    // Step 3: Fetch Wikipedia page title from Wikidata
    const wikipediaTitle = await fetchWikipediaTitleFromWikidata(wikidataId, signal)
    if (!wikipediaTitle) {
      console.log('Could not find Wikipedia page for Wikidata ID:', wikidataId)
      return null
    }
    
    // Step 4: Fetch Wikipedia content
    const wikipediaContent = await fetchWikipediaContent(wikipediaTitle, signal)
    if (!wikipediaContent) {
      console.log('Could not fetch Wikipedia content for:', wikipediaTitle)
      return null
    }
    
    return {
      ...wikipediaContent,
      wikidataUrl: wikidataUrl,
      wikidataId: wikidataId
    }
  } catch (error) {
    console.warn('Error fetching Wikipedia content from MusicBrainz:', error)
    return null
  }
}

// Fetch basic album info (title, artist, year, cover art) - Stage 1
export async function fetchAlbumBasicInfo(releaseGroupId) {
  const rg = await fetchReleaseGroup(releaseGroupId)
  
  // Extract basic info
  const artistName = extractArtistName(rg['artist-credit'])
  if (!artistName) {
    throw new Error('Could not extract artist name from MusicBrainz data - required field missing')
  }
  
  const releaseYear = rg['first-release-date'] 
    ? parseInt(rg['first-release-date'].substring(0, 4)) 
    : null
  
  // Get selected release ID for cover art
  const releases = rg.releases || []
  const officialReleases = releases.filter(r => r.status === 'Official')
  const sortedReleases = officialReleases.length > 0 
    ? officialReleases.sort((a, b) => {
        const dateA = a.date || '9999'
        const dateB = b.date || '9999'
        return dateA.localeCompare(dateB)
      })
    : releases.sort((a, b) => {
        const dateA = a.date || '9999'
        const dateB = b.date || '9999'
        return dateA.localeCompare(dateB)
      })
  
  const selectedReleaseId = sortedReleases[0]?.id || releases[0]?.id
  
  // Don't fetch cover art here - it will be loaded in parallel (non-blocking)
  
  return {
    releaseGroup: rg,
    releases: releases,
    sortedReleases: sortedReleases,
    selectedReleaseId: selectedReleaseId,
    basicInfo: {
      albumId: releaseGroupId,
      title: rg.title || '',
      artistName: artistName,
      releaseYear: releaseYear,
      coverArtUrl: null // Will be loaded separately
    }
  }
}

// Transform MusicBrainz data to album.v1.json schema
// If basicData is provided, reuse it to avoid duplicate API calls
export async function fetchAlbumData(releaseGroupId, basicData = null) {
  const retrievedAt = new Date().toISOString()
  
  let rg, releases, sortedReleases, selectedReleaseId, artistName, releaseYear, coverArtUrl
  
  if (basicData) {
    // Reuse data from fetchAlbumBasicInfo
    rg = basicData.releaseGroup
    releases = basicData.releases
    sortedReleases = basicData.sortedReleases
    selectedReleaseId = basicData.selectedReleaseId
    artistName = basicData.basicInfo.artistName
    releaseYear = basicData.basicInfo.releaseYear
    coverArtUrl = null // Cover art is loaded separately in parallel, will be updated by component
  } else {
    // Fetch release group (fallback if basicData not provided)
    rg = await fetchReleaseGroup(releaseGroupId)
    
    // Extract basic info
    artistName = extractArtistName(rg['artist-credit'])
    if (!artistName) {
      throw new Error('Could not extract artist name from MusicBrainz data - required field missing')
    }
    
    releaseYear = rg['first-release-date'] 
      ? parseInt(rg['first-release-date'].substring(0, 4)) 
      : null
    
    // Get selected release ID first (needed for cover art fallback)
    releases = rg.releases || []
    const officialReleases = releases.filter(r => r.status === 'Official')
    sortedReleases = officialReleases.length > 0 
      ? officialReleases.sort((a, b) => {
          const dateA = a.date || '9999'
          const dateB = b.date || '9999'
          return dateA.localeCompare(dateB)
        })
      : releases.sort((a, b) => {
          const dateA = a.date || '9999'
          const dateB = b.date || '9999'
          return dateA.localeCompare(dateB)
        })
    
    selectedReleaseId = sortedReleases[0]?.id || releases[0]?.id
    
    // Fetch cover art (try release group, then specific release)
    coverArtUrl = await fetchCoverArt(releaseGroupId, selectedReleaseId)
  }
  
  // Get releases and find official + earliest (already done above for cover art)
  if (!selectedReleaseId) {
    throw new Error('No releases found in release group')
  }
  
  // Fetch selected release with full details
  const release = await fetchRelease(selectedReleaseId)
  
  // Build editions array
  const editions = releases.map(r => ({
    editionId: r.id,
    status: r.status || null,
    country: r.country || null,
    date: r.date || null,
    label: null, // Will be populated from release details if available
    catalogNumber: null,
    barcode: null,
    formatSummary: null,
    packaging: null
  }))
  
  // Populate selected release edition details
  const selectedEdition = editions.find(e => e.editionId === selectedReleaseId)
  if (selectedEdition) {
    selectedEdition.label = release['label-info']?.[0]?.label?.name || null
    selectedEdition.catalogNumber = release['label-info']?.[0]?.['catalog-number'] || null
    selectedEdition.barcode = release.barcode || null
    selectedEdition.formatSummary = release.media?.[0]?.format || null
    selectedEdition.packaging = release.packaging || null
  }
  
  // Try to find a release with album credits
  // Start with the selected release, then try up to 3 more if needed
  let releaseWithCredits = release
  let albumCredits = extractAlbumCredits(release)
  
  if (albumCredits.length === 0 && sortedReleases.length > 1) {
    console.log('Selected release has no album credits, trying other releases...')
    // Try up to 3 more releases (limit to avoid too many API calls)
    const releasesToTry = sortedReleases.slice(1, 4) // Skip first (already tried), try next 3
    
    for (const releaseInfo of releasesToTry) {
      console.log(`Trying release ${releaseInfo.id} for album credits...`)
      const candidateRelease = await fetchRelease(releaseInfo.id)
      const candidateCredits = extractAlbumCredits(candidateRelease)
      
      if (candidateCredits.length > 0) {
        console.log(`Found album credits in release ${releaseInfo.id}`)
        releaseWithCredits = candidateRelease
        albumCredits = candidateCredits
        break // Found credits, stop searching
      }
    }
    
    if (albumCredits.length === 0) {
      console.log('No album credits found in any of the checked releases')
    }
  }
  
  // Build tracks array
  const tracks = []
  const trackCreditsMap = {}
  const recordingInfoMap = {}
  
  if (release.media) {
    for (const medium of release.media) {
      if (medium.tracks) {
        for (const track of medium.tracks) {
          const recording = track.recording
          if (!recording) continue
          
          const trackId = recording.id
          const position = parsePosition(track, medium)
          
          // Extract songwriting and publishing
          const songwriting = extractSongwriting(recording)
          const publishing = extractPublishing(recording)
          
          // Extract track credits
          const credits = extractTrackCredits(recording)
          if (credits.length > 0) {
            trackCreditsMap[trackId] = credits
          }
          
          // Extract recording info (studios/locations)
          // First try from the recording in the release response
          let recInfo = extractRecordingInfo(recording)
          
          // Skip individual recording fetches for place relations - too slow (10+ seconds for 10 tracks)
          // This is optional data (studios/locations) and can be deferred or skipped for performance
          // If we want this data later, we can lazy-load it when user expands track credits
          
          if (recInfo) {
            recordingInfoMap[trackId] = recInfo
          }
          
          tracks.push({
            trackId: trackId,
            position: position || track.number?.toString() || '',
            title: recording.title || '',
            durationMs: recording.length || null,
            songwriting: songwriting,
            publishing: publishing
          })
        }
      }
    }
  }
  
  // Note: albumCredits was already extracted above (trying multiple releases if needed)
  // Release-group relations are typically release-group-to-release-group, not artist credits
  
  // Extract Wikidata URL from release group relations
  const wikidataUrl = extractWikidataUrl(rg)
  
  // Build the album object conforming to album.v1.json
  return {
    albumId: releaseGroupId,
    title: rg.title || '',
    artistName: artistName,
    releaseYear: releaseYear,
    albumType: 'album',
    coverArtUrl: coverArtUrl,
    editions: editions,
    tracks: tracks,
    credits: {
      albumCredits: albumCredits.length > 0 ? albumCredits : null,
      trackCredits: Object.keys(trackCreditsMap).length > 0 ? trackCreditsMap : null
    },
    recordingInfo: Object.keys(recordingInfoMap).length > 0 ? recordingInfoMap : null,
    externalLinks: {
      musicbrainzReleaseGroupUrl: `https://musicbrainz.org/release-group/${releaseGroupId}`,
      musicbrainzSelectedReleaseUrl: `https://musicbrainz.org/release/${selectedReleaseId}`,
      wikidataUrl: wikidataUrl,
      discogsUrl: null
    },
    sources: [
      {
        sourceName: 'MusicBrainz',
        license: 'CC0',
        retrievedAt: retrievedAt
      },
      ...(coverArtUrl ? [{
        sourceName: 'Cover Art Archive',
        license: 'CC0',
        retrievedAt: retrievedAt
      }] : [])
    ],
    dataNotes: null
  }
}

