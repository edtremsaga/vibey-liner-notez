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
        Search for an artist, browse release types, open a selected release, and dig into the details that make an album feel alive: tracklists, available credits, artwork, editions, and source links.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Results come from public music data, so the app shows what is documented instead of guessing.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Get better album results</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Start with the artist name. Add an album title when you want to narrow the search, or leave it blank to browse a type of release such as albums, singles, EPs, live releases, compilations, or soundtracks.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Open the result that best matches the album or release edition you want. Different countries, reissues, formats, and release dates can have different credits, artwork, labels, and source links.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Explore an album</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        On Album Detail, check the selected release, open artwork when available, expand tracks to see song-level credits, and review Release Credits when they are documented for that selected release.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Editions & Sources keeps source links and release-edition details available when you want to inspect where the data came from.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Follow producer connections</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search helps you discover releases connected by documented MusicBrainz release-level producer credits.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        If a producer name is ambiguous, choose the correct person or artist from the candidate results. Producer searches can take a moment while Liner Notez checks release-level credits from MusicBrainz.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search is a discovery tool, not a complete career discography. It may miss albums where producer credits are not documented at the release level.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Why some credits are missing</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Music credit data can vary by release edition. Older albums, reissues, compilations, imports, and different countries' editions may have different levels of detail.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        A missing credit usually means the public data source does not document it for the selected release. Liner Notez does not invent credits; unavailable or missing data should be shown as not documented.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Data sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        MusicBrainz provides artist and release search, selected releases, tracklists, relationships, available credits, songwriting, instruments, publishing, edition details, source links, and producer-credit relationships.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Cover Art Archive provides album art, booklet pages, media images, tray images, back covers, and other release artwork when available.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Wikidata is used when MusicBrainz provides a Wikidata relation for an album release group. Wikipedia album article links are resolved from Wikidata sitelinks when available.
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
        The app does not require an account and does not intentionally collect personal information.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Searches and album lookups are sent to public metadata services such as MusicBrainz, Cover Art Archive, Wikidata, and Wikipedia so the app can retrieve results.
      </Text>
    </ScrollView>
  )
}
