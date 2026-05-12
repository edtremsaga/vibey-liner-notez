import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export function ResultsScreen({ albums, onSelectAlbum }) {
  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Results</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>Mock results only (shared core fixture data).</Text>
      {albums.map((album) => (
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
