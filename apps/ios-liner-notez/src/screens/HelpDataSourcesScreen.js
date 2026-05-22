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
        Liner Notez helps explore albums, tracklists, credits, editions, sources, liner images, and album context from source-backed music data.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Current app scope</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search and Results use read-only MusicBrainz artist-first album search. Artist name is required, and Album title can narrow results.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Release Type filters artist-only searches. Search can filter Studio Albums, sort loaded Results by Oldest first or Newest first, and keep Search fields editable during the current app session.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search is available as a bounded, source-backed tool. It finds albums from documented MusicBrainz release-level producer credits.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Ambiguous producer names may ask you to choose the intended MusicBrainz artist or person before results load.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search does not promise a complete producer discography. Recording-level producer fallback is not implemented.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>MusicBrainz</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        MusicBrainz provides artist and release-group search, selected releases, tracklists, relationships, album and track credits, songwriting, instruments, publishing, edition details, source links, and producer-credit relationships.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search uses confident MusicBrainz artist matches when it can, then loads album results from MusicBrainz release groups.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Cover Art Archive</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Cover Art Archive provides album art, booklet pages, media images, tray images, back covers, and other release artwork when available.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Wikidata and Wikipedia</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Wikidata is used only when MusicBrainz provides a Wikidata relation for the album release group.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Wikipedia album article links are resolved from Wikidata sitelinks. Wikipedia URLs are not guessed from artist or title, and Wikipedia summary text is not fetched.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Data limitations</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Credits and producer results depend on what MusicBrainz contributors have entered. Some albums may have sparse credits, missing producer relationships, missing artwork, or no Wikipedia link.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        MusicBrainz release groups can include regional or unusual official album entries, so missing or surprising data should be expected sometimes.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Important notes about the data</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is an informational music discovery app. Metadata comes from public third-party sources and may be incomplete, outdated, duplicated, or incorrect.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Credits can vary by release, country, edition, reissue, or source. The app is not an official record-label, artist, publisher, royalty, copyright, or legal-credit authority.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Album artwork and metadata remain subject to the rights and terms of their original sources. Verify important credit, licensing, royalty, publishing, or legal questions with official sources.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Source links are provided when possible so you can judge confidence for yourself.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Trust rule</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        We do not invent credits. If data is missing, it should be shown as unavailable or not documented.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Support</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        For support, questions, or feedback, contact vibeycraft@gmail.com.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Privacy and network data</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        The app does not require an account and does not intentionally collect personal information.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Searches and album lookups are sent to public metadata services such as MusicBrainz, Cover Art Archive, Wikidata, and Wikipedia so the app can retrieve results.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Source disclaimer</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is an independent app and is not affiliated with or endorsed by MusicBrainz, MetaBrainz, Cover Art Archive, Wikidata, Wikipedia, artists, labels, rights holders, or Apple unless explicitly stated.
      </Text>
    </ScrollView>
  )
}
