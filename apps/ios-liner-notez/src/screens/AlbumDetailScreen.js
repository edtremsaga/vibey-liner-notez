import React, { useState } from 'react'
import { Image, Linking, Modal, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'

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

function getCreditHighlightCategory(role) {
  const normalizedRole = role?.toLowerCase() ?? ''

  if (normalizedRole.includes('producer')) {
    return 'Producers'
  }

  if (
    normalizedRole.includes('engineer') ||
    normalizedRole.includes('mix') ||
    normalizedRole.includes('mastering')
  ) {
    return 'Engineers / Mixers / Mastering'
  }

  if (isPerformerCredit({ role })) {
    return 'Performers & Instruments'
  }

  return null
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

function addCreditHighlight(categoryMap, category, personName, role, trackId = null) {
  if (!category || !personName) {
    return
  }

  const roleLabel = role || category
  const key = `${category}|${personName}|${roleLabel}`
  const existing = categoryMap.get(key)

  if (existing) {
    if (trackId) {
      existing.trackIds.add(trackId)
    }
    return
  }

  categoryMap.set(key, {
    personName,
    role: roleLabel,
    trackIds: trackId ? new Set([trackId]) : new Set()
  })
}

function buildCreditHighlights(albumCredits, tracks, trackCreditsByTrackId) {
  const categoryMaps = {
    Producers: new Map(),
    'Engineers / Mixers / Mastering': new Map(),
    'Performers & Instruments': new Map(),
    Songwriting: new Map(),
    Publishing: new Map()
  }

  for (const credit of albumCredits) {
    const category = getCreditHighlightCategory(credit?.role)
    addCreditHighlight(categoryMaps[category], category, credit?.personName, credit?.role)
  }

  for (const track of tracks) {
    const trackId = track?.trackId
    if (!trackId) {
      continue
    }

    const trackCredits = Array.isArray(trackCreditsByTrackId[trackId]) ? trackCreditsByTrackId[trackId] : []
    for (const credit of trackCredits) {
      const category = getCreditHighlightCategory(credit?.role)
      addCreditHighlight(categoryMaps[category], category, credit?.personName, credit?.role, trackId)
    }

    for (const personName of track.songwriting?.writers ?? []) {
      addCreditHighlight(categoryMaps.Songwriting, 'Songwriting', personName, 'Writer', trackId)
    }
    for (const personName of track.songwriting?.composers ?? []) {
      addCreditHighlight(categoryMaps.Songwriting, 'Songwriting', personName, 'Composer', trackId)
    }
    for (const personName of track.songwriting?.lyricists ?? []) {
      addCreditHighlight(categoryMaps.Songwriting, 'Songwriting', personName, 'Lyricist', trackId)
    }
    for (const publisherName of track.publishing?.publishers ?? []) {
      addCreditHighlight(categoryMaps.Publishing, 'Publishing', publisherName, 'Publisher', trackId)
    }
  }

  return Object.entries(categoryMaps)
    .map(([category, contributorMap]) => [
      category,
      Array.from(contributorMap.values()).sort((a, b) => {
        const trackCountDifference = b.trackIds.size - a.trackIds.size
        return trackCountDifference || a.personName.localeCompare(b.personName)
      })
    ])
    .filter(([, contributors]) => contributors.length > 0)
}

const COUNTRY_DISPLAY_NAMES = {
  AR: 'Argentina',
  AU: 'Australia',
  CA: 'Canada',
  GB: 'United Kingdom',
  JP: 'Japan',
  US: 'United States',
  XE: 'Europe'
}

function formatCountry(countryCode) {
  return COUNTRY_DISPLAY_NAMES[countryCode] ?? countryCode
}

function getArtworkTypeLabel(image) {
  if (Array.isArray(image?.types) && image.types.length > 0) {
    return image.types.join(', ')
  }

  if (image?.front) {
    return 'Front'
  }

  if (image?.back) {
    return 'Back'
  }

  return 'Image'
}

function getArtworkThumbnailUrl(image) {
  return image?.thumbnails?.['500'] ||
    image?.thumbnails?.['250'] ||
    image?.thumbnails?.small ||
    image?.image ||
    null
}

export function AlbumDetailScreen({ album, backLabel = 'Back to Results', errorMessage, isLoading, onBackToResults }) {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions()
  const [showLoading, setShowLoading] = useState(false)
  const [showTracklist, setShowTracklist] = useState(true)
  const [showCredits, setShowCredits] = useState(false)
  const [showEditionsSources, setShowEditionsSources] = useState(false)
  const [showReleaseGroupEditions, setShowReleaseGroupEditions] = useState(false)
  const [showTechnicalLinks, setShowTechnicalLinks] = useState(false)
  const [showCreditHighlights, setShowCreditHighlights] = useState(false)
  const [showAlbumCredits, setShowAlbumCredits] = useState(false)
  const [expandedCreditTrackIds, setExpandedCreditTrackIds] = useState({})
  const [failedCoverArtUrls, setFailedCoverArtUrls] = useState({})
  const [failedArtworkUrls, setFailedArtworkUrls] = useState({})
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0)
  const [isArtworkViewerOpen, setIsArtworkViewerOpen] = useState(false)

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
  const selectedEditionSummary = selectedEdition
    ? [selectedEdition.date, formatCountry(selectedEdition.country), selectedEdition.status].filter(Boolean).join(' · ')
    : null
  const selectedEditionDetailSummary = selectedEdition
    ? [selectedEdition.formatSummary, selectedEdition.label, selectedEdition.catalogNumber].filter(Boolean).join(' · ')
    : null
  const selectedEditionRows = selectedEdition
    ? [
        ['Country', formatCountry(selectedEdition.country)],
        ['Date', selectedEdition.date],
        ['Status', selectedEdition.status],
        ['Format', selectedEdition.formatSummary],
        ['Packaging', selectedEdition.packaging],
        ['Label', selectedEdition.label],
        ['Catalog #', selectedEdition.catalogNumber],
        ['Barcode', selectedEdition.barcode]
      ].filter(([, value]) => !!value)
    : []
  const selectedEditionTechnicalRows = selectedEdition
    ? [['Selected release MBID', selectedEdition.editionId]].filter(([, value]) => !!value)
    : []
  const editionRows = hasEditions ? album.editions.slice(0, 8) : []
  const externalLinks = hasAlbum && album.externalLinks ? album.externalLinks : {}
  const externalLinkRows = [
    ['Wikipedia article', album?.wikipediaArticle?.url],
    ['MusicBrainz release group', externalLinks.musicbrainzReleaseGroupUrl],
    ['MusicBrainz selected release', externalLinks.musicbrainzSelectedReleaseUrl],
    ['Cover Art Archive', album?.coverArtUrl],
    ['Wikidata', externalLinks.wikidataUrl],
    ['Discogs', externalLinks.discogsUrl]
  ].filter(([, value]) => !!value)
  const trackCreditsByTrackId = hasAlbum && album.credits?.trackCredits ? album.credits.trackCredits : {}
  const groupedAlbumCredits = hasAlbumCredits ? groupTrackCredits(album.credits.albumCredits) : []
  const creditHighlights = hasAlbum
    ? buildCreditHighlights(
        hasAlbumCredits ? album.credits.albumCredits : [],
        [],
        {}
      )
    : []
  const hasCreditHighlights = creditHighlights.length > 0
  const tracklistSummary = hasTracks
    ? `${album.tracks.length} ${album.tracks.length === 1 ? 'track' : 'tracks'}`
    : null
  const editionsSourcesSummary = selectedEdition && hasSources
    ? 'Selected edition and sources'
    : hasEditions
      ? `${album.editions.length} ${album.editions.length === 1 ? 'edition' : 'editions'}`
      : hasSources
        ? 'Sources available'
        : null
  const shouldShowCoverArt = hasAlbum && !!album.coverArtUrl && !failedCoverArtUrls[album.coverArtUrl]
  const artworkImages = hasAlbum && Array.isArray(album.artworkImages) ? album.artworkImages : []
  const hasArtworkGallery = artworkImages.length > 0
  const fallbackCoverArtwork = hasAlbum && album.coverArtUrl
    ? [{
        id: 'primary-cover',
        image: album.coverArtUrl,
        thumbnails: null,
        front: true,
        back: false,
        types: ['Front'],
        approved: true
      }]
    : []
  const viewerImages = hasArtworkGallery ? artworkImages : fallbackCoverArtwork
  const selectedArtwork = isArtworkViewerOpen ? viewerImages[selectedArtworkIndex] ?? null : null
  const viewerImageCount = viewerImages.length

  function openArtworkViewer(index = 0) {
    if (viewerImages.length === 0) {
      return
    }

    setSelectedArtworkIndex(Math.max(0, Math.min(index, viewerImages.length - 1)))
    setIsArtworkViewerOpen(true)
  }

  function closeArtworkViewer() {
    setIsArtworkViewerOpen(false)
  }

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
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onBackToResults}
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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>{backLabel}</Text>
      </TouchableOpacity>

      {!isRealMusicBrainzDetail && (
        <>
          <Text style={{ color: '#e5e7eb', fontSize: 30, fontWeight: '500' }}>Album Detail</Text>
          <Text style={{ color: '#9ca3af', marginTop: 8 }}>Album detail.</Text>
        </>
      )}

      {isRealMusicBrainzDetail && !hasAlbum && (
        <Text style={{ color: '#9ca3af', marginTop: 8 }}>Album details are loading.</Text>
      )}

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
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading album detail...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Preparing album detail content.
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
              <TouchableOpacity
                accessibilityRole="imagebutton"
                accessibilityLabel={`${album.title} cover art`}
                onPress={() => {
                  const galleryCoverIndex = artworkImages.findIndex((image) =>
                    image?.image === album.coverArtUrl ||
                    image?.front ||
                    getArtworkThumbnailUrl(image) === album.coverArtUrl
                  )
                  openArtworkViewer(galleryCoverIndex >= 0 ? galleryCoverIndex : 0)
                }}
              >
                <Image
                  source={{ uri: album.coverArtUrl }}
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
              </TouchableOpacity>
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
	          </View>

	          {album?.wikipediaArticle?.url ? (
	            <TouchableOpacity
	              accessibilityRole="link"
	              accessibilityLabel="Read album article on Wikipedia"
	              onPress={() => Linking.openURL(album.wikipediaArticle.url)}
	              style={{
	                marginTop: 12,
	                borderWidth: 1,
	                borderColor: '#374151',
	                borderRadius: 10,
	                padding: 14,
	                backgroundColor: '#181a1f'
	              }}
	            >
	              <Text style={{ color: '#93c5fd', fontSize: 16, fontWeight: '700' }}>
	                Read album article on Wikipedia
	              </Text>
	              <Text style={{ color: '#9ca3af', marginTop: 5, fontSize: 14 }}>
	                Background, release history, reception, and legacy.
	              </Text>
	            </TouchableOpacity>
	          ) : null}

	          {hasArtworkGallery ? (
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
              <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>Album Art & Liner Images</Text>
              <Text style={{ color: '#9ca3af', marginTop: 6, fontSize: 14 }}>
                Browse cover, booklet, media, and other release images.
              </Text>
              <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 13 }}>
                {artworkImages.length} {artworkImages.length === 1 ? 'image' : 'images'} · Tap any image to view full screen.
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
              >
                {artworkImages.map((image, index) => {
                  const thumbnailUrl = getArtworkThumbnailUrl(image)
                  if (!thumbnailUrl || failedArtworkUrls[thumbnailUrl]) {
                    return null
                  }

                  return (
                    <TouchableOpacity
                      key={`artwork-${image.id ?? image.image ?? 'image'}-${index}`}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={`Open ${getArtworkTypeLabel(image)} artwork image ${index + 1} of ${artworkImages.length}`}
                      onPress={() => openArtworkViewer(index)}
                      style={{ width: 104, marginRight: 10 }}
                    >
                      <Image
                        source={{ uri: thumbnailUrl }}
                        onError={() => {
                          setFailedArtworkUrls((current) => ({
                            ...current,
                            [thumbnailUrl]: true
                          }))
                        }}
                        style={{
                          width: 104,
                          height: 104,
                          borderRadius: 8,
                          backgroundColor: '#111827'
                        }}
                        resizeMode="cover"
                      />
                      <Text
                        numberOfLines={1}
                        style={{ color: '#9ca3af', marginTop: 5, fontSize: 12 }}
                      >
                        {getArtworkTypeLabel(image)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          ) : null}

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
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>Tracklist</Text>
                {!!tracklistSummary && (
                  <Text style={{ color: '#9ca3af', marginTop: 3, fontSize: 13 }}>{tracklistSummary}</Text>
                )}
              </View>
              <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showTracklist ? '▾' : '▸'}</Text>
            </TouchableOpacity>
            {showTracklist ? (
              hasTracks ? (
                album.tracks.map((track, index) => {
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
                  const hasTrackDetails =
                    songwritingRows.length > 0 ||
                    publishingRows.length > 0 ||
                    groupedCredits.length > 0

                  return (
                    <View
                      key={`track-${track.trackId ?? track.position ?? 'unknown'}-${index}`}
                      style={{ marginTop: 2, paddingVertical: 6 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <Text style={{ color: '#d1d5db', flex: 1, fontSize: 15 }}>
                          {track.position ? `${track.position}. ` : ''}
                          {track.title}
                        </Text>
                        {trackDuration ? (
                          <Text style={{ color: '#9ca3af', fontSize: 14 }}>{trackDuration}</Text>
                        ) : null}
                      </View>
                      {hasTrackDetails ? (
                        <>
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`${isTrackExpanded ? 'Hide' : 'Show'} credits for ${track.title}`}
                            onPress={() => toggleTrackCredits(track.trackId)}
                            style={{ marginTop: 4, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <Text style={{ color: '#93c5fd', fontSize: 13, fontWeight: '700' }}>
                              {isTrackExpanded ? 'Hide credits' : 'Show credits'}
                            </Text>
                            <Text style={{ color: '#93c5fd', fontSize: 13 }}>{isTrackExpanded ? '▾' : '▸'}</Text>
                          </TouchableOpacity>
                          {isTrackExpanded ? (
                            <View style={{ marginTop: 8, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#374151' }}>
                              {songwritingRows.length > 0 ? (
                                <View>
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
                            </View>
                          ) : null}
                        </>
                      ) : null}
                    </View>
                  )
                })
              ) : (
                <Text style={{ color: '#9ca3af', marginTop: 8 }}>
                  {isRealMusicBrainzDetail
                    ? 'Tracklist is not loaded yet.'
                    : 'Tracklist is not available for this album.'}
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
              accessibilityLabel={`${showCredits ? 'Hide' : 'Show'} album credits`}
              onPress={() => setShowCredits((current) => !current)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>Album Credits</Text>
              </View>
              <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showCredits ? '▾' : '▸'}</Text>
            </TouchableOpacity>
            {showCredits ? (
              <>
                {hasCreditHighlights ? (
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`${showCreditHighlights ? 'Hide' : 'Show'} credit highlights`}
                      onPress={() => setShowCreditHighlights((current) => !current)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                    >
                      <Text style={{ color: '#d1d5db', flex: 1, fontWeight: '700', fontSize: 15 }}>
                        Credit Highlights
                      </Text>
                      <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showCreditHighlights ? '▾' : '▸'}</Text>
                    </TouchableOpacity>
                    {showCreditHighlights
                      ? creditHighlights.map(([category, contributors]) => (
                          <View key={`credit-highlight-${category}`} style={{ marginTop: 8 }}>
                            <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 13 }}>
                              {category}
                            </Text>
                            {contributors.slice(0, 8).map((contributor, index) => {
                              const trackCount = contributor.trackIds.size
                              return (
                                <Text
                                  key={`credit-highlight-${category}-${contributor.personName}-${contributor.role}-${index}`}
                                  style={{ color: '#d1d5db', marginTop: 2, fontSize: 14 }}
                                >
                                  {contributor.personName}
                                  {contributor.role ? ` — ${contributor.role}` : ''}
                                  {trackCount > 0 ? ` (${trackCount} ${trackCount === 1 ? 'track' : 'tracks'})` : ''}
                                </Text>
                              )
                            })}
                          </View>
                        ))
                      : null}
                  </View>
                ) : null}
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
                {!hasAlbumCredits ? (
                  <Text style={{ color: '#9ca3af', marginTop: 8 }}>
                    {isRealMusicBrainzDetail
                      ? 'No separate album-level credits are documented for this selected release. Track credits are shown in the Tracklist above when available.'
                      : 'Credits are not available for this album.'}
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
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f3f4f6', fontWeight: '700', fontSize: 17 }}>
                  Editions & Sources
                </Text>
                {!!editionsSourcesSummary && (
                  <Text style={{ color: '#9ca3af', marginTop: 3, fontSize: 13 }}>{editionsSourcesSummary}</Text>
                )}
              </View>
              <Text style={{ color: '#9ca3af', fontSize: 16 }}>{showEditionsSources ? '▾' : '▸'}</Text>
            </TouchableOpacity>
            {showEditionsSources ? (
              <>
                {selectedEdition ? (
                  <View>
                    <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 15 }}>Selected Edition</Text>
                    {selectedEditionSummary ? (
                      <Text style={{ color: '#d1d5db', marginTop: 4, fontSize: 15 }}>{selectedEditionSummary}</Text>
                    ) : null}
                    {selectedEditionDetailSummary ? (
                      <Text style={{ color: '#9ca3af', marginTop: 3, fontSize: 14 }}>{selectedEditionDetailSummary}</Text>
                    ) : null}
                    {selectedEditionRows.map(([label, value], index) => (
                      <Text key={`selected-edition-${label}-${index}`} style={{ color: '#9ca3af', marginTop: 3, fontSize: 14 }}>
                        {label}: {value}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: '#9ca3af', marginTop: 8 }}>
                    {isRealMusicBrainzDetail
                      ? 'Editions are not loaded yet.'
                      : 'Editions are not available for this album.'}
                  </Text>
                )}
                {editionRows.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`${showReleaseGroupEditions ? 'Hide' : 'Show'} release-group editions`}
                      onPress={() => setShowReleaseGroupEditions((current) => !current)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 15 }}>
                        Release-group editions
                      </Text>
                      <Text style={{ color: '#9ca3af', fontSize: 14 }}>{showReleaseGroupEditions ? '▾' : '▸'}</Text>
                    </TouchableOpacity>
                    {showReleaseGroupEditions
                      ? editionRows.map((edition, index) => {
                          const editionSummary = [edition.date, edition.country, edition.status].filter(Boolean).join(' - ')
                          return (
                            <Text
                              key={`release-group-edition-${edition.editionId ?? (editionSummary || 'unknown')}-${index}`}
                              style={{ color: '#9ca3af', marginTop: 3, fontSize: 14 }}
                            >
                              {editionSummary || edition.editionId}
                            </Text>
                          )
                        })
                      : null}
                  </View>
                )}
                {hasSources ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 15 }}>Sources</Text>
                    {album.sources.map((source, index) => (
                      <Text key={`source-${source.sourceName ?? 'unknown'}-${index}`} style={{ color: '#9ca3af', marginTop: 3, fontSize: 14 }}>
                        {source.sourceName}
                      </Text>
                    ))}
                    {album?.wikipediaArticle?.url ? (
                      <TouchableOpacity
                        accessibilityRole="link"
                        accessibilityLabel="Read album article on Wikipedia"
                        onPress={() => Linking.openURL(album.wikipediaArticle.url)}
                        style={{ marginTop: 8 }}
                      >
                        <Text style={{ color: '#93c5fd', fontSize: 14, fontWeight: '600' }}>
                          Read album article on Wikipedia
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <Text style={{ color: '#9ca3af', marginTop: 6, fontSize: 14 }}>Source attribution unavailable</Text>
                )}
                {selectedEditionTechnicalRows.length > 0 || externalLinkRows.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`${showTechnicalLinks ? 'Hide' : 'Show'} technical links`}
                      onPress={() => setShowTechnicalLinks((current) => !current)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 15 }}>Technical links</Text>
                      <Text style={{ color: '#9ca3af', fontSize: 14 }}>{showTechnicalLinks ? '▾' : '▸'}</Text>
                    </TouchableOpacity>
                    {showTechnicalLinks ? (
                      <>
                        {selectedEditionTechnicalRows.map(([label, value], index) => (
                          <Text key={`technical-id-${label}-${index}`} style={{ color: '#9ca3af', marginTop: 3, fontSize: 13 }}>
                            {label}: {value}
                          </Text>
                        ))}
                        {externalLinkRows.map(([label, value], index) => (
                          <Text key={`technical-link-${label}-${index}`} style={{ color: '#9ca3af', marginTop: 3, fontSize: 13 }}>
                            {label}: {value}
                          </Text>
                        ))}
                      </>
                    ) : null}
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
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Album unavailable</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>
            We could not find this album.
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
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>{backLabel}</Text>
      </TouchableOpacity>

      <Modal
        visible={isArtworkViewerOpen}
        animationType="fade"
        transparent={false}
        onRequestClose={closeArtworkViewer}
      >
        <View style={{ flex: 1, backgroundColor: '#050608' }}>
          <View
            style={{
              paddingTop: 54,
              paddingHorizontal: 16,
              paddingBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close artwork viewer"
              onPress={closeArtworkViewer}
              style={{
                borderWidth: 1,
                borderColor: '#4b5563',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 10
              }}
            >
              <Text style={{ color: '#f3f4f6', fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 12 }}>
              <Text style={{ color: '#f3f4f6', fontWeight: '700' }}>
                {selectedArtwork ? getArtworkTypeLabel(selectedArtwork) : 'Artwork'}
              </Text>
              {viewerImageCount > 0 ? (
                <Text style={{ color: '#9ca3af', marginTop: 2 }}>
                  {(selectedArtworkIndex ?? 0) + 1} of {viewerImageCount}
                </Text>
              ) : null}
            </View>
          </View>

          {viewerImageCount > 0 ? (
            <ScrollView
              key={`artwork-viewer-${selectedArtworkIndex ?? 0}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: (selectedArtworkIndex ?? 0) * viewportWidth, y: 0 }}
              onMomentumScrollEnd={(event) => {
                if (!isArtworkViewerOpen) {
                  return
                }

                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / viewportWidth)
                setSelectedArtworkIndex(Math.max(0, Math.min(nextIndex, viewerImageCount - 1)))
              }}
              style={{ flex: 1 }}
            >
              {viewerImages.map((image, index) => (
                <View
                  key={`viewer-artwork-${image.id ?? image.image ?? 'image'}-${index}`}
                  style={{ width: viewportWidth, height: viewportHeight - 118 }}
                >
                  <ScrollView
                    maximumZoomScale={4}
                    minimumZoomScale={1}
                    centerContent
                    bouncesZoom
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      width: viewportWidth,
                      minHeight: viewportHeight - 118,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Image
                      source={{ uri: image.image }}
                      accessibilityLabel={`${getArtworkTypeLabel(image)} artwork image ${index + 1} of ${viewerImageCount}`}
                      style={{
                        width: viewportWidth,
                        height: viewportHeight - 118,
                        backgroundColor: '#050608'
                      }}
                      resizeMode="contain"
                    />
                  </ScrollView>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  )
}
