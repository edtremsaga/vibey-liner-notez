import React, { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { getMockAlbums } from 'core-liner-notez'

export function SearchScreen({ onSubmitArtistSearch }) {
  const [artistInput, setArtistInput] = useState('')
  const [albumInput, setAlbumInput] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const mockAlbumPreview = getMockAlbums()[0]

  function handleSearchPress() {
    const trimmedArtist = artistInput.trim()
    const trimmedAlbum = albumInput.trim()
    if (!trimmedArtist) {
      setValidationMessage('Please enter an artist name to continue.')
      return
    }

    setValidationMessage('')
    onSubmitArtistSearch({ artistName: trimmedArtist, albumTitle: trimmedAlbum })
  }

  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Search</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search MusicBrainz albums by artist. Add an album title only to narrow results.
      </Text>
      <View
        style={{
          marginTop: 16,
          borderWidth: 1,
          borderColor: '#374151',
          borderRadius: 10,
          padding: 12,
          backgroundColor: '#181a1f'
        }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
          Mock album preview (shared core fixture)
        </Text>
        <Text style={{ color: '#f3f4f6', fontSize: 18, fontWeight: '600' }}>{mockAlbumPreview.title}</Text>
        <Text style={{ color: '#d1d5db', marginTop: 4 }}>{mockAlbumPreview.artistName}</Text>
        <Text style={{ color: '#9ca3af', marginTop: 4 }}>{mockAlbumPreview.releaseYear}</Text>
      </View>

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
        placeholder="e.g. R.E.M."
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
          if (validationMessage) {
            setValidationMessage('')
          }
        }}
        placeholder="e.g. Life's Rich Pageant"
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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Search Albums</Text>
      </TouchableOpacity>
    </View>
  )
}
