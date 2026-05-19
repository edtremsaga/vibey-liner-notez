import React, { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SearchScreen } from './screens/SearchScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { AlbumDetailScreen } from './screens/AlbumDetailScreen'
import { ProducerSearchScreen } from './screens/ProducerSearchScreen'
import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'
import { getMockAlbumById, getMockAlbums } from 'core-liner-notez'
import {
  fetchMusicBrainzAlbumBasicInfo,
  fetchMusicBrainzArtworkGallery,
  fetchMusicBrainzPrimaryCoverArt,
  fetchMusicBrainzSelectedReleaseTracklist
} from './services/musicbrainzAlbumDetail'
import { searchMusicBrainzAlbumsByArtist } from './services/musicbrainzAlbumSearch'

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
    artworkImages: enrichedDetail?.artworkImages ?? [],
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
  onBackToSearch,
  onBackToAlbumSource,
  onOpenProducerSearch,
  onOpenHelpDataSources,
  onSearchFormAlbumTitleChange,
  onSearchFormArtistNameChange,
  onSearchFormReleaseTypeChange,
  searchFormAlbumTitle,
  searchFormArtistName,
  searchFormReleaseType,
  detailReturnRoute
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
          onBackToSearch={onBackToSearch}
          onSelectAlbum={onSelectAlbum}
        />
      )
    case 'Album Detail':
      return (
        <AlbumDetailScreen
          album={selectedAlbum}
          errorMessage={albumDetailError}
          isLoading={albumDetailLoading}
          onBackToResults={onBackToAlbumSource}
          backLabel={detailReturnRoute === 'Producer Search' ? 'Back to Producer Search' : 'Back to Results'}
        />
      )
    case 'Producer Search':
      return <ProducerSearchScreen onBackToSearch={onBackToSearch} onSelectAlbum={onSelectAlbum} />
    case 'Help / Data Sources':
      return <HelpDataSourcesScreen onBackToSearch={onBackToSearch} />
    case 'Search':
    default:
      return (
        <SearchScreen
          albumInput={searchFormAlbumTitle}
          artistInput={searchFormArtistName}
          onOpenHelpDataSources={onOpenHelpDataSources}
          onOpenProducerSearch={onOpenProducerSearch}
          onAlbumInputChange={onSearchFormAlbumTitleChange}
          onArtistInputChange={onSearchFormArtistNameChange}
          onReleaseTypeChange={onSearchFormReleaseTypeChange}
          onSubmitArtistSearch={onSubmitArtistSearch}
          releaseType={searchFormReleaseType}
        />
      )
  }
}

export default function App() {
  const [route, setRoute] = useState('Search')
  const [searchFormArtistName, setSearchFormArtistName] = useState('')
  const [searchFormAlbumTitle, setSearchFormAlbumTitle] = useState('')
  const [searchFormReleaseType, setSearchFormReleaseType] = useState('Album')
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
  const [detailReturnRoute, setDetailReturnRoute] = useState('Results')

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

        fetchMusicBrainzArtworkGallery(detail.albumId ?? selectedAlbumId)
          .then((artworkImages) => {
            if (!isCurrent || !Array.isArray(artworkImages) || artworkImages.length === 0) {
              return
            }

            setSelectedAlbumDetail((currentDetail) => {
              const currentSources = currentDetail?.sources ?? detail.sources ?? []
              const hasCoverArtSource = currentSources.some((source) => source?.sourceName === 'Cover Art Archive')

              return {
                ...(currentDetail ?? detail),
                artworkImages,
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
            // Gallery art is optional and should not block Album Detail.
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
    setSearchFormArtistName(artistName)
    setSearchFormAlbumTitle(albumTitle)
    setSearchFormReleaseType(releaseType)
    setAlbumSearchArtistName(artistName)
    setAlbumSearchAlbumTitle(albumTitle)
    setAlbumSearchReleaseType(releaseType)
    setAlbumSearchResults([])
    setAlbumSearchError('')
    setAlbumSearchLoading(true)
    setDetailReturnRoute('Results')
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
      setDetailReturnRoute('Results')
      setRoute('Album Detail')
      return
    }

    const selected = getMockAlbumById(albumId) || getMockAlbums()[0]
    if (selected) {
      setSelectedAlbumId(selected.albumId)
      setSelectedAlbumResult(null)
      setSelectedAlbumDetail(null)
      setAlbumDetailError('')
      setDetailReturnRoute(route === 'Producer Search' ? 'Producer Search' : 'Results')
      setRoute('Album Detail')
    }
  }

  function handleBackToAlbumSource() {
    setRoute(detailReturnRoute)
  }

  function handleBackToSearch() {
    setRoute('Search')
  }

  function handleOpenProducerSearch() {
    setRoute('Producer Search')
  }

  function handleOpenHelpDataSources() {
    setRoute('Help / Data Sources')
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
          onBackToSearch={handleBackToSearch}
          onBackToAlbumSource={handleBackToAlbumSource}
          onOpenProducerSearch={handleOpenProducerSearch}
          onOpenHelpDataSources={handleOpenHelpDataSources}
          onSearchFormAlbumTitleChange={setSearchFormAlbumTitle}
          onSearchFormArtistNameChange={setSearchFormArtistName}
          onSearchFormReleaseTypeChange={setSearchFormReleaseType}
          searchFormAlbumTitle={searchFormAlbumTitle}
          searchFormArtistName={searchFormArtistName}
          searchFormReleaseType={searchFormReleaseType}
          detailReturnRoute={detailReturnRoute}
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
  content: { flex: 1, minHeight: 0, padding: 16 }
})
