import React from 'react'
import { Text, View } from 'react-native'

export function HelpDataSourcesScreen() {
  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Help / Data Sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        This iOS scaffold is currently mock-data-only and helps us validate app flow and UI structure.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Current scaffold scope</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search, Results, Album Detail, Producer Search, and Help / Data Sources are available as mock screens.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Not implemented yet</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        No real API calls are active yet. No producer traversal is implemented yet.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Planned real sources</Text>
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
