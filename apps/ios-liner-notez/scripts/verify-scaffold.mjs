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
if (!searchScreenSource.includes('mockAlbumFixture')) {
  throw new Error('SearchScreen does not import shared core mockAlbumFixture')
}
if (!searchScreenSource.includes("from 'core-liner-notez'")) {
  throw new Error('SearchScreen does not use stable shared core package import')
}
if (!searchScreenSource.includes('Mock album preview (shared core fixture)')) {
  throw new Error('SearchScreen does not render mock album preview marker')
}

console.log('PASS Expo scaffold files, placeholder routes, and shared core mock album wiring verified')
