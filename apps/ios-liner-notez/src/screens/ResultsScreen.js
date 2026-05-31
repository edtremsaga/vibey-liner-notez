import React, { useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

const RELEASE_TYPE_LABELS = {
  Album: 'Studio albums',
  EP: 'EPs',
  Single: 'Singles',
  Live: 'Live albums',
  Compilation: 'Compilations',
  Soundtrack: 'Soundtracks'
}

const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' }
]

const DISPLAY_FONT_MAX_MULTIPLIER = 1.25
const CONTROL_FONT_MAX_MULTIPLIER = 1.3

export function getDefaultSortOption({ albumTitle, releaseType }) {
  return !albumTitle && releaseType === 'Album' ? 'oldest' : 'newest'
}

function getSortableYear(album) {
  const year = album?.releaseYear ? Number(album.releaseYear) : null
  if (year && !Number.isNaN(year)) {
    return year
  }

  const dateYear = album?.firstReleaseDate ? Number(String(album.firstReleaseDate).slice(0, 4)) : null
  return dateYear && !Number.isNaN(dateYear) ? dateYear : null
}

function sortAlbums(albums, sortOption) {
  return [...albums].sort((a, b) => {
    const aYear = getSortableYear(a)
    const bYear = getSortableYear(b)

    if (aYear && bYear && aYear !== bYear) {
      return sortOption === 'oldest' ? aYear - bYear : bYear - aYear
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

function filterBootlegAlbums(albums, hideBootlegs) {
  return hideBootlegs ? albums.filter((album) => !album?.isBootleg) : albums
}

function getBootlegFilterLabel({ hiddenBootlegCount, hideBootlegs }) {
  const checkbox = hideBootlegs ? '☑' : '☐'
  if (hideBootlegs && hiddenBootlegCount > 0) {
    const bootlegLabel = hiddenBootlegCount === 1 ? 'bootleg' : 'bootlegs'
    return `${hiddenBootlegCount} ${bootlegLabel} hidden · ${checkbox} Hide`
  }

  return `${checkbox} Hide bootlegs`
}

function getDisambiguationLabel(disambiguation) {
  return String(disambiguation ?? '').trim().toLowerCase().startsWith('aka') ? 'Also known as' : 'Note'
}

function getEditionContext(album) {
  const releaseCount = Number(album?.releaseCount ?? 0)
  if (releaseCount <= 1) {
    return null
  }

  return `${releaseCount} editions in MusicBrainz`
}

export function ResultsScreen({
  albums,
  albumTitle,
  artistName,
  errorMessage,
  isLoading,
  releaseType = 'Album',
  sortOption = getDefaultSortOption({ albumTitle, releaseType }),
  onBackToSearch,
  onSelectAlbum,
  onSortOptionChange
}) {
  const [hideBootlegs, setHideBootlegs] = useState(true)
  const filteredAlbums = useMemo(
    () => filterBootlegAlbums(albums, hideBootlegs),
    [albums, hideBootlegs]
  )
  const hiddenBootlegCount = albums.length - filteredAlbums.length
  const showLoading = isLoading
  const showError = !isLoading && !!errorMessage
  const showEmpty = !isLoading && !errorMessage && artistName && filteredAlbums.length === 0
  const showResults = !isLoading && !errorMessage && filteredAlbums.length > 0
  const canFilterBootlegs = !isLoading && !errorMessage && albums.length > 0
  const canSortResults = showResults && !albumTitle
  const bootlegFilterLabel = getBootlegFilterLabel({ hiddenBootlegCount, hideBootlegs })
  const displayedAlbums = useMemo(
    () => (canSortResults ? sortAlbums(filteredAlbums, sortOption) : filteredAlbums),
    [filteredAlbums, canSortResults, sortOption]
  )
  const releaseTypeLabel = RELEASE_TYPE_LABELS[releaseType] ?? RELEASE_TYPE_LABELS.Album
  const resultsHeading = artistName
    ? albumTitle
      ? `Albums by ${artistName} matching "${albumTitle}"`
      : `${releaseTypeLabel} by ${artistName}`
    : 'Find albums by artist'
  const loadingDetail = artistName
    ? albumTitle
      ? `Looking for albums by ${artistName} matching "${albumTitle}".`
      : `Looking for ${releaseTypeLabel.toLowerCase()} by ${artistName}.`
    : 'Looking for MusicBrainz album results.'
  const emptyDetail = albumTitle
    ? 'Try another album title or search by artist only.'
    : hideBootlegs && albums.length > 0
      ? 'Only bootleg results were found. Turn off Hide bootlegs to show them.'
      : 'Try another artist name or choose a different release type.'

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator
    >
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onBackToSearch}
        style={{
          borderWidth: 1,
          borderColor: '#4b5563',
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 10,
          alignSelf: 'flex-start',
          marginBottom: 14
        }}
      >
        <Text maxFontSizeMultiplier={CONTROL_FONT_MAX_MULTIPLIER} style={{ color: '#f3f4f6', fontWeight: '600' }}>Back to Search</Text>
      </TouchableOpacity>

      <Text maxFontSizeMultiplier={DISPLAY_FONT_MAX_MULTIPLIER} style={{ color: '#f3f4f6', fontSize: 24, fontWeight: '700' }}>{resultsHeading}</Text>
      {showResults && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: '#9ca3af' }}>
            {filteredAlbums.length} {filteredAlbums.length === 1 ? 'result' : 'results'} from MusicBrainz
          </Text>
          {canFilterBootlegs && (
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hideBootlegs }}
              accessibilityLabel="Hide bootlegs"
              onPress={() => setHideBootlegs((current) => !current)}
              style={{
                alignSelf: 'flex-start',
                marginTop: 4,
                paddingVertical: 4
              }}
            >
              <Text maxFontSizeMultiplier={CONTROL_FONT_MAX_MULTIPLIER} style={{ color: '#9ca3af', fontWeight: '600' }}>
                {bootlegFilterLabel}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: '#6b7280', marginTop: 4 }}>
            MusicBrainz may list several editions or similarly named releases. Choose the album that best matches.
          </Text>
        </View>
      )}

      {canSortResults && (
        <View style={{ marginTop: 14 }}>
          <Text maxFontSizeMultiplier={CONTROL_FONT_MAX_MULTIPLIER} style={{ color: '#d1d5db', fontWeight: '700', marginBottom: 8 }}>Sort</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortOption === option.value
              return (
                <TouchableOpacity
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort results ${option.label.toLowerCase()}`}
                  onPress={() => onSortOptionChange?.(option.value)}
                  style={{
                    borderWidth: 1,
                    borderColor: isActive ? '#f3f4f6' : '#4b5563',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    backgroundColor: isActive ? '#1f2937' : 'transparent'
                  }}
                >
                  <Text maxFontSizeMultiplier={CONTROL_FONT_MAX_MULTIPLIER} style={{ color: '#f3f4f6', fontWeight: isActive ? '700' : '500' }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {canFilterBootlegs && !showResults && (
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hideBootlegs }}
          accessibilityLabel="Hide bootlegs"
          onPress={() => setHideBootlegs((current) => !current)}
          style={{
            alignSelf: 'flex-start',
            marginTop: 10,
            paddingVertical: 4
          }}
        >
          <Text maxFontSizeMultiplier={CONTROL_FONT_MAX_MULTIPLIER} style={{ color: '#9ca3af', fontWeight: '600' }}>
            {bootlegFilterLabel}
          </Text>
        </TouchableOpacity>
      )}

      {showLoading && (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '700', fontSize: 16 }}>Searching music data</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            {loadingDetail}
          </Text>
        </View>
      )}

      {showError && (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#7f1d1d',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#2a1215'
          }}
        >
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Music data search error</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>
            {errorMessage}
          </Text>
        </View>
      )}

      {showEmpty && (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '700', fontSize: 16 }}>No albums found</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            {emptyDetail}
          </Text>
        </View>
      )}

      {showResults &&
        displayedAlbums.map((album) => {
          const albumId = album?.releaseGroupId ?? album?.id ?? album?.albumId ?? null
          if (!albumId) {
            return null
          }

          const releaseDate = album.firstReleaseDate ?? album.releaseYear ?? null
          const editionContext = getEditionContext(album)

          return (
            <TouchableOpacity
              key={albumId}
              accessibilityRole="button"
              onPress={() => onSelectAlbum(albumId, album)}
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#374151',
                borderRadius: 10,
                padding: 14,
                backgroundColor: '#181a1f'
              }}
            >
              <Text style={{ color: '#f9fafb', fontWeight: '700', fontSize: 18 }}>{album.title}</Text>
              {!!(album.artistCredit ?? album.artistName) && (
                <Text style={{ color: '#d1d5db', marginTop: 6 }}>{album.artistCredit ?? album.artistName}</Text>
              )}
              {!!releaseDate && (
                <Text style={{ color: '#9ca3af', marginTop: 6 }}>First released: {releaseDate}</Text>
              )}
              {!!album.disambiguation && (
                <Text style={{ color: '#9ca3af', marginTop: 6 }}>
                  {getDisambiguationLabel(album.disambiguation)}: {album.disambiguation}
                </Text>
              )}
              {!!editionContext && (
                <Text style={{ color: '#6b7280', marginTop: 6 }}>{editionContext}</Text>
              )}
              <Text maxFontSizeMultiplier={CONTROL_FONT_MAX_MULTIPLIER} style={{ color: '#93c5fd', fontWeight: '600', marginTop: 10 }}>Open details</Text>
            </TouchableOpacity>
          )
        })}
    </ScrollView>
  )
}
