import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

function formatDuration(durationMs) {
  if (!durationMs || Number.isNaN(durationMs)) {
    return null
  }
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function AlbumDetailScreen({ album, onBackToResults }) {
  const [showLoading, setShowLoading] = useState(false)

  const hasAlbum = !!album
  const hasTracks = hasAlbum && Array.isArray(album.tracks) && album.tracks.length > 0
  const hasAlbumCredits =
    hasAlbum &&
    album.credits &&
    Array.isArray(album.credits.albumCredits) &&
    album.credits.albumCredits.length > 0
  const hasEditions = hasAlbum && Array.isArray(album.editions) && album.editions.length > 0
  const hasSources = hasAlbum && Array.isArray(album.sources) && album.sources.length > 0
  const trackCreditsByTrackId = hasAlbum && album.credits?.trackCredits ? album.credits.trackCredits : {}
  const hasTrackCredits =
    hasTracks &&
    album.tracks.some((track) => Array.isArray(trackCreditsByTrackId[track.trackId]) && trackCreditsByTrackId[track.trackId].length > 0)

  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Album Detail</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>Mock detail layout preview (iOS scaffold only).</Text>

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

      {showLoading && (
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

      {hasAlbum ? (
        <>
          <View
            style={{
              marginTop: 16,
              borderWidth: 1,
              borderColor: '#374151',
              borderRadius: 10,
              padding: 12,
              backgroundColor: '#181a1f'
            }}
          >
            <Text style={{ color: '#f3f4f6', fontSize: 20, fontWeight: '700' }}>{album.title}</Text>
            <Text style={{ color: '#d1d5db', marginTop: 6, fontSize: 16 }}>{album.artistName}</Text>
            <Text style={{ color: '#9ca3af', marginTop: 6 }}>
              {album.releaseYear} • {album.albumType}
            </Text>
          </View>

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
            <Text style={{ color: '#f3f4f6', fontWeight: '600', marginBottom: 8 }}>Tracklist</Text>
            {hasTracks ? (
              album.tracks.map((track) => (
                <View
                  key={track.trackId}
                  style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
                >
                  <Text style={{ color: '#d1d5db', flex: 1 }}>
                    {track.position ? `${track.position}. ` : ''}
                    {track.title}
                  </Text>
                  {formatDuration(track.durationMs) ? (
                    <Text style={{ color: '#9ca3af' }}>{formatDuration(track.durationMs)}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={{ color: '#9ca3af' }}>Tracklist preview placeholder</Text>
            )}
          </View>

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
            <Text style={{ color: '#f3f4f6', fontWeight: '600', marginBottom: 8 }}>Credits</Text>
            {hasAlbumCredits ? (
              album.credits.albumCredits.slice(0, 3).map((credit, index) => (
                <Text
                  key={`album-${credit.personName}-${credit.role}-${index}`}
                  style={{ color: '#d1d5db', marginTop: 4 }}
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
                      style={{ color: '#9ca3af', marginTop: 4 }}
                    >
                      {track.title}: {credit.personName}
                      {credit.role ? ` — ${credit.role}` : ''}
                      {credit.instrument ? ` (${credit.instrument})` : ''}
                    </Text>
                  ))
                )
              : null}
            {!hasAlbumCredits && !hasTrackCredits ? (
              <Text style={{ color: '#9ca3af' }}>Credits preview placeholder</Text>
            ) : null}
          </View>

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
            <Text style={{ color: '#f3f4f6', fontWeight: '600', marginBottom: 8 }}>
              Editions & Sources
            </Text>
            {hasEditions ? (
              <Text style={{ color: '#d1d5db' }}>
                Edition: {album.editions[0].status} • {album.editions[0].country} • {album.editions[0].date}
              </Text>
            ) : (
              <Text style={{ color: '#9ca3af' }}>Editions preview placeholder</Text>
            )}
            {hasSources ? (
              <Text style={{ color: '#9ca3af', marginTop: 6 }}>Source: {album.sources[0].sourceName}</Text>
            ) : (
              <Text style={{ color: '#9ca3af', marginTop: 6 }}>Source attribution placeholder</Text>
            )}
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
    </View>
  )
}
