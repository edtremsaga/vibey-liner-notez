import React, { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

function formatDuration(durationMs) {
  if (!durationMs || Number.isNaN(durationMs)) {
    return null
  }
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function AlbumDetailScreen({ album, errorMessage, isLoading, onBackToResults }) {
  const [showLoading, setShowLoading] = useState(false)
  const [showTracklist, setShowTracklist] = useState(true)
  const [showCredits, setShowCredits] = useState(true)
  const [showEditionsSources, setShowEditionsSources] = useState(true)

  const hasAlbum = !!album
  const isRealMusicBrainzDetail = hasAlbum && album.isRealMusicBrainzDetail
  const hasTracks = hasAlbum && Array.isArray(album.tracks) && album.tracks.length > 0
  const hasAlbumCredits =
    hasAlbum &&
    album.credits &&
    Array.isArray(album.credits.albumCredits) &&
    album.credits.albumCredits.length > 0
  const hasEditions = hasAlbum && Array.isArray(album.editions) && album.editions.length > 0
  const hasSources = hasAlbum && Array.isArray(album.sources) && album.sources.length > 0
  const selectedEdition = hasEditions ? album.editions[0] : null
  const selectedEditionLabel = selectedEdition
    ? selectedEdition.label || selectedEdition.editionId || album.title
    : null
  const selectedEditionRows = selectedEdition
    ? [
        ['Country', selectedEdition.country],
        ['Date', selectedEdition.date],
        ['Status', selectedEdition.status],
        ['Format', selectedEdition.formatSummary],
        ['Label', selectedEdition.label],
        ['Catalog #', selectedEdition.catalogNumber],
        ['Barcode', selectedEdition.barcode]
      ].filter(([, value]) => !!value)
    : []
  const editionRows = hasEditions ? album.editions.slice(0, 8) : []
  const externalLinks = hasAlbum && album.externalLinks ? album.externalLinks : {}
  const externalLinkRows = [
    ['MusicBrainz release group', externalLinks.musicbrainzReleaseGroupUrl],
    ['MusicBrainz selected release', externalLinks.musicbrainzSelectedReleaseUrl],
    ['Wikidata', externalLinks.wikidataUrl],
    ['Discogs', externalLinks.discogsUrl]
  ].filter(([, value]) => !!value)
  const trackCreditsByTrackId = hasAlbum && album.credits?.trackCredits ? album.credits.trackCredits : {}
  const hasTrackCredits =
    hasTracks &&
    album.tracks.some((track) => Array.isArray(trackCreditsByTrackId[track.trackId]) && trackCreditsByTrackId[track.trackId].length > 0)

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator
    >
      <Text style={{ color: '#e5e7eb', fontSize: 30, fontWeight: '500' }}>Album Detail</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        {isRealMusicBrainzDetail
          ? hasTrackCredits
            ? 'Real MusicBrainz album header, tracklist, and selected-release track credits.'
            : hasTracks
              ? 'Real MusicBrainz album header and tracklist. Credits are not documented for this selected release yet.'
            : 'Real MusicBrainz album header. Tracklist and credits are not loaded yet.'
          : 'Mock detail layout preview (iOS scaffold only).'}
      </Text>

      {!isRealMusicBrainzDetail && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setShowLoading((current) => !current)}
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: showLoading ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10,
            alignSelf: 'flex-start'
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>
            {showLoading ? 'Hide Loading' : 'Show Loading'}
          </Text>
        </TouchableOpacity>
      )}

      {!isRealMusicBrainzDetail && showLoading && (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading mock album detail...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Simulating album detail retrieval before content is available.
          </Text>
        </View>
      )}

      {isRealMusicBrainzDetail && isLoading && (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading MusicBrainz details...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Keeping the selected result visible while release-group and tracklist information loads.
          </Text>
        </View>
      )}

      {isRealMusicBrainzDetail && !!errorMessage && (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#7f1d1d',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#2a1215'
          }}
        >
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>MusicBrainz detail enrichment unavailable</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>{errorMessage}</Text>
        </View>
      )}

      {hasAlbum ? (
        <>
          <View
            style={{
              marginTop: 14,
              borderWidth: 1,
              borderColor: '#374151',
              borderRadius: 10,
              padding: 14,
              backgroundColor: '#181a1f'
            }}
          >
            <Text style={{ color: '#f3f4f6', fontSize: 20, fontWeight: '700' }}>{album.title}</Text>
            <Text style={{ color: '#d1d5db', marginTop: 4, fontSize: 16 }}>{album.artistName}</Text>
            <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 15 }}>
              {album.firstReleaseDate ?? album.releaseYear ?? 'Release date unknown'} - {album.albumType}
            </Text>
            {!!album.disambiguation && (
              <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 14 }}>
                Disambiguation: {album.disambiguation}
              </Text>
            )}
            {!!album.albumId && (
              <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 13 }}>
                Release-group MBID: {album.albumId}
              </Text>
            )}
          </View>

          <View
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: '#374151',
              borderRadius: 10,
              padding: 14,
              backgroundColor: '#181a1f'
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowTracklist((current) => !current)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>Tracklist</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>{showTracklist ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            {showTracklist ? (
              hasTracks ? (
                album.tracks.map((track) => (
                  <View
                    key={track.trackId}
                    style={{ marginTop: 2, paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
                  >
                    <Text style={{ color: '#d1d5db', flex: 1, fontSize: 15 }}>
                      {track.position ? `${track.position}. ` : ''}
                      {track.title}
                    </Text>
                    {formatDuration(track.durationMs) ? (
                      <Text style={{ color: '#9ca3af', fontSize: 14 }}>{formatDuration(track.durationMs)}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={{ color: '#9ca3af', marginTop: 8 }}>
                  {isRealMusicBrainzDetail
                    ? 'Tracklist is not loaded yet.'
                    : 'Tracklist preview placeholder'}
                </Text>
              )
            ) : null}
          </View>

          <View
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: '#374151',
              borderRadius: 10,
              padding: 14,
              backgroundColor: '#181a1f'
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowCredits((current) => !current)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>Credits</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>{showCredits ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            {showCredits ? (
              <>
                {hasAlbumCredits ? (
                  album.credits.albumCredits.slice(0, 3).map((credit, index) => (
                    <Text
                      key={`album-${credit.personName}-${credit.role}-${index}`}
                      style={{ color: '#d1d5db', marginTop: 2, fontSize: 15 }}
                    >
                      {credit.personName}
                      {credit.role ? ` — ${credit.role}` : ''}
                      {credit.instrument ? ` (${credit.instrument})` : ''}
                    </Text>
                  ))
                ) : null}
                {hasTrackCredits
                  ? album.tracks.slice(0, 3).map((track) =>
                      (trackCreditsByTrackId[track.trackId] ?? []).slice(0, 2).map((credit, index) => (
                        <Text
                          key={`track-${track.trackId}-${credit.personName}-${credit.role}-${index}`}
                          style={{ color: '#9ca3af', marginTop: 2, fontSize: 14 }}
                        >
                          {track.title}: {credit.personName}
                          {credit.role ? ` — ${credit.role}` : ''}
                          {credit.instrument ? ` (${credit.instrument})` : ''}
                        </Text>
                      ))
                    )
                  : null}
                {!hasAlbumCredits && !hasTrackCredits ? (
                  <Text style={{ color: '#9ca3af', marginTop: 8 }}>
                    {isRealMusicBrainzDetail
                      ? 'Credits are unavailable or not documented for this selected release.'
                      : 'Credits preview placeholder'}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>

          <View
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: '#374151',
              borderRadius: 10,
              padding: 14,
              backgroundColor: '#181a1f'
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowEditionsSources((current) => !current)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>
                Editions & Sources
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>{showEditionsSources ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            {showEditionsSources ? (
              <>
                {selectedEdition ? (
                  <View>
                    <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 15 }}>Selected Edition</Text>
                    <Text style={{ color: '#d1d5db', marginTop: 4, fontSize: 15 }}>{selectedEditionLabel}</Text>
                    {selectedEditionRows.map(([label, value]) => (
                      <Text key={label} style={{ color: '#9ca3af', marginTop: 3, fontSize: 14 }}>
                        {label}: {value}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: '#9ca3af', marginTop: 8 }}>
                    {isRealMusicBrainzDetail
                      ? 'Editions are not loaded yet.'
                      : 'Editions preview placeholder'}
                  </Text>
                )}
                {editionRows.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 15 }}>
                      Release-group editions
                    </Text>
                    {editionRows.map((edition) => {
                      const editionSummary = [edition.date, edition.country, edition.status].filter(Boolean).join(' - ')
                      return (
                        <Text key={edition.editionId} style={{ color: '#9ca3af', marginTop: 3, fontSize: 14 }}>
                          {editionSummary || edition.editionId}
                        </Text>
                      )
                    })}
                  </View>
                )}
                {hasSources ? (
                  <Text style={{ color: '#9ca3af', marginTop: 6, fontSize: 14 }}>
                    Source: {album.sources[0].sourceName}
                  </Text>
                ) : (
                  <Text style={{ color: '#9ca3af', marginTop: 6, fontSize: 14 }}>Source attribution placeholder</Text>
                )}
                {externalLinkRows.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    {externalLinkRows.map(([label, value]) => (
                      <Text key={label} style={{ color: '#9ca3af', marginTop: 3, fontSize: 13 }}>
                        {label}: {value}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: '#9ca3af', marginTop: 6 }}>External links unavailable</Text>
                )}
              </>
            ) : null}
          </View>
        </>
      ) : (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#7f1d1d',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#2a1215'
          }}
        >
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Album unavailable (mock not-found state)</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>
            We could not find this album in the shared mock fixture.
          </Text>
        </View>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onBackToResults}
        style={{
          marginTop: 16,
          borderWidth: 1,
          borderColor: '#4b5563',
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignSelf: 'flex-start'
        }}
      >
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Back to Results</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
