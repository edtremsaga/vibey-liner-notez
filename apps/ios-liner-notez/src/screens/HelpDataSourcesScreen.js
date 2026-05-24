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
        Search for an artist, browse release types, open a selected release, and dig into tracklists, available credits, artwork, editions, and source links.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Results come from public music data, so the app shows what is documented instead of guessing.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Get better album results</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Start with the artist name. Add an album title to narrow the search, or leave it blank to browse albums, singles, EPs, live releases, compilations, or soundtracks.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Open the result that best matches the release edition you want. Different editions can have different credits, artwork, labels, and source links.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Explore an album</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        On Album Detail, check the selected release, open artwork, expand tracks for song-level credits, and review Release Credits when available.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Editions & Sources keeps release-edition details and source links available when you want to inspect the data.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Follow producer connections</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search helps you discover releases connected by documented release-level producer credits.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        If a name is ambiguous, choose the correct person or artist. Searches can take a moment while Liner Notez checks MusicBrainz credits.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        It is a discovery tool, not a complete career discography, and may miss albums without documented release-level producer credits.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Why some credits are missing</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Credit data can vary by release edition. Older albums, reissues, compilations, imports, and country-specific editions may have different levels of detail.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        A missing credit usually means the public source does not document it for the selected release. Liner Notez does not invent credits.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Data sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        MusicBrainz provides album, release, track, credit, and relationship data.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Cover Art Archive provides album art and liner image files when available.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Wikidata and Wikipedia provide source-backed album article links when available.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>A few important notes</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is an informational music discovery app. Public music data may be incomplete, outdated, duplicated, or incorrect.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Credits can vary by release edition and source. The app is not an official label, artist, publisher, royalty, copyright, or legal-credit authority.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Artwork and metadata remain subject to their original sources. Verify important credit, licensing, royalty, publishing, or legal questions with official sources.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Source links are included when possible so you can judge confidence for yourself.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Independent app</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is independent and is not affiliated with or endorsed by MusicBrainz, MetaBrainz, Cover Art Archive, Wikidata, Wikipedia, artists, labels, rights holders, streaming services, or Apple unless explicitly stated.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Support</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        For support, questions, or feedback, contact vibeycraft@gmail.com.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Privacy and network data</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez does not require an account and does not intentionally collect personal information.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Searches and album lookups use the internet and may be sent to public data sources such as MusicBrainz, Cover Art Archive, Wikidata, and Wikipedia.
      </Text>
    </ScrollView>
  )
}
