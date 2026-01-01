// MusicBrainz API service (for future steps)
// This file is preserved for reference but not used in Step 1
// Step 1 explicitly requires "no backend or live API calls yet"

// MusicBrainz API service
// Uses MusicBrainz REST API v2 (JSON)
// Note: MusicBrainz requires rate limiting (max 1 request per second)
// Outputs data conforming to album.v1.json schema

const MB_API_BASE = 'https://musicbrainz.org/ws/2'
const COVER_ART_BASE = 'https://coverartarchive.org'

// Simple rate limiter: ensure at least 1 second between requests
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

// Helper to format duration from milliseconds to MM:SS
export function formatDuration(ms) {
  if (!ms) return null
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Helper to extract artist name from artist-credit
function extractArtistName(artistCredit) {
  if (!artistCredit) return 'Unknown Artist'
  if (Array.isArray(artistCredit)) {
    return artistCredit.map(ac => ac.name || ac.artist?.name).filter(Boolean).join(', ') || 'Unknown Artist'
  }
  if (artistCredit.name) return artistCredit.name
  if (artistCredit.artist?.name) return artistCredit.artist.name
  return 'Unknown Artist'
}

// Helper to parse position from track number and disc
function parsePosition(track, medium) {
  // For multi-disc, format as "disc-track" (e.g., "1-1", "2-3")
  if (medium && medium.position && medium.position > 1) {
    return `${medium.position}-${track.number || ''}`
  }
  // Single disc: just use track number
  return track.number?.toString() || ''
}

// Search for release groups (albums)
export async function searchAlbums(query) {
  const url = `${MB_API_BASE}/release-group?query=${encodeURIComponent(query)}&limit=20&fmt=json`
  
  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data['release-groups'].map(rg => ({
      albumId: rg.id,
      title: rg.title,
      artistName: extractArtistName(rg['artist-credit']),
      releaseYear: rg['first-release-date'] ? parseInt(rg['first-release-date'].substring(0, 4)) : null
    }))
  } catch (error) {
    console.error('Error searching albums:', error)
    throw error
  }
}

// Get release group details and transform to album.v1.json schema
export async function getReleaseGroup(releaseGroupId) {
  const url = `${MB_API_BASE}/release-group/${releaseGroupId}?inc=releases&fmt=json`
  
  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`)
    }
    
    const rg = await response.json()
    const retrievedAt = new Date().toISOString()
    
    // Get cover art
    let coverArtUrl = null
    try {
      const coverResponse = await rateLimitedFetch(`${COVER_ART_BASE}/release-group/${releaseGroupId}`, {
        headers: {
          'User-Agent': 'liner-notez/1.0'
        }
      })
      if (coverResponse.ok) {
        const coverData = await coverResponse.json()
        const frontImage = coverData.images?.find(img => img.front === true)
        if (frontImage) {
          coverArtUrl = frontImage.image
        }
      }
    } catch (e) {
      // Cover art is optional
    }
    
    // Get all releases (editions)
    const releasePromises = (rg.releases || []).map(release => getRelease(release.id))
    const releases = await Promise.all(releasePromises)
    
    // Find default edition (official + earliest)
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
    
    const selectedRelease = sortedReleases[0] || releases[0]
    const selectedReleaseId = selectedRelease?.id || null
    
    // Extract artist name
    const artistName = extractArtistName(rg['artist-credit'])
    
    // Extract release year
    const releaseYear = rg['first-release-date'] 
      ? parseInt(rg['first-release-date'].substring(0, 4)) 
      : null
    
    // Build editions array (without nested tracklist)
    const editions = releases.map(r => ({
      editionId: r.id,
      status: r.status || null,
      country: r.country || null,
      date: r.date || null,
      label: r.labelInfo?.[0]?.label?.name || null,
      catalogNumber: r.labelInfo?.[0]?.['catalog-number'] || null,
      barcode: r.barcode || null,
      formatSummary: r.media?.[0]?.format || null,
      packaging: r.packaging || null
    }))
    
    // Build tracks array from selected release (without credits property)
    const tracks = (selectedRelease?.tracklist || []).map(track => ({
      trackId: track.trackId,
      position: track.position,
      title: track.title,
      durationMs: track.durationMs,
      songwriting: track.songwriting || null,
      publishing: track.publishing || null
    }))
    
    // Build credits object
    const albumCredits = selectedRelease?.albumCredits || []
    const trackCredits = {}
    if (selectedRelease?.tracklist) {
      for (const track of selectedRelease.tracklist) {
        if (track.credits && track.credits.length > 0) {
          trackCredits[track.trackId] = track.credits.map(c => ({
            personName: c.name,
            role: c.role,
            instrument: c.instrument || null,
            notes: null
          }))
        }
      }
    }
    
    // Build recordingInfo (if available)
    const recordingInfo = null // MusicBrainz doesn't always provide this explicitly
    
    // Build external links
    const externalLinks = {
      musicbrainzReleaseGroupUrl: `https://musicbrainz.org/release-group/${releaseGroupId}`,
      musicbrainzSelectedReleaseUrl: selectedReleaseId 
        ? `https://musicbrainz.org/release/${selectedReleaseId}`
        : `https://musicbrainz.org/release-group/${releaseGroupId}`,
      wikidataUrl: null, // Would need to fetch from Wikidata
      discogsUrl: null // Would need to fetch from Discogs
    }
    
    // Build sources array
    const sources = [
      {
        sourceName: 'MusicBrainz',
        license: 'CC0',
        retrievedAt
      }
    ]
    if (coverArtUrl) {
      sources.push({
        sourceName: 'Cover Art Archive',
        license: 'CC0',
        retrievedAt
      })
    }
    
    return {
      albumId: releaseGroupId,
      title: rg.title,
      artistName,
      releaseYear,
      albumType: 'album', // Always 'album' per schema
      coverArtUrl,
      editions,
      tracks,
      credits: {
        albumCredits: albumCredits.length > 0 
          ? albumCredits.map(c => ({
              personName: c.name,
              role: c.role,
              instrument: c.instrument || null,
              notes: null
            }))
          : null,
        trackCredits: Object.keys(trackCredits).length > 0 
          ? trackCredits 
          : null
      },
      recordingInfo,
      externalLinks,
      sources,
      dataNotes: null
    }
  } catch (error) {
    console.error('Error fetching release group:', error)
    throw error
  }
}

// Get release details with tracks and credits
async function getRelease(releaseId) {
  // Include recordings with artist-credits and recording-rels for better credit data
  const url = `${MB_API_BASE}/release/${releaseId}?inc=recordings+artist-credits+recording-rels+release-rels+labels&fmt=json`
  
  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'liner-notez/1.0 (https://github.com/yourusername/liner-notez)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`)
    }
    
    const release = await response.json()
    
    // Build tracklist with songwriting/publishing info
    const tracklist = []
    if (release.media) {
      for (const medium of release.media) {
        if (medium.tracks) {
          for (const track of medium.tracks) {
            const recording = track.recording
            const recordingCredits = extractCredits(recording)
            
            // Extract songwriting info from relations
            const songwriting = extractSongwriting(recording)
            const publishing = extractPublishing(recording)
            
            tracklist.push({
              trackId: recording.id,
              position: parsePosition(track, medium),
              title: recording.title,
              durationMs: recording.length || null,
              songwriting,
              publishing,
              credits: recordingCredits
            })
          }
        }
      }
    }
    
    // Extract album-level credits from release
    const albumCredits = extractAlbumCredits(release)
    
    return {
      id: release.id,
      title: release.title,
      date: release.date || null,
      country: release.country || null,
      status: release.status || null,
      packaging: release.packaging || null,
      labelInfo: release['label-info'] || [],
      barcode: release.barcode || null,
      media: release.media,
      tracklist,
      albumCredits
    }
  } catch (error) {
    console.error('Error fetching release:', error)
    throw error
  }
}

// Extract songwriting info (writers, composers, lyricists)
function extractSongwriting(recording) {
  const writers = []
  const composers = []
  const lyricists = []
  
  if (recording.relations) {
    for (const relation of recording.relations) {
      if (relation['target-type'] === 'artist') {
        const role = relation.type?.toLowerCase() || ''
        const name = relation.artist?.name || relation['target-credit'] || null
        
        if (!name) continue
        
        if (role.includes('writer') || role === 'lyricist') {
          if (role === 'lyricist') {
            lyricists.push(name)
          } else {
            writers.push(name)
          }
        } else if (role.includes('composer')) {
          composers.push(name)
        }
      }
    }
  }
  
  // Only return object if we have data
  if (writers.length === 0 && composers.length === 0 && lyricists.length === 0) {
    return null
  }
  
  return {
    writers: writers.length > 0 ? writers : null,
    composers: composers.length > 0 ? composers : null,
    lyricists: lyricists.length > 0 ? lyricists : null
  }
}

// Extract publishing info
function extractPublishing(recording) {
  const publishers = []
  
  if (recording.relations) {
    for (const relation of recording.relations) {
      if (relation['target-type'] === 'label' && relation.type?.toLowerCase().includes('publisher')) {
        const name = relation.label?.name || relation['target-credit'] || null
        if (name) publishers.push(name)
      }
    }
  }
  
  return publishers.length > 0 ? { publishers } : null
}

// Extract credits from a recording
function extractCredits(recording) {
  const credits = []
  
  // Artist credits (performers) - can be array or single object
  if (recording['artist-credit']) {
    const artistCredits = Array.isArray(recording['artist-credit']) 
      ? recording['artist-credit'] 
      : [recording['artist-credit']]
    
    for (const ac of artistCredits) {
      if (ac && (ac.artist || ac.name)) {
        // Extract instrument from attributes if available
        const instrument = ac.attributes?.[0] || null
        const role = instrument || 'Performer'
        credits.push({
          name: ac.name || ac.artist?.name || 'Unknown',
          role: normalizeRole(role),
          instrument: instrument || null
        })
      }
    }
  }
  
  // Relations (producers, engineers, songwriters, etc.)
  if (recording.relations) {
    for (const relation of recording.relations) {
      if (relation.type && relation['target-type'] === 'artist') {
        const role = relation.type
        const normalizedRole = normalizeRole(role)
        
        // Skip if it's a songwriting role (handled separately)
        if (normalizedRole.toLowerCase().includes('writer') || 
            normalizedRole.toLowerCase().includes('composer') ||
            normalizedRole.toLowerCase().includes('lyricist')) {
          continue
        }
        
        credits.push({
          name: relation.artist?.name || relation['target-credit'] || 'Unknown',
          role: normalizedRole,
          instrument: null
        })
      }
    }
  }
  
  return credits
}

// Normalize MusicBrainz role names to more readable forms
function normalizeRole(role) {
  const roleMap = {
    'producer': 'Producer',
    'engineer': 'Engineer',
    'mixer': 'Mixer',
    'mastering engineer': 'Mastering Engineer',
    'recording engineer': 'Recording Engineer',
    'arranger': 'Arranger',
    'performer': 'Performer',
    'vocals': 'Vocals',
    'guitar': 'Guitar',
    'bass guitar': 'Bass',
    'drums': 'Drums',
    'piano': 'Piano',
    'keyboard': 'Keyboard'
  }
  
  const lowerRole = role.toLowerCase()
  return roleMap[lowerRole] || role
}

// Extract album-level credits from release
function extractAlbumCredits(release) {
  const credits = []
  
  // Release-level relations (producers, engineers, etc. at album level)
  if (release.relations) {
    for (const relation of release.relations) {
      if (relation.type && relation['target-type'] === 'artist') {
        const role = relation.type
        const normalizedRole = normalizeRole(role)
        credits.push({
          name: relation.artist?.name || relation['target-credit'] || 'Unknown',
          role: normalizedRole,
          instrument: null
        })
      }
    }
  }
  
  return credits
}



