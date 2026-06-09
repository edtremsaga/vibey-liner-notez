import React, { useMemo, useState } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

const CONTROL_FONT_MAX_MULTIPLIER = 1.3
const DISPLAY_FONT_MAX_MULTIPLIER = 1.25

function matchesLibrarySearch(album, query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  return [album?.title, album?.artistName, album?.note]
    .some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery))
}

function sortSavedAlbums(albums) {
  return [...albums].sort((a, b) => {
    const updatedDifference = String(b?.updatedAt ?? '').localeCompare(String(a?.updatedAt ?? ''))
    return updatedDifference || String(a?.title ?? '').localeCompare(String(b?.title ?? ''))
  })
}

export function MyLibraryScreen({
  albums,
  errorMessage,
  isReady,
  onBackToSearch,
  onOpenAlbum,
  onRemoveAlbum
}) {
  const [query, setQuery] = useState('')
  const filteredAlbums = useMemo(
    () => sortSavedAlbums(albums).filter((album) => matchesLibrarySearch(album, query)),
    [albums, query]
  )
  const hasAlbums = albums.length > 0
  const hasMatches = filteredAlbums.length > 0

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
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

      <Text maxFontSizeMultiplier={DISPLAY_FONT_MAX_MULTIPLIER} style={{ color: '#f3f4f6', fontSize: 24, fontWeight: '700' }}>My Library</Text>
      <Text style={{ color: '#9ca3af', marginTop: 6 }}>
        Your saved album research and private notes, stored on this device.
      </Text>

      {!isReady && !errorMessage ? (
        <Text style={{ color: '#9ca3af', marginTop: 14 }}>Loading your library...</Text>
      ) : null}

      {!!errorMessage ? (
        <View
          style={{
            marginTop: 14,
            borderWidth: 1,
            borderColor: '#7f1d1d',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#2a1215'
          }}
        >
          <Text style={{ color: '#fecaca', fontWeight: '700' }}>My Library unavailable</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>{errorMessage}</Text>
        </View>
      ) : null}

      {isReady && hasAlbums ? (
        <TextInput
          accessibilityLabel="Search saved albums and private notes"
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Search albums, artists, or private notes"
          placeholderTextColor="#6b7280"
          returnKeyType="search"
          style={{
            marginTop: 14,
            borderWidth: 1,
            borderColor: '#4b5563',
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            color: '#f3f4f6',
            width: '100%'
          }}
          value={query}
        />
      ) : null}

      {isReady && !hasAlbums ? (
        <View
          style={{
            marginTop: 14,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 14,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '700', fontSize: 17 }}>No saved albums yet</Text>
          <Text style={{ color: '#9ca3af', marginTop: 5 }}>
            Save an album from Album Detail to start a private research notebook on this device.
          </Text>
        </View>
      ) : null}

      {isReady && hasAlbums && !hasMatches ? (
        <View
          style={{
            marginTop: 14,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 14,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '700', fontSize: 17 }}>No saved albums found</Text>
          <Text style={{ color: '#9ca3af', marginTop: 5 }}>
            Try another album, artist, or private-note search.
          </Text>
        </View>
      ) : null}

      {isReady && hasMatches
        ? filteredAlbums.map((album) => (
            <View
              key={album.releaseGroupId}
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#374151',
                borderRadius: 10,
                padding: 14,
                backgroundColor: '#181a1f'
              }}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Open saved album ${album.title}`}
                onPress={() => onOpenAlbum(album)}
              >
                <Text style={{ color: '#f9fafb', fontWeight: '700', fontSize: 18 }}>{album.title}</Text>
                <Text style={{ color: '#d1d5db', marginTop: 5 }}>{album.artistName}</Text>
                {!!(album.firstReleaseDate ?? album.releaseYear) ? (
                  <Text style={{ color: '#9ca3af', marginTop: 5 }}>
                    First released: {album.firstReleaseDate ?? album.releaseYear}
                  </Text>
                ) : null}
                {!!album.note.trim() ? (
                  <Text numberOfLines={3} style={{ color: '#9ca3af', marginTop: 8 }}>
                    Private note: {album.note.trim()}
                  </Text>
                ) : (
                  <Text style={{ color: '#6b7280', marginTop: 8 }}>No private note yet.</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Remove ${album.title} from My Library`}
                onPress={() => onRemoveAlbum(album.releaseGroupId)}
                style={{
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: '#7f1d1d',
                  borderRadius: 8,
                  paddingVertical: 7,
                  paddingHorizontal: 9,
                  alignSelf: 'flex-start'
                }}
              >
                <Text maxFontSizeMultiplier={CONTROL_FONT_MAX_MULTIPLIER} style={{ color: '#fca5a5', fontWeight: '600' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        : null}
    </ScrollView>
  )
}
