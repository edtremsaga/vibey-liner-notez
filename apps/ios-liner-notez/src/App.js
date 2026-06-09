import React, { useEffect, useRef, useState } from 'react'
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SearchScreen } from './screens/SearchScreen'
import { ResultsScreen, getDefaultSortOption } from './screens/ResultsScreen'
import { AlbumDetailScreen } from './screens/AlbumDetailScreen'
import { ProducerSearchScreen } from './screens/ProducerSearchScreen'
import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'
import { MyLibraryScreen } from './screens/MyLibraryScreen'
import {
  fetchMusicBrainzAlbumBasicInfo,
  fetchMusicBrainzArtworkGallery,
  fetchMusicBrainzPrimaryCoverArt,
  fetchMusicBrainzSelectedReleaseTracklist,
  fetchWikipediaArticleFromWikidataUrl
} from './services/musicbrainzAlbumDetail'
import { searchMusicBrainzAlbumsByArtist } from './services/musicbrainzAlbumSearch'
import { formatMusicDataError } from './services/musicDataErrors'
import { buildSavedAlbumSummary, loadMyLibrary, saveMyLibrary } from './services/myLibraryStorage'

const HEADER_FONT_MAX_MULTIPLIER = 1.3

const HEADER_RELEASE_TYPE_PHRASES = {
  Album: 'albums',
  EP: 'EPs',
  Single: 'singles',
  Live: 'live albums',
  Compilation: 'compilations',
  Soundtrack: 'soundtracks'
}

const INITIAL_PRODUCER_SEARCH_STATE = {
  producerName: '',
  showValidation: false,
  isLoadingCandidates: false,
  isLoadingProducerResults: false,
  candidateResult: null,
  selectedProducer: null,
  producerResult: null,
  producerResultError: '',
  isLoadingMoreProducerResults: false,
  producerLoadMoreMessage: '',
  producerLoadMoreError: '',
  errorMessage: ''
}

function getReleaseTypeHeaderPhrase(releaseType) {
  return HEADER_RELEASE_TYPE_PHRASES[releaseType] ?? HEADER_RELEASE_TYPE_PHRASES.Album
}

function getHeaderSubtitle({
  albumSearchAlbumTitle,
  albumSearchArtistName,
  albumSearchReleaseType,
  detailReturnRoute,
  producerSearchState,
  route
}) {
  if (route === 'My Library' || (route === 'Album Detail' && detailReturnRoute === 'My Library')) {
    return 'Private research notebook'
  }

  if (route === 'Producer Search' || (route === 'Album Detail' && detailReturnRoute === 'Producer Search')) {
    const producerName = producerSearchState?.selectedProducer?.name ?? producerSearchState?.producerName?.trim()
    return producerName ? `Producer credits for ${producerName}` : 'Producer Search'
  }

  const releaseTypePhrase = albumSearchAlbumTitle
    ? HEADER_RELEASE_TYPE_PHRASES.Album
    : getReleaseTypeHeaderPhrase(albumSearchReleaseType)

  return albumSearchArtistName
    ? `Browsing ${releaseTypePhrase} by ${albumSearchArtistName}${albumSearchAlbumTitle ? ` matching ${albumSearchAlbumTitle}` : ''}`
    : ''
}

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
    wikipediaArticle: enrichedDetail?.wikipediaArticle ?? null,
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
  albumSearchSortOption,
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
  onOpenMyLibrary,
  onAlbumSearchSortOptionChange,
  onSearchFormAlbumTitleChange,
  onSearchFormArtistNameChange,
  onSearchFormReleaseTypeChange,
  onProducerSearchStateChange,
  searchFormAlbumTitle,
  searchFormArtistName,
  searchFormReleaseType,
  producerSearchState,
  detailReturnRoute,
  savedAlbums,
  libraryError,
  libraryReady,
  onSaveAlbum,
  onRemoveSavedAlbum,
  onSavePrivateNote,
  onDeletePrivateNote
}) {
  const selectedAlbum = selectedAlbumResult
    ? buildAlbumDetailFromResult(selectedAlbumId, selectedAlbumResult, selectedAlbumDetail)
    : null

  switch (route) {
    case 'Results':
      return (
        <ResultsScreen
          albums={albumSearchResults}
          albumTitle={albumSearchAlbumTitle}
          artistName={albumSearchArtistName}
          releaseType={albumSearchReleaseType}
          sortOption={albumSearchSortOption}
          errorMessage={albumSearchError}
          isLoading={albumSearchLoading}
          onBackToSearch={onBackToSearch}
          onSelectAlbum={onSelectAlbum}
          onSortOptionChange={onAlbumSearchSortOptionChange}
        />
      )
    case 'Album Detail':
      {
        const savedAlbum = savedAlbums.find((album) => album.releaseGroupId === selectedAlbum?.albumId) ?? null
        return (
          <AlbumDetailScreen
            album={selectedAlbum}
            errorMessage={albumDetailError}
            isLoading={albumDetailLoading}
            onBackToResults={onBackToAlbumSource}
            backLabel={
              detailReturnRoute === 'Producer Search'
                ? 'Back to Producer Search'
                : detailReturnRoute === 'My Library'
                  ? 'Back to My Library'
                  : 'Back to Results'
            }
            isLibraryReady={libraryReady}
            libraryErrorMessage={libraryError}
            savedAlbum={savedAlbum}
            onSaveAlbum={onSaveAlbum}
            onRemoveSavedAlbum={onRemoveSavedAlbum}
            onSavePrivateNote={onSavePrivateNote}
            onDeletePrivateNote={onDeletePrivateNote}
          />
        )
      }
    case 'Producer Search':
      return (
        <ProducerSearchScreen
          onBackToSearch={onBackToSearch}
          onProducerSearchStateChange={onProducerSearchStateChange}
          onSelectAlbum={onSelectAlbum}
          producerSearchState={producerSearchState}
        />
      )
    case 'Help / Data Sources':
      return <HelpDataSourcesScreen onBackToSearch={onBackToSearch} />
    case 'My Library':
      return (
        <MyLibraryScreen
          albums={savedAlbums}
          errorMessage={libraryError}
          isReady={libraryReady}
          onBackToSearch={onBackToSearch}
          onOpenAlbum={(savedAlbum) => onSelectAlbum(
            savedAlbum.releaseGroupId,
            {
              id: savedAlbum.releaseGroupId,
              releaseGroupId: savedAlbum.releaseGroupId,
              title: savedAlbum.title,
              artistCredit: savedAlbum.artistName,
              firstReleaseDate: savedAlbum.firstReleaseDate,
              releaseYear: savedAlbum.releaseYear,
              disambiguation: savedAlbum.disambiguation
            },
            'My Library'
          )}
          onRemoveAlbum={onRemoveSavedAlbum}
          onSaveNote={onSavePrivateNote}
        />
      )
    case 'Search':
    default:
      return (
        <SearchScreen
          albumInput={searchFormAlbumTitle}
          artistInput={searchFormArtistName}
          onOpenHelpDataSources={onOpenHelpDataSources}
          onOpenMyLibrary={onOpenMyLibrary}
          onOpenProducerSearch={onOpenProducerSearch}
          onAlbumInputChange={onSearchFormAlbumTitleChange}
          onArtistInputChange={onSearchFormArtistNameChange}
          onReleaseTypeChange={onSearchFormReleaseTypeChange}
          onSubmitArtistSearch={onSubmitArtistSearch}
          releaseType={searchFormReleaseType}
          savedAlbumCount={savedAlbums.length}
        />
      )
  }
}

class StartupErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Liner Notez startup error', error)
  }

  render() {
    if (this.state.error) {
      const errorMessage = this.state.error?.message || String(this.state.error)

      return (
        <SafeAreaView style={styles.startupErrorRoot}>
          <View style={styles.startupErrorCard}>
            <Text style={styles.startupErrorTitle}>Liner Notez startup error</Text>
            <Text style={styles.startupErrorText}>
              The app hit an error before the first screen loaded.
            </Text>
            <Text style={styles.startupErrorMessage}>{errorMessage}</Text>
            <Text style={styles.startupErrorNote}>
              Diagnostic text for TestFlight.
            </Text>
          </View>
        </SafeAreaView>
      )
    }

    return this.props.children
  }
}

function LinerNotezApp() {
  const [route, setRoute] = useState('Search')
  const [searchFormArtistName, setSearchFormArtistName] = useState('')
  const [searchFormAlbumTitle, setSearchFormAlbumTitle] = useState('')
  const [searchFormReleaseType, setSearchFormReleaseType] = useState('Album')
  const [albumSearchResults, setAlbumSearchResults] = useState([])
  const [albumSearchAlbumTitle, setAlbumSearchAlbumTitle] = useState('')
  const [albumSearchArtistName, setAlbumSearchArtistName] = useState('')
  const [albumSearchReleaseType, setAlbumSearchReleaseType] = useState('Album')
  const [albumSearchSortOption, setAlbumSearchSortOption] = useState(() => getDefaultSortOption({
    albumTitle: '',
    releaseType: 'Album'
  }))
  const [albumSearchError, setAlbumSearchError] = useState('')
  const [albumSearchLoading, setAlbumSearchLoading] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [selectedAlbumResult, setSelectedAlbumResult] = useState(null)
  const [selectedAlbumDetail, setSelectedAlbumDetail] = useState(null)
  const [albumDetailLoading, setAlbumDetailLoading] = useState(false)
  const [albumDetailError, setAlbumDetailError] = useState('')
  const [detailReturnRoute, setDetailReturnRoute] = useState('Results')
  const [producerSearchState, setProducerSearchState] = useState(INITIAL_PRODUCER_SEARCH_STATE)
  const [savedAlbums, setSavedAlbums] = useState([])
  const [libraryReady, setLibraryReady] = useState(false)
  const [libraryError, setLibraryError] = useState('')
  const albumSearchRequestId = useRef(0)
  const [albumDetailOpenRequestId, setAlbumDetailOpenRequestId] = useState(0)

  useEffect(() => {
    let isCurrent = true

    loadMyLibrary()
      .then((albums) => {
        if (!isCurrent) {
          return
        }
        setSavedAlbums(albums)
        setLibraryError('')
        setLibraryReady(true)
      })
      .catch((error) => {
        if (!isCurrent) {
          return
        }
        console.warn('Unable to load My Library', error)
        setLibraryError('Your saved albums could not be loaded. Reopen the app and try again.')
        setLibraryReady(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

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

        if (detail.externalLinks?.wikidataUrl) {
          fetchWikipediaArticleFromWikidataUrl(detail.externalLinks.wikidataUrl)
            .then((wikipediaArticle) => {
              if (!isCurrent || !wikipediaArticle?.url) {
                return
              }

              setSelectedAlbumDetail((currentDetail) => {
                const currentSources = currentDetail?.sources ?? detail.sources ?? []
                const hasWikipediaSource = currentSources.some((source) => source?.sourceName === 'Wikipedia')

                return {
                  ...(currentDetail ?? detail),
                  wikipediaArticle,
                  sources: hasWikipediaSource
                    ? currentSources
                    : [
                        ...currentSources,
                        {
                          sourceName: 'Wikipedia',
                          license: 'CC BY-SA'
                        }
                      ]
                }
              })
            })
            .catch(() => {
              // Wikipedia links are optional and should not block Album Detail.
            })
        }

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
            setAlbumDetailError(formatMusicDataError(error))
          }
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setAlbumDetailError(formatMusicDataError(error))
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
  }, [selectedAlbumId, selectedAlbumResult, albumDetailOpenRequestId])

  async function handleSubmitArtistSearch({ artistName, albumTitle, releaseType }) {
    const requestId = albumSearchRequestId.current + 1
    albumSearchRequestId.current = requestId

    setSearchFormArtistName(artistName)
    setSearchFormAlbumTitle(albumTitle)
    setSearchFormReleaseType(releaseType)
    setAlbumSearchArtistName(artistName)
    setAlbumSearchAlbumTitle(albumTitle)
    setAlbumSearchReleaseType(releaseType)
    setAlbumSearchSortOption(getDefaultSortOption({ albumTitle, releaseType }))
    setAlbumSearchResults([])
    setAlbumSearchError('')
    setAlbumSearchLoading(true)
    setDetailReturnRoute('Results')
    setRoute('Results')

    try {
      const results = await searchMusicBrainzAlbumsByArtist({ artistName, albumTitle, releaseType })
      if (albumSearchRequestId.current !== requestId) {
        return
      }
      setAlbumSearchResults(results)
    } catch (error) {
      if (albumSearchRequestId.current !== requestId) {
        return
      }
      setAlbumSearchError(formatMusicDataError(error))
    } finally {
      if (albumSearchRequestId.current === requestId) {
        setAlbumSearchLoading(false)
      }
    }
  }

  function handleSelectAlbum(albumId, albumResult = null, sourceRoute = 'Results') {
    if (!albumResult) {
      return
    }

    setSelectedAlbumId(albumId)
    setSelectedAlbumResult(albumResult)
    setSelectedAlbumDetail(null)
    setAlbumDetailError('')
    setDetailReturnRoute(sourceRoute)
    setAlbumDetailOpenRequestId((current) => current + 1)
    setRoute('Album Detail')
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

  function handleOpenMyLibrary() {
    setRoute('My Library')
  }

  async function persistLibrary(nextAlbums) {
    if (!libraryReady) {
      setLibraryError('My Library is still loading. Please wait and try again.')
      return false
    }

    try {
      const persistedAlbums = await saveMyLibrary(nextAlbums)
      setSavedAlbums(persistedAlbums)
      setLibraryError('')
      return true
    } catch (error) {
      console.warn('Unable to save My Library', error)
      setLibraryError('Your My Library changes could not be saved. Please try again.')
      return false
    }
  }

  async function handleSaveAlbum(album) {
    const releaseGroupId = album?.albumId ?? album?.releaseGroupId ?? album?.id ?? null
    const existingAlbum = savedAlbums.find((savedAlbum) => savedAlbum.releaseGroupId === releaseGroupId) ?? null
    const savedAlbum = buildSavedAlbumSummary(album, existingAlbum)
    if (!savedAlbum) {
      setLibraryError('This album could not be saved because its album information is incomplete.')
      return
    }

    const nextAlbums = [
      ...savedAlbums.filter((candidate) => candidate.releaseGroupId !== savedAlbum.releaseGroupId),
      savedAlbum
    ]
    await persistLibrary(nextAlbums)
  }

  async function handleSavePrivateNote(releaseGroupId, note) {
    const existingAlbum = savedAlbums.find((album) => album.releaseGroupId === releaseGroupId)
    if (!existingAlbum) {
      setLibraryError('Save this album to My Library before adding a private note.')
      return
    }

    const nextAlbums = savedAlbums.map((album) =>
      album.releaseGroupId === releaseGroupId
        ? { ...album, note, updatedAt: new Date().toISOString() }
        : album
    )
    await persistLibrary(nextAlbums)
  }

  async function performRemoveSavedAlbum(releaseGroupId) {
    const nextAlbums = savedAlbums.filter((album) => album.releaseGroupId !== releaseGroupId)
    await persistLibrary(nextAlbums)
  }

  function handleRemoveSavedAlbum(releaseGroupId) {
    const savedAlbum = savedAlbums.find((album) => album.releaseGroupId === releaseGroupId)
    if (!savedAlbum) {
      return
    }

    if (savedAlbum.note.trim()) {
      Alert.alert(
        'Remove saved album?',
        'Removing this album will also delete its private note from this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              performRemoveSavedAlbum(releaseGroupId)
            }
          }
        ]
      )
      return
    }

    performRemoveSavedAlbum(releaseGroupId)
  }

  function handleDeletePrivateNote(releaseGroupId) {
    handleSavePrivateNote(releaseGroupId, '')
  }

  const headerSubtitle = getHeaderSubtitle({
    albumSearchAlbumTitle,
    albumSearchArtistName,
    albumSearchReleaseType,
    detailReturnRoute,
    producerSearchState,
    route
  })

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text maxFontSizeMultiplier={HEADER_FONT_MAX_MULTIPLIER} style={styles.title}>Liner Notez</Text>
        {!!headerSubtitle && (
          <Text maxFontSizeMultiplier={HEADER_FONT_MAX_MULTIPLIER} style={styles.subtitle}>
            {headerSubtitle}
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
          albumSearchSortOption={albumSearchSortOption}
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
          onOpenMyLibrary={handleOpenMyLibrary}
          onAlbumSearchSortOptionChange={setAlbumSearchSortOption}
          onSearchFormAlbumTitleChange={setSearchFormAlbumTitle}
          onSearchFormArtistNameChange={setSearchFormArtistName}
          onSearchFormReleaseTypeChange={setSearchFormReleaseType}
          onProducerSearchStateChange={setProducerSearchState}
          searchFormAlbumTitle={searchFormAlbumTitle}
          searchFormArtistName={searchFormArtistName}
          searchFormReleaseType={searchFormReleaseType}
          producerSearchState={producerSearchState}
          detailReturnRoute={detailReturnRoute}
          savedAlbums={savedAlbums}
          libraryError={libraryError}
          libraryReady={libraryReady}
          onSaveAlbum={handleSaveAlbum}
          onRemoveSavedAlbum={handleRemoveSavedAlbum}
          onSavePrivateNote={handleSavePrivateNote}
          onDeletePrivateNote={handleDeletePrivateNote}
        />
      </View>
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <StartupErrorBoundary>
      <LinerNotezApp />
    </StartupErrorBoundary>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101114' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: '#f3f4f6', fontSize: 22, fontWeight: '600' },
  subtitle: { color: '#9ca3af', marginTop: 6, fontSize: 12 },
  content: { flex: 1, minHeight: 0, padding: 16 },
  startupErrorRoot: {
    flex: 1,
    backgroundColor: '#101114',
    padding: 20,
    justifyContent: 'center'
  },
  startupErrorCard: {
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#2a1215'
  },
  startupErrorTitle: {
    color: '#fecaca',
    fontSize: 22,
    fontWeight: '700'
  },
  startupErrorText: {
    color: '#fca5a5',
    fontSize: 16,
    marginTop: 10
  },
  startupErrorMessage: {
    color: '#fef2f2',
    fontSize: 14,
    marginTop: 12
  },
  startupErrorNote: {
    color: '#fca5a5',
    fontSize: 13,
    marginTop: 14
  }
})
