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

export function SearchScreen({ onSubmitArtistSearch }) {
  const [artistInput, setArtistInput] = useState('')
  const [albumInput, setAlbumInput] = useState('')
  const [releaseType, setReleaseType] = useState('Album')
  const [showReleaseTypes, setShowReleaseTypes] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const selectedReleaseType = RELEASE_TYPES.find((type) => type.value === releaseType) ?? RELEASE_TYPES[0]
  const showReleaseTypeSelector = !albumInput.trim()

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
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Search Albums</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search MusicBrainz albums by artist. Add an album title only to narrow results.
      </Text>

      <Text style={{ color: '#d1d5db', marginTop: 16, marginBottom: 6 }}>Artist name</Text>
      <TextInput
        accessibilityLabel="Artist search input"
        autoCapitalize="words"
        onChangeText={(value) => {
          setArtistInput(value)
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
          color: '#f3f4f6'
        }}
        value={artistInput}
      />

      <Text style={{ color: '#d1d5db', marginTop: 12, marginBottom: 6 }}>Album title (optional)</Text>
      <TextInput
        accessibilityLabel="Album search input"
        autoCapitalize="words"
        onChangeText={(value) => {
          setAlbumInput(value)
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
          color: '#f3f4f6'
        }}
        value={albumInput}
      />

      {showReleaseTypeSelector && (
        <View>
          <Text style={{ color: '#d1d5db', marginTop: 12, marginBottom: 6 }}>Release Type</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Release Type"
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
            <Text style={{ color: '#9ca3af' }}>{showReleaseTypes ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>

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
                    setReleaseType(type.value)
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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
