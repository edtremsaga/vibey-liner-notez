import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { mockAlbumFixture } from 'core-liner-notez'

export function SearchScreen({ onViewMockResults }) {
  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Search</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>Placeholder screen for album search flow.</Text>
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
        <Text style={{ color: '#f3f4f6', fontSize: 18, fontWeight: '600' }}>{mockAlbumFixture.title}</Text>
        <Text style={{ color: '#d1d5db', marginTop: 4 }}>{mockAlbumFixture.artistName}</Text>
        <Text style={{ color: '#9ca3af', marginTop: 4 }}>{mockAlbumFixture.releaseYear}</Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onViewMockResults}
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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>View Mock Results</Text>
      </TouchableOpacity>
    </View>
  )
}
