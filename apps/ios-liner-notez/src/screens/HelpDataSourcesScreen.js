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
        Liner Notez is a music-credit research notebook for exploring album credits, tracklists, release editions, and documented contributors.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>What Liner Notez helps you do</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Search for an artist, browse releases, and explore documented credits for songwriters, producers, performers, publishers, and instruments.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Add album releases to My Library for later research, write private notes about them, and search your saved library entries and notes locally.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search helps you follow documented producer connections across releases.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is for album information, album credit research, and discovery. It does not play, stream, download, or provide music audio.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Find the right album or release</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Start with the artist name. Add an album title when you want a closer match, or leave the title blank to browse albums, singles, EPs, live releases, compilations, or soundtracks.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        For example, search David Bowie to browse releases. Add Aladdin Sane when you want a closer match.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Use Hide bootlegs to reduce unofficial or bootleg releases when MusicBrainz identifies them.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Tap to open the search result that best matches the album or release edition you want. Different countries, reissues, formats, and release dates can have different artwork, credits, labels, and source links.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Explore an album</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        On Album Detail, you can add an album release to My Library, write a private note about the album release, expand tracks for song-level credits, and review Release Credits when they are documented.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Editions & Sources keeps release details, attribution, and supplemental source links available when you want to inspect where the data came from.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Follow producer connections</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search helps you discover releases connected by documented release-level producer credits.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        If a producer name is ambiguous, choose the correct person from the candidate results. Producer searches can take a moment while Liner Notez checks documented producer credits.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Producer Search is a discovery tool, not a complete career discography. It may miss albums where producer credits are not documented at the release level.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Why credits may be missing</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Music credits can vary by release edition. Older albums, reissues, imports, compilations, and different countries’ editions may have different levels of detail.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        When a credit is missing, it usually means the public source record does not document it for the selected release. Liner Notez shows that as not documented.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Data sources</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez uses public music data from:
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        • MusicBrainz: album, release, track, credit, and relationship data.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        • Cover Art Archive: artwork and release images when available.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        • Wikidata and Wikipedia: background links when available through public source records.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Source links are shown when possible so you can inspect the underlying records.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        External links such as Wikipedia and source pages open in a browser view. Tap the checkmark at the top left to return to Liner Notez.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Artwork and source links appear only when they are available from connected public source records.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Important notes about the data</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Public music data is not always complete or consistent. Credits, artwork, dates, labels, and editions can differ across sources and releases.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is for music discovery and reference. For legal, royalty, licensing, publishing, or official credit questions, check official sources.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Independent app</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez is an independent app. It is not affiliated with or endorsed by MusicBrainz, MetaBrainz, Cover Art Archive, Wikidata, Wikipedia, artists, labels, rights holders, streaming services, or Apple.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Support</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        For support, questions, or feedback, contact vibeycraft@gmail.com.
      </Text>

      <Text style={{ color: '#e5e7eb', fontSize: 18, marginTop: 16 }}>Privacy and network use</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Liner Notez does not require an account or login.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        My Library entries and private notes are stored locally on your device. They are not synced to an account or shared with Liner Notez.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Searches and album lookups are sent to public music data services so the app can return results. The app needs an internet connection to search and load music data.
      </Text>
    </ScrollView>
  )
}
