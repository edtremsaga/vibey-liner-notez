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
  if (timeSinceLastRequest < 1000) {
    // Check if request was aborted during delay
    if (options.signal && options.signal.aborted) {
      throw new Error('Request aborted')
    }
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest))
    // Check again after delay
    if (options.signal && options.signal.aborted) {
      throw new Error('Request aborted')
    }
  }
  lastRequestTime = Date.now()
  return fetch(url, options)
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

// Fetch cover art for release group or release
export async function fetchCoverArt(releaseGroupId, releaseId = null) {
  // Try release group first
  try {
    const response = await rateLimitedFetch(`${COVER_ART_BASE}/release-group/${releaseGroupId}`, {
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
          // Convert HTTP to HTTPS to avoid mixed content issues
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
      const response = await rateLimitedFetch(`${COVER_ART_BASE}/release/${releaseId}`, {
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
  try {
    const response = await rateLimitedFetch(`${COVER_ART_BASE}/release-group/${releaseGroupId}`, {
      headers: {
        'User-Agent': 'liner-notez/1.0'
      },
      signal: signal || undefined
    })
    
    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await response.json()
        const images = data.images || []
        
        // Limit to first 20 images
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
        
        return limitedImages
      }
    }
  } catch (e) {
    console.warn('Error fetching all album art from release group:', e)
    // Return empty array on error - gallery is optional
  }
  
  return [] // Return empty array if no images found
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
    
    const response = await fetch(url, {
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
  
  try {
    // Wikipedia API: Get page extract (intro text)
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      },
      signal: signal || undefined
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    // Return extract (intro text) and full URL
    return {
      extract: data.extract || null,
      title: data.title || pageTitle,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`
    }
  } catch (error) {
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

