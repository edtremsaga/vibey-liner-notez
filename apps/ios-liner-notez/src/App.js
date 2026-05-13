import React, { useMemo, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SearchScreen } from './screens/SearchScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { AlbumDetailScreen } from './screens/AlbumDetailScreen'
import { ProducerSearchScreen } from './screens/ProducerSearchScreen'
import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'
import { getMockAlbumById, getMockAlbums } from 'core-liner-notez'

const ROUTES = ['Search', 'Results', 'Album Detail', 'Producer Search', 'Help / Data Sources']

function ScreenRouter({
  route,
  mockResults,
  selectedAlbumId,
  onSubmitMockSearch,
  onSelectAlbum,
  onBackToResults
}) {
  const selectedAlbum = selectedAlbumId ? getMockAlbumById(selectedAlbumId) : null

  switch (route) {
    case 'Results':
      return <ResultsScreen albums={mockResults} onSelectAlbum={onSelectAlbum} />
    case 'Album Detail':
      return <AlbumDetailScreen album={selectedAlbum} onBackToResults={onBackToResults} />
    case 'Producer Search':
      return <ProducerSearchScreen />
    case 'Help / Data Sources':
      return <HelpDataSourcesScreen />
    case 'Search':
    default:
      return <SearchScreen onSubmitMockSearch={onSubmitMockSearch} />
  }
}

export default function App() {
  const [route, setRoute] = useState('Search')
  const [mockResults] = useState(getMockAlbums())
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [lastMockSearchArtist, setLastMockSearchArtist] = useState('')
  const tabs = useMemo(() => ROUTES, [])

  function handleSubmitMockSearch(artistName) {
    setLastMockSearchArtist(artistName)
    setRoute('Results')
  }

  function handleSelectAlbum(albumId) {
    const selected = getMockAlbumById(albumId)
    if (selected) {
      setSelectedAlbumId(selected.albumId)
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
        {!!lastMockSearchArtist && (
          <Text style={styles.subtitle}>Mock search artist: {lastMockSearchArtist}</Text>
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
          mockResults={mockResults}
          selectedAlbumId={selectedAlbumId}
          onSubmitMockSearch={handleSubmitMockSearch}
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
