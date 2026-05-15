import React from 'react'
import { Text, View } from 'react-native'

export function HelpDataSourcesScreen() {
  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Help / Data Sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        This iOS scaffold uses read-only MusicBrainz artist-first album search and can enrich Album Detail with release-group information while Producer Search remains mock-only.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Current scaffold scope</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search and Results can display albums by a required artist, with an optional album title to narrow results. Release Type filters artist-only searches.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Not implemented yet</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Tracklists, credits, full edition metadata, and cover art are not loaded yet. No producer traversal is implemented yet.
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
    </View>
  )
}
