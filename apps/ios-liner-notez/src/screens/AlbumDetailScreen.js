import React, { useState } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'

function formatDuration(durationMs) {
  if (!durationMs || Number.isNaN(durationMs)) {
    return null
  }
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function isPerformerCredit(credit) {
  const role = credit?.role?.toLowerCase() ?? ''
  return (
    role === 'performer' ||
    role.includes('vocal') ||
    role.includes('guitar') ||
    role.includes('bass') ||
    role.includes('drum') ||
    role.includes('piano') ||
    role.includes('keyboard')
  )
}

function isProductionCredit(credit) {
  const role = credit?.role?.toLowerCase() ?? ''
  return role.includes('producer') || role.includes('engineer') || role.includes('mix') || role.includes('mastering')
}

function groupTrackCredits(credits) {
  const performers = credits.filter(isPerformerCredit)
  const production = credits.filter(isProductionCredit)
  const other = credits.filter((credit) => !isPerformerCredit(credit) && !isProductionCredit(credit))

  return [
    ['Performers & Instruments', performers],
    ['Production & Technical', production],
    ['Other', other]
  ].filter(([, groupedCredits]) => groupedCredits.length > 0)
}

export function AlbumDetailScreen({ album, errorMessage, isLoading, onBackToResults }) {
  const [showLoading, setShowLoading] = useState(false)
  const [showTracklist, setShowTracklist] = useState(true)
  const [showCredits, setShowCredits] = useState(true)
  const [showEditionsSources, setShowEditionsSources] = useState(true)
  const [showAlbumCredits, setShowAlbumCredits] = useState(false)
  const [expandedCreditTrackIds, setExpandedCreditTrackIds] = useState({})
  const [failedCoverArtUrls, setFailedCoverArtUrls] = useState({})

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
  const tracksWithCredits = hasTracks
    ? album.tracks.filter((track) => Array.isArray(trackCreditsByTrackId[track.trackId]) && trackCreditsByTrackId[track.trackId].length > 0)
    : []
  const groupedAlbumCredits = hasAlbumCredits ? groupTrackCredits(album.credits.albumCredits) : []
  const tracksWithCreditDetails = hasTracks
    ? album.tracks.filter((track) => {
        const trackCredits = trackCreditsByTrackId[track.trackId]
        return (
          (Array.isArray(trackCredits) && trackCredits.length > 0) ||
          !!track.songwriting ||
          !!track.publishing
        )
      })
    : []
  const hasTrackCreditDetails = tracksWithCreditDetails.length > 0
  const shouldShowCoverArt = hasAlbum && !!album.coverArtUrl && !failedCoverArtUrls[album.coverArtUrl]

  function toggleTrackCredits(trackId) {
    setExpandedCreditTrackIds((current) => ({
      ...current,
      [trackId]: !current[trackId]
    }))
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 96 }}
      alwaysBounceVertical
      showsVerticalScrollIndicator
    >
      <Text style={{ color: '#e5e7eb', fontSize: 30, fontWeight: '500' }}>Album Detail</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        {isRealMusicBrainzDetail
          ? hasTrackCreditDetails
            ? 'Real MusicBrainz album header, tracklist, and selected-release credits.'
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
            {shouldShowCoverArt ? (
              <Image
                source={{ uri: album.coverArtUrl }}
                accessibilityLabel={`${album.title} cover art`}
                onError={() => {
                  setFailedCoverArtUrls((current) => ({
                    ...current,
                    [album.coverArtUrl]: true
                  }))
                }}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: 8,
                  marginBottom: 12,
                  backgroundColor: '#111827'
                }}
                resizeMode="cover"
              />
            ) : null}
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
              accessibilityLabel={`${showTracklist ? 'Hide' : 'Show'} tracklist`}
              onPress={() => setShowTracklist((current) => !current)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>Tracklist</Text>
              <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showTracklist ? '▾' : '▸'}</Text>
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
              accessibilityLabel={`${showCredits ? 'Hide' : 'Show'} credits`}
              onPress={() => setShowCredits((current) => !current)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>Credits</Text>
              <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showCredits ? '▾' : '▸'}</Text>
            </TouchableOpacity>
            {showCredits ? (
              <>
                {hasAlbumCredits ? (
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`${showAlbumCredits ? 'Hide' : 'Show'} album credits`}
                      onPress={() => setShowAlbumCredits((current) => !current)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                    >
                      <Text style={{ color: '#d1d5db', flex: 1, fontWeight: '700', fontSize: 15 }}>Album</Text>
                      <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showAlbumCredits ? '▾' : '▸'}</Text>
                    </TouchableOpacity>
                    {showAlbumCredits
                      ? groupedAlbumCredits.map(([groupLabel, credits]) => (
                          <View key={`album-${groupLabel}`} style={{ marginTop: 8 }}>
                            <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 13 }}>
                              {groupLabel}
                            </Text>
                            {credits.map((credit, index) => (
                              <Text
                                key={`album-${groupLabel}-${credit.personName}-${credit.role}-${index}`}
                                style={{ color: '#d1d5db', marginTop: 2, fontSize: 14 }}
                              >
                                {credit.personName}
                                {credit.role ? ` — ${credit.role}` : ''}
                                {credit.instrument ? ` (${credit.instrument})` : ''}
                              </Text>
                            ))}
                          </View>
                        ))
                      : null}
                  </View>
                ) : null}
                {hasTrackCreditDetails ? (
                  <>
                    <Text style={{ color: '#9ca3af', marginTop: 8, fontSize: 14 }}>
                      Selected-release track credits, songwriting, and publishing from MusicBrainz.
                    </Text>
                    {tracksWithCreditDetails.map((track) => {
                      const trackCredits = trackCreditsByTrackId[track.trackId] ?? []
                      const groupedCredits = groupTrackCredits(trackCredits)
                      const trackDuration = formatDuration(track.durationMs)
                      const isTrackExpanded = !!expandedCreditTrackIds[track.trackId]
                      const songwritingRows = [
                        ...(track.songwriting?.writers ?? []).map((personName) => [personName, 'Writer']),
                        ...(track.songwriting?.composers ?? []).map((personName) => [personName, 'Composer']),
                        ...(track.songwriting?.lyricists ?? []).map((personName) => [personName, 'Lyricist'])
                      ]
                      const publishingRows = (track.publishing?.publishers ?? []).map((publisherName) => [publisherName, 'Publisher'])

                      return (
                        <View key={`credits-${track.trackId}`} style={{ marginTop: 12 }}>
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`${isTrackExpanded ? 'Hide' : 'Show'} credits for ${track.title}`}
                            onPress={() => toggleTrackCredits(track.trackId)}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                          >
                            <Text style={{ color: '#d1d5db', flex: 1, fontWeight: '700', fontSize: 15 }}>
                              {track.position ? `${track.position}. ` : ''}
                              {track.title}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                              {trackDuration ? (
                                <Text style={{ color: '#9ca3af', fontSize: 14 }}>{trackDuration}</Text>
                              ) : null}
                              <Text style={{ color: '#9ca3af', marginTop: 2, fontSize: 16 }}>
                                {isTrackExpanded ? '▾' : '▸'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          {isTrackExpanded
                            ? (
                                <>
                                  {songwritingRows.length > 0 ? (
                                    <View style={{ marginTop: 8 }}>
                                      <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 13 }}>
                                        Songwriting
                                      </Text>
                                      {songwritingRows.map(([personName, role], index) => (
                                        <Text
                                          key={`${track.trackId}-songwriting-${personName}-${role}-${index}`}
                                          style={{ color: '#d1d5db', marginTop: 2, fontSize: 14 }}
                                        >
                                          {personName} — {role}
                                        </Text>
                                      ))}
                                    </View>
                                  ) : null}
                                  {publishingRows.length > 0 ? (
                                    <View style={{ marginTop: 8 }}>
                                      <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 13 }}>
                                        Publishing
                                      </Text>
                                      {publishingRows.map(([publisherName, role], index) => (
                                        <Text
                                          key={`${track.trackId}-publishing-${publisherName}-${index}`}
                                          style={{ color: '#d1d5db', marginTop: 2, fontSize: 14 }}
                                        >
                                          {publisherName} — {role}
                                        </Text>
                                      ))}
                                    </View>
                                  ) : null}
                                  {groupedCredits.map(([groupLabel, credits]) => (
                                    <View key={`${track.trackId}-${groupLabel}`} style={{ marginTop: 8 }}>
                                      <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 13 }}>
                                        {groupLabel}
                                      </Text>
                                      {credits.map((credit, index) => (
                                        <Text
                                          key={`${track.trackId}-${groupLabel}-${credit.personName}-${credit.role}-${index}`}
                                          style={{ color: '#d1d5db', marginTop: 2, fontSize: 14 }}
                                        >
                                          {credit.personName}
                                          {credit.role ? ` — ${credit.role}` : ''}
                                          {credit.instrument ? ` (${credit.instrument})` : ''}
                                        </Text>
                                      ))}
                                    </View>
                                  ))}
                                </>
                              )
                            : null}
                        </View>
                      )
                    })}
                  </>
                ) : null}
                {!hasAlbumCredits && !hasTrackCreditDetails ? (
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
              accessibilityLabel={`${showEditionsSources ? 'Hide' : 'Show'} editions and sources`}
              onPress={() => setShowEditionsSources((current) => !current)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>
                Editions & Sources
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showEditionsSources ? '▾' : '▸'}</Text>
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
