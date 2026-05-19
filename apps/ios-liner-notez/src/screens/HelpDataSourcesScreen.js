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
        The album workflow is the main polished path. Producer Search remains separate and future-oriented.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>MusicBrainz</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        MusicBrainz provides artist and release-group search, selected releases, tracklists, relationships, album and track credits, songwriting, instruments, publishing, edition details, and source links.
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
        Credits depend on what MusicBrainz contributors have entered. Some albums may have sparse credits, missing artwork, or no Wikipedia link.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        MusicBrainz release groups can include regional or unusual official album entries, so missing or surprising data should be expected sometimes.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Trust rule</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        We do not invent credits. If data is missing, it should be shown as unavailable or not documented.
      </Text>
    </ScrollView>
  )
}
