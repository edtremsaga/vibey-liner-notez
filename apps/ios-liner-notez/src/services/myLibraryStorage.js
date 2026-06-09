import AsyncStorage from '@react-native-async-storage/async-storage'

export const MY_LIBRARY_STORAGE_KEY = '@liner-notez/my-library/v1'
export const MY_LIBRARY_SCHEMA_VERSION = 1

function normalizeOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeReleaseYear(value) {
  const year = Number(value)
  return Number.isInteger(year) && year > 0 ? year : null
}

function normalizeSavedAlbum(album) {
  const releaseGroupId = normalizeOptionalString(album?.releaseGroupId)
  const title = normalizeOptionalString(album?.title)
  const artistName = normalizeOptionalString(album?.artistName)

  if (!releaseGroupId || !title || !artistName) {
    return null
  }

  return {
    releaseGroupId,
    title,
    artistName,
    firstReleaseDate: normalizeOptionalString(album?.firstReleaseDate),
    releaseYear: normalizeReleaseYear(album?.releaseYear),
    disambiguation: normalizeOptionalString(album?.disambiguation),
    note: typeof album?.note === 'string' ? album.note : '',
    savedAt: normalizeOptionalString(album?.savedAt) ?? new Date().toISOString(),
    updatedAt: normalizeOptionalString(album?.updatedAt) ?? new Date().toISOString()
  }
}

function normalizeSavedAlbums(albums) {
  const albumsById = new Map()

  for (const album of Array.isArray(albums) ? albums : []) {
    const normalizedAlbum = normalizeSavedAlbum(album)
    if (normalizedAlbum) {
      albumsById.set(normalizedAlbum.releaseGroupId, normalizedAlbum)
    }
  }

  return Array.from(albumsById.values())
}

export function buildSavedAlbumSummary(album, existingAlbum = null) {
  const now = new Date().toISOString()
  const releaseGroupId = album?.albumId ?? album?.releaseGroupId ?? album?.id ?? null

  return normalizeSavedAlbum({
    releaseGroupId,
    title: album?.title,
    artistName: album?.artistName ?? album?.artistCredit,
    firstReleaseDate: album?.firstReleaseDate ?? null,
    releaseYear: album?.releaseYear ?? null,
    disambiguation: album?.disambiguation ?? null,
    note: existingAlbum?.note ?? '',
    savedAt: existingAlbum?.savedAt ?? now,
    updatedAt: now
  })
}

export async function loadMyLibrary() {
  const rawValue = await AsyncStorage.getItem(MY_LIBRARY_STORAGE_KEY)
  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue)
    if (parsedValue?.schemaVersion !== MY_LIBRARY_SCHEMA_VERSION || !Array.isArray(parsedValue?.albums)) {
      return []
    }

    return normalizeSavedAlbums(parsedValue.albums)
  } catch {
    return []
  }
}

export async function saveMyLibrary(albums) {
  const payload = {
    schemaVersion: MY_LIBRARY_SCHEMA_VERSION,
    albums: normalizeSavedAlbums(albums)
  }

  await AsyncStorage.setItem(MY_LIBRARY_STORAGE_KEY, JSON.stringify(payload))
  return payload.albums
}
