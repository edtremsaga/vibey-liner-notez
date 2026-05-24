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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Back to Album Search</Text>
      </TouchableOpacity>

      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Help / Data Sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez helps you explore albums the way liner notes used to: credits, musicians, producers, artwork, release editions, and source links using public music data.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>What Liner Notez helps you do</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Find an album, open a selected release, and dig into tracklists, available credits, artwork, editions, and source links.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez shows documented public music data instead of guessing.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Get better album results</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search with artist and album title together when you know both. Leave the album blank to browse albums, singles, EPs, live releases, compilations, or soundtracks.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        If several editions appear, open the one that best matches what you want. Different editions can have different credits, artwork, labels, and source links.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Explore an album</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        On Album Detail, open artwork, expand tracks for song-level credits, and review Release Credits when available.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Editions & Sources shows the selected release and the source links behind it.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Follow producer connections</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search follows documented release-level producer credits so you can discover connected albums.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        If a name is ambiguous, choose the correct person or artist. Searches can take a moment while Liner Notez checks MusicBrainz.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        It is a discovery tool, not a complete career discography, and may miss albums without documented producer credits.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Why credits may be missing</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Credits are only as complete as the public records for the selected release. Older albums, reissues, imports, compilations, and country-specific editions can vary.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        When a credit is missing, it usually means the source record does not document it there. Liner Notez does not invent credits.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Data sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        MusicBrainz supplies album, release, track, credit, and relationship data.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Cover Art Archive supplies artwork when available.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Wikidata and Wikipedia help with background links when available.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>A few notes</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Public music data may be incomplete, outdated, duplicated, or incorrect.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is for music discovery, not official credit, licensing, royalty, publishing, or legal questions. Check official sources for anything important.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Source links are included when possible so you can inspect the data yourself.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Independent app</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is independent. It is not affiliated with MusicBrainz, Cover Art Archive, Wikidata, Wikipedia, artists, labels, rights holders, streaming services, or Apple.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Support</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        For support, questions, or feedback, contact vibeycraft@gmail.com.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Privacy and network data</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez needs an internet connection to search and load music data.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Searches may be sent to public data sources so the app can return results. The app does not require an account.
      </Text>
    </ScrollView>
  )
}
