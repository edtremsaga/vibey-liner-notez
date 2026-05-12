import React, { useMemo, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SearchScreen } from './screens/SearchScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { AlbumDetailScreen } from './screens/AlbumDetailScreen'
import { ProducerSearchScreen } from './screens/ProducerSearchScreen'
import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'

const ROUTES = ['Search', 'Results', 'Album Detail', 'Producer Search', 'Help / Data Sources']

function ScreenRouter({ route }) {
  switch (route) {
    case 'Results':
      return <ResultsScreen />
    case 'Album Detail':
      return <AlbumDetailScreen />
    case 'Producer Search':
      return <ProducerSearchScreen />
    case 'Help / Data Sources':
      return <HelpDataSourcesScreen />
    case 'Search':
    default:
      return <SearchScreen />
  }
}

export default function App() {
  const [route, setRoute] = useState('Search')
  const tabs = useMemo(() => ROUTES, [])

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>liner notez (iOS scaffold)</Text>
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
        <ScreenRouter route={route} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101114' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: '#f3f4f6', fontSize: 22, fontWeight: '600' },
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
