import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export function ResultsScreen({ albums, errorMessage, isLoading, query, onSelectAlbum }) {
  const showLoading = isLoading
  const showError = !isLoading && !!errorMessage
  const showEmpty = !isLoading && !errorMessage && query && albums.length === 0
  const showResults = !isLoading && !errorMessage && albums.length > 0

  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Results</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        {query ? `MusicBrainz album results for "${query}".` : 'Search for an album to load MusicBrainz results.'}
      </Text>

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
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading MusicBrainz album results...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Searching the MusicBrainz release-group catalog.
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
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>No albums found</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Try another album title in Search.
          </Text>
        </View>
      )}

      {showResults &&
        albums.map((album) => {
          const albumId = album?.releaseGroupId ?? album?.id ?? album?.albumId ?? null
          if (!albumId) {
            return null
          }

          return (
            <TouchableOpacity
              key={albumId}
              accessibilityRole="button"
              onPress={() => onSelectAlbum(albumId)}
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#374151',
                borderRadius: 10,
                padding: 12,
                backgroundColor: '#181a1f'
              }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '600', fontSize: 16 }}>{album.title}</Text>
              <Text style={{ color: '#d1d5db', marginTop: 4 }}>{album.artistCredit ?? album.artistName}</Text>
              {!!(album.firstReleaseDate ?? album.releaseYear) && (
                <Text style={{ color: '#9ca3af', marginTop: 4 }}>
                  {album.firstReleaseDate ?? album.releaseYear}
                </Text>
              )}
              {!!album.disambiguation && (
                <Text style={{ color: '#9ca3af', marginTop: 4 }}>{album.disambiguation}</Text>
              )}
            </TouchableOpacity>
          )
        })}
    </View>
  )
}
