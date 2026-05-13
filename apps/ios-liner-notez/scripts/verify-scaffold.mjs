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
if (!appSource.includes("import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'")) {
  throw new Error('App.js does not import HelpDataSourcesScreen from src/screens')
}
if (!appSource.includes("case 'Help / Data Sources':") || !appSource.includes('return <HelpDataSourcesScreen />')) {
  throw new Error('App.js does not route Help / Data Sources to HelpDataSourcesScreen')
}
if (appSource.includes('Placeholder screen for help, attribution, and data-source disclosures.')) {
  throw new Error('App.js contains inline Help placeholder copy instead of screen-based Help content')
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

const producerSearchScreenSource = readFileSync(
  path.join(appRoot, 'src/screens/ProducerSearchScreen.js'),
  'utf8'
)
if (!producerSearchScreenSource.includes('Producer search input')) {
  throw new Error('ProducerSearchScreen does not include producer input')
}
if (!producerSearchScreenSource.includes('Search Mock Producers')) {
  throw new Error('ProducerSearchScreen does not include mock producer search action')
}
if (!producerSearchScreenSource.includes('Please enter a producer name to continue.')) {
  throw new Error('ProducerSearchScreen does not include required-field validation message')
}
if (!producerSearchScreenSource.includes('Loading mock producer results...')) {
  throw new Error('ProducerSearchScreen does not include mock loading state text')
}
if (!producerSearchScreenSource.includes('Mock producer error state')) {
  throw new Error('ProducerSearchScreen does not include mock error state text')
}
if (!producerSearchScreenSource.includes('No producer results found (mock empty state)')) {
  throw new Error('ProducerSearchScreen does not include mock empty state text')
}
if (!producerSearchScreenSource.includes('Producer shell only. Real producer traversal is not implemented yet.')) {
  throw new Error('ProducerSearchScreen does not include explicit mock-only results copy')
}
if (!producerSearchScreenSource.includes("Life's Rich Pageant")) {
  throw new Error("ProducerSearchScreen is missing mock producer result row title: Life's Rich Pageant")
}
if (!producerSearchScreenSource.includes('Producer match')) {
  throw new Error('ProducerSearchScreen does not include producer match label in mock rows')
}
if (!producerSearchScreenSource.includes('onSelectAlbum?.(result.albumId)')) {
  throw new Error('ProducerSearchScreen mock rows are not wired to albumId selection')
}

const helpDataSourcesScreenSource = readFileSync(
  path.join(appRoot, 'src/screens/HelpDataSourcesScreen.js'),
  'utf8'
)
if (helpDataSourcesScreenSource.includes('Placeholder screen for help, attribution, and data-source disclosures.')) {
  throw new Error('HelpDataSourcesScreen still contains placeholder-only copy')
}
if (!helpDataSourcesScreenSource.includes('mock-data-only')) {
  throw new Error('HelpDataSourcesScreen does not include explicit mock-data-only scope copy')
}
if (!helpDataSourcesScreenSource.includes('No real API calls are active yet.')) {
  throw new Error('HelpDataSourcesScreen does not include no-real-API copy')
}
if (!helpDataSourcesScreenSource.includes('No producer traversal is implemented yet.')) {
  throw new Error('HelpDataSourcesScreen does not include no-producer-traversal copy')
}
for (const source of ['MusicBrainz', 'Cover Art Archive', 'Wikidata', 'Wikipedia']) {
  if (!helpDataSourcesScreenSource.includes(source)) {
    throw new Error(`HelpDataSourcesScreen is missing planned real source: ${source}`)
  }
}
if (!helpDataSourcesScreenSource.includes('We do not invent credits.')) {
  throw new Error('HelpDataSourcesScreen does not include no-invented-credits trust rule')
}
if (
  !helpDataSourcesScreenSource.includes('unavailable') ||
  !helpDataSourcesScreenSource.includes('not documented')
) {
  throw new Error('HelpDataSourcesScreen does not include missing-data trust rule')
}

const albumDetailScreenSource = readFileSync(path.join(appRoot, 'src/screens/AlbumDetailScreen.js'), 'utf8')
if (!albumDetailScreenSource.includes('Back to Results')) {
  throw new Error('AlbumDetailScreen does not include back-to-results action')
}
if (!albumDetailScreenSource.includes('Loading mock album detail...')) {
  throw new Error('AlbumDetailScreen does not include mock loading state text')
}
if (!albumDetailScreenSource.includes('Tracklist')) {
  throw new Error('AlbumDetailScreen does not include Tracklist section label')
}
if (!albumDetailScreenSource.includes('track.position') || !albumDetailScreenSource.includes('track.title')) {
  throw new Error('AlbumDetailScreen does not render track number/title from mock data')
}
if (!albumDetailScreenSource.includes('Credits')) {
  throw new Error('AlbumDetailScreen does not include Credits section label')
}
if (
  !albumDetailScreenSource.includes('credit.personName') ||
  !albumDetailScreenSource.includes('credit.role')
) {
  throw new Error('AlbumDetailScreen does not render mock credit person/role data')
}
if (
  !albumDetailScreenSource.includes('track.title') ||
  !albumDetailScreenSource.includes('trackCreditsByTrackId')
) {
  throw new Error('AlbumDetailScreen does not render track-associated credit rows')
}
if (!albumDetailScreenSource.includes('Editions & Sources')) {
  throw new Error('AlbumDetailScreen does not include Editions & Sources section label')
}
if (!albumDetailScreenSource.includes('Selected Edition') || !albumDetailScreenSource.includes('selectedEditionRows')) {
  throw new Error('AlbumDetailScreen does not render compact selected edition section')
}
if (!albumDetailScreenSource.includes("['Country', selectedEdition.country]") || !albumDetailScreenSource.includes("['Format', selectedEdition.formatSummary]")) {
  throw new Error('AlbumDetailScreen does not render selected edition field rows')
}
if (!albumDetailScreenSource.includes('album.sources[0].sourceName')) {
  throw new Error('AlbumDetailScreen does not render source attribution mock field')
}
if (
  !albumDetailScreenSource.includes('externalLinks.musicbrainzReleaseGroupUrl') ||
  !albumDetailScreenSource.includes('externalLinks.musicbrainzSelectedReleaseUrl')
) {
  throw new Error('AlbumDetailScreen does not render external link rows from mock data')
}
if (!albumDetailScreenSource.includes('MusicBrainz release group')) {
  throw new Error('AlbumDetailScreen does not include external link labels in Editions & Sources')
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
if (!appSource.includes('return <ProducerSearchScreen onSelectAlbum={onSelectAlbum} />')) {
  throw new Error('App router does not pass album-select handler to ProducerSearchScreen')
}

console.log('PASS Expo scaffold files and mock Search -> Results -> Album Detail flow wiring verified')
