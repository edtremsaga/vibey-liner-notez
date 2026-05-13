import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export function ResultsScreen({ albums, onSelectAlbum }) {
  const [mockState, setMockState] = useState('results')

  const showLoading = mockState === 'loading'
  const showResults = mockState === 'results'
  const showEmpty = mockState === 'empty'
  const showError = mockState === 'error'

  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Results</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>Mock results only (shared core fixture data).</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('loading')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'loading' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Loading</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('results')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'results' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('empty')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'empty' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Empty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('error')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'error' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Error</Text>
        </TouchableOpacity>
      </View>

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
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading mock album results...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Simulating the in-flight state before results are shown.
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
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Mock error state</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>
            We could not load album results. Please try again.
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
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>No albums found (mock empty state)</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Try another artist or album name in Search.
          </Text>
        </View>
      )}

      {showResults &&
        albums.map((album) => (
          <TouchableOpacity
            key={album.albumId}
            accessibilityRole="button"
            onPress={() => onSelectAlbum(album)}
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
            <Text style={{ color: '#d1d5db', marginTop: 4 }}>{album.artistName}</Text>
            <Text style={{ color: '#9ca3af', marginTop: 4 }}>{album.releaseYear}</Text>
          </TouchableOpacity>
        ))}
    </View>
  )
}
