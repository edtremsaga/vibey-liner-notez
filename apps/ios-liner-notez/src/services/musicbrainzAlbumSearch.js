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

function formatReleaseDate(firstReleaseDate) {
  if (!firstReleaseDate) {
    return null
  }

  return firstReleaseDate
}

export function mapMusicBrainzReleaseGroup(releaseGroup) {
  const firstReleaseDate = formatReleaseDate(releaseGroup?.['first-release-date'])

  return {
    id: releaseGroup?.id ?? null,
    releaseGroupId: releaseGroup?.id ?? null,
    title: releaseGroup?.title ?? 'Untitled album',
    artistCredit: extractArtistCredit(releaseGroup?.['artist-credit']) ?? 'Unknown artist',
    firstReleaseDate,
    releaseYear: firstReleaseDate ? firstReleaseDate.slice(0, 4) : null,
    disambiguation: releaseGroup?.disambiguation || null
  }
}

export async function searchMusicBrainzAlbumsByArtist({ artistName, albumTitle = '' }) {
  const trimmedArtist = artistName.trim()
  const trimmedAlbum = albumTitle.trim()

  if (!trimmedArtist) {
    throw new Error('Artist name is required')
  }

  const query = trimmedAlbum
    ? `artist:"${trimmedArtist}" AND release:"${trimmedAlbum}"`
    : `artist:"${trimmedArtist}" AND primarytype:album`

  const params = new URLSearchParams({
    query,
    limit: '20',
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

  return releaseGroups.map(mapMusicBrainzReleaseGroup).filter((result) => result.id && result.title)
}
