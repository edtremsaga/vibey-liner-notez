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
if (!searchScreenSource.includes('Mock album preview (shared core fixture)')) {
  throw new Error('SearchScreen does not render mock album preview marker')
}
if (!searchScreenSource.includes('View Mock Results')) {
  throw new Error('SearchScreen does not include View Mock Results action')
}

const resultsScreenSource = readFileSync(path.join(appRoot, 'src/screens/ResultsScreen.js'), 'utf8')
if (!resultsScreenSource.includes('albums.map')) {
  throw new Error('ResultsScreen does not render result list from shared fixture data')
}
if (!resultsScreenSource.includes('onSelectAlbum')) {
  throw new Error('ResultsScreen does not wire album selection handler')
}
if (!resultsScreenSource.includes('No albums found (mock empty state)')) {
  throw new Error('ResultsScreen does not include mock empty state text')
}
if (!resultsScreenSource.includes('Mock error state')) {
  throw new Error('ResultsScreen does not include mock error state text')
}

const albumDetailScreenSource = readFileSync(path.join(appRoot, 'src/screens/AlbumDetailScreen.js'), 'utf8')
if (!albumDetailScreenSource.includes('Back to Results')) {
  throw new Error('AlbumDetailScreen does not include back-to-results action')
}
if (!albumDetailScreenSource.includes('album.title')) {
  throw new Error('AlbumDetailScreen does not render selected album data')
}

if (!appSource.includes('handleSelectAlbum') || !appSource.includes('setRoute(\'Album Detail\')')) {
  throw new Error('App router does not navigate from results to album detail')
}
if (!appSource.includes('getMockAlbumById')) {
  throw new Error('App router does not use shared core getMockAlbumById accessor')
}
if (!appSource.includes('handleBackToResults') || !appSource.includes('setRoute(\'Results\')')) {
  throw new Error('App router does not restore results route from album detail')
}

console.log('PASS Expo scaffold files, route shell, and Search -> Results -> Album Detail mock flow wiring verified')
