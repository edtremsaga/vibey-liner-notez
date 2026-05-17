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
if (!appSource.includes('content: { flex: 1, minHeight: 0, padding: 16 }')) {
  throw new Error('App content shell does not provide a bounded scroll host for screen ScrollViews')
}

const searchScreenSource = readFileSync(path.join(appRoot, 'src/screens/SearchScreen.js'), 'utf8')
if (!searchScreenSource.includes('ScrollView') || !searchScreenSource.includes('contentContainerStyle')) {
  throw new Error('SearchScreen is not scrollable for expanded release-type content')
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
if (!searchScreenSource.includes('Search Albums')) {
  throw new Error('SearchScreen does not include album search heading')
}
if (!searchScreenSource.includes('>Search</Text>')) {
  throw new Error('SearchScreen does not include search action')
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
if (!resultsScreenSource.includes('albums.map')) {
  throw new Error('ResultsScreen does not render result list')
}
if (!resultsScreenSource.includes('onSelectAlbum(albumId, album)')) {
  throw new Error('ResultsScreen does not pass selected MusicBrainz result to Album Detail')
}
if (!resultsScreenSource.includes('No albums found')) {
  throw new Error('ResultsScreen does not include empty state text')
}
if (!resultsScreenSource.includes('MusicBrainz search error')) {
  throw new Error('ResultsScreen does not include MusicBrainz error state text')
}
if (!resultsScreenSource.includes('Searching MusicBrainz')) {
  throw new Error('ResultsScreen does not include MusicBrainz loading state text')
}
if (!resultsScreenSource.includes('artistCredit') || !resultsScreenSource.includes('firstReleaseDate')) {
  throw new Error('ResultsScreen does not render compact MusicBrainz album fields')
}
if (!resultsScreenSource.includes('from MusicBrainz')) {
  throw new Error('ResultsScreen does not describe artist-first MusicBrainz album results')
}
if (!resultsScreenSource.includes('${releaseTypeLabel} by ${artistName}.')) {
  throw new Error('ResultsScreen does not include release-type-aware artist-only heading')
}
if (!resultsScreenSource.includes('Album detail opens the current preview.')) {
  throw new Error('ResultsScreen does not explain current preview behavior')
}
if (!resultsScreenSource.includes('Open preview')) {
  throw new Error('ResultsScreen does not include row preview affordance text')
}
if (resultsScreenSource.includes('Search for an album to load MusicBrainz results.')) {
  throw new Error('ResultsScreen still presents album-only search copy')
}

const producerSearchScreenSource = readFileSync(
  path.join(appRoot, 'src/screens/ProducerSearchScreen.js'),
  'utf8'
)
if (!producerSearchScreenSource.includes('ScrollView') || !producerSearchScreenSource.includes('contentContainerStyle')) {
  throw new Error('ProducerSearchScreen is not scrollable for mock producer content')
}
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
if (!helpDataSourcesScreenSource.includes('ScrollView') || !helpDataSourcesScreenSource.includes('contentContainerStyle')) {
  throw new Error('HelpDataSourcesScreen is not scrollable for help/data-source content')
}
if (helpDataSourcesScreenSource.includes('Placeholder screen for help, attribution, and data-source disclosures.')) {
  throw new Error('HelpDataSourcesScreen still contains placeholder-only copy')
}
if (!helpDataSourcesScreenSource.includes('read-only MusicBrainz artist-first album search')) {
  throw new Error('HelpDataSourcesScreen does not disclose read-only MusicBrainz album search scope')
}
if (!helpDataSourcesScreenSource.includes('required artist')) {
  throw new Error('HelpDataSourcesScreen does not explain required artist search scope')
}
if (!helpDataSourcesScreenSource.includes('Release Type filters artist-only searches.')) {
  throw new Error('HelpDataSourcesScreen does not explain release type search scope')
}
if (!helpDataSourcesScreenSource.includes('release-group information')) {
  throw new Error('HelpDataSourcesScreen does not disclose real release-group enrichment scope')
}
if (!helpDataSourcesScreenSource.includes('optional primary cover art')) {
  throw new Error('HelpDataSourcesScreen does not disclose optional primary cover art scope')
}
if (!helpDataSourcesScreenSource.includes('producer traversal are not loaded yet')) {
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
if (!albumDetailScreenSource.includes('ScrollView') || !albumDetailScreenSource.includes('contentContainerStyle')) {
  throw new Error('AlbumDetailScreen is not scrollable for long album detail content')
}
if (!albumDetailScreenSource.includes('alwaysBounceVertical') || !albumDetailScreenSource.includes('paddingBottom: 96')) {
  throw new Error('AlbumDetailScreen ScrollView does not include hardened scroll props for long detail content')
}
for (const sectionDisclosureLabel of [
  "accessibilityLabel={`${showTracklist ? 'Hide' : 'Show'} tracklist`}",
  "accessibilityLabel={`${showCredits ? 'Hide' : 'Show'} credits`}",
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
if (!albumDetailScreenSource.includes('Back to Results')) {
  throw new Error('AlbumDetailScreen does not include back-to-results action')
}
if (!albumDetailScreenSource.includes('Loading mock album detail...')) {
  throw new Error('AlbumDetailScreen does not include mock loading state text')
}
if (!albumDetailScreenSource.includes('Real MusicBrainz album header. Tracklist and credits are not loaded yet.')) {
  throw new Error('AlbumDetailScreen does not include real MusicBrainz header scope copy')
}
if (!albumDetailScreenSource.includes('Real MusicBrainz album header, tracklist, and selected-release credits.')) {
  throw new Error('AlbumDetailScreen does not include real MusicBrainz selected-release credits scope copy')
}
if (!albumDetailScreenSource.includes('Real MusicBrainz album header and tracklist. Credits are not documented for this selected release yet.')) {
  throw new Error('AlbumDetailScreen does not include real MusicBrainz tracklist scope copy')
}
if (!albumDetailScreenSource.includes('Release-group MBID')) {
  throw new Error('AlbumDetailScreen does not render release-group MBID')
}
if (!albumDetailScreenSource.includes('Tracklist is not loaded yet.')) {
  throw new Error('AlbumDetailScreen does not include deferred real tracklist copy')
}
if (!albumDetailScreenSource.includes('Credits are unavailable or not documented for this selected release.')) {
  throw new Error('AlbumDetailScreen does not include unavailable selected-release credits copy')
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
if (!albumDetailScreenSource.includes('Selected-release track credits, songwriting, and publishing from MusicBrainz.')) {
  throw new Error('AlbumDetailScreen does not include selected-release track credits, songwriting, and publishing scope copy')
}
if (
  !albumDetailScreenSource.includes('tracksWithCreditDetails') ||
  !albumDetailScreenSource.includes('hasTrackCreditDetails') ||
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
  !albumDetailScreenSource.includes('showAlbumCredits') ||
  !albumDetailScreenSource.includes('groupedAlbumCredits') ||
  !albumDetailScreenSource.includes("accessibilityLabel={`${showAlbumCredits ? 'Hide' : 'Show'} album credits`}") ||
  !albumDetailScreenSource.includes("{showAlbumCredits ? '▾' : '▸'}")
) {
  throw new Error('AlbumDetailScreen does not render album-level credits as a collapsed disclosure row')
}
for (const creditGroupLabel of ['Performers & Instruments', 'Production & Technical', 'Other']) {
  if (!albumDetailScreenSource.includes(creditGroupLabel)) {
    throw new Error(`AlbumDetailScreen is missing track credit group label: ${creditGroupLabel}`)
  }
}
if (!albumDetailScreenSource.includes('tracksWithCreditDetails.map') || albumDetailScreenSource.includes('album.tracks.slice(0, 3)')) {
  throw new Error('AlbumDetailScreen does not render all tracks with selected-release credits, songwriting, or publishing')
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

if (!appSource.includes('searchMusicBrainzAlbumsByArtist')) {
  throw new Error('App router does not import iOS MusicBrainz album search adapter')
}
if (!appSource.includes('handleSubmitArtistSearch') || !appSource.includes("setRoute('Results')")) {
  throw new Error('App router does not navigate from search to results via artist submit flow')
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
if (!appSource.includes('fetchMusicBrainzSelectedReleaseTracklist') || !appSource.includes('tracks: tracklistDetail.tracks')) {
  throw new Error('App router does not fetch and merge selected-release tracklist for Album Detail')
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
if (!appSource.includes('handleBackToResults') || !appSource.includes("setRoute('Results')")) {
  throw new Error('App router does not restore results route from album detail')
}
if (!appSource.includes('return <ProducerSearchScreen onSelectAlbum={onSelectAlbum} />')) {
  throw new Error('App router does not pass album-select handler to ProducerSearchScreen')
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
if (!musicBrainzAlbumDetailSource.includes("release?.status === 'Official'") || !musicBrainzAlbumDetailSource.includes('dateA.localeCompare(dateB)')) {
  throw new Error('iOS MusicBrainz album detail service does not choose selected release like React basic info')
}
if (!musicBrainzAlbumDetailSource.includes('mapReleaseToEdition') || !musicBrainzAlbumDetailSource.includes('editionId')) {
  throw new Error('iOS MusicBrainz album detail service does not map minimal release-group editions')
}
if (!musicBrainzAlbumDetailSource.includes('fetchMusicBrainzSelectedReleaseTracklist')) {
  throw new Error('iOS MusicBrainz album detail service does not expose selected-release tracklist fetch')
}
if (!musicBrainzAlbumDetailSource.includes('/release/${selectedReleaseId}?')) {
  throw new Error('iOS MusicBrainz album detail service does not fetch selected-release tracklist')
}
if (!musicBrainzAlbumDetailSource.includes('recordings+artist-credits+recording-level-rels+release-rels+labels+artist-rels')) {
  throw new Error('iOS MusicBrainz album detail service does not use React-parity selected-release includes')
}
if (!musicBrainzAlbumDetailSource.includes('parseTrackPosition') || !musicBrainzAlbumDetailSource.includes('${medium.position}-${track.number}')) {
  throw new Error('iOS MusicBrainz album detail service does not preserve React multi-disc track positions')
}
if (!musicBrainzAlbumDetailSource.includes('extractTrackCredits') || !musicBrainzAlbumDetailSource.includes('mapReleaseToTrackCredits')) {
  throw new Error('iOS MusicBrainz album detail service does not extract selected-release track credits')
}
if (
  !musicBrainzAlbumDetailSource.includes('function extractSongwriting') ||
  !musicBrainzAlbumDetailSource.includes('writers: writers.length > 0 ? writers : null') ||
  !musicBrainzAlbumDetailSource.includes('composers: composers.length > 0 ? composers : null') ||
  !musicBrainzAlbumDetailSource.includes('lyricists: lyricists.length > 0 ? lyricists : null') ||
  !musicBrainzAlbumDetailSource.includes('songwriting: extractSongwriting(recording)')
) {
  throw new Error('iOS MusicBrainz album detail service does not extract selected-release songwriting from recording relations')
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
for (const deferredCoverArtMarker of ['fetchAllAlbumArt', 'galleryImages', 'lightbox', 'selectedImage', 'currentImageIndex']) {
  if (musicBrainzAlbumDetailSource.includes(deferredCoverArtMarker) || albumDetailScreenSource.includes(deferredCoverArtMarker)) {
    throw new Error(`iOS cover-art slice includes deferred gallery/lightbox work: ${deferredCoverArtMarker}`)
  }
}
if (
  !appSource.includes('fetchMusicBrainzPrimaryCoverArt') ||
  !appSource.includes('coverArtUrl') ||
  !appSource.includes("sourceName: 'Cover Art Archive'")
) {
  throw new Error('App router does not fetch and merge optional primary cover art for Album Detail')
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
if (!musicBrainzAlbumSearchSource.includes('searchMusicBrainzAlbumsByArtist')) {
  throw new Error('iOS MusicBrainz album search adapter is not artist-first')
}
if (!musicBrainzAlbumSearchSource.includes('Artist name is required')) {
  throw new Error('iOS MusicBrainz album search adapter does not require artist')
}
if (!musicBrainzAlbumSearchSource.includes('RELEASE_TYPE_QUERIES')) {
  throw new Error('iOS MusicBrainz album search adapter does not define release type query mapping')
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
  throw new Error('iOS MusicBrainz album search adapter does not search artist-only albums')
}
if (!musicBrainzAlbumSearchSource.includes('artist:"${trimmedArtist}" AND release:"${trimmedAlbum}"')) {
  throw new Error('iOS MusicBrainz album search adapter does not support artist plus album narrowing')
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
  !musicBrainzAlbumSearchSource.includes('firstReleaseDate') ||
  !musicBrainzAlbumSearchSource.includes('disambiguation')
) {
  throw new Error('iOS MusicBrainz album search adapter does not expose compact result fields')
}

console.log('PASS Expo scaffold files and MusicBrainz Search -> Results -> real Album Detail header flow wiring verified')
