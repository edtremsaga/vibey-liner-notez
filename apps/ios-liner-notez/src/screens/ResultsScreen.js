import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

const RELEASE_TYPE_LABELS = {
  Album: 'Studio albums',
  EP: 'EPs',
  Single: 'Singles',
  Live: 'Live albums',
  Compilation: 'Compilations',
  Soundtrack: 'Soundtracks'
}

export function ResultsScreen({ albums, albumTitle, artistName, errorMessage, isLoading, releaseType = 'Album', onSelectAlbum }) {
  const showLoading = isLoading
  const showError = !isLoading && !!errorMessage
  const showEmpty = !isLoading && !errorMessage && artistName && albums.length === 0
  const showResults = !isLoading && !errorMessage && albums.length > 0
  const releaseTypeLabel = RELEASE_TYPE_LABELS[releaseType] ?? RELEASE_TYPE_LABELS.Album
  const resultsHeading = artistName
    ? albumTitle
      ? `Albums by ${artistName} matching "${albumTitle}".`
      : `${releaseTypeLabel} by ${artistName}.`
    : 'Search by artist to load MusicBrainz album results.'
  const loadingDetail = artistName
    ? albumTitle
      ? `Looking for albums by ${artistName} matching "${albumTitle}".`
      : `Looking for ${releaseTypeLabel.toLowerCase()} by ${artistName}.`
    : 'Looking for MusicBrainz album results.'
  const emptyDetail = albumTitle
    ? 'Try another album title or search by artist only.'
    : 'Try another artist name or choose a different release type.'

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator
    >
      <Text style={{ color: '#f3f4f6', fontSize: 24, fontWeight: '700' }}>{resultsHeading}</Text>
      {showResults && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: '#9ca3af' }}>
            {albums.length} {albums.length === 1 ? 'result' : 'results'} from MusicBrainz
          </Text>
          <Text style={{ color: '#6b7280', marginTop: 4 }}>Album detail opens the current preview.</Text>
        </View>
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
          <Text style={{ color: '#d1d5db', fontWeight: '700', fontSize: 16 }}>Searching MusicBrainz</Text>
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
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>MusicBrainz search error</Text>
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
        albums.map((album) => {
          const albumId = album?.releaseGroupId ?? album?.id ?? album?.albumId ?? null
          if (!albumId) {
            return null
          }

          const releaseDate = album.firstReleaseDate ?? album.releaseYear ?? null
          const artistAndDate = [album.artistCredit ?? album.artistName, releaseDate].filter(Boolean).join(' - ')

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
              {!!artistAndDate && <Text style={{ color: '#d1d5db', marginTop: 6 }}>{artistAndDate}</Text>}
              {!!album.disambiguation && (
                <Text style={{ color: '#9ca3af', marginTop: 6 }}>{album.disambiguation}</Text>
              )}
              <Text style={{ color: '#93c5fd', fontWeight: '600', marginTop: 10 }}>Open preview</Text>
            </TouchableOpacity>
          )
        })}
    </ScrollView>
  )
}
