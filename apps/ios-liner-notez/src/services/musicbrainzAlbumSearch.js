const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2'
const MUSICBRAINZ_USER_AGENT = 'liner-notez-ios/0.0.1 (https://github.com/edtremsaga/vibey-liner-notez)'

const RELEASE_TYPE_QUERIES = {
  Album: 'primarytype:album NOT secondarytype:live NOT secondarytype:compilation NOT secondarytype:soundtrack',
  EP: 'primarytype:ep',
  Single: 'primarytype:single',
  Live: 'primarytype:album AND secondarytype:live',
  Compilation: 'primarytype:album AND secondarytype:compilation',
  Soundtrack: 'primarytype:album AND secondarytype:soundtrack'
}
const BOOTLEG_STATUS_ID = '1156806e-d06a-38bd-83f0-cf2284a808b9'

function extractArtistCredit(artistCredit) {
  if (!Array.isArray(artistCredit)) {
    return null
  }

  const names = artistCredit
    .map((credit) => credit?.name || credit?.artist?.name)
    .filter(Boolean)

  return names.length > 0 ? names.join(', ') : null
}

function formatReleaseDate(firstReleaseDate) {
  if (!firstReleaseDate) {
    return null
  }

  return firstReleaseDate
}

export function mapMusicBrainzReleaseGroup(releaseGroup) {
  const firstReleaseDate = formatReleaseDate(releaseGroup?.['first-release-date'])
  const releases = Array.isArray(releaseGroup?.releases) ? releaseGroup.releases : []
  const isBootleg = releases.length > 0 && releases.every((release) => release?.['status-id'] === BOOTLEG_STATUS_ID)

  return {
    id: releaseGroup?.id ?? null,
    releaseGroupId: releaseGroup?.id ?? null,
    title: releaseGroup?.title ?? 'Untitled album',
    artistCredit: extractArtistCredit(releaseGroup?.['artist-credit']) ?? 'Unknown artist',
    firstReleaseDate,
    releaseYear: firstReleaseDate ? firstReleaseDate.slice(0, 4) : null,
    disambiguation: releaseGroup?.disambiguation || null,
    isBootleg
  }
}

function sortArtistOnlyResults(results) {
  return [...results].sort((a, b) => {
    const aYear = a.releaseYear ? Number(a.releaseYear) : null
    const bYear = b.releaseYear ? Number(b.releaseYear) : null

    if (aYear && bYear && bYear !== aYear) {
      return bYear - aYear
    }

    if (aYear && !bYear) {
      return -1
    }

    if (!aYear && bYear) {
      return 1
    }

    return (a.title || '').localeCompare(b.title || '')
  })
}

export async function searchMusicBrainzAlbumsByArtist({ artistName, albumTitle = '', releaseType = 'Album' }) {
  const trimmedArtist = artistName.trim()
  const trimmedAlbum = albumTitle.trim()

  if (!trimmedArtist) {
    throw new Error('Artist name is required')
  }

  const releaseTypeQuery = RELEASE_TYPE_QUERIES[releaseType] ?? RELEASE_TYPE_QUERIES.Album
  const query = trimmedAlbum
    ? `artist:"${trimmedArtist}" AND release:"${trimmedAlbum}"`
    : `artist:"${trimmedArtist}" AND ${releaseTypeQuery}`
  const isArtistOnlySearch = !trimmedAlbum

  const params = new URLSearchParams({
    query,
    limit: isArtistOnlySearch ? '100' : '20',
    offset: '0',
    inc: 'releases',
    fmt: 'json'
  })
  const url = `${MUSICBRAINZ_API_BASE}/release-group?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MUSICBRAINZ_USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(`MusicBrainz album search failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const releaseGroups = Array.isArray(data?.['release-groups']) ? data['release-groups'] : []
  const results = releaseGroups.map(mapMusicBrainzReleaseGroup).filter((result) => result.id && result.title)

  return isArtistOnlySearch ? sortArtistOnlyResults(results) : results
}
