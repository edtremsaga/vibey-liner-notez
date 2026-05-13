import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')

const requiredFiles = [
  'index.js',
  'src/App.js',
  'src/screens/SearchScreen.js',
  'src/screens/ResultsScreen.js',
  'src/screens/AlbumDetailScreen.js',
  'src/screens/ProducerSearchScreen.js',
  'src/screens/HelpDataSourcesScreen.js'
]

for (const rel of requiredFiles) {
  const full = path.join(appRoot, rel)
  if (!existsSync(full)) {
    throw new Error(`Missing scaffold file: ${rel}`)
  }
}

const appSource = readFileSync(path.join(appRoot, 'src/App.js'), 'utf8')
const requiredRoutes = ['Search', 'Results', 'Album Detail', 'Producer Search', 'Help / Data Sources']
for (const route of requiredRoutes) {
  if (!appSource.includes(route)) {
    throw new Error(`Route not found in App.js: ${route}`)
  }
}

const searchScreenSource = readFileSync(path.join(appRoot, 'src/screens/SearchScreen.js'), 'utf8')
if (!searchScreenSource.includes('getMockAlbums')) {
  throw new Error('SearchScreen does not use shared core getMockAlbums')
}
if (!searchScreenSource.includes("from 'core-liner-notez'")) {
  throw new Error('SearchScreen does not use stable shared core package import')
}
if (!searchScreenSource.includes('Artist search input')) {
  throw new Error('SearchScreen does not include artist search input marker')
}
if (!searchScreenSource.includes('Search Mock Albums')) {
  throw new Error('SearchScreen does not include mock search action')
}
if (!searchScreenSource.includes('Please enter an artist name to continue.')) {
  throw new Error('SearchScreen does not include empty-input validation message')
}

const resultsScreenSource = readFileSync(path.join(appRoot, 'src/screens/ResultsScreen.js'), 'utf8')
if (!resultsScreenSource.includes('albums.map')) {
  throw new Error('ResultsScreen does not render result list from shared fixture data')
}
if (!resultsScreenSource.includes('onSelectAlbum(albumId)')) {
  throw new Error('ResultsScreen does not pass albumId-only selection handler')
}
if (!resultsScreenSource.includes('No albums found (mock empty state)')) {
  throw new Error('ResultsScreen does not include mock empty state text')
}
if (!resultsScreenSource.includes('Mock error state')) {
  throw new Error('ResultsScreen does not include mock error state text')
}
if (!resultsScreenSource.includes('Loading mock album results...')) {
  throw new Error('ResultsScreen does not include mock loading state text')
}

const albumDetailScreenSource = readFileSync(path.join(appRoot, 'src/screens/AlbumDetailScreen.js'), 'utf8')
if (!albumDetailScreenSource.includes('Back to Results')) {
  throw new Error('AlbumDetailScreen does not include back-to-results action')
}
if (!albumDetailScreenSource.includes('Loading mock album detail...')) {
  throw new Error('AlbumDetailScreen does not include mock loading state text')
}
if (!albumDetailScreenSource.includes('TRACKLIST_MOCK_DATA_MARKER')) {
  throw new Error('AlbumDetailScreen does not include mock tracklist data marker')
}
if (!albumDetailScreenSource.includes('track.position') || !albumDetailScreenSource.includes('track.title')) {
  throw new Error('AlbumDetailScreen does not render track number/title from mock data')
}
if (!albumDetailScreenSource.includes('CREDITS_PREVIEW_MARKER')) {
  throw new Error('AlbumDetailScreen does not include credits preview marker')
}
if (!albumDetailScreenSource.includes('EDITIONS_SOURCES_PREVIEW_MARKER')) {
  throw new Error('AlbumDetailScreen does not include editions/sources preview marker')
}
if (!albumDetailScreenSource.includes('mock not-found state')) {
  throw new Error('AlbumDetailScreen does not include not-found/unavailable state')
}

if (!appSource.includes('handleSubmitMockSearch') || !appSource.includes("setRoute('Results')")) {
  throw new Error('App router does not navigate from search to results via mock submit flow')
}
if (!appSource.includes('handleSelectAlbum') || !appSource.includes("setRoute('Album Detail')")) {
  throw new Error('App router does not navigate from results to album detail')
}
if (!appSource.includes('getMockAlbumById')) {
  throw new Error('App router does not use shared core getMockAlbumById accessor')
}
if (!appSource.includes('handleBackToResults') || !appSource.includes("setRoute('Results')")) {
  throw new Error('App router does not restore results route from album detail')
}

console.log('PASS Expo scaffold files and mock Search -> Results -> Album Detail flow wiring verified')
