import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')

const requiredFiles = [
  'index.js',
  'src/App.js',
  'src/services/musicbrainzAlbumDetail.js',
  'src/services/musicbrainzAlbumSearch.js',
  'src/services/musicDataErrors.js',
  'src/services/musicbrainzProducerSearch.js',
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
const musicDataErrorsSource = readFileSync(path.join(appRoot, 'src/services/musicDataErrors.js'), 'utf8')
const formatMusicDataError = new Function(
  `${musicDataErrorsSource.replace('export function formatMusicDataError', 'function formatMusicDataError')}\nreturn formatMusicDataError;`
)()
const requiredRoutes = ['Search', 'Results', 'Album Detail', 'Producer Search', 'Help / Data Sources']
for (const route of requiredRoutes) {
  if (!appSource.includes(route)) {
    throw new Error(`Route not found in App.js: ${route}`)
  }
}
if (!appSource.includes("import { HelpDataSourcesScreen } from './screens/HelpDataSourcesScreen'")) {
  throw new Error('App.js does not import HelpDataSourcesScreen from src/screens')
}
if (
  !appSource.includes("case 'Help / Data Sources':") ||
  !appSource.includes('return <HelpDataSourcesScreen onBackToSearch={onBackToSearch} />')
) {
  throw new Error('App.js does not route Help / Data Sources to HelpDataSourcesScreen')
}
if (appSource.includes('Placeholder screen for help, attribution, and data-source disclosures.')) {
  throw new Error('App.js contains inline Help placeholder copy instead of screen-based Help content')
}
if (!appSource.includes('content: { flex: 1, minHeight: 0, padding: 16 }')) {
  throw new Error('App content shell does not provide a bounded scroll host for screen ScrollViews')
}
if (!appSource.includes('Liner Notez') || appSource.includes('liner notez (iOS scaffold)')) {
  throw new Error('App visible title still uses scaffold/dev copy')
}
if (!appSource.includes('Browsing albums by') || appSource.includes('Artist search:')) {
  throw new Error('App search context copy still reads like internal state')
}
if (
  appSource.includes('const ROUTES') ||
  appSource.includes('const tabs') ||
  appSource.includes('styles.tabs') ||
  appSource.includes('tabActive') ||
  appSource.includes('tabLabel')
) {
  throw new Error('App.js still exposes the prototype top tab navigation shell')
}
if (
  !appSource.includes("const [detailReturnRoute, setDetailReturnRoute] = useState('Results')") ||
  !appSource.includes("setDetailReturnRoute('Results')") ||
  !appSource.includes("setDetailReturnRoute(route === 'Producer Search' ? 'Producer Search' : 'Results')") ||
  !appSource.includes('setRoute(detailReturnRoute)')
) {
  throw new Error('App.js does not preserve contextual Album Detail back routing')
}
if (
  !appSource.includes('handleBackToSearch') ||
  !appSource.includes("setRoute('Search')") ||
  !appSource.includes('handleOpenProducerSearch') ||
  !appSource.includes("setRoute('Producer Search')") ||
  !appSource.includes('handleOpenHelpDataSources') ||
  !appSource.includes("setRoute('Help / Data Sources')")
) {
  throw new Error('App.js does not expose contextual navigation actions from Search')
}
if (
  !appSource.includes("const [searchFormArtistName, setSearchFormArtistName] = useState('')") ||
  !appSource.includes("const [searchFormAlbumTitle, setSearchFormAlbumTitle] = useState('')") ||
  !appSource.includes("const [searchFormReleaseType, setSearchFormReleaseType] = useState('Album')") ||
  !appSource.includes('searchFormArtistName={searchFormArtistName}') ||
  !appSource.includes('searchFormAlbumTitle={searchFormAlbumTitle}') ||
  !appSource.includes('searchFormReleaseType={searchFormReleaseType}')
) {
  throw new Error('App.js does not retain Search form values in session state')
}
if (
  !appSource.includes('setSearchFormArtistName(artistName)') ||
  !appSource.includes('setSearchFormAlbumTitle(albumTitle)') ||
  !appSource.includes('setSearchFormReleaseType(releaseType)')
) {
  throw new Error('App.js does not sync submitted Search values back to the retained form')
}
if (appSource.includes('AsyncStorage') || appSource.includes('localStorage')) {
  throw new Error('Search form retention must remain session-only and not use persistent storage')
}

const searchScreenSource = readFileSync(path.join(appRoot, 'src/screens/SearchScreen.js'), 'utf8')
if (!searchScreenSource.includes('ScrollView') || !searchScreenSource.includes('contentContainerStyle')) {
  throw new Error('SearchScreen is not scrollable for expanded release-type content')
}
if (
  searchScreenSource.includes("const [artistInput, setArtistInput] = useState('')") ||
  searchScreenSource.includes("const [albumInput, setAlbumInput] = useState('')") ||
  searchScreenSource.includes("const [releaseType, setReleaseType] = useState('Album')")
) {
  throw new Error('SearchScreen still owns reset-prone local input state')
}
if (searchScreenSource.includes('getMockAlbums') || searchScreenSource.includes('Mock album preview')) {
  throw new Error('SearchScreen still includes mock album preview content')
}
if (!searchScreenSource.includes('Artist search input')) {
  throw new Error('SearchScreen does not include artist search input marker')
}
if (!searchScreenSource.includes('Album search input')) {
  throw new Error('SearchScreen does not include optional album search input marker')
}
if (
  !searchScreenSource.includes('Clear artist name') ||
  !searchScreenSource.includes('Clear album title') ||
  !searchScreenSource.includes('onArtistInputChange') ||
  !searchScreenSource.includes('onAlbumInputChange') ||
  !searchScreenSource.includes("onAlbumInputChange('')") ||
  !searchScreenSource.includes("onArtistInputChange('')")
) {
  throw new Error('SearchScreen does not include per-field accessible clear controls')
}
if (
  !searchScreenSource.includes("position: 'relative'") ||
  !searchScreenSource.includes("position: 'absolute'") ||
  !searchScreenSource.includes('paddingRight: 44')
) {
  throw new Error('SearchScreen clear controls are not presented as in-field trailing controls')
}
if (!searchScreenSource.includes('Explore Album Liner Notes') || !searchScreenSource.includes('Find Albums')) {
  throw new Error('SearchScreen does not include polished album search heading/action')
}
if (!searchScreenSource.includes('Search by artist to browse albums, credits, tracklists, editions, sources, and liner images.')) {
  throw new Error('SearchScreen does not include user-facing artist-first helper copy')
}
if (!searchScreenSource.includes('Optional: narrow results to a specific album.')) {
  throw new Error('SearchScreen does not include optional album helper copy')
}
if (!searchScreenSource.includes("Used when browsing an artist's albums.")) {
  throw new Error('SearchScreen does not explain artist-only release type behavior')
}
if (!searchScreenSource.includes('Other tools')) {
  throw new Error('SearchScreen does not use polished secondary tools label')
}
if (
  !searchScreenSource.includes('onOpenProducerSearch') ||
  !searchScreenSource.includes('onOpenHelpDataSources') ||
  !searchScreenSource.includes('Producer Search') ||
  !searchScreenSource.includes('Help / Data Sources')
) {
  throw new Error('SearchScreen does not expose secondary navigation actions')
}
if (!searchScreenSource.includes('Please enter an artist name to continue.')) {
  throw new Error('SearchScreen does not include empty-input validation message')
}
if (!searchScreenSource.includes('Album title (optional)')) {
  throw new Error('SearchScreen does not present album title as optional')
}
if (!searchScreenSource.includes('Release Type')) {
  throw new Error('SearchScreen does not include release type control')
}
if (
  !searchScreenSource.includes("`${showReleaseTypes ? 'Hide' : 'Show'} release type options`") ||
  !searchScreenSource.includes("{showReleaseTypes ? '▾' : '▸'}")
) {
  throw new Error('SearchScreen release type control does not use chevron disclosure behavior')
}
if (!searchScreenSource.includes('onReleaseTypeChange(type.value)')) {
  throw new Error('SearchScreen does not update retained release type form state')
}
if (!searchScreenSource.includes("value: 'Album', label: 'Studio Albums'")) {
  throw new Error('SearchScreen does not default release type to Studio Albums')
}
for (const releaseTypeLabel of ['Studio Albums', 'EPs', 'Singles', 'Live Albums', 'Compilations', 'Soundtracks']) {
  if (!searchScreenSource.includes(releaseTypeLabel)) {
    throw new Error(`SearchScreen is missing release type option: ${releaseTypeLabel}`)
  }
}
if (!searchScreenSource.includes('const showReleaseTypeSelector = !albumInput.trim()')) {
  throw new Error('SearchScreen does not hide release type when album title is present')
}
if (searchScreenSource.includes('Please enter an album title to continue.')) {
  throw new Error('SearchScreen incorrectly requires album-only search')
}

const resultsScreenSource = readFileSync(path.join(appRoot, 'src/screens/ResultsScreen.js'), 'utf8')
if (!resultsScreenSource.includes('ScrollView') || !resultsScreenSource.includes('contentContainerStyle')) {
  throw new Error('ResultsScreen is not scrollable for long MusicBrainz result lists')
}
if (!resultsScreenSource.includes('displayedAlbums.map')) {
  throw new Error('ResultsScreen does not render result list')
}
if (
  !resultsScreenSource.includes('SORT_OPTIONS') ||
  !resultsScreenSource.includes('Oldest first') ||
  !resultsScreenSource.includes('Newest first')
) {
  throw new Error('ResultsScreen does not include Oldest/Newest sort controls')
}
if (
  !resultsScreenSource.includes('getDefaultSortOption') ||
  !resultsScreenSource.includes("releaseType === 'Album' ? 'oldest' : 'newest'")
) {
  throw new Error('ResultsScreen does not default artist-only Studio Albums to Oldest first')
}
if (
  !resultsScreenSource.includes('sortAlbums(albums, sortOption)') ||
  !resultsScreenSource.includes('setSortOption')
) {
  throw new Error('ResultsScreen does not sort already-loaded results client-side')
}
if (!resultsScreenSource.includes('onBackToSearch') || !resultsScreenSource.includes('Back to Album Search')) {
  throw new Error('ResultsScreen does not include contextual back-to-search action')
}
if (!resultsScreenSource.includes('onSelectAlbum(albumId, album)')) {
  throw new Error('ResultsScreen does not pass selected MusicBrainz result to Album Detail')
}
if (!resultsScreenSource.includes('No albums found')) {
  throw new Error('ResultsScreen does not include empty state text')
}
if (!resultsScreenSource.includes('Music data search error')) {
  throw new Error('ResultsScreen does not include MusicBrainz error state text')
}
if (!resultsScreenSource.includes('Searching MusicBrainz')) {
  throw new Error('ResultsScreen does not include MusicBrainz loading state text')
}
if (!resultsScreenSource.includes('artistCredit') || !resultsScreenSource.includes('firstReleaseDate')) {
  throw new Error('ResultsScreen does not render compact MusicBrainz album fields')
}
if (
  !resultsScreenSource.includes('First released:') ||
  !resultsScreenSource.includes('getDisambiguationLabel') ||
  !resultsScreenSource.includes('Also known as') ||
  !resultsScreenSource.includes('editions in MusicBrainz')
) {
  throw new Error('ResultsScreen does not include clarified release date, aka/note, and edition context copy')
}
if (!resultsScreenSource.includes('from MusicBrainz')) {
  throw new Error('ResultsScreen does not describe artist-first MusicBrainz album results')
}
if (!resultsScreenSource.includes('${releaseTypeLabel} by ${artistName}')) {
  throw new Error('ResultsScreen does not include release-type-aware artist-only heading')
}
if (!resultsScreenSource.includes('MusicBrainz may list several editions or similarly named releases. Choose the album that best matches.')) {
  throw new Error('ResultsScreen does not explain why similar MusicBrainz results may appear')
}
if (!resultsScreenSource.includes('Open album detail')) {
  throw new Error('ResultsScreen does not include row album-detail affordance text')
}
if (resultsScreenSource.includes('Open preview') || resultsScreenSource.includes('current preview')) {
  throw new Error('ResultsScreen still uses preview/dev copy for real album detail flow')
}
if (resultsScreenSource.includes('Search for an album to load MusicBrainz results.')) {
  throw new Error('ResultsScreen still presents album-only search copy')
}

const producerSearchScreenSource = readFileSync(
  path.join(appRoot, 'src/screens/ProducerSearchScreen.js'),
  'utf8'
)
if (!producerSearchScreenSource.includes('ScrollView') || !producerSearchScreenSource.includes('contentContainerStyle')) {
  throw new Error('ProducerSearchScreen is not scrollable for producer candidate content')
}
if (!producerSearchScreenSource.includes('onBackToSearch') || !producerSearchScreenSource.includes('Back to Album Search')) {
  throw new Error('ProducerSearchScreen does not include contextual back-to-search action')
}
if (!producerSearchScreenSource.includes('Producer search input')) {
  throw new Error('ProducerSearchScreen does not include producer input')
}
if (
  !producerSearchScreenSource.includes('resetProducerSearchState') ||
  !producerSearchScreenSource.includes('Clear producer name') ||
  !producerSearchScreenSource.includes('paddingRight: 44') ||
  !producerSearchScreenSource.includes("position: 'absolute'") ||
  !producerSearchScreenSource.includes("width: 34") ||
  !producerSearchScreenSource.includes('setIsLoadingProducerResults(false)')
) {
  throw new Error('ProducerSearchScreen does not include an in-field producer clear control that resets search state')
}
if (
  !producerSearchScreenSource.includes("from '../services/musicbrainzProducerSearch'") ||
  !producerSearchScreenSource.includes('resolveMusicBrainzProducerCandidates') ||
  !producerSearchScreenSource.includes('handleResolveProducerCandidates') ||
  !producerSearchScreenSource.includes('resolveMusicBrainzProducerCandidates(trimmedProducer)')
) {
  throw new Error('ProducerSearchScreen does not use the MusicBrainz producer candidate service')
}
if (!producerSearchScreenSource.includes('Find Producer')) {
  throw new Error('ProducerSearchScreen does not include producer candidate lookup action')
}
if (!producerSearchScreenSource.includes('Please enter a producer name to continue.')) {
  throw new Error('ProducerSearchScreen does not include required-field validation message')
}
if (!producerSearchScreenSource.includes('Loading producer candidates...')) {
  throw new Error('ProducerSearchScreen does not include candidate loading state text')
}
if (!producerSearchScreenSource.includes('Producer search error')) {
  throw new Error('ProducerSearchScreen does not include error state text')
}
if (!producerSearchScreenSource.includes('No producer candidates found')) {
  throw new Error('ProducerSearchScreen does not include no-candidates state text')
}
if (!producerSearchScreenSource.includes('Choose the MusicBrainz artist you mean.')) {
  throw new Error('ProducerSearchScreen does not include candidate selection copy')
}
if (
  !producerSearchScreenSource.includes('ProducerResultsContext') ||
  !producerSearchScreenSource.includes('Producer: {producer.name}') ||
  !producerSearchScreenSource.includes('resultCountLabel') ||
  !producerSearchScreenSource.includes('Showing ${resultCount} ${resultCount === 1 ?') ||
  !producerSearchScreenSource.includes('found from MusicBrainz producer credits.') ||
  producerSearchScreenSource.includes('Selected producer:') ||
  producerSearchScreenSource.includes('MusicBrainz artist MBID:') ||
  producerSearchScreenSource.includes('duplicate release groups skipped') ||
  producerSearchScreenSource.includes('Bounded results from documented') ||
  producerSearchScreenSource.includes('Producer album results') ||
  producerSearchScreenSource.includes('Results are based on documented MusicBrainz producer credits.') ||
  producerSearchScreenSource.includes('Source release MBID:')
) {
  throw new Error('ProducerSearchScreen does not include compact user-facing selected-producer results context')
}
if (
  !producerSearchScreenSource.includes('searchMusicBrainzAlbumsByProducer') ||
  !producerSearchScreenSource.includes('PRODUCER_RELEASE_LOOKUP_LIMIT = 10') ||
  !producerSearchScreenSource.includes('loadProducerReleaseLevelResults') ||
  !producerSearchScreenSource.includes('ActivityIndicator') ||
  !producerSearchScreenSource.includes('Searching producer credits')
) {
  throw new Error('ProducerSearchScreen does not run bounded release-level producer result lookup')
}
if (
  !producerSearchScreenSource.includes('handleLoadMoreProducerResults') ||
  !producerSearchScreenSource.includes('showLoadMoreButton') ||
  !producerSearchScreenSource.includes('offset: producerResult.nextOffset') ||
  !producerSearchScreenSource.includes('seenReleaseGroupIds: producerResult.seenReleaseGroupIds') ||
  !producerSearchScreenSource.includes('results: [...currentResults, ...nextResult.results]') ||
  !producerSearchScreenSource.includes('Added ${nextResult.results.length} more') ||
  !producerSearchScreenSource.includes('Load more') ||
  !producerSearchScreenSource.includes('disabled={isLoadingMoreProducerResults}') ||
  !producerSearchScreenSource.includes('Checking more producer credits') ||
  !producerSearchScreenSource.includes('No new albums found in that batch.') ||
  !producerSearchScreenSource.includes('No more producer-credit results found in MusicBrainz.')
) {
  throw new Error('ProducerSearchScreen does not implement bounded button-based producer Load More')
}
if (
  !producerSearchScreenSource.includes('ProducerResultCard') ||
  !producerSearchScreenSource.includes('producerEvidence') ||
  !producerSearchScreenSource.includes('evidence.evidenceLabel') ||
  !producerSearchScreenSource.includes('Producer credit detail:')
) {
  throw new Error('ProducerSearchScreen does not render source-backed producer evidence cards')
}
if (
  !producerSearchScreenSource.includes('rankProducerResults') ||
  !producerSearchScreenSource.includes('getProducerResultSortBucket') ||
  !producerSearchScreenSource.includes('getProducerEvidenceRank') ||
  !producerSearchScreenSource.includes('DEEMPHASIZED_SECONDARY_TYPES') ||
  !producerSearchScreenSource.includes('rankedProducerResults = rankProducerResults(producerResults)') ||
  !producerSearchScreenSource.includes('Album releases are shown first when available.') ||
  !producerSearchScreenSource.includes('return left.index - right.index') ||
  !producerSearchScreenSource.includes('rankedProducerResults.map((result)')
) {
  throw new Error('ProducerSearchScreen does not apply presentation-only producer result ranking')
}
if (
  !producerSearchScreenSource.includes('mapProducerResultToAlbumResult') ||
  !producerSearchScreenSource.includes('Open album detail') ||
  !producerSearchScreenSource.includes("onSelectAlbum?.(releaseGroupId, mapProducerResultToAlbumResult(result), 'Producer Search')") ||
  !producerSearchScreenSource.includes("accessibilityLabel={`Open album detail for ${result.releaseGroupTitle}`}")
) {
  throw new Error('ProducerSearchScreen does not open producer results with the existing Album Detail flow')
}
if (!producerSearchScreenSource.includes('No documented MusicBrainz producer credits found for this artist.')) {
  throw new Error('ProducerSearchScreen does not include concise no-results state copy')
}
if (
  !producerSearchScreenSource.includes('candidate.type') ||
  !producerSearchScreenSource.includes('candidate.disambiguation') ||
  !producerSearchScreenSource.includes('candidate.country') ||
  !producerSearchScreenSource.includes('formatLifeSpan(candidate.lifeSpan)') ||
  !producerSearchScreenSource.includes('Aliases:') ||
  !producerSearchScreenSource.includes('MAX_VISIBLE_ALIASES = 3') ||
  !producerSearchScreenSource.includes('latinCharacterCount / visibleCharacterCount >= 0.6')
) {
  throw new Error('ProducerSearchScreen candidate rows do not include enough disambiguation')
}
if (producerSearchScreenSource.includes('MusicBrainz score:')) {
  throw new Error('ProducerSearchScreen still shows raw MusicBrainz candidate scores')
}
if (
  producerSearchScreenSource.includes('MOCK_PRODUCER_RESULTS') ||
  producerSearchScreenSource.includes("Life's Rich Pageant") ||
  producerSearchScreenSource.includes('Producer match') ||
  producerSearchScreenSource.includes('onSelectAlbum?.(result.albumId)')
) {
  throw new Error('ProducerSearchScreen still exposes mock producer album results')
}

const producerSearchServiceSource = readFileSync(
  path.join(appRoot, 'src/services/musicbrainzProducerSearch.js'),
  'utf8'
)
if (
  !producerSearchServiceSource.includes('resolveMusicBrainzProducerCandidates') ||
  !producerSearchServiceSource.includes('searchMusicBrainzAlbumsByProducer') ||
  !producerSearchServiceSource.includes("status: 'auto'") ||
  !producerSearchServiceSource.includes("status: 'select'") ||
  !producerSearchServiceSource.includes("status: 'none'")
) {
  throw new Error('musicbrainzProducerSearch service does not expose producer candidate/result APIs')
}
if (
  !producerSearchServiceSource.includes('/artist') ||
  !producerSearchServiceSource.includes("inc: 'aliases'") ||
  !producerSearchServiceSource.includes('HIGH_CONFIDENCE_SCORE') ||
  !producerSearchServiceSource.includes('isExactNameOrAliasMatch')
) {
  throw new Error('musicbrainzProducerSearch service does not perform conservative MusicBrainz artist candidate lookup')
}
if (
  !producerSearchServiceSource.includes("inc: 'release-rels'") ||
  !producerSearchServiceSource.includes("inc: 'release-groups+artist-credits'") ||
  !producerSearchServiceSource.includes('DEFAULT_PRODUCER_RELEASE_LOOKUP_LIMIT = 10') ||
  !producerSearchServiceSource.includes('isProducerReleaseRelation') ||
  !producerSearchServiceSource.includes('seenReleaseGroupIds') ||
  !producerSearchServiceSource.includes('producerEvidence') ||
  !producerSearchServiceSource.includes('evidenceLabel') ||
  !producerSearchServiceSource.includes('metrics')
) {
  throw new Error('musicbrainzProducerSearch service does not implement bounded release-level producer results')
}
if (
  producerSearchServiceSource.includes('recording-rels') ||
  producerSearchServiceSource.includes('/recording/') ||
  producerSearchServiceSource.includes('recording-level')
) {
  throw new Error('musicbrainzProducerSearch service should not fetch recording-level producer data in v1')
}

const helpDataSourcesScreenSource = readFileSync(
  path.join(appRoot, 'src/screens/HelpDataSourcesScreen.js'),
  'utf8'
)
if (!helpDataSourcesScreenSource.includes('ScrollView') || !helpDataSourcesScreenSource.includes('contentContainerStyle')) {
  throw new Error('HelpDataSourcesScreen is not scrollable for help/data-source content')
}
if (!helpDataSourcesScreenSource.includes('onBackToSearch') || !helpDataSourcesScreenSource.includes('Back to Search')) {
  throw new Error('HelpDataSourcesScreen does not include contextual back-to-search action')
}
if (helpDataSourcesScreenSource.includes('Placeholder screen for help, attribution, and data-source disclosures.')) {
  throw new Error('HelpDataSourcesScreen still contains placeholder-only copy')
}
if (
  !helpDataSourcesScreenSource.includes('explore albums, tracklists, credits, editions, sources, liner images, and album context') ||
  !helpDataSourcesScreenSource.includes('read-only MusicBrainz artist-first album search')
) {
  throw new Error('HelpDataSourcesScreen does not disclose read-only MusicBrainz album search scope')
}
if (!helpDataSourcesScreenSource.includes('Artist name is required')) {
  throw new Error('HelpDataSourcesScreen does not explain required artist search scope')
}
if (!helpDataSourcesScreenSource.includes('Release Type filters artist-only searches.')) {
  throw new Error('HelpDataSourcesScreen does not explain release type search scope')
}
if (
  !helpDataSourcesScreenSource.includes('release-group search') ||
  !helpDataSourcesScreenSource.includes('selected releases')
) {
  throw new Error('HelpDataSourcesScreen does not disclose real release-group enrichment scope')
}
if (
  !helpDataSourcesScreenSource.includes('album art, booklet pages, media images, tray images, back covers') ||
  !helpDataSourcesScreenSource.includes('Cover Art Archive')
) {
  throw new Error('HelpDataSourcesScreen does not disclose optional cover art gallery scope')
}
if (
  !helpDataSourcesScreenSource.includes('Producer Search is available as a bounded, source-backed tool') ||
  !helpDataSourcesScreenSource.includes('documented MusicBrainz release-level producer credits') ||
  !helpDataSourcesScreenSource.includes('Ambiguous producer names may ask you to choose') ||
  !helpDataSourcesScreenSource.includes('does not promise a complete producer discography') ||
  !helpDataSourcesScreenSource.includes('Recording-level producer fallback is not implemented')
) {
  throw new Error('HelpDataSourcesScreen does not explain current Producer Search scope and limits')
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
  !helpDataSourcesScreenSource.includes('Wikidata is used only when MusicBrainz provides a Wikidata relation') ||
  !helpDataSourcesScreenSource.includes('Wikipedia album article links are resolved from Wikidata sitelinks') ||
  !helpDataSourcesScreenSource.includes('Wikipedia URLs are not guessed from artist or title') ||
  !helpDataSourcesScreenSource.includes('Wikipedia summary text is not fetched')
) {
  throw new Error('HelpDataSourcesScreen does not explain source-backed Wikidata/Wikipedia behavior')
}
if (
  !helpDataSourcesScreenSource.includes('Credits and producer results depend on what MusicBrainz contributors have entered') ||
  !helpDataSourcesScreenSource.includes('sparse credits') ||
  !helpDataSourcesScreenSource.includes('missing producer relationships') ||
  !helpDataSourcesScreenSource.includes('missing artwork') ||
  !helpDataSourcesScreenSource.includes('regional or unusual official album entries')
) {
  throw new Error('HelpDataSourcesScreen does not explain current source data limitations')
}
if (
  !helpDataSourcesScreenSource.includes('vibeycraft@gmail.com') ||
  !helpDataSourcesScreenSource.includes('does not require an account') ||
  !helpDataSourcesScreenSource.includes('does not intentionally collect personal information') ||
  !helpDataSourcesScreenSource.includes('Searches and album lookups are sent to public metadata services') ||
  !helpDataSourcesScreenSource.includes('not affiliated with MusicBrainz')
) {
  throw new Error('HelpDataSourcesScreen does not include support, privacy, and source disclaimer copy')
}
if (
  !helpDataSourcesScreenSource.includes('unavailable') ||
  !helpDataSourcesScreenSource.includes('not documented')
) {
  throw new Error('HelpDataSourcesScreen does not include missing-data trust rule')
}

const albumDetailScreenSource = readFileSync(path.join(appRoot, 'src/screens/AlbumDetailScreen.js'), 'utf8')
if (!albumDetailScreenSource.includes('ScrollView') || !albumDetailScreenSource.includes('contentContainerStyle')) {
  throw new Error('AlbumDetailScreen is not scrollable for long album detail content')
}
if (!albumDetailScreenSource.includes('alwaysBounceVertical') || !albumDetailScreenSource.includes('paddingBottom: 96')) {
  throw new Error('AlbumDetailScreen ScrollView does not include hardened scroll props for long detail content')
}
for (const sectionDisclosureLabel of [
  "accessibilityLabel={`${showTracklist ? 'Hide' : 'Show'} tracklist`}",
  "accessibilityLabel={`${showCredits ? 'Hide' : 'Show'} album credits`}",
  "accessibilityLabel={`${showEditionsSources ? 'Hide' : 'Show'} editions and sources`}"
]) {
  if (!albumDetailScreenSource.includes(sectionDisclosureLabel)) {
    throw new Error(`AlbumDetailScreen is missing section disclosure accessibility label: ${sectionDisclosureLabel}`)
  }
}
for (const sectionDisclosureIndicator of [
  "{showTracklist ? '▾' : '▸'}",
  "{showCredits ? '▾' : '▸'}",
  "{showEditionsSources ? '▾' : '▸'}"
]) {
  if (!albumDetailScreenSource.includes(sectionDisclosureIndicator)) {
    throw new Error(`AlbumDetailScreen is missing section disclosure chevron: ${sectionDisclosureIndicator}`)
  }
}
for (const textDisclosure of [
  "{showTracklist ? 'Hide' : 'Show'}</Text>",
  "{showCredits ? 'Hide' : 'Show'}</Text>",
  "{showEditionsSources ? 'Hide' : 'Show'}</Text>"
]) {
  if (albumDetailScreenSource.includes(textDisclosure)) {
    throw new Error(`AlbumDetailScreen still uses visible Show/Hide text for section disclosure: ${textDisclosure}`)
  }
}
if (
  !albumDetailScreenSource.includes("backLabel = 'Back to Results'") ||
  !appSource.includes("backLabel={detailReturnRoute === 'Producer Search' ? 'Back to Producer Search' : 'Back to Results'}") ||
  !albumDetailScreenSource.includes('marginBottom: 14')
) {
  throw new Error('AlbumDetailScreen does not include top contextual back action label')
}
if (!albumDetailScreenSource.includes('Loading album detail...')) {
  throw new Error('AlbumDetailScreen does not include loading state text')
}
if (!albumDetailScreenSource.includes('Album details are loading.')) {
  throw new Error('AlbumDetailScreen does not include user-facing loading-scope copy')
}
if (albumDetailScreenSource.includes('Album details, credits, editions, and sources.')) {
  throw new Error('AlbumDetailScreen still shows generic real Album Detail helper copy')
}
if (
  !albumDetailScreenSource.includes('!isRealMusicBrainzDetail && (') ||
  !albumDetailScreenSource.includes('isRealMusicBrainzDetail && !hasAlbum')
) {
  throw new Error('AlbumDetailScreen does not suppress the generic Album Detail heading for real album details')
}
if (albumDetailScreenSource.includes('Real MusicBrainz album header') || albumDetailScreenSource.includes('Release-group MBID')) {
  throw new Error('AlbumDetailScreen still uses developer-facing hero copy')
}
if (!albumDetailScreenSource.includes('Tracklist is not loaded yet.')) {
  throw new Error('AlbumDetailScreen does not include deferred real tracklist copy')
}
if (!albumDetailScreenSource.includes('No separate album-level credits are documented for this selected release. Track credits are shown in the Tracklist above when available.')) {
  throw new Error('AlbumDetailScreen does not include clarified selected-release album-level credits copy')
}
if (!albumDetailScreenSource.includes('Editions are not loaded yet.')) {
  throw new Error('AlbumDetailScreen does not include deferred real editions copy')
}
if (!albumDetailScreenSource.includes('Loading MusicBrainz details...')) {
  throw new Error('AlbumDetailScreen does not include release-group enrichment loading state')
}
if (!albumDetailScreenSource.includes('MusicBrainz detail enrichment unavailable')) {
  throw new Error('AlbumDetailScreen does not include release-group enrichment error state')
}
if (!albumDetailScreenSource.includes('Release-group editions')) {
  throw new Error('AlbumDetailScreen does not render minimal release-group editions')
}
if (!albumDetailScreenSource.includes('Tracklist')) {
  throw new Error('AlbumDetailScreen does not include Tracklist section label')
}
if (!albumDetailScreenSource.includes('track.position') || !albumDetailScreenSource.includes('track.title')) {
  throw new Error('AlbumDetailScreen does not render track number/title from mock data')
}
if (!albumDetailScreenSource.includes('Album Credits')) {
  throw new Error('AlbumDetailScreen does not include Album Credits section label')
}
if (!albumDetailScreenSource.includes('showCredits, setShowCredits] = useState(false)')) {
  throw new Error('AlbumDetailScreen does not keep Credits collapsed by default')
}
if (!albumDetailScreenSource.includes('showTracklist, setShowTracklist] = useState(true)')) {
  throw new Error('AlbumDetailScreen no longer keeps Tracklist open by default')
}
if (!albumDetailScreenSource.includes('showEditionsSources, setShowEditionsSources] = useState(false)')) {
  throw new Error('AlbumDetailScreen no longer keeps Editions & Sources collapsed by default')
}
if (
  !albumDetailScreenSource.includes('tracklistSummary') ||
  !albumDetailScreenSource.includes("album.tracks.length === 1 ? 'track' : 'tracks'") ||
  !albumDetailScreenSource.includes('editionsSourcesSummary') ||
  !albumDetailScreenSource.includes('Selected edition and sources')
) {
  throw new Error('AlbumDetailScreen does not include compact disclosure summary labels')
}
if (albumDetailScreenSource.includes('Credit highlights available')) {
  throw new Error('AlbumDetailScreen still shows vague Credits disclosure summary copy')
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
  throw new Error('AlbumDetailScreen does not render track-associated credit rows inside Tracklist')
}
if (!albumDetailScreenSource.includes("{isTrackExpanded ? 'Hide credits' : 'Show credits'}")) {
  throw new Error('AlbumDetailScreen does not show track credit controls inside Tracklist rows')
}
if (!albumDetailScreenSource.includes('No separate album-level credits are documented for this selected release. Track credits are shown in the Tracklist above when available.')) {
  throw new Error('AlbumDetailScreen does not keep Credits scoped to album-level credits')
}
if (albumDetailScreenSource.includes('Album and track credits, with songwriting and publishing when available.')) {
  throw new Error('AlbumDetailScreen still describes the Credits section as mixed album and track credits')
}
if (albumDetailScreenSource.includes('Selected-release track credits, songwriting, and publishing from MusicBrainz.')) {
  throw new Error('AlbumDetailScreen still includes technical selected-release credit scope copy')
}
if (
  !albumDetailScreenSource.includes('const hasTrackDetails') ||
  !albumDetailScreenSource.includes('groupedCredits.length > 0') ||
  !albumDetailScreenSource.includes('Songwriting') ||
  !albumDetailScreenSource.includes("track.songwriting?.writers") ||
  !albumDetailScreenSource.includes("track.songwriting?.composers") ||
  !albumDetailScreenSource.includes("track.songwriting?.lyricists")
) {
  throw new Error('AlbumDetailScreen does not render selected-release songwriting inside expanded track credits')
}
if (
  !albumDetailScreenSource.includes('Publishing') ||
  !albumDetailScreenSource.includes("track.publishing?.publishers") ||
  !albumDetailScreenSource.includes('Publisher')
) {
  throw new Error('AlbumDetailScreen does not render selected-release publishing inside expanded track credits')
}
if (
  !albumDetailScreenSource.includes('Image') ||
  !albumDetailScreenSource.includes('shouldShowCoverArt') ||
  !albumDetailScreenSource.includes('source={{ uri: album.coverArtUrl }}') ||
  !albumDetailScreenSource.includes('failedCoverArtUrls')
) {
  throw new Error('AlbumDetailScreen does not render optional primary cover art with silent image-failure handling')
}
if (
  !albumDetailScreenSource.includes('Modal') ||
  !albumDetailScreenSource.includes('Album Art & Liner Images') ||
  !albumDetailScreenSource.includes('Browse cover, booklet, media, and other release images.') ||
  !albumDetailScreenSource.includes('Tap any image to view full screen.') ||
  !albumDetailScreenSource.includes('artworkImages.map') ||
  !albumDetailScreenSource.includes('openArtworkViewer') ||
  !albumDetailScreenSource.includes('pagingEnabled') ||
  !albumDetailScreenSource.includes('maximumZoomScale={4}') ||
  !albumDetailScreenSource.includes('minimumZoomScale={1}') ||
  !albumDetailScreenSource.includes('Close artwork viewer') ||
  !albumDetailScreenSource.includes('isArtworkViewerOpen') ||
  !albumDetailScreenSource.includes('visible={isArtworkViewerOpen}') ||
  !albumDetailScreenSource.includes('function closeArtworkViewer') ||
  !albumDetailScreenSource.includes('if (!isArtworkViewerOpen)') ||
  !albumDetailScreenSource.includes('getArtworkTypeLabel') ||
  !albumDetailScreenSource.includes('getArtworkThumbnailUrl') ||
  !albumDetailScreenSource.includes('getArtworkViewerUrl') ||
  !albumDetailScreenSource.includes("image?.thumbnails?.['1200']") ||
  !albumDetailScreenSource.includes('Image.prefetch(viewerUrl)') ||
  !albumDetailScreenSource.includes('selectedArtworkIndex - 1') ||
  !albumDetailScreenSource.includes('selectedArtworkIndex + 1') ||
  !albumDetailScreenSource.includes('ActivityIndicator') ||
  !albumDetailScreenSource.includes('Loading image...') ||
  !albumDetailScreenSource.includes('loadedViewerImageUrls') ||
  !albumDetailScreenSource.includes('failedViewerImageUrls')
) {
  throw new Error('AlbumDetailScreen does not include responsive artwork gallery viewer wiring')
}
if (
  !albumDetailScreenSource.includes('artworkViewerScrollRef') ||
  !albumDetailScreenSource.includes('ref={artworkViewerScrollRef}') ||
  !albumDetailScreenSource.includes('scrollTo({')
) {
  throw new Error('AlbumDetailScreen does not keep the artwork pager aligned without remounting')
}
if (albumDetailScreenSource.includes('visible={selectedArtworkIndex !== null}')) {
  throw new Error('AlbumDetailScreen couples artwork viewer visibility to selectedArtworkIndex, which can reopen after Close')
}
if (albumDetailScreenSource.includes('key={`artwork-viewer-${selectedArtworkIndex')) {
  throw new Error('AlbumDetailScreen remounts the artwork pager when the selected artwork index changes')
}
if (
  !albumDetailScreenSource.includes('groupedAlbumCredits') ||
  !albumDetailScreenSource.includes('function groupAlbumCredits') ||
  !albumDetailScreenSource.includes('Artwork, Design & Photography') ||
  !albumDetailScreenSource.includes('Additional Credits')
) {
  throw new Error('AlbumDetailScreen does not render album-level credits as direct user-facing groups')
}
if (albumDetailScreenSource.includes('showAlbumCredits') || albumDetailScreenSource.includes('setShowAlbumCredits')) {
  throw new Error('AlbumDetailScreen still uses a nested Album disclosure inside Album Credits')
}
if (
  !albumDetailScreenSource.includes('Credit Highlights') ||
  !albumDetailScreenSource.includes('showCreditHighlights') ||
  !albumDetailScreenSource.includes('buildCreditHighlights') ||
  !albumDetailScreenSource.includes('buildCreditHighlights(') ||
  !albumDetailScreenSource.includes('[],') ||
  !albumDetailScreenSource.includes('{}') ||
  !albumDetailScreenSource.includes("accessibilityLabel={`${showCreditHighlights ? 'Hide' : 'Show'} credit highlights`}") ||
  !albumDetailScreenSource.includes("{showCreditHighlights ? '▾' : '▸'}")
) {
  throw new Error('AlbumDetailScreen does not render album-level credit highlights as a collapsed disclosure row')
}
for (const creditHighlightLabel of [
  'Producers',
  'Engineers / Mixers / Mastering',
  'Performers & Instruments'
]) {
  if (!albumDetailScreenSource.includes(creditHighlightLabel)) {
    throw new Error(`AlbumDetailScreen is missing credit highlight category: ${creditHighlightLabel}`)
  }
}
for (const creditGroupLabel of ['Performers & Instruments', 'Production & Technical', 'Other']) {
  if (!albumDetailScreenSource.includes(creditGroupLabel)) {
    throw new Error(`AlbumDetailScreen is missing track credit group label: ${creditGroupLabel}`)
  }
}
if (!albumDetailScreenSource.includes('album.tracks.map') || albumDetailScreenSource.includes('album.tracks.slice(0, 3)')) {
  throw new Error('AlbumDetailScreen does not render all Tracklist rows with selected-release credits, songwriting, or publishing')
}
if (
  !albumDetailScreenSource.includes('expandedCreditTrackIds') ||
  !albumDetailScreenSource.includes('toggleTrackCredits') ||
  !albumDetailScreenSource.includes("onPress={() => toggleTrackCredits(track.trackId)}") ||
  !albumDetailScreenSource.includes("accessibilityLabel={`${isTrackExpanded ? 'Hide' : 'Show'} credits for ${track.title}`}")
) {
  throw new Error('AlbumDetailScreen does not provide per-track credit expand/collapse controls')
}
if (!albumDetailScreenSource.includes("{isTrackExpanded ? '▾' : '▸'}")) {
  throw new Error('AlbumDetailScreen does not use iOS-style disclosure indicators for per-track credits')
}
if (!albumDetailScreenSource.includes('isTrackExpanded') || !albumDetailScreenSource.includes(': null}')) {
  throw new Error('AlbumDetailScreen does not keep per-track credits collapsed until expanded')
}
if (!albumDetailScreenSource.includes('Editions & Sources')) {
  throw new Error('AlbumDetailScreen does not include Editions & Sources section label')
}
if (
  !albumDetailScreenSource.includes('Selected Edition') ||
  !albumDetailScreenSource.includes('selectedEditionSummary') ||
  !albumDetailScreenSource.includes('selectedEditionDetailSummary') ||
  !albumDetailScreenSource.includes('selectedEditionRows')
) {
  throw new Error('AlbumDetailScreen does not render compact selected edition section')
}
if (!albumDetailScreenSource.includes("join(' · ')")) {
  throw new Error('AlbumDetailScreen does not render human-readable selected edition summaries')
}
if (
  !albumDetailScreenSource.includes("['Country', formatCountry(selectedEdition.country)]") ||
  !albumDetailScreenSource.includes("['Format', selectedEdition.formatSummary]") ||
  !albumDetailScreenSource.includes("['Packaging', selectedEdition.packaging]")
) {
  throw new Error('AlbumDetailScreen does not render selected edition field rows')
}
if (!albumDetailScreenSource.includes('selectedEditionTechnicalRows') || !albumDetailScreenSource.includes('Selected release MBID')) {
  throw new Error('AlbumDetailScreen does not keep selected release technical identifier available')
}
if (
  !albumDetailScreenSource.includes('showReleaseGroupEditions, setShowReleaseGroupEditions') ||
  !albumDetailScreenSource.includes('useState(false)') ||
  !albumDetailScreenSource.includes("`${showReleaseGroupEditions ? 'Hide' : 'Show'} release-group editions`") ||
  !albumDetailScreenSource.includes("{showReleaseGroupEditions ? '▾' : '▸'}")
) {
  throw new Error('AlbumDetailScreen does not keep release-group editions collapsed behind a chevron disclosure')
}
if (
  !albumDetailScreenSource.includes('editionRows.map((edition, index)') ||
  !albumDetailScreenSource.includes('release-group-edition-${edition.editionId') ||
  albumDetailScreenSource.includes('key={edition.editionId}')
) {
  throw new Error('AlbumDetailScreen release-group edition rows are not protected against duplicate MusicBrainz release IDs')
}
if (
  !albumDetailScreenSource.includes('showTechnicalLinks, setShowTechnicalLinks') ||
  !albumDetailScreenSource.includes("`${showTechnicalLinks ? 'Hide' : 'Show'} technical links`") ||
  !albumDetailScreenSource.includes("{showTechnicalLinks ? '▾' : '▸'}")
) {
  throw new Error('AlbumDetailScreen does not keep technical links collapsed behind a chevron disclosure')
}
if (!albumDetailScreenSource.includes('Technical links') || !albumDetailScreenSource.includes('showTechnicalLinks ? (')) {
  throw new Error('AlbumDetailScreen does not visually separate collapsible technical source links')
}
if (!albumDetailScreenSource.includes('album.sources.map')) {
  throw new Error('AlbumDetailScreen does not render source attribution field')
}
if (
  !albumDetailScreenSource.includes('externalLinks.musicbrainzReleaseGroupUrl') ||
  !albumDetailScreenSource.includes('externalLinks.musicbrainzSelectedReleaseUrl')
) {
  throw new Error('AlbumDetailScreen does not render external link rows')
}
if (
  !albumDetailScreenSource.includes('MusicBrainz release group') ||
  !albumDetailScreenSource.includes('MusicBrainz selected release') ||
  !albumDetailScreenSource.includes('Cover Art Archive') ||
  !albumDetailScreenSource.includes('Wikipedia article') ||
  !albumDetailScreenSource.includes('Read album article on Wikipedia') ||
  !albumDetailScreenSource.includes('Background, release history, reception, and legacy.') ||
  !albumDetailScreenSource.includes('Linking.openURL(album.wikipediaArticle.url)') ||
  !albumDetailScreenSource.includes('externalLinks.wikidataUrl')
) {
  throw new Error('AlbumDetailScreen does not include external link labels in Editions & Sources')
}
if (!albumDetailScreenSource.includes('Album unavailable')) {
  throw new Error('AlbumDetailScreen does not include not-found/unavailable state')
}

if (!appSource.includes('searchMusicBrainzAlbumsByArtist')) {
  throw new Error('App router does not import iOS MusicBrainz album search adapter')
}
const normalizedErrorCases = [
  [
    new TypeError('Network request failed'),
    'Couldn’t reach the music data service. Check your connection and try again.'
  ],
  [
    new Error('MusicBrainz request failed: 429 Too Many Requests'),
    'MusicBrainz is temporarily unavailable or busy. Try again in a minute.'
  ],
  [
    new Error('MusicBrainz request failed: 503 Service Unavailable'),
    'MusicBrainz is temporarily unavailable or busy. Try again in a minute.'
  ],
  [
    new Error('MusicBrainz request failed: 500 Internal Server Error'),
    'The music data service is having trouble right now. Try again later.'
  ],
  [
    new SyntaxError('Unexpected token < in JSON at position 0'),
    'The music data service returned an unexpected response. Try again later.'
  ],
  [
    new Error('Unknown music data issue'),
    'Something went wrong while loading music data. Try again.'
  ]
]
for (const [error, expectedMessage] of normalizedErrorCases) {
  const actualMessage = formatMusicDataError(error)
  if (actualMessage !== expectedMessage) {
    throw new Error(`Unexpected normalized music data error message: ${actualMessage}`)
  }
}
const appErrorFormatterUses = appSource.match(/formatMusicDataError\(error\)/g) ?? []
const producerErrorFormatterUses = producerSearchScreenSource.match(/formatMusicDataError\(error\)/g) ?? []
if (
  !musicDataErrorsSource.includes('formatMusicDataError') ||
  !musicDataErrorsSource.includes('Couldn’t reach the music data service. Check your connection and try again.') ||
  !musicDataErrorsSource.includes('MusicBrainz is temporarily unavailable or busy. Try again in a minute.') ||
  !musicDataErrorsSource.includes('The music data service returned an unexpected response. Try again later.') ||
  appErrorFormatterUses.length < 3 ||
  producerErrorFormatterUses.length < 3
) {
  throw new Error('iOS app does not normalize user-facing music data error messages')
}
for (const rawErrorCopy of [
  'MusicBrainz request failed: 503',
  'TypeError: Failed to fetch',
  'Network request failed\\n',
  'Error: MusicBrainz request failed'
]) {
  if (
    resultsScreenSource.includes(rawErrorCopy) ||
    albumDetailScreenSource.includes(rawErrorCopy) ||
    producerSearchScreenSource.includes(rawErrorCopy)
  ) {
    throw new Error(`User-facing screen includes raw network/API error copy: ${rawErrorCopy}`)
  }
}
if (!appSource.includes('handleSubmitArtistSearch') || !appSource.includes("setRoute('Results')")) {
  throw new Error('App router does not navigate from search to results via artist submit flow')
}
if (
  !appSource.includes('albumSearchRequestId') ||
  !appSource.includes('albumSearchRequestId.current !== requestId') ||
  !appSource.includes('albumSearchRequestId.current === requestId')
) {
  throw new Error('App router does not guard stale Album Search request updates')
}
if (!appSource.includes('handleSelectAlbum') || !appSource.includes("setRoute('Album Detail')")) {
  throw new Error('App router does not navigate from results to album detail')
}
if (!appSource.includes('selectedAlbumResult') || !appSource.includes('buildAlbumDetailFromResult')) {
  throw new Error('App router does not preserve selected MusicBrainz result for Album Detail header')
}
if (!appSource.includes('fetchMusicBrainzAlbumBasicInfo') || !appSource.includes('setAlbumDetailLoading')) {
  throw new Error('App router does not fetch release-group basic enrichment for Album Detail')
}
if (
  !appSource.includes('albumDetailOpenRequestId') ||
  !appSource.includes('setAlbumDetailOpenRequestId((current) => current + 1)') ||
  !appSource.includes('[selectedAlbumId, selectedAlbumResult, albumDetailOpenRequestId]')
) {
  throw new Error('App router does not refetch Album Detail enrichment when the same album is explicitly reopened')
}
if (!appSource.includes('fetchMusicBrainzSelectedReleaseTracklist') || !appSource.includes('tracks: tracklistDetail.tracks')) {
  throw new Error('App router does not fetch and merge selected-release tracklist for Album Detail')
}
if (
  !appSource.includes('fetchMusicBrainzSelectedReleaseTracklist(detail.selectedReleaseId, detail.editions)') ||
  !appSource.includes('editions: tracklistDetail.editions')
) {
  throw new Error('App router does not merge selected-release edition metadata for Album Detail')
}
if (!appSource.includes('credits: tracklistDetail.credits')) {
  throw new Error('App router does not merge selected-release track credits for Album Detail')
}
if (!appSource.includes('musicbrainzReleaseGroupUrl:') || !appSource.includes('`https://musicbrainz.org/release-group/${releaseGroupId}`')) {
  throw new Error('App router does not build MusicBrainz release-group link for real Album Detail header')
}
if (!appSource.includes('getMockAlbumById')) {
  throw new Error('App router does not use shared core getMockAlbumById accessor')
}
if (!appSource.includes('handleBackToAlbumSource') || !appSource.includes('setRoute(detailReturnRoute)')) {
  throw new Error('App router does not restore contextual source route from album detail')
}
if (
  !appSource.includes('INITIAL_PRODUCER_SEARCH_STATE') ||
  !appSource.includes('const [producerSearchState, setProducerSearchState]') ||
  !appSource.includes('isLoadingMoreProducerResults: false') ||
  !appSource.includes("producerLoadMoreMessage: ''") ||
  !appSource.includes("producerLoadMoreError: ''") ||
  !appSource.includes('onProducerSearchStateChange={setProducerSearchState}') ||
  !appSource.includes('producerSearchState={producerSearchState}')
) {
  throw new Error('App router does not preserve Producer Search state while Album Detail is open')
}
if (
  !appSource.includes("function handleSelectAlbum(albumId, albumResult = null, sourceRoute = 'Results')") ||
  !appSource.includes('setDetailReturnRoute(sourceRoute)') ||
  !appSource.includes('onSelectAlbum={onSelectAlbum}')
) {
  throw new Error('App router does not pass album-select handler and source route to ProducerSearchScreen')
}

const musicBrainzAlbumSearchSource = readFileSync(
  path.join(appRoot, 'src/services/musicbrainzAlbumSearch.js'),
  'utf8'
)
const musicBrainzAlbumDetailSource = readFileSync(
  path.join(appRoot, 'src/services/musicbrainzAlbumDetail.js'),
  'utf8'
)
if (!musicBrainzAlbumDetailSource.includes('fetchMusicBrainzAlbumBasicInfo')) {
  throw new Error('iOS MusicBrainz album detail service does not expose basic info fetch')
}
if (!musicBrainzAlbumDetailSource.includes('/release-group/${releaseGroupId}?')) {
  throw new Error('iOS MusicBrainz album detail service does not fetch release-group detail')
}
if (!musicBrainzAlbumDetailSource.includes('releases+artist-credits+release-group-rels+artist-rels+url-rels')) {
  throw new Error('iOS MusicBrainz album detail service does not use React-parity release-group includes')
}
if (
  !musicBrainzAlbumDetailSource.includes('function extractWikidataUrl') ||
  !musicBrainzAlbumDetailSource.includes("releaseGroup?.['url-rels']") ||
  !musicBrainzAlbumDetailSource.includes('function extractWikidataId') ||
  !musicBrainzAlbumDetailSource.includes('fetchWikipediaArticleFromWikidataUrl') ||
  !musicBrainzAlbumDetailSource.includes("action: 'wbgetentities'") ||
  !musicBrainzAlbumDetailSource.includes('sitelinks?.enwiki') ||
  musicBrainzAlbumDetailSource.includes('artistName}/') ||
  musicBrainzAlbumDetailSource.includes('albumTitle}/')
) {
  throw new Error('iOS MusicBrainz album detail service does not resolve Wikipedia links through MusicBrainz/Wikidata sitelinks')
}
if (!musicBrainzAlbumDetailSource.includes("release?.status === 'Official'") || !musicBrainzAlbumDetailSource.includes('dateA.localeCompare(dateB)')) {
  throw new Error('iOS MusicBrainz album detail service does not choose selected release like React basic info')
}
if (!musicBrainzAlbumDetailSource.includes('mapReleaseToEdition') || !musicBrainzAlbumDetailSource.includes('editionId')) {
  throw new Error('iOS MusicBrainz album detail service does not map minimal release-group editions')
}
if (
  !musicBrainzAlbumDetailSource.includes('function mergeSelectedReleaseEditionDetails') ||
  !musicBrainzAlbumDetailSource.includes("release?.['label-info']?.[0]?.label?.name") ||
  !musicBrainzAlbumDetailSource.includes("release?.['label-info']?.[0]?.['catalog-number']") ||
  !musicBrainzAlbumDetailSource.includes('release?.barcode') ||
  !musicBrainzAlbumDetailSource.includes('release?.media?.[0]?.format') ||
  !musicBrainzAlbumDetailSource.includes('release?.packaging')
) {
  throw new Error('iOS MusicBrainz album detail service does not enrich selected-release edition metadata')
}
if (!musicBrainzAlbumDetailSource.includes('fetchMusicBrainzSelectedReleaseTracklist')) {
  throw new Error('iOS MusicBrainz album detail service does not expose selected-release tracklist fetch')
}
if (!musicBrainzAlbumDetailSource.includes('/release/${selectedReleaseId}?')) {
  throw new Error('iOS MusicBrainz album detail service does not fetch selected-release tracklist')
}
if (
  !musicBrainzAlbumDetailSource.includes('recordings+artist-credits+recording-level-rels+work-rels+work-level-rels+release-rels+labels+artist-rels') ||
  !musicBrainzAlbumDetailSource.includes("relation?.['target-type'] !== 'work'") ||
  !musicBrainzAlbumDetailSource.includes('relation?.work?.relations')
) {
  throw new Error('iOS MusicBrainz album detail service does not include work-level songwriting relations on the selected-release request')
}
if (!musicBrainzAlbumDetailSource.includes('parseTrackPosition') || !musicBrainzAlbumDetailSource.includes('${medium.position}-${track.number}')) {
  throw new Error('iOS MusicBrainz album detail service does not preserve React multi-disc track positions')
}
if (!musicBrainzAlbumDetailSource.includes('extractTrackCredits') || !musicBrainzAlbumDetailSource.includes('mapReleaseToTrackCredits')) {
  throw new Error('iOS MusicBrainz album detail service does not extract selected-release track credits')
}
if (
  !musicBrainzAlbumDetailSource.includes('function extractSongwriting') ||
  !musicBrainzAlbumDetailSource.includes('const writers = new Set()') ||
  !musicBrainzAlbumDetailSource.includes('function addSongwritingRelation') ||
  !musicBrainzAlbumDetailSource.includes('writers: writers.size > 0 ? Array.from(writers) : null') ||
  !musicBrainzAlbumDetailSource.includes('composers: composers.size > 0 ? Array.from(composers) : null') ||
  !musicBrainzAlbumDetailSource.includes('lyricists: lyricists.size > 0 ? Array.from(lyricists) : null') ||
  !musicBrainzAlbumDetailSource.includes('songwriting: extractSongwriting(recording)')
) {
  throw new Error('iOS MusicBrainz album detail service does not extract and dedupe selected-release songwriting')
}
if (
  !musicBrainzAlbumDetailSource.includes('function extractPublishing') ||
  !musicBrainzAlbumDetailSource.includes("relation?.['target-type'] !== 'label'") ||
  !musicBrainzAlbumDetailSource.includes("relation?.type?.toLowerCase().includes('publisher')") ||
  !musicBrainzAlbumDetailSource.includes('publishing: extractPublishing(recording)')
) {
  throw new Error('iOS MusicBrainz album detail service does not extract selected-release publishing from recording label relations')
}
if (
  !musicBrainzAlbumDetailSource.includes('function extractAlbumCredits') ||
  !musicBrainzAlbumDetailSource.includes('release?.relations') ||
  !musicBrainzAlbumDetailSource.includes("relation?.['target-type'] !== 'artist'") ||
  !musicBrainzAlbumDetailSource.includes('albumCredits: extractAlbumCredits(release)')
) {
  throw new Error('iOS MusicBrainz album detail service does not extract selected-release album-level credits')
}
for (const trackField of ['trackId', 'position', 'title', 'durationMs']) {
  if (!musicBrainzAlbumDetailSource.includes(trackField)) {
    throw new Error(`iOS MusicBrainz album detail service does not map track field: ${trackField}`)
  }
}
for (const creditField of ['personName', 'role', 'instrument', 'notes: null']) {
  if (!musicBrainzAlbumDetailSource.includes(creditField)) {
    throw new Error(`iOS MusicBrainz album detail service does not map credit field: ${creditField}`)
  }
}
if (!musicBrainzAlbumDetailSource.includes("role: instrument || 'Performer'")) {
  throw new Error('iOS MusicBrainz album detail service does not map recording artist-credit performer roles')
}
if (
  !musicBrainzAlbumDetailSource.includes('Array.isArray(relation.attributes)') ||
  !musicBrainzAlbumDetailSource.includes("role === 'instrument' && attributes.length > 0") ||
  !musicBrainzAlbumDetailSource.includes('for (const instrument of attributes)') ||
  !musicBrainzAlbumDetailSource.includes('role: instrument')
) {
  throw new Error('iOS MusicBrainz album detail service does not map recording instrument relation attributes')
}
if (
  !musicBrainzAlbumDetailSource.includes("lowerRole.includes('writer')") ||
  !musicBrainzAlbumDetailSource.includes("lowerRole.includes('composer')") ||
  !musicBrainzAlbumDetailSource.includes("lowerRole.includes('lyricist')")
) {
  throw new Error('iOS MusicBrainz album detail service does not defer songwriting roles from track credits')
}
if (
  !musicBrainzAlbumDetailSource.includes('COVER_ART_ARCHIVE_BASE') ||
  !musicBrainzAlbumDetailSource.includes('fetchMusicBrainzPrimaryCoverArt') ||
  !musicBrainzAlbumDetailSource.includes('getPrimaryCoverImageUrl') ||
  !musicBrainzAlbumDetailSource.includes('`/release/${selectedReleaseId}`') ||
  !musicBrainzAlbumDetailSource.includes('`/release-group/${releaseGroupId}`')
) {
  throw new Error('iOS MusicBrainz album detail service does not include the narrow primary Cover Art Archive path')
}
if (
  !musicBrainzAlbumDetailSource.includes('fetchMusicBrainzArtworkGallery') ||
  !musicBrainzAlbumDetailSource.includes('mapCoverArtImages') ||
  !musicBrainzAlbumDetailSource.includes('.slice(0, 20)') ||
  !musicBrainzAlbumDetailSource.includes('thumbnails') ||
  !musicBrainzAlbumDetailSource.includes('front: image?.front || false') ||
  !musicBrainzAlbumDetailSource.includes('back: image?.back || false') ||
  !musicBrainzAlbumDetailSource.includes('types: Array.isArray(image?.types) ? image.types : []') ||
  !musicBrainzAlbumDetailSource.includes('approved: image?.approved || false') ||
  !musicBrainzAlbumDetailSource.includes('fetchCoverArtArchiveJson(`/release-group/${releaseGroupId}`)')
) {
  throw new Error('iOS MusicBrainz album detail service does not include the optional release-group artwork gallery fetch')
}
if (
  !appSource.includes('fetchMusicBrainzPrimaryCoverArt') ||
  !appSource.includes('coverArtUrl') ||
  !appSource.includes("sourceName: 'Cover Art Archive'")
) {
  throw new Error('App router does not fetch and merge optional primary cover art for Album Detail')
}
if (
  !appSource.includes('fetchMusicBrainzArtworkGallery') ||
  !appSource.includes('artworkImages') ||
  !appSource.includes('Gallery art is optional and should not block Album Detail.')
) {
  throw new Error('App router does not fetch and merge optional artwork gallery images for Album Detail')
}
if (
  !appSource.includes('fetchWikipediaArticleFromWikidataUrl') ||
  !appSource.includes('wikipediaArticle') ||
  !appSource.includes("sourceName: 'Wikipedia'") ||
  !appSource.includes('Wikipedia links are optional and should not block Album Detail.')
) {
  throw new Error('App router does not fetch and merge optional Wikipedia article links for Album Detail')
}
for (const deferredDetailMarker of ['trackCreditsMap', 'fetchAlbumCredits', 'fetchRelease(candidate', 'fetchRelease(releaseInfo']) {
  if (musicBrainzAlbumDetailSource.includes(deferredDetailMarker)) {
    throw new Error(`iOS MusicBrainz album detail service includes deferred credits work: ${deferredDetailMarker}`)
  }
}
for (const deferredRecordingInfoMarker of ['function extractRecordingInfo', 'place-rels', 'recordingInfoMap']) {
  if (musicBrainzAlbumDetailSource.includes(deferredRecordingInfoMarker)) {
    throw new Error(`iOS MusicBrainz album detail service includes deferred recording info work: ${deferredRecordingInfoMarker}`)
  }
}
if (!musicBrainzAlbumSearchSource.includes('https://musicbrainz.org/ws/2')) {
  throw new Error('iOS MusicBrainz album search adapter does not target MusicBrainz')
}
if (!musicBrainzAlbumSearchSource.includes('/release-group?')) {
  throw new Error('iOS MusicBrainz album search adapter does not use release-group search')
}
if (!musicBrainzAlbumSearchSource.includes('/artist?')) {
  throw new Error('iOS MusicBrainz album search adapter does not resolve artist identity first')
}
if (!musicBrainzAlbumSearchSource.includes('searchMusicBrainzAlbumsByArtist')) {
  throw new Error('iOS MusicBrainz album search adapter is not artist-first')
}
if (!musicBrainzAlbumSearchSource.includes('Artist name is required')) {
  throw new Error('iOS MusicBrainz album search adapter does not require artist')
}
if (!musicBrainzAlbumSearchSource.includes('RELEASE_TYPE_QUERIES')) {
  throw new Error('iOS MusicBrainz album search adapter does not define release type query mapping')
}
if (
  !musicBrainzAlbumSearchSource.includes('function normalizeArtistMatchValue') ||
  !musicBrainzAlbumSearchSource.includes("replace(/[.\\s']/g, '')") ||
  !musicBrainzAlbumSearchSource.includes('function resolveMusicBrainzArtist') ||
  !musicBrainzAlbumSearchSource.includes('alias:"${trimmedArtist}"') ||
  !musicBrainzAlbumSearchSource.includes('isConfidentArtistMatch')
) {
  throw new Error('iOS MusicBrainz album search adapter does not include conservative artist identity resolution')
}
if (musicBrainzAlbumSearchSource.includes('R.E.M.') || musicBrainzAlbumSearchSource.includes('REM ->')) {
  throw new Error('iOS MusicBrainz album search adapter must not hard-code R.E.M. artist normalization')
}
for (const typeQuery of [
  'primarytype:album NOT secondarytype:live NOT secondarytype:compilation NOT secondarytype:soundtrack',
  'primarytype:ep',
  'primarytype:single',
  'primarytype:album AND secondarytype:live',
  'primarytype:album AND secondarytype:compilation',
  'primarytype:album AND secondarytype:soundtrack'
]) {
  if (!musicBrainzAlbumSearchSource.includes(typeQuery)) {
    throw new Error(`iOS MusicBrainz album search adapter is missing release type query: ${typeQuery}`)
  }
}
if (!musicBrainzAlbumSearchSource.includes('artist:"${trimmedArtist}" AND ${releaseTypeQuery}')) {
  throw new Error('iOS MusicBrainz album search adapter does not preserve broad artist-only fallback search')
}
if (!musicBrainzAlbumSearchSource.includes('artist:"${trimmedArtist}" AND release:"${trimmedAlbum}"')) {
  throw new Error('iOS MusicBrainz album search adapter does not preserve broad artist plus album fallback search')
}
if (
  !musicBrainzAlbumSearchSource.includes('arid:${artistMbid} AND ${releaseTypeQuery}') ||
  !musicBrainzAlbumSearchSource.includes('arid:${artistMbid} AND release:"${trimmedAlbum}"')
) {
  throw new Error('iOS MusicBrainz album search adapter does not use artist MBID release-group search when resolved')
}
if (
  !musicBrainzAlbumSearchSource.includes('STUDIO_ALBUM_EXCLUDED_SECONDARY_TYPES') ||
  !musicBrainzAlbumSearchSource.includes('function hasOfficialRelease') ||
  !musicBrainzAlbumSearchSource.includes('function isAllBootlegReleaseGroup') ||
  !musicBrainzAlbumSearchSource.includes('function isStudioAlbumReleaseGroup') ||
  !musicBrainzAlbumSearchSource.includes("primaryType === 'album'") ||
  !musicBrainzAlbumSearchSource.includes("getReleaseStatus(release) === 'official'") ||
  !musicBrainzAlbumSearchSource.includes("getReleaseStatus(release) === 'bootleg'") ||
  !musicBrainzAlbumSearchSource.includes('!isAllBootlegReleaseGroup(releaseGroup)') ||
  !musicBrainzAlbumSearchSource.includes('hasOfficialRelease(releaseGroup)') ||
  !musicBrainzAlbumSearchSource.includes("'demo'") ||
  !musicBrainzAlbumSearchSource.includes("'remix'") ||
  !musicBrainzAlbumSearchSource.includes("'interview'") ||
  !musicBrainzAlbumSearchSource.includes("'spokenword'")
) {
  throw new Error('iOS MusicBrainz album search adapter does not locally filter Studio Albums release groups')
}
if (!musicBrainzAlbumSearchSource.includes("limit: isArtistOnlySearch ? '100' : '20'")) {
  throw new Error('iOS MusicBrainz album search adapter does not use React-parity artist-only limit')
}
if (!musicBrainzAlbumSearchSource.includes("offset: '0'")) {
  throw new Error('iOS MusicBrainz album search adapter does not include React-parity offset')
}
if (!musicBrainzAlbumSearchSource.includes("inc: 'releases'")) {
  throw new Error('iOS MusicBrainz album search adapter does not include releases for bootleg status checks')
}
if (!musicBrainzAlbumSearchSource.includes("BOOTLEG_STATUS_ID = '1156806e-d06a-38bd-83f0-cf2284a808b9'")) {
  throw new Error('iOS MusicBrainz album search adapter does not include React-parity bootleg status handling')
}
if (!musicBrainzAlbumSearchSource.includes('function sortArtistOnlyResults') || !musicBrainzAlbumSearchSource.includes('return isArtistOnlySearch ? sortArtistOnlyResults(results) : results')) {
  throw new Error('iOS MusicBrainz album search adapter does not sort artist-only results like React')
}
if (musicBrainzAlbumSearchSource.includes('releasegroup:"${trimmedQuery}"')) {
  throw new Error('iOS MusicBrainz album search adapter still supports album-only query')
}
if (
  !musicBrainzAlbumSearchSource.includes('artistCredit') ||
  !musicBrainzAlbumSearchSource.includes('primaryType') ||
  !musicBrainzAlbumSearchSource.includes('secondaryTypes') ||
  !musicBrainzAlbumSearchSource.includes('firstReleaseDate') ||
  !musicBrainzAlbumSearchSource.includes('disambiguation') ||
  !musicBrainzAlbumSearchSource.includes('releaseCount') ||
  !musicBrainzAlbumSearchSource.includes('officialReleaseCount')
) {
  throw new Error('iOS MusicBrainz album search adapter does not expose compact result fields')
}

console.log('PASS Expo scaffold files and MusicBrainz Search -> Results -> real Album Detail header flow wiring verified')
