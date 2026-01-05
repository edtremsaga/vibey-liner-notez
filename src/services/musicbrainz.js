// MusicBrainz API service
// Fetches data from MusicBrainz and transforms to album.v1.json schema
// No data invention - only uses values from MusicBrainz API responses

const MB_API_BASE = 'https://musicbrainz.org/ws/2'
const COVER_ART_BASE = 'https://coverartarchive.org'

// Rate limiter: MusicBrainz requires max 1 request per second
let lastRequestTime = 0
async function rateLimitedFetch(url, options) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest))
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

// Search for release groups by artist name and album name
export async function searchReleaseGroups(artistName, albumName) {
  if (!artistName || !albumName) {
    throw new Error('Both artist name and album name are required')
  }
  
  // Construct query: artist:"name" AND release:"name"
  const query = `artist:"${artistName}" AND release:"${albumName}"`
  const url = `${MB_API_BASE}/release-group?query=${encodeURIComponent(query)}&limit=20&fmt=json`
  
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
    
    // Transform to simple result format
    return releaseGroups.map(rg => ({
      releaseGroupId: rg.id,
      title: rg.title,
      artistName: extractArtistName(rg['artist-credit']),
      releaseYear: rg['first-release-date'] 
        ? parseInt(rg['first-release-date'].substring(0, 4)) 
        : null
    }))
  } catch (error) {
    console.error('Error searching release groups:', error)
    throw error
  }
}

// Fetch release group by MBID
async function fetchReleaseGroup(releaseGroupId) {
  const url = `${MB_API_BASE}/release-group/${releaseGroupId}?inc=releases+artist-credits+release-group-rels+artist-rels&fmt=json`
  
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
async function fetchCoverArt(releaseGroupId, releaseId = null) {
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

// Transform MusicBrainz data to album.v1.json schema
export async function fetchAlbumData(releaseGroupId) {
  const retrievedAt = new Date().toISOString()
  
  // Fetch release group
  const rg = await fetchReleaseGroup(releaseGroupId)
  
  // Extract basic info
  const artistName = extractArtistName(rg['artist-credit'])
  if (!artistName) {
    throw new Error('Could not extract artist name from MusicBrainz data - required field missing')
  }
  
  const releaseYear = rg['first-release-date'] 
    ? parseInt(rg['first-release-date'].substring(0, 4)) 
    : null
  
  // Get selected release ID first (needed for cover art fallback)
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
  
  // Fetch cover art (try release group, then specific release)
  const coverArtUrl = await fetchCoverArt(releaseGroupId, selectedReleaseId)
  
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
          
          // If not found, fetch recording individually to get place relations
          if (!recInfo) {
            const recordingWithPlaces = await fetchRecordingWithPlaces(trackId)
            if (recordingWithPlaces) {
              recInfo = extractRecordingInfo(recordingWithPlaces)
            }
          }
          
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
      wikidataUrl: null,
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

