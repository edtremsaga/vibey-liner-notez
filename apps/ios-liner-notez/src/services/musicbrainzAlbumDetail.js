const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2'
const COVER_ART_ARCHIVE_BASE = 'https://coverartarchive.org'
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
  const writers = new Set()
  const composers = new Set()
  const lyricists = new Set()

  function addSongwritingRelation(relation) {
    if (relation?.['target-type'] !== 'artist') {
      return
    }

    const role = (relation.type || '').toLowerCase()
    const personName = relation.artist?.name || relation['target-credit'] || null
    if (!personName) {
      return
    }

    if (role.includes('lyricist')) {
      lyricists.add(personName)
    } else if (role.includes('composer')) {
      composers.add(personName)
    } else if (role.includes('writer') || role.includes('songwriter')) {
      writers.add(personName)
    }
  }

  for (const relation of relations) {
    addSongwritingRelation(relation)

    if (relation?.['target-type'] !== 'work') {
      continue
    }

    const workRelations = Array.isArray(relation?.work?.relations) ? relation.work.relations : []
    for (const workRelation of workRelations) {
      addSongwritingRelation(workRelation)
    }
  }

  if (writers.size === 0 && composers.size === 0 && lyricists.size === 0) {
    return null
  }

  return {
    writers: writers.size > 0 ? Array.from(writers) : null,
    composers: composers.size > 0 ? Array.from(composers) : null,
    lyricists: lyricists.size > 0 ? Array.from(lyricists) : null
  }
}

function extractPublishing(recording) {
  const relations = Array.isArray(recording?.relations) ? recording.relations : []
  const publishers = []

  for (const relation of relations) {
    if (relation?.['target-type'] !== 'label' || !relation?.type?.toLowerCase().includes('publisher')) {
      continue
    }

    const publisherName = relation.label?.name || relation['target-credit'] || null
    if (publisherName) {
      publishers.push(publisherName)
    }
  }

  return publishers.length > 0 ? { publishers } : null
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
          publishing: extractPublishing(recording)
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

function normalizeOptionalValue(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return value
}

function mergeSelectedReleaseEditionDetails(editions, release) {
  const selectedReleaseId = release?.id
  if (!selectedReleaseId || !Array.isArray(editions)) {
    return editions
  }

  return editions.map((edition) => {
    if (edition?.editionId !== selectedReleaseId) {
      return edition
    }

    return {
      ...edition,
      label: normalizeOptionalValue(release?.['label-info']?.[0]?.label?.name),
      catalogNumber: normalizeOptionalValue(release?.['label-info']?.[0]?.['catalog-number']),
      barcode: normalizeOptionalValue(release?.barcode),
      formatSummary: normalizeOptionalValue(release?.media?.[0]?.format),
      packaging: normalizeOptionalValue(release?.packaging)
    }
  })
}

function getPrimaryCoverImageUrl(coverArtData) {
  const images = Array.isArray(coverArtData?.images) ? coverArtData.images : []
  const frontImage = images.find((image) => image?.front === true)
  const primaryImage = frontImage ?? images[0] ?? null

  return primaryImage?.image ? primaryImage.image.replace('http://', 'https://') : null
}

function mapCoverArtImages(coverArtData) {
  const images = Array.isArray(coverArtData?.images) ? coverArtData.images : []

  return images
    .slice(0, 20)
    .map((image) => ({
      id: image?.id ?? null,
      image: image?.image ? image.image.replace('http://', 'https://') : null,
      thumbnails: image?.thumbnails
        ? {
            small: image.thumbnails.small ? image.thumbnails.small.replace('http://', 'https://') : null,
            large: image.thumbnails.large ? image.thumbnails.large.replace('http://', 'https://') : null,
            '250': image.thumbnails['250'] ? image.thumbnails['250'].replace('http://', 'https://') : null,
            '500': image.thumbnails['500'] ? image.thumbnails['500'].replace('http://', 'https://') : null,
            '1200': image.thumbnails['1200'] ? image.thumbnails['1200'].replace('http://', 'https://') : null
          }
        : null,
      front: image?.front || false,
      back: image?.back || false,
      types: Array.isArray(image?.types) ? image.types : [],
      approved: image?.approved || false
    }))
    .filter((image) => image.image)
}

async function fetchCoverArtArchivePrimaryImage(path) {
  const response = await fetch(`${COVER_ART_ARCHIVE_BASE}${path}`, {
    headers: {
      Accept: 'application/json'
    }
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Cover Art Archive lookup failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return getPrimaryCoverImageUrl(data)
}

async function fetchCoverArtArchiveJson(path) {
  const response = await fetch(`${COVER_ART_ARCHIVE_BASE}${path}`, {
    headers: {
      Accept: 'application/json'
    }
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Cover Art Archive lookup failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
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

export async function fetchMusicBrainzSelectedReleaseTracklist(selectedReleaseId, editions = []) {
  if (!selectedReleaseId) {
    throw new Error('MusicBrainz selected release id is required')
  }

  const params = new URLSearchParams({
    inc: 'recordings+artist-credits+recording-level-rels+work-rels+work-level-rels+release-rels+labels+artist-rels',
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
    editions: mergeSelectedReleaseEditionDetails(editions, release),
    tracks: mapReleaseToTracks(release),
    credits: {
      albumCredits: extractAlbumCredits(release),
      trackCredits: mapReleaseToTrackCredits(release)
    }
  }
}

export async function fetchMusicBrainzPrimaryCoverArt({ releaseGroupId, selectedReleaseId }) {
  if (!releaseGroupId) {
    return null
  }

  if (selectedReleaseId) {
    try {
      const releaseCoverArtUrl = await fetchCoverArtArchivePrimaryImage(`/release/${selectedReleaseId}`)
      if (releaseCoverArtUrl) {
        return releaseCoverArtUrl
      }
    } catch {
      // Cover art is optional; fall back to release-group art.
    }
  }

  try {
    return await fetchCoverArtArchivePrimaryImage(`/release-group/${releaseGroupId}`)
  } catch {
    return null
  }
}

export async function fetchMusicBrainzArtworkGallery(releaseGroupId) {
  if (!releaseGroupId) {
    return []
  }

  const coverArtData = await fetchCoverArtArchiveJson(`/release-group/${releaseGroupId}`)
  return coverArtData ? mapCoverArtImages(coverArtData) : []
}
