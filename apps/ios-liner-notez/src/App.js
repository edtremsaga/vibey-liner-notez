import React, { useMemo, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SearchScreen } from './screens/SearchScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { AlbumDetailScreen } from './screens/AlbumDetailScreen'
import { ProducerSearchScreen } from './screens/ProducerSearchScreen'
import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'
import { getMockAlbumById, getMockAlbums } from 'core-liner-notez'
import { searchMusicBrainzAlbumsByArtist } from './services/musicbrainzAlbumSearch'

const ROUTES = ['Search', 'Results', 'Album Detail', 'Producer Search', 'Help / Data Sources']

function buildAlbumDetailFromResult(albumId, albumResult) {
  if (!albumResult) {
    return null
  }

  const releaseGroupId = albumResult.releaseGroupId ?? albumResult.id ?? albumId
  const firstReleaseDate = albumResult.firstReleaseDate ?? null
  const releaseYear = albumResult.releaseYear
    ? Number(albumResult.releaseYear)
    : firstReleaseDate
      ? Number(firstReleaseDate.slice(0, 4))
      : null

  return {
    albumId: releaseGroupId,
    title: albumResult.title ?? 'Untitled album',
    artistName: albumResult.artistCredit ?? albumResult.artistName ?? 'Unknown artist',
    firstReleaseDate,
    releaseYear: Number.isNaN(releaseYear) ? null : releaseYear,
    disambiguation: albumResult.disambiguation ?? null,
    albumType: 'album',
    coverArtUrl: null,
    editions: [],
    tracks: [],
    credits: {
      albumCredits: null,
      trackCredits: null
    },
    recordingInfo: null,
    externalLinks: {
      musicbrainzReleaseGroupUrl: `https://musicbrainz.org/release-group/${releaseGroupId}`,
      musicbrainzSelectedReleaseUrl: null,
      wikidataUrl: null,
      discogsUrl: null
    },
    sources: [
      {
        sourceName: 'MusicBrainz',
        license: 'CC0'
      }
    ],
    dataNotes: 'Tracklist, credits, editions, and cover art are not loaded yet.'
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
  onSubmitArtistSearch,
  onSelectAlbum,
  onBackToResults
}) {
  const selectedAlbum = selectedAlbumResult
    ? buildAlbumDetailFromResult(selectedAlbumId, selectedAlbumResult)
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
      return <AlbumDetailScreen album={selectedAlbum} onBackToResults={onBackToResults} />
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
  const tabs = useMemo(() => ROUTES, [])

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
      setRoute('Album Detail')
      return
    }

    const selected = getMockAlbumById(albumId) || getMockAlbums()[0]
    if (selected) {
      setSelectedAlbumId(selected.albumId)
      setSelectedAlbumResult(null)
      setRoute('Album Detail')
    }
  }

  function handleBackToResults() {
    setRoute('Results')
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>liner notez (iOS scaffold)</Text>
        {!!albumSearchArtistName && (
          <Text style={styles.subtitle}>
            Artist search: {albumSearchArtistName}{albumSearchAlbumTitle ? ` - ${albumSearchAlbumTitle}` : ''}
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
  content: { flex: 1, padding: 16 }
})
