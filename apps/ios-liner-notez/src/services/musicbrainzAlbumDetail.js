const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2'
const MUSICBRAINZ_USER_AGENT = 'liner-notez-ios/0.0.1 (https://github.com/edtremsaga/vibey-liner-notez)'

function extractArtistCredit(artistCredit) {
  if (!Array.isArray(artistCredit)) {
    return null
  }

  const names = artistCredit
    .map((credit) => credit?.name || credit?.artist?.name)
    .filter(Boolean)

  return names.length > 0 ? names.join(', ') : null
}

function getReleaseYear(firstReleaseDate) {
  if (!firstReleaseDate) {
    return null
  }

  const releaseYear = Number(firstReleaseDate.slice(0, 4))
  return Number.isNaN(releaseYear) ? null : releaseYear
}

function sortReleasesForSelectedRelease(releases) {
  const sorted = [...releases].sort((a, b) => {
    const dateA = a?.date || '9999'
    const dateB = b?.date || '9999'
    return dateA.localeCompare(dateB)
  })
  const officialReleases = sorted.filter((release) => release?.status === 'Official')

  return officialReleases.length > 0 ? officialReleases : sorted
}

function mapReleaseToEdition(release) {
  return {
    editionId: release?.id ?? null,
    status: release?.status ?? null,
    country: release?.country ?? null,
    date: release?.date ?? null,
    label: null,
    catalogNumber: null,
    barcode: null,
    formatSummary: null,
    packaging: null
  }
}

function parseTrackPosition(track, medium) {
  if (!track?.number) {
    return null
  }

  if (medium?.position && medium.position > 1) {
    return `${medium.position}-${track.number}`
  }

  return track.number.toString()
}

function extractTrackCredits(recording) {
  const credits = []

  const artistCredits = Array.isArray(recording?.['artist-credit'])
    ? recording['artist-credit']
    : recording?.['artist-credit']
      ? [recording['artist-credit']]
      : []

  for (const credit of artistCredits) {
    const personName = credit?.name || credit?.artist?.name || null
    if (!personName) {
      continue
    }

    const instrument = Array.isArray(credit?.attributes) && credit.attributes.length > 0
      ? credit.attributes[0]
      : null

    credits.push({
      personName,
      role: instrument || 'Performer',
      instrument,
      notes: null
    })
  }

  const relations = Array.isArray(recording?.relations) ? recording.relations : []
  for (const relation of relations) {
    if (!relation?.type || relation?.['target-type'] !== 'artist') {
      continue
    }

    const role = relation.type
    const lowerRole = role.toLowerCase()
    if (lowerRole.includes('writer') || lowerRole.includes('composer') || lowerRole.includes('lyricist')) {
      continue
    }

    const personName = relation.artist?.name || relation['target-credit'] || null
    if (!personName) {
      continue
    }

    credits.push({
      personName,
      role,
      instrument: null,
      notes: null
    })
  }

  return credits
}

function extractSongwriting(recording) {
  const relations = Array.isArray(recording?.relations) ? recording.relations : []
  const writers = []
  const composers = []
  const lyricists = []

  for (const relation of relations) {
    if (relation?.['target-type'] !== 'artist') {
      continue
    }

    const role = (relation.type || '').toLowerCase()
    const personName = relation.artist?.name || relation['target-credit'] || null
    if (!personName) {
      continue
    }

    if (role.includes('lyricist')) {
      lyricists.push(personName)
    } else if (role.includes('composer')) {
      composers.push(personName)
    } else if (role.includes('writer') || role.includes('songwriter')) {
      writers.push(personName)
    }
  }

  if (writers.length === 0 && composers.length === 0 && lyricists.length === 0) {
    return null
  }

  return {
    writers: writers.length > 0 ? writers : null,
    composers: composers.length > 0 ? composers : null,
    lyricists: lyricists.length > 0 ? lyricists : null
  }
}

function extractAlbumCredits(release) {
  const credits = []
  const relations = Array.isArray(release?.relations) ? release.relations : []

  for (const relation of relations) {
    if (!relation?.type || relation?.['target-type'] !== 'artist') {
      continue
    }

    const personName = relation.artist?.name || relation['target-credit'] || null
    if (!personName) {
      continue
    }

    const relationType = relation.type
    const attributes = Array.isArray(relation.attributes) ? relation.attributes.filter(Boolean) : []

    if (relationType === 'instrument' && attributes.length > 0) {
      for (const instrument of attributes) {
        credits.push({
          personName,
          role: instrument,
          instrument: null,
          notes: null
        })
      }
      continue
    }

    if (relationType === 'vocal') {
      credits.push({
        personName,
        role: attributes[0] || 'Vocals',
        instrument: null,
        notes: null
      })
      continue
    }

    credits.push({
      personName,
      role: relationType,
      instrument: null,
      notes: null
    })
  }

  return credits
}

function mapReleaseToTracks(release) {
  const media = Array.isArray(release?.media) ? release.media : []

  return media.flatMap((medium) => {
    const tracks = Array.isArray(medium?.tracks) ? medium.tracks : []

    return tracks
      .map((track) => {
        const recording = track?.recording
        if (!recording) {
          return null
        }

        const position = parseTrackPosition(track, medium) || track?.number?.toString() || ''

        return {
          trackId: recording.id ?? track?.id ?? `${medium?.position ?? 1}-${position}`,
          position,
          title: recording.title || track?.title || '',
          durationMs: recording.length ?? track?.length ?? null,
          songwriting: extractSongwriting(recording),
          publishing: null
        }
      })
      .filter(Boolean)
  })
}

function mapReleaseToTrackCredits(release) {
  const media = Array.isArray(release?.media) ? release.media : []
  const trackCredits = {}

  for (const medium of media) {
    const tracks = Array.isArray(medium?.tracks) ? medium.tracks : []
    for (const track of tracks) {
      const recording = track?.recording
      if (!recording?.id) {
        continue
      }

      const credits = extractTrackCredits(recording)
      if (credits.length > 0) {
        trackCredits[recording.id] = credits
      }
    }
  }

  return Object.keys(trackCredits).length > 0 ? trackCredits : null
}

export async function fetchMusicBrainzAlbumBasicInfo(releaseGroupId) {
  if (!releaseGroupId) {
    throw new Error('MusicBrainz release-group id is required')
  }

  const params = new URLSearchParams({
    inc: 'releases+artist-credits+release-group-rels+artist-rels+url-rels',
    fmt: 'json'
  })
  const url = `${MUSICBRAINZ_API_BASE}/release-group/${releaseGroupId}?${params.toString()}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MUSICBRAINZ_USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(`MusicBrainz release-group detail failed: ${response.status} ${response.statusText}`)
  }

  const releaseGroup = await response.json()
  const releases = Array.isArray(releaseGroup?.releases) ? releaseGroup.releases : []
  const sortedReleases = sortReleasesForSelectedRelease(releases)
  const selectedReleaseId = sortedReleases[0]?.id ?? releases[0]?.id ?? null
  const selectedRelease = selectedReleaseId
    ? releases.find((release) => release?.id === selectedReleaseId) ?? sortedReleases[0] ?? null
    : null
  const remainingReleases = releases.filter((release) => release?.id && release.id !== selectedReleaseId)
  const editions = [
    ...(selectedRelease ? [selectedRelease] : []),
    ...remainingReleases
  ].map(mapReleaseToEdition).filter((edition) => edition.editionId)
  const firstReleaseDate = releaseGroup?.['first-release-date'] ?? null
  const retrievedAt = new Date().toISOString()

  return {
    albumId: releaseGroup?.id ?? releaseGroupId,
    title: releaseGroup?.title ?? null,
    artistName: extractArtistCredit(releaseGroup?.['artist-credit']),
    firstReleaseDate,
    releaseYear: getReleaseYear(firstReleaseDate),
    disambiguation: releaseGroup?.disambiguation || null,
    selectedReleaseId,
    editions,
    externalLinks: {
      musicbrainzReleaseGroupUrl: `https://musicbrainz.org/release-group/${releaseGroup?.id ?? releaseGroupId}`,
      musicbrainzSelectedReleaseUrl: selectedReleaseId ? `https://musicbrainz.org/release/${selectedReleaseId}` : null,
      wikidataUrl: null,
      discogsUrl: null
    },
    sources: [
      {
        sourceName: 'MusicBrainz',
        license: 'CC0',
        retrievedAt
      }
    ]
  }
}

export async function fetchMusicBrainzSelectedReleaseTracklist(selectedReleaseId) {
  if (!selectedReleaseId) {
    throw new Error('MusicBrainz selected release id is required')
  }

  const params = new URLSearchParams({
    inc: 'recordings+artist-credits+recording-level-rels+release-rels+labels+artist-rels',
    fmt: 'json'
  })
  const url = `${MUSICBRAINZ_API_BASE}/release/${selectedReleaseId}?${params.toString()}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MUSICBRAINZ_USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(`MusicBrainz selected release tracklist failed: ${response.status} ${response.statusText}`)
  }

  const release = await response.json()

  return {
    selectedReleaseId: release?.id ?? selectedReleaseId,
    tracks: mapReleaseToTracks(release),
    credits: {
      albumCredits: extractAlbumCredits(release),
      trackCredits: mapReleaseToTrackCredits(release)
    }
  }
}
