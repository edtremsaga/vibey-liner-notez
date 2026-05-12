import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export function AlbumDetailScreen({ album, onBackToResults }) {
  const [showLoading, setShowLoading] = useState(false)

  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Album Detail</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>Placeholder screen for album details and liner-note sections.</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setShowLoading((current) => !current)}
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: showLoading ? '#f3f4f6' : '#4b5563',
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 10,
          alignSelf: 'flex-start'
        }}
      >
        <Text style={{ color: '#f3f4f6', fontSize: 12 }}>
          {showLoading ? 'Hide Loading' : 'Show Loading'}
        </Text>
      </TouchableOpacity>
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
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading mock album detail...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Simulating album detail retrieval before content is available.
          </Text>
        </View>
      )}
      {album ? (
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
          <Text style={{ color: '#f3f4f6', fontSize: 18, fontWeight: '600' }}>{album.title}</Text>
          <Text style={{ color: '#d1d5db', marginTop: 4 }}>{album.artistName}</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>{album.releaseYear}</Text>
        </View>
      ) : (
        <Text style={{ color: '#9ca3af', marginTop: 12 }}>No album selected yet.</Text>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onBackToResults}
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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Back to Results</Text>
      </TouchableOpacity>
    </View>
  )
}
