import React from 'react'
import { ScrollView, Text, TouchableOpacity } from 'react-native'

export function HelpDataSourcesScreen({ onBackToSearch }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Back to Search</Text>
      </TouchableOpacity>

      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Help / Data Sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez uses read-only MusicBrainz artist-first album search and can enrich Album Detail with release-group information, selected-release credits, and optional primary cover art. Producer Search is not connected to real data yet.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Current app scope</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search and Results can display albums by a required artist, with an optional album title to narrow results. Release Type filters artist-only searches.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Not implemented yet</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Full edition metadata, album art gallery browsing, recording places/studios, and producer traversal are not loaded yet.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Data sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>MusicBrainz</Text>
      <Text style={{ color: '#9ca3af', marginTop: 4 }}>Cover Art Archive</Text>
      <Text style={{ color: '#9ca3af', marginTop: 4 }}>Wikidata</Text>
      <Text style={{ color: '#9ca3af', marginTop: 4 }}>Wikipedia</Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Data trust rule</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        We do not invent credits. If data is missing, it should be shown as unavailable or not documented.
      </Text>
    </ScrollView>
  )
}
