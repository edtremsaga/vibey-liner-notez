import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SearchScreen } from './screens/SearchScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { AlbumDetailScreen } from './screens/AlbumDetailScreen'
import { ProducerSearchScreen } from './screens/ProducerSearchScreen'
import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'
import { getMockAlbumById, getMockAlbums } from 'core-liner-notez'
import {
  fetchMusicBrainzAlbumBasicInfo,
  fetchMusicBrainzPrimaryCoverArt,
  fetchMusicBrainzSelectedReleaseTracklist
} from './services/musicbrainzAlbumDetail'
import { searchMusicBrainzAlbumsByArtist } from './services/musicbrainzAlbumSearch'

const ROUTES = ['Search', 'Results', 'Album Detail', 'Producer Search', 'Help / Data Sources']

function buildAlbumDetailFromResult(albumId, albumResult, enrichedDetail = null) {
  if (!albumResult) {
    return null
  }

  const releaseGroupId = enrichedDetail?.albumId ?? albumResult.releaseGroupId ?? albumResult.id ?? albumId
  const firstReleaseDate = enrichedDetail?.firstReleaseDate ?? albumResult.firstReleaseDate ?? null
  const releaseYear = enrichedDetail?.releaseYear ?? (albumResult.releaseYear
    ? Number(albumResult.releaseYear)
    : firstReleaseDate
      ? Number(firstReleaseDate.slice(0, 4))
      : null)

  return {
    albumId: releaseGroupId,
    title: enrichedDetail?.title ?? albumResult.title ?? 'Untitled album',
    artistName: enrichedDetail?.artistName ?? albumResult.artistCredit ?? albumResult.artistName ?? 'Unknown artist',
    firstReleaseDate,
    releaseYear: Number.isNaN(releaseYear) ? null : releaseYear,
    disambiguation: enrichedDetail?.disambiguation ?? albumResult.disambiguation ?? null,
    selectedReleaseId: enrichedDetail?.selectedReleaseId ?? null,
    isRealMusicBrainzDetail: true,
    albumType: 'album',
    coverArtUrl: enrichedDetail?.coverArtUrl ?? null,
    editions: enrichedDetail?.editions ?? [],
    tracks: enrichedDetail?.tracks ?? [],
    credits: enrichedDetail?.credits ?? {
      albumCredits: null,
      trackCredits: null
    },
    recordingInfo: null,
    externalLinks: {
      musicbrainzReleaseGroupUrl: enrichedDetail?.externalLinks?.musicbrainzReleaseGroupUrl ?? `https://musicbrainz.org/release-group/${releaseGroupId}`,
      musicbrainzSelectedReleaseUrl: enrichedDetail?.externalLinks?.musicbrainzSelectedReleaseUrl ?? null,
      wikidataUrl: enrichedDetail?.externalLinks?.wikidataUrl ?? null,
      discogsUrl: enrichedDetail?.externalLinks?.discogsUrl ?? null
    },
    sources: enrichedDetail?.sources ?? [
      {
        sourceName: 'MusicBrainz',
        license: 'CC0'
      }
    ],
    dataNotes: enrichedDetail?.credits?.trackCredits
      ? 'Selected-release track credits are loaded. Album-level credits and full editions are not loaded yet.'
      : enrichedDetail?.tracks?.length > 0
        ? 'Album-level credits and full editions are not loaded yet.'
      : 'Tracklist, credits, and full editions are not loaded yet.'
  }
}

function ScreenRouter({
  route,
  albumSearchResults,
  albumSearchAlbumTitle,
  albumSearchArtistName,
  albumSearchReleaseType,
  albumSearchError,
  albumSearchLoading,
  selectedAlbumId,
  selectedAlbumResult,
  selectedAlbumDetail,
  albumDetailLoading,
  albumDetailError,
  onSubmitArtistSearch,
  onSelectAlbum,
  onBackToResults
}) {
  const selectedAlbum = selectedAlbumResult
    ? buildAlbumDetailFromResult(selectedAlbumId, selectedAlbumResult, selectedAlbumDetail)
    : selectedAlbumId
      ? getMockAlbumById(selectedAlbumId)
      : null

  switch (route) {
    case 'Results':
      return (
        <ResultsScreen
          albums={albumSearchResults}
          albumTitle={albumSearchAlbumTitle}
          artistName={albumSearchArtistName}
          releaseType={albumSearchReleaseType}
          errorMessage={albumSearchError}
          isLoading={albumSearchLoading}
          onSelectAlbum={onSelectAlbum}
        />
      )
    case 'Album Detail':
      return (
        <AlbumDetailScreen
          album={selectedAlbum}
          errorMessage={albumDetailError}
          isLoading={albumDetailLoading}
          onBackToResults={onBackToResults}
        />
      )
    case 'Producer Search':
      return <ProducerSearchScreen onSelectAlbum={onSelectAlbum} />
    case 'Help / Data Sources':
      return <HelpDataSourcesScreen />
    case 'Search':
    default:
      return <SearchScreen onSubmitArtistSearch={onSubmitArtistSearch} />
  }
}

export default function App() {
  const [route, setRoute] = useState('Search')
  const [albumSearchResults, setAlbumSearchResults] = useState([])
  const [albumSearchAlbumTitle, setAlbumSearchAlbumTitle] = useState('')
  const [albumSearchArtistName, setAlbumSearchArtistName] = useState('')
  const [albumSearchReleaseType, setAlbumSearchReleaseType] = useState('Album')
  const [albumSearchError, setAlbumSearchError] = useState('')
  const [albumSearchLoading, setAlbumSearchLoading] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [selectedAlbumResult, setSelectedAlbumResult] = useState(null)
  const [selectedAlbumDetail, setSelectedAlbumDetail] = useState(null)
  const [albumDetailLoading, setAlbumDetailLoading] = useState(false)
  const [albumDetailError, setAlbumDetailError] = useState('')
  const tabs = useMemo(() => ROUTES, [])

  useEffect(() => {
    if (!selectedAlbumResult || !selectedAlbumId) {
      setSelectedAlbumDetail(null)
      setAlbumDetailLoading(false)
      setAlbumDetailError('')
      return undefined
    }

    let isCurrent = true
    setAlbumDetailLoading(true)
    setAlbumDetailError('')

    fetchMusicBrainzAlbumBasicInfo(selectedAlbumId)
      .then(async (detail) => {
        if (isCurrent) {
          setSelectedAlbumDetail(detail)
        }

        fetchMusicBrainzPrimaryCoverArt({
          releaseGroupId: detail.albumId ?? selectedAlbumId,
          selectedReleaseId: detail.selectedReleaseId ?? null
        })
          .then((coverArtUrl) => {
            if (!isCurrent || !coverArtUrl) {
              return
            }

            setSelectedAlbumDetail((currentDetail) => {
              const currentSources = currentDetail?.sources ?? detail.sources ?? []
              const hasCoverArtSource = currentSources.some((source) => source?.sourceName === 'Cover Art Archive')

              return {
                ...(currentDetail ?? detail),
                coverArtUrl,
                sources: hasCoverArtSource
                  ? currentSources
                  : [
                      ...currentSources,
                      {
                        sourceName: 'Cover Art Archive',
                        license: 'CC0'
                      }
                    ]
              }
            })
          })
          .catch(() => {
            // Cover art is optional and should not block Album Detail.
          })

        if (!detail?.selectedReleaseId) {
          return
        }

        try {
          const tracklistDetail = await fetchMusicBrainzSelectedReleaseTracklist(detail.selectedReleaseId, detail.editions)
          if (isCurrent) {
            setSelectedAlbumDetail((currentDetail) => ({
              ...(currentDetail ?? detail),
              selectedReleaseId: tracklistDetail.selectedReleaseId ?? detail.selectedReleaseId,
              editions: tracklistDetail.editions ?? currentDetail?.editions ?? detail.editions ?? [],
              tracks: tracklistDetail.tracks ?? [],
              credits: tracklistDetail.credits ?? {
                albumCredits: null,
                trackCredits: null
              }
            }))
          }
        } catch (error) {
          if (isCurrent) {
            setAlbumDetailError(error?.message || 'We could not load the MusicBrainz selected release tracklist.')
          }
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setAlbumDetailError(error?.message || 'We could not load MusicBrainz release-group details.')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setAlbumDetailLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [selectedAlbumId, selectedAlbumResult])

  async function handleSubmitArtistSearch({ artistName, albumTitle, releaseType }) {
    setAlbumSearchArtistName(artistName)
    setAlbumSearchAlbumTitle(albumTitle)
    setAlbumSearchReleaseType(releaseType)
    setAlbumSearchResults([])
    setAlbumSearchError('')
    setAlbumSearchLoading(true)
    setRoute('Results')

    try {
      const results = await searchMusicBrainzAlbumsByArtist({ artistName, albumTitle, releaseType })
      setAlbumSearchResults(results)
    } catch (error) {
      setAlbumSearchError(error?.message || 'We could not load album results. Please try again.')
    } finally {
      setAlbumSearchLoading(false)
    }
  }

  function handleSelectAlbum(albumId, albumResult = null) {
    if (albumResult) {
      setSelectedAlbumId(albumId)
      setSelectedAlbumResult(albumResult)
      setSelectedAlbumDetail(null)
      setAlbumDetailError('')
      setRoute('Album Detail')
      return
    }

    const selected = getMockAlbumById(albumId) || getMockAlbums()[0]
    if (selected) {
      setSelectedAlbumId(selected.albumId)
      setSelectedAlbumResult(null)
      setSelectedAlbumDetail(null)
      setAlbumDetailError('')
      setRoute('Album Detail')
    }
  }

  function handleBackToResults() {
    setRoute('Results')
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Liner Notez</Text>
        {!!albumSearchArtistName && (
          <Text style={styles.subtitle}>
            Browsing albums by {albumSearchArtistName}{albumSearchAlbumTitle ? ` matching ${albumSearchAlbumTitle}` : ''}
          </Text>
        )}
      </View>
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={tab}
            onPress={() => setRoute(tab)}
            style={[styles.tab, route === tab && styles.tabActive]}
          >
            <Text style={styles.tabLabel}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>
        <ScreenRouter
          route={route}
          albumSearchResults={albumSearchResults}
          albumSearchAlbumTitle={albumSearchAlbumTitle}
          albumSearchArtistName={albumSearchArtistName}
          albumSearchReleaseType={albumSearchReleaseType}
          albumSearchError={albumSearchError}
          albumSearchLoading={albumSearchLoading}
          selectedAlbumId={selectedAlbumId}
          selectedAlbumResult={selectedAlbumResult}
          selectedAlbumDetail={selectedAlbumDetail}
          albumDetailLoading={albumDetailLoading}
          albumDetailError={albumDetailError}
          onSubmitArtistSearch={handleSubmitArtistSearch}
          onSelectAlbum={handleSelectAlbum}
          onBackToResults={handleBackToResults}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101114' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: '#f3f4f6', fontSize: 22, fontWeight: '600' },
  subtitle: { color: '#9ca3af', marginTop: 6, fontSize: 12 },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  tab: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  tabActive: {
    borderColor: '#f3f4f6'
  },
  tabLabel: { color: '#e5e7eb', fontSize: 12 },
  content: { flex: 1, minHeight: 0, padding: 16 }
})
