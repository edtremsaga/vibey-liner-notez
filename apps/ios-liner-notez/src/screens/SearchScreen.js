import React, { useState } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

const RELEASE_TYPES = [
  { value: 'Album', label: 'Studio Albums' },
  { value: 'EP', label: 'EPs' },
  { value: 'Single', label: 'Singles' },
  { value: 'Live', label: 'Live Albums' },
  { value: 'Compilation', label: 'Compilations' },
  { value: 'Soundtrack', label: 'Soundtracks' }
]

export function SearchScreen({
  albumInput = '',
  artistInput = '',
  onAlbumInputChange,
  onArtistInputChange,
  onOpenHelpDataSources,
  onOpenProducerSearch,
  onReleaseTypeChange,
  onSubmitArtistSearch,
  releaseType = 'Album'
}) {
  const [showReleaseTypes, setShowReleaseTypes] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const selectedReleaseType = RELEASE_TYPES.find((type) => type.value === releaseType) ?? RELEASE_TYPES[0]
  const showReleaseTypeSelector = !albumInput.trim()

  function handleClearArtist() {
    onArtistInputChange('')
    if (validationMessage) {
      setValidationMessage('')
    }
  }

  function handleClearAlbum() {
    onAlbumInputChange('')
    if (validationMessage) {
      setValidationMessage('')
    }
  }

  function handleSearchPress() {
    const trimmedArtist = artistInput.trim()
    const trimmedAlbum = albumInput.trim()
    if (!trimmedArtist) {
      setValidationMessage('Please enter an artist name to continue.')
      return
    }

    setValidationMessage('')
    onSubmitArtistSearch({ artistName: trimmedArtist, albumTitle: trimmedAlbum, releaseType })
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <Text style={{ color: '#e5e7eb', fontSize: 24, fontWeight: '700' }}>Explore Album Liner Notes</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search by artist to browse albums, credits, tracklists, editions, sources, and liner images.
      </Text>

      <Text style={{ color: '#d1d5db', marginTop: 16, marginBottom: 6 }}>Artist name</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          accessibilityLabel="Artist search input"
          autoCapitalize="words"
          onChangeText={(value) => {
            onArtistInputChange(value)
            if (validationMessage) {
              setValidationMessage('')
            }
          }}
          placeholder="e.g. David Bowie"
          placeholderTextColor="#6b7280"
          style={{
            borderWidth: 1,
            borderColor: '#4b5563',
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            color: '#f3f4f6',
            flex: 1
          }}
          value={artistInput}
        />
        {!!artistInput && (
          <TouchableOpacity
            accessibilityLabel="Clear artist name"
            accessibilityRole="button"
            onPress={handleClearArtist}
            style={{
              borderWidth: 1,
              borderColor: '#374151',
              borderRadius: 8,
              minHeight: 42,
              minWidth: 42,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#9ca3af', fontSize: 18, fontWeight: '700' }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={{ color: '#d1d5db', marginTop: 12, marginBottom: 6 }}>Album title (optional)</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          accessibilityLabel="Album search input"
          autoCapitalize="words"
          onChangeText={(value) => {
            onAlbumInputChange(value)
            if (value.trim()) {
              setShowReleaseTypes(false)
            }
            if (validationMessage) {
              setValidationMessage('')
            }
          }}
          placeholder="e.g. Aladdin Sane (optional)"
          placeholderTextColor="#6b7280"
          style={{
            borderWidth: 1,
            borderColor: '#4b5563',
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            color: '#f3f4f6',
            flex: 1
          }}
          value={albumInput}
        />
        {!!albumInput && (
          <TouchableOpacity
            accessibilityLabel="Clear album title"
            accessibilityRole="button"
            onPress={handleClearAlbum}
            style={{
              borderWidth: 1,
              borderColor: '#374151',
              borderRadius: 8,
              minHeight: 42,
              minWidth: 42,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#9ca3af', fontSize: 18, fontWeight: '700' }}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={{ color: '#6b7280', marginTop: 5, fontSize: 13 }}>
        Optional: narrow results to a specific album.
      </Text>

      {showReleaseTypeSelector && (
        <View>
          <Text style={{ color: '#d1d5db', marginTop: 12, marginBottom: 6 }}>Release Type</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${showReleaseTypes ? 'Hide' : 'Show'} release type options`}
            onPress={() => setShowReleaseTypes((current) => !current)}
            style={{
              borderWidth: 1,
              borderColor: '#4b5563',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>{selectedReleaseType.label}</Text>
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showReleaseTypes ? '▾' : '▸'}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#6b7280', marginTop: 5, fontSize: 13 }}>
            Used when browsing an artist's albums.
          </Text>

          {showReleaseTypes && (
            <View
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: '#374151',
                borderRadius: 10,
                backgroundColor: '#181a1f',
                overflow: 'hidden'
              }}
            >
              {RELEASE_TYPES.map((type) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${type.label}`}
                  key={type.value}
                  onPress={() => {
                    onReleaseTypeChange(type.value)
                    setShowReleaseTypes(false)
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderTopWidth: type.value === 'Album' ? 0 : 1,
                    borderTopColor: '#374151'
                  }}
                >
                  <Text style={{ color: '#f3f4f6', fontWeight: type.value === releaseType ? '700' : '500' }}>
                    {type.value === releaseType ? '✓ ' : ''}
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {!!validationMessage && <Text style={{ color: '#fca5a5', marginTop: 8 }}>{validationMessage}</Text>}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={handleSearchPress}
        style={{
          marginTop: 16,
          borderWidth: 1,
          borderColor: '#4b5563',
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignSelf: 'flex-start'
        }}
      >
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Find Albums</Text>
      </TouchableOpacity>

      <View
        style={{
          marginTop: 20,
          borderTopWidth: 1,
          borderTopColor: '#1f2937',
          paddingTop: 14
        }}
      >
        <Text style={{ color: '#9ca3af', marginBottom: 8 }}>Other tools</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onOpenProducerSearch}
            style={{
              borderWidth: 1,
              borderColor: '#4b5563',
              borderRadius: 8,
              paddingVertical: 9,
              paddingHorizontal: 11
            }}
          >
            <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Producer Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onOpenHelpDataSources}
            style={{
              borderWidth: 1,
              borderColor: '#4b5563',
              borderRadius: 8,
              paddingVertical: 9,
              paddingHorizontal: 11
            }}
          >
            <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Help / Data Sources</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}
