import { useState, useEffect, useRef } from 'react'
import { fetchAlbumData, fetchAlbumBasicInfo, searchReleaseGroups, searchByProducer, fetchCoverArt, fetchAllAlbumArt, fetchWikipediaContentFromMusicBrainz, clearProducerSeenRgIds } from '../services/musicbrainz'
import { formatDuration } from '../utils/formatDuration'
import { getCachedAlbum, setCachedAlbum } from '../utils/albumCache'
import Help from '../components/Help'
import { useHelp } from '../contexts/HelpContext'
import './AlbumPage.css'

function AlbumPage() {
  // Search type state: 'album' or 'producer'
  const [searchType, setSearchType] = useState('album') // 'album' or 'producer'
  
  // Album search state
  const [searchArtist, setSearchArtist] = useState('')
  const [searchAlbum, setSearchAlbum] = useState('')
  const [releaseType, setReleaseType] = useState('Album') // Default to Album
  
  // Producer search state
  const [searchProducer, setSearchProducer] = useState('')
  const [multipleProducerMatches, setMultipleProducerMatches] = useState(null) // Array of producer matches if multiple found
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 50 }) // Progress tracking for producer search (50 max for initial search, 10 for pagination)
  
  // Shared search state
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [searchMeta, setSearchMeta] = useState(null) // { totalCount, isArtistOnly, releaseType, isProducerSearch, producerName, producerMBID }
  const [displayedResults, setDisplayedResults] = useState([])
  const [resultsPage, setResultsPage] = useState(1)
  const [sortOption, setSortOption] = useState('newest') // 'newest', 'oldest', 'title-az', 'title-za'
  const [loadingPage, setLoadingPage] = useState(false) // Loading state for pagination
  const [fetchedCount, setFetchedCount] = useState(0) // Track how many results have been fetched from API
  const [hideBootlegs, setHideBootlegs] = useState(false) // Filter to hide bootleg records
  const [albumPlaceholder, setAlbumPlaceholder] = useState('e.g., Aladdin Sane (leave blank to see all albums)')
  const RESULTS_PER_PAGE = 20
  
  // Prefetch state
  const [prefetchedResults, setPrefetchedResults] = useState(null) // { results: [...], finalOffset: number } or null
  const [prefetching, setPrefetching] = useState(false) // Whether prefetch is in progress
  const prefetchAbortController = useRef(null) // AbortController for cancelling prefetch
  const prefetchPromiseRef = useRef(null) // Promise for the current prefetch operation (allows awaiting completion)
  const currentProducerMBID = useRef(null) // Track current producer MBID for cache management
  const prefetchTriggeredRef = useRef(false) // Track if prefetch has been triggered for current search (prevents duplicates)
  const reachedEndRef = useRef(false) // Track if we've reached the end of unique albums (bypasses React state timing)
  const previousProducerMBIDRef = useRef(null) // Track previous producer MBID to detect actual changes (not just first set)
  
  // Available release types for filtering
  const RELEASE_TYPES = [
    { value: 'Album', label: 'Studio Albums' },
    { value: 'EP', label: 'EPs' },
    { value: 'Single', label: 'Singles' },
    { value: 'Live', label: 'Live Albums' },
    { value: 'Compilation', label: 'Compilations' },
    { value: 'Soundtrack', label: 'Soundtracks' }
  ]
  
  // Album state
  const [album, setAlbum] = useState(null)
  const [loadingAlbum, setLoadingAlbum] = useState(false)
  const [albumError, setAlbumError] = useState(null)
  
  // Progressive loading states
  const [loadingBasicInfo, setLoadingBasicInfo] = useState(false)
  const [loadingTracklist, setLoadingTracklist] = useState(false)
  const [loadingCredits, setLoadingCredits] = useState(false)
  
  // Editions collapse state
  const [editionsExpanded, setEditionsExpanded] = useState(false)
  
  // Track credits collapse state (Set of track IDs that are expanded)
  const [expandedTracks, setExpandedTracks] = useState(new Set())
  
  // Album credits collapse state (default to true - expanded)
  const [albumCreditsExpanded, setAlbumCreditsExpanded] = useState(true)
  
  // Album art gallery state
  const [galleryImages, setGalleryImages] = useState([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [galleryError, setGalleryError] = useState(null) // Error state for gallery
  const [galleryExpanded, setGalleryExpanded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null) // For lightbox view
  
  // Wikipedia content state
  const [wikipediaContent, setWikipediaContent] = useState(null)
  const [loadingWikipedia, setLoadingWikipedia] = useState(false)
  const [wikipediaError, setWikipediaError] = useState(null) // Error state for Wikipedia
  
  // Help section state (from context)
  const { showHelp, openHelp, closeHelp } = useHelp()
  
  // Mobile detection state for responsive UI
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Handle URL query params for search type (?type=producer or ?type=album)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const typeParam = urlParams.get('type')
    if (typeParam === 'producer' || typeParam === 'album') {
      setSearchType(typeParam)
    } else {
      // Default to album search if no type param
      setSearchType('album')
    }
  }, [])
  
  // Update URL when search type changes
  useEffect(() => {
    const url = new URL(window.location.href)
    if (searchType === 'album') {
      url.searchParams.delete('type') // Remove param for album (default)
    } else {
      url.searchParams.set('type', searchType)
    }
    window.history.replaceState(
      { page: 'search', type: searchType, initialized: true },
      '',
      url.toString()
    )
  }, [searchType])
  
  // Initialize browser history on page load (safety measure for back button)
  // This ensures the initial search page is a distinct history entry
  useEffect(() => {
    // Only initialize if no history state exists (first load or page refresh)
    if (window.history.state === null) {
      window.history.replaceState(
        { page: 'search', type: searchType, initialized: true },
        '',
        window.location.href
      )
      console.log('[History] Initialized history state for search page')
    }
  }, [searchType])
  
  // Get heading text based on release type
  function getResultsHeading(releaseType, producerName = null) {
    const headingMap = {
      'Album': 'Studio Albums Found',
      'EP': 'EPs Found',
      'Single': 'Singles Found',
      'Live': 'Live Albums Found',
      'Compilation': 'Compilations Found',
      'Soundtrack': 'Soundtracks Found'
    }
    const baseHeading = headingMap[releaseType] || 'Studio Albums Found'
    
    // For producer search, append producer name
    if (producerName) {
      return `${baseHeading} - ${producerName}`
    }
    
    return baseHeading
  }
  
  // Get pluralized release type name for results count
  function getReleaseTypePlural(releaseType) {
    const pluralMap = {
      'Album': 'studio albums',
      'EP': 'EPs',
      'Single': 'singles',
      'Live': 'live albums',
      'Compilation': 'compilations',
      'Soundtrack': 'soundtracks'
    }
    return pluralMap[releaseType] || 'studio albums'
  }
  
  // Get singular release type name for loading messages
  function getReleaseTypeSingular(releaseType) {
    const singularMap = {
      'Album': 'studio album',
      'EP': 'EP',
      'Single': 'single',
      'Live': 'live album',
      'Compilation': 'compilation',
      'Soundtrack': 'soundtrack'
    }
    return singularMap[releaseType] || 'release'
  }
  
  // Get the appropriate release type term for loading message
  function getLoadingReleaseType() {
    // Use searchMeta.releaseType if available (from current search context)
    if (searchMeta && searchMeta.releaseType) {
      return getReleaseTypeSingular(searchMeta.releaseType)
    }
    // Default to generic term if no context available
    return 'release'
  }
  
  // Sort results based on selected sort option
  function sortResults(results, sortOption) {
    const sorted = [...results] // Create a copy to avoid mutating original
    
    switch (sortOption) {
      case 'newest':
        // Sort by year (newest first), then by title
        sorted.sort((a, b) => {
          if (a.releaseYear && b.releaseYear) {
            if (b.releaseYear !== a.releaseYear) {
              return b.releaseYear - a.releaseYear
            }
          } else if (a.releaseYear && !b.releaseYear) {
            return -1
          } else if (!a.releaseYear && b.releaseYear) {
            return 1
          }
          return (a.title || '').localeCompare(b.title || '')
        })
        break
      case 'oldest':
        // Sort by year (oldest first), then by title
        sorted.sort((a, b) => {
          if (a.releaseYear && b.releaseYear) {
            if (a.releaseYear !== b.releaseYear) {
              return a.releaseYear - b.releaseYear
            }
          } else if (!a.releaseYear && b.releaseYear) {
            return -1
          } else if (a.releaseYear && !b.releaseYear) {
            return 1
          }
          return (a.title || '').localeCompare(b.title || '')
        })
        break
      case 'title-az':
        // Sort by title A-Z
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case 'title-za':
        // Sort by title Z-A
        sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
        break
      default:
        // Default to newest
        break
    }
    
    return sorted
  }
  
  // Filter results to exclude bootlegs if hideBootlegs is enabled
  function filterBootlegs(results) {
    if (!hideBootlegs) return results
    return results.filter(result => !result.isBootleg)
  }
  
  // Handle sort option change
  function handleSortChange(newSortOption) {
    setSearchError(null) // Clear any previous errors
    setSortOption(newSortOption)
    if (searchResults) {
      const sorted = sortResults(searchResults, newSortOption)
      setSearchResults(sorted)
      // Apply bootleg filter and reset to first page
      const filtered = filterBootlegs(sorted)
      setResultsPage(1)
      setDisplayedResults(filtered.slice(0, RESULTS_PER_PAGE))
    }
  }
  
  // Handle bootleg filter toggle
  function handleBootlegFilterChange() {
    setSearchError(null) // Clear any previous errors
    setHideBootlegs(!hideBootlegs)
    if (searchResults) {
      // Re-apply sorting and filtering
      const sorted = sortResults(searchResults, sortOption)
      const filtered = filterBootlegs(sorted)
      setResultsPage(1)
      setDisplayedResults(filtered.slice(0, RESULTS_PER_PAGE))
    }
  }

  // Reset prefetch state on new search or when search type changes
  useEffect(() => {
    // Reset prefetch trigger ref when search changes
    if (!searchMeta?.isProducerSearch) {
      prefetchTriggeredRef.current = false
      setPrefetchedResults(null)
      setPrefetching(false)
      if (prefetchAbortController.current) {
        prefetchAbortController.current.abort()
        prefetchAbortController.current = null
      }
      prefetchPromiseRef.current = null
    }
  }, [searchMeta?.isProducerSearch, searchMeta?.producerMBID])
  
  // Prefetch when Next button becomes enabled (user-intent driven approach)
  // This useEffect watches the state values that affect canGoNext() and triggers prefetch automatically
  useEffect(() => {
    // Only prefetch for producer search, on page 1, when Next button is enabled
    if (
      !searchMeta?.isProducerSearch ||
      resultsPage !== 1 ||
      loadingPage ||
      prefetching ||
      prefetchedResults?.results ||
      prefetchTriggeredRef.current
    ) {
      return // Early exit if conditions not met
    }
    
    // Check if Next button would be enabled (reuse canGoNext logic)
    const nextEnabled = canGoNext()
    
    if (nextEnabled) {
      // Next button is enabled - trigger prefetch in anticipation of user action
      const producerName = searchMeta.producerName
      const producerMBID = searchMeta.producerMBID
      const currentOffset = searchMeta.producerOffset || 0
      const releaseRelations = searchMeta.releaseRelations
      const seenRgIds = searchMeta.seenRgIds
      const totalCount = searchMeta.totalCount
      
      // Validate we have all required data
      if (!producerName || !producerMBID || !releaseRelations || currentOffset >= totalCount) {
        console.log(`[Prefetch] Skipping: missing required data`, {
          hasName: !!producerName,
          hasMBID: !!producerMBID,
          hasRelations: !!releaseRelations,
          atEnd: currentOffset >= totalCount
        })
        return
      }
      
      // Mark as triggered to prevent duplicate prefetches
      prefetchTriggeredRef.current = true
      
      console.log(`[Prefetch] Next button enabled - starting prefetch automatically`, {
        producerName,
        currentOffset,
        totalCount,
        resultsPage
      })
      
      startPrefetchNextPage(
        producerName,
        producerMBID,
        currentOffset,
        releaseRelations,
        seenRgIds,
        totalCount
      )
    }
  }, [
    // Watch all state values that affect canGoNext()
    searchResults?.length,
    searchMeta?.isProducerSearch,
    searchMeta?.totalCount,
    searchMeta?.producerOffset,
    searchMeta?.producerName,
    searchMeta?.producerMBID,
    searchMeta?.releaseRelations,
    searchMeta?.seenRgIds,
    resultsPage,
    loadingPage,
    hideBootlegs, // Affects filtered count, which affects canGoNext()
    prefetching,
    prefetchedResults
  ])
  
  // Cleanup: Cancel prefetch only when producer actually changes (not on first set)
  useEffect(() => {
    const previousProducerMBID = previousProducerMBIDRef.current
    const currentProducerMBID = searchMeta?.producerMBID || null
    
    // Update ref for next render
    previousProducerMBIDRef.current = currentProducerMBID
    
    return () => {
      // Only abort if producer actually changed (previous !== current) AND previous was not null
      // This prevents aborting on first set (previous is null, current is set) or when producer stays the same
      const isProducerChange = previousProducerMBID !== null && 
                               previousProducerMBID !== currentProducerMBID
      
      if (prefetchAbortController.current && isProducerChange) {
        console.log('[Prefetch] Cleanup: Cancelling in-flight prefetch (producer changed)', {
          previous: previousProducerMBID,
          current: currentProducerMBID
        })
        prefetchAbortController.current.abort()
        prefetchAbortController.current = null
        prefetchPromiseRef.current = null
      }
    }
  }, [searchMeta?.producerMBID]) // Re-run cleanup when producer changes
  
  // Handle producer search form submission
  async function handleProducerSearch(e) {
    e.preventDefault()
    
    const trimmedProducer = searchProducer.trim()
    if (!trimmedProducer) {
      setSearchError('Please enter a producer name')
      return
    }
    
    setSearching(true)
    setSearchError(null)
    setSearchResults(null)
    setSearchMeta(null)
    
    // Reset prefetch state for new search
    prefetchTriggeredRef.current = false
    reachedEndRef.current = false // Reset reached end flag for new search
    previousProducerMBIDRef.current = null // Reset previous producer MBID tracking
    setPrefetchedResults(null)
    setPrefetching(false)
    if (prefetchAbortController.current) {
      prefetchAbortController.current.abort()
      prefetchAbortController.current = null
    }
    prefetchPromiseRef.current = null
    setAlbum(null)
    setAlbumError(null)
    setDisplayedResults([])
    setResultsPage(1)
    setFetchedCount(0)
    setLoadingPage(false)
    setMultipleProducerMatches(null)
    setSearchProgress({ current: 0, total: 50 }) // Reset progress (50 max for initial search)
    
    // Progress callback for producer search
    const onProgress = ({ current, total }) => {
      setSearchProgress({ current, total })
    }
    
    // Cancel any ongoing prefetch
    if (prefetchAbortController.current) {
      prefetchAbortController.current.abort()
      prefetchAbortController.current = null
    }
    setPrefetchedResults(null)
    setPrefetching(false)
    prefetchPromiseRef.current = null
    
    // Clear seenRgIds for previous producer if switching producers
    if (currentProducerMBID.current && currentProducerMBID.current !== null) {
      clearProducerSeenRgIds(currentProducerMBID.current)
    }
    
    try {
      const searchResponse = await searchByProducer(trimmedProducer, null, 0, onProgress)
      
      // Check if multiple producer matches found
      if (searchResponse.multipleMatches) {
        setMultipleProducerMatches(searchResponse.matches)
        setSearching(false)
        setSearchProgress({ current: 0, total: 50 }) // Reset progress
        return // Wait for user to select a producer
      }
      
      const { results, totalCount, producerName, producerMBID, releasesProcessed, releaseRelations, seenRgIds } = searchResponse
      
      // Update current producer MBID
      currentProducerMBID.current = producerMBID
      
      if (results.length === 0) {
        setSearchError('No albums found for this producer. The producer exists but no production credits are documented.')
      } else {
        // Multiple results - sort and show list with pagination
        const sortedResults = sortResults(results, sortOption)
        setSearchResults(sortedResults)
        const newSearchMeta = { 
          totalCount, // Total releases available for pagination (from API - represents total release relations)
          isArtistOnly: false, 
          releaseType: null,
          isProducerSearch: true,
          producerName,
          producerMBID,
          producerOffset: releasesProcessed || 0, // Track how many releases we've actually processed (important for pagination)
          releaseRelations: releaseRelations || null, // Cache release relations to avoid re-fetching during pagination
          seenRgIds: seenRgIds || null // Cache seenRgIds Set for deduplication across pagination
        }
        setSearchMeta(newSearchMeta)
        setFetchedCount(results.length) // Total albums found so far
        
        // Apply bootleg filter and show first page of results
        const filteredResults = filterBootlegs(sortedResults)
        setDisplayedResults(filteredResults.slice(0, RESULTS_PER_PAGE))
        
        // Push new history state for search results
        console.log('[History] Pushing new history state for producer search results')
        window.history.pushState(
          { fromSearch: true, page: 'results', type: 'producer' },
          '',
          window.location.href
        )
        
        // Explicitly trigger prefetch immediately after search completes (if Next button would be enabled)
        // Use setTimeout to ensure state updates have been processed
        setTimeout(() => {
          // Check if prefetch should be triggered (same conditions as useEffect)
          if (
            !prefetching &&
            !prefetchedResults &&
            !prefetchTriggeredRef.current &&
            releaseRelations &&
            (releasesProcessed || 0) < totalCount &&
            !reachedEndRef.current
          ) {
            // Check if Next button would be enabled (we have more releases to process)
            const canFetchMore = (releasesProcessed || 0) < totalCount
            const calculatedTotalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE)
            const hasNextPage = 1 < calculatedTotalPages
            const shouldPrefetch = hasNextPage || canFetchMore
            
            if (shouldPrefetch) {
              prefetchTriggeredRef.current = true
              console.log(`[Prefetch] Explicitly triggering prefetch after search completion`, {
                producerName,
                currentOffset: releasesProcessed || 0,
                totalCount,
                resultsPage: 1
              })
              startPrefetchNextPage(
                producerName,
                producerMBID,
                releasesProcessed || 0,
                releaseRelations,
                seenRgIds,
                totalCount
              )
            }
          }
        }, 0)
      }
    } catch (error) {
      console.error('Error searching by producer:', error)
      setSearchError(error.message || 'An error occurred while searching. Please try again.')
    } finally {
      setSearching(false)
      setSearchProgress({ current: 0, total: 50 }) // Reset progress
    }
  }
  
  // Handle producer selection when multiple matches found
  async function handleProducerSelection(selectedProducerMBID) {
    setSearching(true)
    setSearchError(null)
    setMultipleProducerMatches(null)
    setSearchProgress({ current: 0, total: 50 }) // Reset progress (50 max for initial search)
    
    // Reset prefetch state for new producer selection
    prefetchTriggeredRef.current = false
    reachedEndRef.current = false // Reset reached end flag for new search
    previousProducerMBIDRef.current = null // Reset previous producer MBID tracking
    setPrefetchedResults(null)
    setPrefetching(false)
    if (prefetchAbortController.current) {
      prefetchAbortController.current.abort()
      prefetchAbortController.current = null
    }
    prefetchPromiseRef.current = null
    
    // Progress callback for producer search
    const onProgress = ({ current, total }) => {
      setSearchProgress({ current, total })
    }
    
    // Cancel any ongoing prefetch
    if (prefetchAbortController.current) {
      prefetchAbortController.current.abort()
      prefetchAbortController.current = null
    }
    setPrefetchedResults(null)
    setPrefetching(false)
    prefetchPromiseRef.current = null
    
    // Clear seenRgIds for previous producer if switching producers
    if (currentProducerMBID.current && currentProducerMBID.current !== selectedProducerMBID) {
      clearProducerSeenRgIds(currentProducerMBID.current)
    }
    
    try {
      const searchResponse = await searchByProducer(searchProducer.trim(), selectedProducerMBID, 0, onProgress)
      
      const { results, totalCount, producerName, producerMBID, releasesProcessed, releaseRelations, seenRgIds } = searchResponse
      
      // Update current producer MBID
      currentProducerMBID.current = producerMBID
      
      if (results.length === 0) {
        setSearchError('No albums found for this producer. The producer exists but no production credits are documented.')
      } else {
        // Multiple results - sort and show list with pagination
        const sortedResults = sortResults(results, sortOption)
        setSearchResults(sortedResults)
        const newSearchMeta = { 
          totalCount, // Total releases available for pagination (from API - represents total release relations)
          isArtistOnly: false, 
          releaseType: null,
          isProducerSearch: true,
          producerName,
          producerMBID,
          producerOffset: releasesProcessed || 0, // Track how many releases we've actually processed (important for pagination)
          releaseRelations: releaseRelations || null, // Cache release relations to avoid re-fetching during pagination
          seenRgIds: seenRgIds || null // Cache seenRgIds Set for deduplication across pagination
        }
        setSearchMeta(newSearchMeta)
        setFetchedCount(results.length) // Total albums found so far
        // Apply bootleg filter and show first page of results
        const filteredResults = filterBootlegs(sortedResults)
        setDisplayedResults(filteredResults.slice(0, RESULTS_PER_PAGE))
        
        // Push new history state for search results
        console.log('[History] Pushing new history state for producer search results')
        window.history.pushState(
          { fromSearch: true, page: 'results', type: 'producer' },
          '',
          window.location.href
        )
        
        // Explicitly trigger prefetch immediately after search completes (if Next button would be enabled)
        // Use setTimeout to ensure state updates have been processed
        setTimeout(() => {
          // Check if prefetch should be triggered (same conditions as useEffect)
          if (
            !prefetching &&
            !prefetchedResults &&
            !prefetchTriggeredRef.current &&
            releaseRelations &&
            (releasesProcessed || 0) < totalCount &&
            !reachedEndRef.current
          ) {
            // Check if Next button would be enabled (we have more releases to process)
            const canFetchMore = (releasesProcessed || 0) < totalCount
            const calculatedTotalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE)
            const hasNextPage = 1 < calculatedTotalPages
            const shouldPrefetch = hasNextPage || canFetchMore
            
            if (shouldPrefetch) {
              prefetchTriggeredRef.current = true
              console.log(`[Prefetch] Explicitly triggering prefetch after search completion`, {
                producerName,
                currentOffset: releasesProcessed || 0,
                totalCount,
                resultsPage: 1
              })
              startPrefetchNextPage(
                producerName,
                producerMBID,
                releasesProcessed || 0,
                releaseRelations,
                seenRgIds,
                totalCount
              )
            }
          }
        }, 0)
      }
    } catch (error) {
      console.error('Error searching by producer:', error)
      setSearchError(error.message || 'An error occurred while searching. Please try again.')
    } finally {
      setSearching(false)
      setSearchProgress({ current: 0, total: 50 }) // Reset progress
    }
  }
  
  // Unified search handler that routes to album or producer search based on searchType
  function handleSearch(e) {
    e.preventDefault()
    if (searchType === 'producer') {
      handleProducerSearch(e)
    } else {
      handleAlbumSearch(e)
    }
  }
  
  // Handle tab switching between album and producer search
  function handleTabChange(newSearchType) {
    // Preserve form inputs when switching tabs
    setSearchType(newSearchType)
    setSearchError(null)
    setSearchResults(null)
    setSearchMeta(null)
    setMultipleProducerMatches(null)
    // Don't clear search inputs - preserve them when switching tabs
  }
  
  // Handle search form submission (album search)
  async function handleAlbumSearch(e) {
    e.preventDefault()
    
    if (!searchArtist.trim()) {
      setSearchError('Please enter an artist name')
      return
    }
    
    setSearching(true)
    setSearchError(null)
    setSearchResults(null)
    setSearchMeta(null)
    setAlbum(null)
    setAlbumError(null)
    setDisplayedResults([])
    setResultsPage(1)
    setFetchedCount(0)
    setLoadingPage(false)
    
    try {
      const albumName = searchAlbum.trim() || null
      // Only use release type filter for artist-only searches (when album name is not provided)
      const typeFilter = albumName ? null : releaseType
      const searchResponse = await searchReleaseGroups(searchArtist.trim(), albumName, typeFilter, 0)
      
      const { results, totalCount, isArtistOnly } = searchResponse
      
      if (results.length === 0) {
        const releaseTypePlural = getReleaseTypePlural(typeFilter || 'Album')
        setSearchError(`No ${releaseTypePlural} found. Please check spelling and try again.`)
      } else if (results.length === 1 && !isArtistOnly) {
        // Single specific album result - show basic info immediately, then load full album
        const result = results[0]
        setAlbum({
          albumId: result.releaseGroupId,
          title: result.title,
          artistName: result.artistName,
          releaseYear: result.releaseYear,
          albumType: 'album',
          coverArtUrl: null, // Will load later
          editions: [],
          tracks: null,
          credits: null,
          recordingInfo: null,
          externalLinks: null,
          sources: null,
          dataNotes: null
        })
        // Load full album data in background
        await loadAlbum(result.releaseGroupId)
      } else {
        // Multiple results - sort and show list with pagination
        const sortedResults = sortResults(results, sortOption)
        setSearchResults(sortedResults)
        setSearchMeta({ totalCount, isArtistOnly, releaseType: typeFilter || 'Album' })
        setFetchedCount(results.length) // Track how many we've fetched
        // Apply bootleg filter and show first page of results
        const filteredResults = filterBootlegs(sortedResults)
        setDisplayedResults(filteredResults.slice(0, RESULTS_PER_PAGE))
        setResultsPage(1) // Reset pagination
        
        // Push new history entry for search results (unified for mobile and desktop)
        // Initial history state is now guaranteed to exist from component mount
        window.history.pushState(
          { fromSearch: true, page: 'results', type: 'album' },
          '',
          window.location.href
        )
        console.log('[History] Pushed search results state (album search)')
      }
    } catch (err) {
      console.error('Error searching albums:', err)
      setSearchError(err.message || 'Failed to search albums. Please try again.')
    } finally {
      setSearching(false)
    }
  }
  
  // Calculate total pages based on filtered count
  function getTotalPages() {
    if (!searchResults || !searchMeta || !searchResults.length) return 1
    const filteredResults = filterBootlegs(searchResults)
    // For producer search: use albums found (searchResults.length), not totalCount (which is total releases)
    // For album search: use totalCount from API if not hiding bootlegs, otherwise use filtered length
    const filteredCount = (searchMeta.isProducerSearch || hideBootlegs) 
      ? filteredResults.length 
      : searchMeta.totalCount || filteredResults.length
    const total = Math.ceil(filteredCount / RESULTS_PER_PAGE)
    
    // Option 1: Allow partial pages for producer search
    // If we have more than RESULTS_PER_PAGE albums AND more releases are available, allow showing page 2 (even if partial)
    if (searchMeta.isProducerSearch && filteredResults.length > RESULTS_PER_PAGE) {
      const releasesProcessed = searchMeta.producerOffset || 0
      const totalReleases = searchMeta.totalCount || 0
      if (releasesProcessed < totalReleases) {
        // More releases available, allow at least 2 pages (even if page 2 is partial)
        return Math.max(2, total)
      }
    }
    
    return Math.max(1, total) // Ensure at least 1 page
  }
  
  function getFilteredCount() {
    if (!searchResults || !searchMeta) return searchMeta?.totalCount || 0
    const filteredResults = filterBootlegs(searchResults)
    // For producer search: always use albums found (searchResults.length), not totalCount (which is total releases)
    // For album search: use totalCount from API if not hiding bootlegs, otherwise use filtered length
    if (searchMeta.isProducerSearch) {
      return hideBootlegs ? filteredResults.length : searchResults.length
    }
    return hideBootlegs ? filteredResults.length : searchMeta.totalCount || filteredResults.length
  }
  
  // Check if Next button should be enabled (for producer search, enable if more releases available)
  function canGoNext() {
    const debugInfo = {
      searchResults: !!searchResults,
      searchResultsLength: searchResults?.length || 0,
      searchMeta: !!searchMeta,
      loadingPage,
      calculatedTotalPages: searchResults && searchMeta ? getTotalPages() : 0,
      resultsPage,
      isProducerSearch: searchMeta?.isProducerSearch,
      totalCount: searchMeta?.totalCount,
      producerOffset: searchMeta?.producerOffset,
      producerName: searchMeta?.producerName,
      producerMBID: searchMeta?.producerMBID
    }
    
    if (!searchResults || !searchMeta || loadingPage) {
      console.log('[canGoNext] Returning false (early exit):', debugInfo)
      return false
    }
    
    const calculatedTotalPages = getTotalPages()
    
    // Normal pagination: enable if there's another page
    if (resultsPage < calculatedTotalPages) {
      console.log('[canGoNext] Returning true (normal pagination):', { resultsPage, calculatedTotalPages, ...debugInfo })
      return true
    }
    
    // For producer search: enable Next if we can fetch more releases OR if there's already a next page OR if there are prefetched results
    if (searchMeta.isProducerSearch && searchMeta.totalCount) {
      const releasesProcessed = searchMeta.producerOffset || 0
      const hasNextPage = resultsPage < calculatedTotalPages
      
      // Check if we have prefetched results (even partial) - this means there are more albums to show
      const hasPrefetchedResults = prefetchedResults && prefetchedResults.results && prefetchedResults.results.length > 0
      
      // Check if we've reached the end of unique albums
      // Use ref first (immediate, bypasses React state timing), then fall back to state
      const hasReachedEnd = reachedEndRef.current || searchMeta.hasMore === false
      
      // If we have prefetched results, always enable Next (even if partial page)
      if (hasPrefetchedResults) {
        console.log('[canGoNext] Producer search: prefetched results available, enabling Next:', {
          ...debugInfo,
          prefetchedCount: prefetchedResults.results.length,
          resultsPage,
          calculatedTotalPages
        })
        return true
      }
      
      // Check if there are more albums in searchResults than what's displayed on current page
      const albumsOnCurrentPage = RESULTS_PER_PAGE
      const albumsAvailable = searchResults.length
      const albumsNeededForNextPage = resultsPage * albumsOnCurrentPage // Albums needed to fill pages up to current page
      const hasMoreAlbumsAvailable = albumsAvailable > albumsNeededForNextPage
      
      // Check if all releases have been processed (we've fetched everything available)
      const allReleasesProcessed = releasesProcessed >= searchMeta.totalCount
      
      // If we're on the last calculated page:
      // - Disable Next if we've reached the end, OR
      // - Disable Next if all releases have been processed AND no more albums available beyond current page
      if (resultsPage >= calculatedTotalPages) {
        if (hasReachedEnd || (allReleasesProcessed && !hasMoreAlbumsAvailable)) {
          console.log('[canGoNext] Producer search: on last page and reached end, disabling Next:', {
            ...debugInfo,
            resultsPage,
            calculatedTotalPages,
            hasReachedEnd,
            reachedEndRef: reachedEndRef.current,
            hasMore: searchMeta.hasMore,
            albumsAvailable,
            albumsNeededForNextPage,
            hasMoreAlbumsAvailable,
            allReleasesProcessed,
            releasesProcessed,
            totalCount: searchMeta.totalCount
          })
          return false
        }
      }
      
      // Only enable if:
      // 1. We have a next page already loaded, OR
      // 2. We have more albums available beyond current page, OR
      // 3. We can fetch more releases AND we haven't reached the end of unique albums
      const canFetchMore = !hasReachedEnd && releasesProcessed < searchMeta.totalCount
      const shouldEnable = hasNextPage || hasMoreAlbumsAvailable || canFetchMore
      
      console.log('[canGoNext] Producer search check:', {
        ...debugInfo,
        releasesProcessed,
        totalCount: searchMeta.totalCount,
        hasReachedEnd,
        reachedEndRef: reachedEndRef.current,
        canFetchMore,
        hasNextPage,
        hasPrefetchedResults,
        hasMoreAlbumsAvailable,
        albumsAvailable: searchResults.length,
        shouldEnable
      })
      return shouldEnable
    }
    
    console.log('[canGoNext] Returning false (no conditions met):', debugInfo)
    return false
  }
  
  // Navigate to a specific page (handles both Previous and Next)
  // Prefetch next page function - now returns a Promise for awaitable completion
  const startPrefetchNextPage = async (producerName, producerMBID, currentOffset, releaseRelations, seenRgIds, totalCount) => {
    // Don't prefetch if already prefetching or if we're at the end
    if (prefetching || !releaseRelations || currentOffset >= totalCount) {
      console.log(`[Prefetch] Skipping prefetch: prefetching=${prefetching}, hasRelations=${!!releaseRelations}, atEnd=${currentOffset >= totalCount}`)
      return null
    }
    
    console.log(`[Prefetch] Starting prefetch for page 2 (currentOffset=${currentOffset}, totalCount=${totalCount})`)
    setPrefetching(true)
    
    // Create abort controller for cancellation
    const abortController = new AbortController()
    prefetchAbortController.current = abortController
    
    // Create and store Promise for this prefetch operation
    const prefetchPromise = (async () => {
      try {
        // Calculate what we need for page 2 (20 more albums)
        const targetAlbums = RESULTS_PER_PAGE * 2 // Need 40 albums total for page 2
        const currentAlbums = RESULTS_PER_PAGE // We have 20 from page 1
        const albumsNeeded = targetAlbums - currentAlbums
        
        console.log(`[Prefetch] Need ${albumsNeeded} more albums for page 2`)
        
        // Start fetching batches until we have enough
        let allResults = []
        let currentOffsetForPrefetch = currentOffset
        let currentSeenRgIds = seenRgIds
        
        while (allResults.length < albumsNeeded && currentOffsetForPrefetch < totalCount && !abortController.signal.aborted) {
          const nextOffset = currentOffsetForPrefetch
          console.log(`[Prefetch] Fetching batch at offset ${nextOffset}... (have ${allResults.length}, need ${albumsNeeded})`)
          
          const searchResponse = await searchByProducer(
            producerName,
            producerMBID,
            nextOffset,
            null, // No progress for background prefetch
            releaseRelations,
            currentSeenRgIds
          )
          
          if (abortController.signal.aborted) {
            console.log(`[Prefetch] Aborted`)
            throw new Error('Aborted')
          }
          
          const { results: newResults, seenRgIds: updatedSeenRgIds, hasMore, releasesProcessed } = searchResponse
          
          // Update seenRgIds for next iteration
          if (updatedSeenRgIds) {
            currentSeenRgIds = updatedSeenRgIds
          }
          
          // Filter out duplicates
          const existingRgIds = new Set(allResults.map(r => r.releaseGroupId))
          const uniqueNewResults = newResults.filter(r => !existingRgIds.has(r.releaseGroupId))
          
          allResults = [...allResults, ...uniqueNewResults]
          
          // Calculate actual final offset based on releasesProcessed (if available) or fallback to batch increment
          // releasesProcessed tells us how many releases were actually processed in this batch
          const actualReleasesProcessed = releasesProcessed || 10 // Default to 10 if not available (full batch)
          currentOffsetForPrefetch = nextOffset + actualReleasesProcessed // Move to next batch (use actual count, not assumed 10)
          
          console.log(`[Prefetch] Batch at offset ${nextOffset}: found ${uniqueNewResults.length} new albums (${allResults.length} total), processed ${actualReleasesProcessed} releases`)
          
          // If we got no results or hasMore is false, we've reached the end
          if (newResults.length === 0 || hasMore === false) {
            console.log(`[Prefetch] Reached end of available releases (hasMore=${hasMore})`)
            // Update ref and state to indicate we've reached the end (so canGoNext() disables Next button)
            reachedEndRef.current = true
            setSearchMeta(prev => prev ? { ...prev, hasMore: false } : null)
            break
          }
        }
        
        if (abortController.signal.aborted) {
          throw new Error('Aborted')
        }
        
        // Return prefetch results (even if empty)
        const result = {
          results: allResults,
          finalOffset: currentOffsetForPrefetch,
          reachedEnd: reachedEndRef.current
        }
        
        if (allResults.length > 0) {
          // Store both results and final offset for accurate pagination tracking
          setPrefetchedResults(result)
          console.log(`[Prefetch] ✅ Prefetched ${allResults.length} albums for page 2 (finalOffset=${currentOffsetForPrefetch})`)
        } else {
          console.log(`[Prefetch] No albums prefetched (reached end)`)
          // If we reached the end with no results, update ref and state
          reachedEndRef.current = true
          setSearchMeta(prev => prev ? { ...prev, hasMore: false } : null)
        }
        
        return result
      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Aborted') {
          console.log('[Prefetch] Prefetch was aborted')
          // Return null instead of throwing - prevents uncaught Promise rejection
          // Caller can check prefetchedResults for partial results if available
          return null
        } else {
          console.warn('[Prefetch] Error prefetching next page:', error)
          throw error
        }
      } finally {
        // Always clear prefetching state when Promise completes (unless aborted)
        if (!abortController.signal.aborted) {
          setPrefetching(false)
          prefetchAbortController.current = null
          prefetchPromiseRef.current = null
        } else {
          // If aborted, still clear the Promise ref but keep prefetching state
          // (prefetch may have partial results that were set before abort)
          prefetchPromiseRef.current = null
        }
      }
    })()
    
    // Store Promise ref so we can await it in handlePageChange
    prefetchPromiseRef.current = prefetchPromise
    
    // Don't await here - return Promise for caller to await if needed
    return prefetchPromise
  }
  
  async function handlePageChange(direction) {
    if (!searchResults || !searchMeta || loadingPage) {
      console.log(`[Pagination] handlePageChange blocked: searchResults=${!!searchResults}, searchMeta=${!!searchMeta}, loadingPage=${loadingPage}`)
      return
    }
    
    const calculatedTotalPages = getTotalPages()
    console.log(`[Pagination] handlePageChange('${direction}'): currentPage=${resultsPage}, totalPages=${calculatedTotalPages}, canGoNext=${canGoNext()}`)
    let targetPage
    
    if (direction === 'next') {
      // For producer search: allow going to next page even if we're on last page of current results
      // (we'll fetch more releases to get more albums)
      // For album search: only allow if there's another page
      if (!searchMeta.isProducerSearch && resultsPage >= calculatedTotalPages) {
        console.log(`[Pagination] Blocked: Already on last page (${resultsPage} >= ${calculatedTotalPages})`)
        return
      }
      targetPage = resultsPage + 1
    } else if (direction === 'prev') {
      // On page 1: clear results and return to search form
      if (resultsPage === 1) {
        console.log(`[Pagination] On page 1: clearing results and returning to search form`)
        
        // Clear all search state
        setSearchResults(null)
        setSearchMeta(null)
        setDisplayedResults([])
        setResultsPage(1)
        setFetchedCount(0)
        setSearchError(null)
        setLoadingPage(false)
        
        // Clear prefetch state
        prefetchTriggeredRef.current = false
        reachedEndRef.current = false
        previousProducerMBIDRef.current = null // Reset previous producer MBID tracking
        setPrefetchedResults(null)
        setPrefetching(false)
        if (prefetchAbortController.current) {
          prefetchAbortController.current.abort()
          prefetchAbortController.current = null
        }
        prefetchPromiseRef.current = null
        
        // Clear producer-specific cache if needed
        if (currentProducerMBID.current) {
          clearProducerSeenRgIds(currentProducerMBID.current)
          currentProducerMBID.current = null
        }
        
        // Reset search progress
        setSearchProgress({ current: 0, total: 50 })
        
        // Update browser history to return to search page
        const url = new URL(window.location.href)
        if (searchType === 'producer') {
          url.searchParams.set('type', 'producer')
        } else {
          url.searchParams.delete('type')
        }
        window.history.pushState(
          { page: 'search', type: searchType, initialized: true },
          '',
          url.toString()
        )
        
        return // Early return - we've cleared everything and returned to form
      }
      
      // On page 2+: go to previous page (normal pagination)
      targetPage = resultsPage - 1
      console.log(`[Pagination] Going to previous page: ${resultsPage} -> ${targetPage}`)
    } else {
      return
    }
    
    // Calculate end index based on filtered results
    const filteredResults = filterBootlegs(searchResults)
    // For producer search: use albums found (searchResults.length), not totalCount (which is releases)
    // For album search: use totalCount from API if not hiding bootlegs
    const filteredCount = (searchMeta.isProducerSearch)
      ? (hideBootlegs ? filteredResults.length : searchResults.length)
      : (hideBootlegs ? filteredResults.length : searchMeta.totalCount || filteredResults.length)
    const startIndex = (targetPage - 1) * RESULTS_PER_PAGE
    const endIndex = Math.min(startIndex + RESULTS_PER_PAGE, filteredCount)
    
    // For Previous navigation: always use results already in memory (we're going backwards, so data is already loaded)
    // For Next navigation: check if we need to fetch more data
    const isGoingBackwards = direction === 'prev'
    
    // Check if we need to fetch more from API (only for Next direction)
    // For producer search: check if we need more albums for the requested page AND more releases are available
    // For album search: check if we need more results for the requested page
    const needsMoreData = isGoingBackwards
      ? false // Never fetch when going backwards - use what's already in memory
      : (searchMeta.isProducerSearch)
        ? (startIndex >= searchResults.length && (searchMeta.producerOffset || 0) < (searchMeta.totalCount || 0))
        : (endIndex > searchResults.length)
    
    console.log(`[Pagination] Page ${targetPage} (direction: ${direction}, goingBackwards: ${isGoingBackwards}): startIndex=${startIndex}, searchResults.length=${searchResults.length}, needsMoreData=${needsMoreData}`)
    if (searchMeta.isProducerSearch) {
      console.log(`[Pagination] Producer search: producerOffset=${searchMeta.producerOffset || 0}, totalCount=${searchMeta.totalCount}`)
    }
    
    if (needsMoreData) {
      setLoadingPage(true)
      
      try {
        // Handle producer search pagination differently from album search
        if (searchMeta && searchMeta.isProducerSearch) {
          // For producer search: keep fetching batches until we have enough albums for the target page
          // Page 1 needs 10 albums, Page 2 needs 20 albums, Page 3 needs 30 albums, etc.
          const albumsNeededForPage = targetPage * RESULTS_PER_PAGE
          
          // Handle prefetch state before manual fetch
          // If navigating to page 2 and prefetch is in progress, wait for it (with reasonable timeout)
          let prefetchResultToUse = null // Store prefetch result to use directly (React state is async)
          
          if (targetPage === 2 && prefetching && !prefetchedResults) {
            console.log(`[Producer Search Pagination] Prefetch in progress for page 2 - waiting for completion...`)
            
            // Wait for prefetch to complete with timeout (120s - allows time for large producers)
            try {
              const prefetchResult = await Promise.race([
                prefetchPromiseRef.current,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Prefetch timeout')), 120000) // 120s timeout
                )
              ])
              
              // Check if prefetch was aborted (returns null)
              if (prefetchResult === null) {
                console.log(`[Producer Search Pagination] Prefetch was aborted - checking for partial results`)
                // Fall through to check prefetchedResults below
              } else if (prefetchResult && prefetchResult.results) {
                console.log(`[Producer Search Pagination] Prefetch completed, using results (${prefetchResult.results.length} albums)`)
                
                // Store result to use directly (React state updates are async)
                prefetchResultToUse = prefetchResult
                // Also set state for consistency
                setPrefetchedResults(prefetchResult)
                // Use prefetchResultToUse directly below instead of prefetchedResults
              }
            } catch (error) {
              // Check for AbortError or 'Aborted' message
              if (error.name === 'AbortError' || error.message === 'Aborted') {
                console.log(`[Producer Search Pagination] Prefetch was aborted - checking for partial results`)
              } else if (error.message === 'Prefetch timeout') {
                console.warn(`[Producer Search Pagination] Prefetch timed out after 120s - giving prefetch a moment to complete`)
                // Don't abort prefetch on timeout - let it continue in background
                // Give prefetch a small grace period (1s) to complete before falling back
                // This handles cases where prefetch completes just after timeout
                await new Promise(resolve => setTimeout(resolve, 1000))
                console.log(`[Producer Search Pagination] Grace period ended - checking if prefetch completed`)
                
                // Try to get prefetch result one more time (with very short timeout) in case it completed during grace period
                if (prefetchPromiseRef.current) {
                  try {
                    const quickResult = await Promise.race([
                      prefetchPromiseRef.current,
                      new Promise((_, reject) => setTimeout(() => reject(new Error('Still pending')), 100))
                    ])
                    if (quickResult && quickResult.results) {
                      console.log(`[Producer Search Pagination] Prefetch completed during grace period - using ${quickResult.results.length} results`)
                      prefetchResultToUse = quickResult
                      setPrefetchedResults(quickResult)
                    }
                  } catch (quickError) {
                    // Prefetch still not ready - that's ok, will check state or proceed with manual fetch
                    console.log(`[Producer Search Pagination] Prefetch still in progress after grace period`)
                  }
                }
                // Fall through - will check prefetchResultToUse or prefetchedResults below
              } else {
                console.warn(`[Producer Search Pagination] Prefetch error: ${error.message} - falling back to manual fetch`)
              }
              // Fall through - will check prefetchedResults below if available
            }
          }
          
          // Abort prefetch if navigating to page 3+ or going back (don't need prefetch data)
          if (targetPage !== 2 && prefetching) {
            console.log(`[Producer Search Pagination] Aborting prefetch - navigating to page ${targetPage} (prefetch only needed for page 2)`)
            if (prefetchAbortController.current) {
              prefetchAbortController.current.abort()
              setPrefetching(false)
              setPrefetchedResults(null)
              prefetchAbortController.current = null
              prefetchPromiseRef.current = null
            }
          }
          
          // Check if we have prefetched results for this page (either already completed or just completed above)
          // Use prefetchResultToUse if available (from async wait), otherwise check state
          let prefetchResults = prefetchResultToUse || prefetchedResults
          
          // Final check: if we're on page 2 and don't have results yet, check one more time
          // (prefetch may have completed during grace period or between checks)
          if (targetPage === 2 && !prefetchResults) {
            // If prefetching is false, prefetch finished - wait a moment for state to update
            if (!prefetching) {
              await new Promise(resolve => setTimeout(resolve, 200))
              prefetchResults = prefetchedResults
            } else {
              // Prefetch still running - try one more quick check (100ms) in case it completes
              if (prefetchPromiseRef.current) {
                try {
                  const finalCheck = await Promise.race([
                    prefetchPromiseRef.current,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Still pending')), 100))
                  ])
                  if (finalCheck && finalCheck.results) {
                    console.log(`[Producer Search Pagination] Prefetch completed on final check - using ${finalCheck.results.length} results`)
                    prefetchResults = finalCheck
                    setPrefetchedResults(finalCheck)
                  }
                } catch (e) {
                  // Prefetch still not ready - proceed with manual fetch
                }
              }
            }
          }
          
          if (targetPage === 2 && prefetchResults && prefetchResults.results && prefetchResults.results.length > 0) {
            console.log(`[Producer Search Pagination] Using prefetched results for page 2 (${prefetchResults.results.length} albums, finalOffset=${prefetchResults.finalOffset})`)
            const existingRgIds = new Set(searchResults.map(r => r.releaseGroupId))
            const uniquePrefetched = prefetchResults.results.filter(r => !existingRgIds.has(r.releaseGroupId))
            const combinedResults = [...searchResults, ...uniquePrefetched]
            
            // Sort and filter
            const sortedCombined = sortResults(combinedResults, sortOption)
            const filteredCombined = filterBootlegs(sortedCombined)
            
            setSearchResults(sortedCombined)
            setFetchedCount(sortedCombined.length)
            
            // Clear prefetched results
            setPrefetchedResults(null)
            
            // Update displayed results for page 2
            // Calculate slice based on actual number of albums on page 1
            // Page 1 might have fewer than RESULTS_PER_PAGE albums, so we need to account for that
            // Use displayedResults.length to get the actual number of albums on page 1
            const actualPage1Length = displayedResults.length || Math.min(RESULTS_PER_PAGE, filteredCombined.length)
            const pageStart = actualPage1Length // Start page 2 after page 1's actual albums
            const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, filteredCombined.length)
            
            if (pageStart < filteredCombined.length) {
              // We have results for page 2
              const pageResults = filteredCombined.slice(pageStart, pageEnd)
              console.log(`[Producer Search Pagination] ✅ Displaying page ${targetPage} from prefetch: ${pageResults.length} albums (indices ${pageStart}-${pageEnd - 1} of ${filteredCombined.length}, page1Length=${actualPage1Length})`)
              setDisplayedResults(pageResults)
              setResultsPage(targetPage)
            } else {
              // Fallback: calculate last valid page (shouldn't happen with prefetch, but handle it)
              const lastValidPage = Math.max(1, Math.ceil(filteredCombined.length / RESULTS_PER_PAGE))
              const lastPageStart = (lastValidPage - 1) * RESULTS_PER_PAGE
              const lastPageEnd = Math.min(lastPageStart + RESULTS_PER_PAGE, filteredCombined.length)
              const lastPageResults = filteredCombined.slice(lastPageStart, lastPageEnd)
              console.log(`[Producer Search Pagination] ⚠️ Fallback: displaying page ${lastValidPage} from prefetch: ${lastPageResults.length} albums (indices ${lastPageStart}-${lastPageEnd - 1} of ${filteredCombined.length})`)
              setDisplayedResults(lastPageResults)
              setResultsPage(lastValidPage)
            }
            
            setLoadingPage(false)
            
            // Update searchMeta with ACTUAL final offset from prefetch (not estimated)
            // This ensures accurate pagination tracking for subsequent pages
            setSearchMeta(prev => ({
              ...prev,
              producerOffset: prefetchResults.finalOffset // Use actual final offset from prefetch
            }))
            
            return // Early return - we used prefetched data
          }
          
          // If we're on page 2 and prefetch is still running but we don't have results, abort it before starting manual fetch
          // This prevents race conditions where prefetch and manual fetch process overlapping offsets
          if (targetPage === 2 && prefetching && !prefetchResults) {
            console.warn(`[Producer Search Pagination] Prefetch still running but no results - aborting prefetch before manual fetch`)
            if (prefetchAbortController.current) {
              prefetchAbortController.current.abort()
              setPrefetching(false)
              setPrefetchedResults(null)
              prefetchAbortController.current = null
              prefetchPromiseRef.current = null
            }
          }
          
          let currentResults = [...searchResults]
          let currentOffset = searchMeta.producerOffset || 0
          const totalReleases = searchMeta.totalCount || 0
          let lastHasMore = true // Track hasMore from last response
          
          console.log(`[Producer Search Pagination] Target page ${targetPage} needs ${albumsNeededForPage} albums, currently have ${currentResults.length}`)
          
          // Keep fetching batches until we have enough albums for the target page OR no more releases available
          while (currentResults.length < albumsNeededForPage && currentOffset < totalReleases) {
            const nextOffset = currentOffset + 10 // Process next batch of 10 releases
            console.log(`[Producer Search Pagination] Fetching batch starting at offset ${nextOffset}... (need ${albumsNeededForPage - currentResults.length} more albums)`)
            
            const searchResponse = await searchByProducer(
              searchMeta.producerName,
              searchMeta.producerMBID,
              nextOffset,
              null, // No progress callback for pagination (background fetch)
              searchMeta.releaseRelations || null, // Use cached release relations if available (performance optimization)
              searchMeta.seenRgIds || null // Pass seenRgIds Set for deduplication
            )
            
            const { results: newResults, totalCount, releasesProcessed, seenRgIds: updatedSeenRgIds, hasMore } = searchResponse
            
            // Track hasMore from this response
            lastHasMore = hasMore !== false // Only set to false if explicitly false
            
            // Update seenRgIds in searchMeta for next pagination call
            if (updatedSeenRgIds) {
              setSearchMeta(prev => ({
                ...prev,
                seenRgIds: updatedSeenRgIds
              }))
            }
            
            // Merge new results with existing (deduplicate by releaseGroupId)
            const existingIds = new Set(currentResults.map(r => r.releaseGroupId))
            const uniqueNewResults = newResults.filter(r => !existingIds.has(r.releaseGroupId))
            
            if (uniqueNewResults.length > 0) {
              currentResults = [...currentResults, ...uniqueNewResults]
              currentOffset = nextOffset // Always use the offset we just fetched from (not releasesProcessed which is batch count)
              console.log(`[Producer Search Pagination] Found ${uniqueNewResults.length} new albums (${currentResults.length} total now)`)
            } else {
              // No new albums in this batch
              currentOffset = nextOffset
              console.log(`[Producer Search Pagination] No new albums in this batch, continuing...`)
              
              // If hasMore is false, we've reached the end - break out of loop
              if (hasMore === false) {
                console.log(`[Producer Search Pagination] Reached end of available releases (hasMore=false)`)
                lastHasMore = false
                break
              }
            }
            
            // Update totalCount if it changed
            if (totalCount !== totalReleases) {
              setSearchMeta({
                ...searchMeta,
                totalCount: totalCount
              })
            }
            
            // Safety check: if we've processed all available releases, break
            if (currentOffset >= totalReleases) {
              console.log(`[Producer Search Pagination] Reached end of available releases (offset ${currentOffset} >= total ${totalReleases})`)
              break
            }
          }
          
          // Sort all results
          const sortedResults = sortResults(currentResults, sortOption)
          
          // Update state with all results
          setSearchResults(sortedResults)
          setFetchedCount(sortedResults.length)
          
          // Determine if we've reached the end (no more unique albums available)
          // We've reached the end if:
          // 1. We've processed all available releases, OR
          // 2. The last search response had hasMore === false
          const reachedEnd = currentOffset >= totalReleases || lastHasMore === false
          
          // Update ref immediately (bypasses React state timing issues)
          reachedEndRef.current = reachedEnd
          
          // Update searchMeta with final offset and hasMore status
          setSearchMeta({
            ...searchMeta,
            totalCount: totalReleases,
            producerOffset: currentOffset,
            hasMore: reachedEnd ? false : undefined // Store false if we reached end, otherwise don't override (keep existing or undefined)
          })
          
          // Apply bootleg filter
          const filteredResults = filterBootlegs(sortedResults)
          
          // Calculate if we have enough for the target page
          const pageStart = (targetPage - 1) * RESULTS_PER_PAGE
          const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, filteredResults.length)
          
          if (pageStart < filteredResults.length) {
            // We have enough results for the target page
            const pageResults = filteredResults.slice(pageStart, pageEnd)
            setDisplayedResults(pageResults)
            setResultsPage(targetPage)
            console.log(`[Producer Search Pagination] ✅ Displaying page ${targetPage}: ${pageResults.length} albums (indices ${pageStart}-${pageEnd - 1} of ${filteredResults.length})`)
          } else {
            // This shouldn't happen since we fetched until we had enough, but handle it anyway
            // This fallback occurs when we've reached the end but don't have enough for the target page
            const lastValidPage = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE))
            const lastPageStart = (lastValidPage - 1) * RESULTS_PER_PAGE
            const lastPageEnd = Math.min(lastPageStart + RESULTS_PER_PAGE, filteredResults.length)
            const lastPageResults = filteredResults.slice(lastPageStart, lastPageEnd)
            setDisplayedResults(lastPageResults)
            setResultsPage(lastValidPage)
            
            // Explicitly mark that we've reached the end (this is a fallback, so we're definitely at the end)
            reachedEndRef.current = true
            setSearchMeta(prev => ({
              ...prev,
              hasMore: false // Explicitly set to false in fallback case
            }))
            
            console.log(`[Producer Search Pagination] ⚠️ Fallback: displaying page ${lastValidPage} with ${lastPageResults.length} albums (reached end)`)
          }
        } else {
          // Album search pagination (existing logic)
          const albumName = searchAlbum.trim() || null
          const typeFilter = albumName ? null : releaseType
          const nextOffset = fetchedCount
          
          const searchResponse = await searchReleaseGroups(
            searchArtist.trim(), 
            albumName, 
            typeFilter, 
            nextOffset
          )
          
            const { results: newResults, seenRgIds: updatedSeenRgIds } = searchResponse
            
            // Update seenRgIds in searchMeta for next pagination call
            if (updatedSeenRgIds) {
              setSearchMeta(prev => ({
                ...prev,
                seenRgIds: updatedSeenRgIds
              }))
            }
          
          if (newResults.length > 0) {
            const mergedResults = [...searchResults, ...newResults]
            const sortedResults = sortResults(mergedResults, sortOption)
            
            // Update state with merged and sorted results
            setSearchResults(sortedResults)
            setFetchedCount(fetchedCount + newResults.length)
            
            // Apply bootleg filter and display the target page
            const filteredResults = filterBootlegs(sortedResults)
            const pageStart = (targetPage - 1) * RESULTS_PER_PAGE
            const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, filteredResults.length)
            const pageResults = filteredResults.slice(pageStart, pageEnd)
            
            setDisplayedResults(pageResults)
            setResultsPage(targetPage)
          }
        }
      } catch (err) {
        console.error('Error loading page:', err)
        setSearchError(err.message || 'Failed to load page. Please try again.')
      } finally {
        setLoadingPage(false)
      }
    } else {
      // Results already in memory, apply bootleg filter and display the page
      const filteredResults = filterBootlegs(searchResults)
      const pageStart = (targetPage - 1) * RESULTS_PER_PAGE
      
      console.log(`[Pagination] Displaying page from memory: targetPage=${targetPage}, pageStart=${pageStart}, filteredResults.length=${filteredResults.length}`)
      
      // Ensure we don't try to slice beyond available results
      if (pageStart >= filteredResults.length) {
        // Not enough results for this page - go back to last valid page
        const lastValidPage = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE))
        const lastPageStart = (lastValidPage - 1) * RESULTS_PER_PAGE
        const lastPageEnd = Math.min(lastPageStart + RESULTS_PER_PAGE, filteredResults.length)
        const lastPageResults = filteredResults.slice(lastPageStart, lastPageEnd)
        setDisplayedResults(lastPageResults)
        setResultsPage(lastValidPage)
        console.log(`[Pagination] Not enough results for page ${targetPage} (have ${filteredResults.length} albums), displaying page ${lastValidPage}`)
      } else {
        const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, filteredResults.length)
        const pageResults = filteredResults.slice(pageStart, pageEnd)
        console.log(`[Pagination] Slicing results: pageStart=${pageStart}, pageEnd=${pageEnd}, pageResults.length=${pageResults.length}`)
        setDisplayedResults(pageResults)
        setResultsPage(targetPage)
      }
    }
  }
  
  // Load full album details with progressive loading
  async function loadAlbum(releaseGroupId) {
    // Don't clear album if it already has basic info (from search results)
    const hasBasicInfo = album && album.title && album.artistName
    
    if (!hasBasicInfo) {
      setLoadingAlbum(true)
      setAlbumError(null)
      setAlbum(null)
    }
    
    // Don't clear searchResults - we need it for "Back to Results" button
    setEditionsExpanded(false) // Reset editions collapse state when loading new album
    setAlbumCreditsExpanded(true) // Reset album credits to expanded when loading new album
    setLoadingBasicInfo(false) // Basic info already shown from search results
    setLoadingTracklist(true)
    setLoadingCredits(false)
    
    try {
      // Check cache first
      const cachedAlbum = getCachedAlbum(releaseGroupId)
      
      if (cachedAlbum) {
        // Cache hit - use cached data
        console.log(`Loading album from cache: ${releaseGroupId}`)
        
        // Update album with cached data
        if (hasBasicInfo) {
          setAlbum(prev => ({
            ...prev,
            ...cachedAlbum
          }))
        } else {
          setAlbum(cachedAlbum)
        }
        
        setLoadingTracklist(false)
        setLoadingCredits(false)
        setLoadingAlbum(false)
        
        // Use cached cover art URL if available (already set via setAlbum above)
        // Otherwise fetch it in background
        if (cachedAlbum.coverArtUrl) {
          // Cached URL exists - use it immediately (already set via setAlbum above)
          // Browser HTTP cache will handle loading the image - no API call needed
          console.log(`Using cached cover art URL: ${cachedAlbum.coverArtUrl}`)
        } else if (cachedAlbum.albumId) {
          // No cached URL - fetch it in background
          console.log(`No cached cover art URL, fetching from API...`)
          // Try to get selectedReleaseId from cached album if available
          const selectedReleaseId = cachedAlbum.selectedReleaseId || 
                                    cachedAlbum.editions?.[0]?.id || 
                                    cachedAlbum.releases?.[0]?.id || 
                                    null
          fetchCoverArt(cachedAlbum.albumId, selectedReleaseId)
            .then(coverArtUrl => {
              if (coverArtUrl) {
                console.log(`Fetched cover art URL: ${coverArtUrl}`)
                setAlbum(prev => prev ? { ...prev, coverArtUrl } : null)
                // Update cache with the new cover art URL for future use
                setCachedAlbum(cachedAlbum.albumId, { ...cachedAlbum, coverArtUrl })
              } else {
                console.log(`No cover art URL found from API`)
              }
            })
            .catch(err => {
              console.warn('Failed to load cover art:', err)
            })
        }
        
        return // Exit early, we have cached data
      }
      
      // Cache miss - fetch from API
      console.log(`Cache miss, fetching album from API: ${releaseGroupId}`)
      
      // Fetch basic info (without waiting for cover art)
      const basicData = await fetchAlbumBasicInfo(releaseGroupId)
      
      // Update album with basic info (cover art will be null initially)
      if (hasBasicInfo) {
        // Keep existing album data, just update if needed
        setAlbum(prev => ({
          ...prev,
          ...basicData.basicInfo
        }))
      } else {
        setAlbum({
          ...basicData.basicInfo,
          albumType: 'album',
          editions: [],
          tracks: null,
          credits: null,
          recordingInfo: null,
          externalLinks: null,
          sources: null,
          dataNotes: null
        })
      }
      
      // Start cover art fetch in parallel (non-blocking)
      // It will update the album state when it arrives
      fetchCoverArt(releaseGroupId, basicData.selectedReleaseId)
        .then(coverArtUrl => {
          if (coverArtUrl) {
            setAlbum(prev => prev ? { ...prev, coverArtUrl } : null)
          }
        })
        .catch(err => {
          console.warn('Failed to load cover art:', err)
          // Don't show error - cover art is optional
        })
      
      setLoadingTracklist(true)
      
      // Fetch full album data (tracks, credits, etc.)
      // Pass basic data to avoid duplicate API calls
      const albumData = await fetchAlbumData(releaseGroupId, basicData)
      
      // Store selectedReleaseId in albumData for cache (so we can use it when loading from cache)
      albumData.selectedReleaseId = basicData.selectedReleaseId
      
      // Update with full data, preserving cover art if it was already loaded
      setAlbum(prev => {
        const updated = { ...albumData }
        // Preserve cover art if it was already loaded in parallel
        if (prev && prev.coverArtUrl && !updated.coverArtUrl) {
          updated.coverArtUrl = prev.coverArtUrl
        }
        return updated
      })
      setLoadingTracklist(false)
      setLoadingCredits(false)
      
      // Cache the fetched album data (now includes selectedReleaseId)
      setCachedAlbum(releaseGroupId, albumData)
    } catch (err) {
      console.error('Error fetching album data:', err)
      setAlbumError(err.message || 'Failed to load album data from MusicBrainz')
    } finally {
      setLoadingAlbum(false)
      setLoadingBasicInfo(false)
      setLoadingTracklist(false)
      setLoadingCredits(false)
    }
    
    // Push browser history entry if we came from search results
    // This allows back button to return to search results
    if (searchResults && searchResults.length > 0) {
      window.history.pushState(
        { fromSearchResults: true, albumId: releaseGroupId },
        '',
        window.location.href
      )
    }
  }
  
  // Return to search form
  function handleNewSearch() {
    // Check if we're on album page BEFORE clearing album state
    const wasOnAlbumPage = !!album
    
    setAlbum(null)
    setAlbumError(null)
    
    // If we were on album page and search results exist, return to results
    // Otherwise, clear everything for fresh search
    if (wasOnAlbumPage && searchResults && searchResults.length > 0) {
      // Return to search results - reset to first page
      setSearchError(null)
      setDisplayedResults(searchResults.slice(0, RESULTS_PER_PAGE))
      setResultsPage(1)
    } else {
      // Start completely fresh - clear everything
      setSearchResults(null)
      setSearchMeta(null)
      setSearchError(null)
      setSearchArtist('')
      setSearchAlbum('')
      setReleaseType('Album') // Reset to default
      setDisplayedResults([])
      setResultsPage(1)
    }
    setSortOption('newest') // Reset to default sort
    setExpandedTracks(new Set())
    setEditionsExpanded(false)
    setAlbumCreditsExpanded(true) // Reset album credits to expanded
    setGalleryExpanded(false) // Reset gallery to collapsed
    setSelectedImage(null) // Clear selected image
    setWikipediaContent(null) // Clear Wikipedia content
    setLoadingWikipedia(false) // Reset Wikipedia loading state
  }
  
  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event) => {
      // Handle back button navigation based on current state
      const historyState = event.state
      
      // Case 1: Lightbox is open → close lightbox and stay on album details page
      if (selectedImage !== null) {
        setSelectedImage(null)
        // Don't push a new state - we're already on the album details page
        // The history stack is: search results → album details → lightbox open
        // After closing lightbox, we're back to album details page
        return
      }
      
      // Case 2: Coming back from help section → close help
      if (showHelp) {
        setShowHelp(false)
        return
      }
      
      // Case 3: On album page with search results → return to search results
      if (album && searchResults && searchResults.length > 0) {
        setAlbum(null)
        setAlbumError(null)
        setDisplayedResults(searchResults.slice(0, RESULTS_PER_PAGE))
        setResultsPage(1)
        return
      }
      
      // Case 4: Returning to initial search page (check history state)
      // This handles going back from search results to the initial search page
      if (historyState && (historyState.page === 'search' || historyState.initialized === true)) {
        // Restore search type from history state if available
        if (historyState.type) {
          setSearchType(historyState.type)
        }
        // Clear search results and return to main search form
        setSearchResults(null)
        setSearchMeta(null)
        setDisplayedResults([])
        setResultsPage(1)
        setFetchedCount(0)
        setSearchError(null)
        setMultipleProducerMatches(null)
        // Keep search form values so user can see what they searched for
        // (Don't clear searchArtist, searchAlbum, releaseType, searchProducer)
        console.log('[History] Returning to initial search page', historyState.type ? `(type: ${historyState.type})` : '')
        return
      }
      
      // Case 5: On search results page (no album) → return to main search page
      // Fallback: Check React state if history state doesn't match
      if (!album && searchResults && searchResults.length > 0) {
        // Restore search type from searchMeta if available (producer vs album search)
        if (searchMeta && searchMeta.isProducerSearch) {
          setSearchType('producer')
        } else {
          setSearchType('album')
        }
        // Clear search results and return to main search form
        setSearchResults(null)
        setSearchMeta(null)
        setDisplayedResults([])
        setResultsPage(1)
        setFetchedCount(0)
        setSearchError(null)
        setMultipleProducerMatches(null)
        // Keep search form values so user can see what they searched for
        // (Don't clear searchArtist, searchAlbum, releaseType, searchProducer)
        console.log('[History] Returning to search page (fallback)')
        return
      }
      
      // Case 6: No special handling needed, let browser handle normally
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [searchResults, album, showHelp, selectedImage]) // Re-run when searchResults, album, showHelp, or selectedImage changes
  
  // Fetch gallery images in background after album loads
  useEffect(() => {
    if (album && album.albumId) {
      console.log('[Gallery Debug] useEffect triggered - album.albumId:', album.albumId)
      
      // Reset gallery state when new album loads
      setGalleryImages([])
      setGalleryExpanded(false)
      setSelectedImage(null)
      setGalleryError(null) // Clear previous errors
      
      // Create AbortController for this request
      const abortController = new AbortController()
      const TIMEOUT_MS = 10000 // 10 second timeout
      
      // Set timeout to abort request
      const timeoutId = setTimeout(() => {
        console.log('[Gallery Debug] Timeout reached - aborting request')
        abortController.abort()
      }, TIMEOUT_MS)
      
      // Fetch gallery images in background with timeout
      console.log('[Gallery Debug] Setting loadingGallery to true, clearing error')
      setLoadingGallery(true)
      setGalleryError(null)
      
      console.log('[Gallery Debug] Calling fetchAllAlbumArt with albumId:', album.albumId)
      fetchAllAlbumArt(album.albumId, abortController.signal)
        .then(images => {
          console.log('[Gallery Debug] fetchAllAlbumArt SUCCESS - images received:', images.length)
          console.log('[Gallery Debug] Aborted?', abortController.signal.aborted)
          
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            console.log('[Gallery Debug] Setting galleryImages to:', images.length, 'images')
            setGalleryImages(images)
            setGalleryError(null)
            console.log('[Gallery Debug] State after success - images:', images.length, 'error:', null)
          } else {
            console.log('[Gallery Debug] Request was aborted - not updating state')
          }
        })
        .catch(err => {
          console.log('[Gallery Debug] fetchAllAlbumArt ERROR caught:', err)
          console.log('[Gallery Debug] Error name:', err.name)
          console.log('[Gallery Debug] Error message:', err.message)
          console.log('[Gallery Debug] Aborted?', abortController.signal.aborted)
          
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            console.warn('Error loading gallery images:', err)
            const errorMessage = err.message || 'Failed to load album art gallery'
            const finalError = errorMessage.includes('timeout') 
              ? 'Gallery loading timed out. Please try again.' 
              : errorMessage
            console.log('[Gallery Debug] Setting galleryError to:', finalError)
            setGalleryError(finalError)
            console.log('[Gallery Debug] State after error - images: 0, error:', finalError)
          } else {
            console.log('[Gallery Debug] Request was aborted - not updating error state')
          }
        })
        .finally(() => {
          console.log('[Gallery Debug] finally() called - Aborted?', abortController.signal.aborted)
          
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            console.log('[Gallery Debug] Setting loadingGallery to false')
            setLoadingGallery(false)
          } else {
            console.log('[Gallery Debug] Request was aborted - not updating loading state')
          }
        })
      
      // Cleanup: abort request if component unmounts or album changes
      return () => {
        clearTimeout(timeoutId)
        abortController.abort()
      }
    } else {
      // Clear gallery when no album is loaded
      setGalleryImages([])
      setGalleryExpanded(false)
      setSelectedImage(null)
      setLoadingGallery(false)
      setGalleryError(null)
    }
  }, [album])
  
  // Fetch Wikipedia content in background after album loads
  useEffect(() => {
    if (album && album.albumId) {
      // Reset Wikipedia state when new album loads
      setWikipediaContent(null)
      setWikipediaError(null) // Clear previous errors
      
      // Create AbortController for this request
      const abortController = new AbortController()
      const TIMEOUT_MS = 10000 // 10 second timeout
      
      // Set timeout to abort request
      const timeoutId = setTimeout(() => {
        abortController.abort()
      }, TIMEOUT_MS)
      
      // Fetch Wikipedia content in background with timeout
      setLoadingWikipedia(true)
      setWikipediaError(null)
      
      fetchWikipediaContentFromMusicBrainz(album.albumId, abortController.signal)
        .then(content => {
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            if (content) {
              setWikipediaContent(content)
              setWikipediaError(null)
            } else {
              // No content available (not an error, just no data)
              setWikipediaError(null)
            }
          }
        })
        .catch(err => {
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            console.warn('Error loading Wikipedia content:', err)
            const errorMessage = err.message || 'Failed to load Wikipedia content'
            setWikipediaError(errorMessage.includes('timeout') 
              ? 'Wikipedia loading timed out. Please try again.' 
              : errorMessage)
          }
        })
        .finally(() => {
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            setLoadingWikipedia(false)
          }
        })
      
      // Cleanup: abort request if component unmounts or album changes
      return () => {
        clearTimeout(timeoutId)
        abortController.abort()
      }
    } else {
      // Clear Wikipedia when no album is loaded
      setWikipediaContent(null)
      setLoadingWikipedia(false)
      setWikipediaError(null)
    }
  }, [album])
  
  // Toggle track expanded state
  function toggleTrackExpanded(trackId) {
    setExpandedTracks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(trackId)) {
        newSet.delete(trackId)
      } else {
        newSet.add(trackId)
      }
      return newSet
    })
  }
  
  // Toggle album credits expanded state
  function toggleAlbumCreditsExpanded() {
    setAlbumCreditsExpanded(prev => !prev)
  }
  
  // Retry gallery fetch
  function retryGallery() {
    console.log('[Gallery Debug] retryGallery called')
    if (album && album.albumId) {
      console.log('[Gallery Debug] Retry - Clearing error, setting loading to true')
      setGalleryError(null)
      setLoadingGallery(true)
      const abortController = new AbortController()
      
      console.log('[Gallery Debug] Retry - Calling fetchAllAlbumArt with albumId:', album.albumId)
      fetchAllAlbumArt(album.albumId, abortController.signal)
        .then(images => {
          console.log('[Gallery Debug] Retry SUCCESS - images received:', images.length)
          if (!abortController.signal.aborted) {
            console.log('[Gallery Debug] Retry - Setting galleryImages to:', images.length)
            setGalleryImages(images)
            setGalleryError(null)
            console.log('[Gallery Debug] Retry - State after success: images:', images.length, 'error:', null)
          } else {
            console.log('[Gallery Debug] Retry - Request was aborted')
          }
        })
        .catch(err => {
          console.log('[Gallery Debug] Retry ERROR:', err)
          console.log('[Gallery Debug] Retry ERROR name:', err.name)
          console.log('[Gallery Debug] Retry ERROR message:', err.message)
          console.log('[Gallery Debug] Retry ERROR stack:', err.stack)
          if (!abortController.signal.aborted) {
            console.warn('Error loading gallery images:', err)
            // Show more detailed error message for debugging
            const errorMsg = err.message || 'Failed to load album art gallery'
            const detailedError = `${errorMsg} (${err.name || 'Unknown error'})`
            console.log('[Gallery Debug] Retry - Setting galleryError to:', detailedError)
            setGalleryError(detailedError)
          } else {
            console.log('[Gallery Debug] Retry - Request was aborted, not setting error')
          }
        })
        .finally(() => {
          console.log('[Gallery Debug] Retry finally() - Setting loadingGallery to false')
          if (!abortController.signal.aborted) {
            setLoadingGallery(false)
          }
        })
    } else {
      console.log('[Gallery Debug] Retry - No album or albumId available')
    }
  }
  
  // Retry Wikipedia fetch
  function retryWikipedia() {
    if (album && album.albumId) {
      setWikipediaError(null)
      setLoadingWikipedia(true)
      const abortController = new AbortController()
      
      fetchWikipediaContentFromMusicBrainz(album.albumId, abortController.signal)
        .then(content => {
          if (!abortController.signal.aborted) {
            if (content) {
              setWikipediaContent(content)
              setWikipediaError(null)
            } else {
              setWikipediaError(null)
            }
          }
        })
        .catch(err => {
          if (!abortController.signal.aborted) {
            console.warn('Error loading Wikipedia content:', err)
            setWikipediaError(err.message || 'Failed to load Wikipedia content')
          }
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setLoadingWikipedia(false)
          }
        })
    }
  }
  
  // Function to open help section
  function handleOpenHelp() {
    openHelp()
    // Push browser history entry so back button works
    window.history.pushState(
      { fromHelp: true },
      '',
      window.location.href
    )
  }
  
  // Function to close help section
  function handleCloseHelp() {
    closeHelp()
  }
  
  // Set mobile-responsive placeholder for album name input
  useEffect(() => {
    const updatePlaceholder = () => {
      if (window.innerWidth <= 480) {
        setAlbumPlaceholder('e.g., Aladdin Sane (optional)')
      } else {
        setAlbumPlaceholder('e.g., Aladdin Sane (leave blank to see all albums)')
      }
    }
    
    updatePlaceholder()
    window.addEventListener('resize', updatePlaceholder)
    return () => window.removeEventListener('resize', updatePlaceholder)
  }, [])
  
  // Prevent body scroll when lightbox is open (important for mobile)
  useEffect(() => {
    if (selectedImage) {
      // Save current scroll position and prevent scrolling
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Restore scroll position when lightbox closes
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [selectedImage])
  
  // Show help section (replaces all other views)
  if (showHelp) {
    return <Help onClose={handleCloseHelp} />
  }
  
  // Show search form (initial state or after "New Search")
  if (!album && !searchResults && !loadingAlbum) {
    return (
      <div className="album-page">
        <div className="album-container">
          <div className="search-description">
            <p className="search-description-main">
              {searchType === 'producer' ? (
                <>
                  <span className="search-description-short">Producer searches may take a few minutes and may not include every album.</span>
                  <span className="search-description-long"> Results are based on documented production credits from public music archives.</span>
                </>
              ) : (
                <>
                  <span className="search-description-short">Search by artist to explore album focused liner note information</span>
                  <span className="search-description-long"> — personnel, recording details, album art, and historical facts all sourced from documented music archives.</span>
                </>
              )}
            </p>
          </div>
          <section className="search-section">
            {/* Tab Navigation */}
            <div className="search-tabs">
              <button
                type="button"
                className={`search-tab ${searchType === 'album' ? 'active' : ''}`}
                onClick={() => handleTabChange('album')}
                disabled={searching}
              >
                Search Albums
              </button>
              <button
                type="button"
                className={`search-tab ${searchType === 'producer' ? 'active' : ''}`}
                onClick={() => handleTabChange('producer')}
                disabled={searching}
              >
                Search by Producer
              </button>
            </div>
            
            {/* Album Search Form */}
            {searchType === 'album' && (
              <form onSubmit={handleSearch} className="search-form">
                <h1 className="search-title">{isMobile ? 'Search Albums' : 'Search for an Album'}</h1>
              <div className="search-field">
                <label htmlFor="artist-name">Artist Name</label>
                <input
                  id="artist-name"
                  type="text"
                  value={searchArtist}
                  onChange={(e) => setSearchArtist(e.target.value)}
                  placeholder="e.g., David Bowie"
                  disabled={searching}
                  required
                />
              </div>
              <div className="search-field">
                <label htmlFor="album-name">Album Name <span className="optional-label">(optional)</span></label>
                <input
                  id="album-name"
                  type="text"
                  value={searchAlbum}
                  onChange={(e) => setSearchAlbum(e.target.value)}
                  placeholder={albumPlaceholder}
                  disabled={searching}
                />
              </div>
              {!searchAlbum.trim() && (
                <div className="search-field">
                  <label htmlFor="release-type">Release Type</label>
                  {isMobile ? (
                    // Mobile: Use dropdown
                    <select
                      id="release-type"
                      value={releaseType}
                      onChange={(e) => setReleaseType(e.target.value)}
                      disabled={searching}
                      className="release-type-select"
                    >
                      {RELEASE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Desktop: Use button grid
                    <div className="release-type-button-group">
                      {RELEASE_TYPES.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          className={`release-type-button ${releaseType === type.value ? 'active' : ''}`}
                          onClick={() => setReleaseType(type.value)}
                          disabled={searching}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button 
                type="submit" 
                className="search-button"
                disabled={searching}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
                {searchError && (
                  <div className="search-error">{searchError}</div>
                )}
              </form>
            )}
            
            {/* Producer Search Form */}
            {searchType === 'producer' && (
              <form onSubmit={handleSearch} className="search-form">
                <h1 className="search-title">{isMobile ? 'Search by Producer' : 'Search Albums by Producer'}</h1>
                
                {/* Multiple Producer Matches Selection */}
                {multipleProducerMatches && multipleProducerMatches.length > 0 && (
                  <div className="search-field">
                    <label>Multiple producers found. Please select one:</label>
                    <div className="producer-matches-list">
                      {multipleProducerMatches.map((producer, index) => (
                        <button
                          key={producer.mbid}
                          type="button"
                          className="producer-match-button"
                          onClick={() => handleProducerSelection(producer.mbid)}
                          disabled={searching}
                        >
                          {producer.name}
                          {producer.disambiguation && ` (${producer.disambiguation})`}
                          {producer.type && ` - ${producer.type}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="search-field">
                  <label htmlFor="producer-name">Producer Name</label>
                  <input
                    id="producer-name"
                    type="text"
                    value={searchProducer}
                    onChange={(e) => setSearchProducer(e.target.value)}
                    placeholder="e.g., Quincy Jones"
                    disabled={searching || !!multipleProducerMatches}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={searching || !!multipleProducerMatches}
                >
                  {searching && searchType === 'producer' && searchProgress.current > 0
                    ? `Searching... (${searchProgress.current} of ${searchProgress.total})`
                    : searching
                    ? 'Searching...'
                    : 'Search'}
                </button>
                
                {searchError && (
                  <div className="search-error">{searchError}</div>
                )}
              </form>
            )}
          </section>
          <p className="search-description-note">ⓘ Album information only — no audio playback or streaming</p>
          {!isMobile && (
            <div className="help-link-container">
              <button className="help-link" onClick={handleOpenHelp}>
                Help
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Show loading state (searching or loading album)
  if (searching || loadingAlbum) {
    return (
      <div className="album-page">
        <div className="loading">
          {searching 
            ? `Searching for ${searchMeta?.releaseType ? getReleaseTypePlural(searchMeta.releaseType) : 'albums'}...`
            : `Loading ${getLoadingReleaseType()} from MusicBrainz...`
          }
        </div>
      </div>
    )
  }
  
  // Show search results list (multiple results)
  // Only show if no album is currently loaded (album takes priority)
  if (searchResults && searchResults.length > 1 && !album) {
    return (
      <div className="album-page">
        <div className="album-container">
          <section className="search-results-section">
            <div className="search-results-header">
              <h2>{getResultsHeading(searchMeta?.releaseType || 'Album', searchMeta?.isProducerSearch ? searchMeta?.producerName : null)}</h2>
              <button 
                className="new-search-button"
                onClick={handleNewSearch}
              >
                New Search
              </button>
            </div>
            {searchMeta && (
              <div className="results-meta">
                <div className="results-meta-row">
                  <p className="results-count">
                    {searchMeta.isProducerSearch ? (
                      // For producer search: show "Page X (Y albums)" format (stable, no changing totals)
                      <>Page {resultsPage} ({displayedResults.length} {displayedResults.length === 1 ? getReleaseTypeSingular(searchMeta.releaseType || 'Album') : getReleaseTypePlural(searchMeta.releaseType || 'Album')})</>
                    ) : (
                      // For album search: show "Showing X of Y" format (total is known upfront)
                      <>
                        Showing {displayedResults.length} of {getFilteredCount()} {getReleaseTypePlural(searchMeta.releaseType || 'Album')}
                        {hideBootlegs && searchMeta.totalCount > getFilteredCount() && (
                          <span className="filter-note">
                            {' '}({searchMeta.totalCount - getFilteredCount()} bootlegs hidden)
                          </span>
                        )}
                      </>
                    )}
                    {searchMeta.isArtistOnly && (
                      <span className="refine-suggestion">
                        {' '}• Enter an album name to narrow your search
                      </span>
                    )}
                  </p>
                  <div className="sort-control">
                    <label htmlFor="sort-select">Sort by:</label>
                    <select
                      id="sort-select"
                      value={sortOption}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="sort-select"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title-az">Title A-Z</option>
                      <option value="title-za">Title Z-A</option>
                    </select>
                  </div>
                </div>
                <div className="filter-control">
                  <label className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={hideBootlegs}
                      onChange={handleBootlegFilterChange}
                      className="filter-checkbox"
                    />
                    <span>Hide bootlegs</span>
                  </label>
                </div>
              </div>
            )}
            <ul className="results-list">
              {displayedResults.map((result) => (
                <li key={result.releaseGroupId} className="result-item">
                  <button
                    className="result-button"
                    onClick={() => loadAlbum(result.releaseGroupId)}
                  >
                    <span className="result-title">{result.title}</span>
                    <span className="result-artist">{result.artistName}</span>
                    {result.releaseYear && (
                      <span className="result-year">{result.releaseYear}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {searchResults && searchMeta && searchResults.length > 0 && displayedResults.length > 0 && (
              <div className="pagination-controls">
                <button
                  className="pagination-button pagination-prev"
                  onClick={() => {
                    // Previous button is always enabled (on page 1 it returns to search form, on page 2+ it goes to previous page)
                    const buttonDisabled = loadingPage
                    console.log('[Previous Button] Clicked!', {
                      resultsPage,
                      searchResultsLength: searchResults?.length,
                      displayedResultsLength: displayedResults.length,
                      buttonDisabled,
                      loadingPage,
                      getTotalPages: getTotalPages(),
                      action: resultsPage === 1 ? 'return to search form' : 'go to previous page'
                    })
                    if (!buttonDisabled) {
                      handlePageChange('prev')
                    } else {
                      console.log('[Previous Button] Button is disabled (loading), click ignored')
                    }
                  }}
                  disabled={loadingPage}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  {(() => {
                    const totalPages = getTotalPages()
                    const isProducerSearch = searchMeta?.isProducerSearch
                    const releasesProcessed = searchMeta?.producerOffset || 0
                    const totalReleases = searchMeta?.totalCount || 0
                    const hasMoreReleases = releasesProcessed < totalReleases
                    
                    // Option 4: Progressive pagination messaging
                    // If we're on page 1 with only 1 page, but more releases are available for producer search, show "Loading more..."
                    if (isProducerSearch && resultsPage === 1 && totalPages === 1 && hasMoreReleases) {
                      return <>Page 1 • Loading more...</>
                    }
                    
                    // Normal pagination display
                    return <>Page {resultsPage} of {totalPages}</>
                  })()}
                </span>
                <button
                  className="pagination-button pagination-next"
                  onClick={() => {
                    console.log('[Next Button] Clicked! canGoNext() =', canGoNext())
                    if (canGoNext()) {
                      handlePageChange('next')
                    } else {
                      console.log('[Next Button] Button is disabled, click ignored')
                    }
                  }}
                  disabled={!canGoNext()}
                >
                  {loadingPage ? 'Loading...' : 'Next'}
                </button>
              </div>
            )}
          </section>
          {!isMobile && (
            <div className="help-link-container">
              <button className="help-link" onClick={handleOpenHelp}>
                Help
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Show album error
  if (albumError) {
    return (
      <div className="album-page">
        <div className="album-container">
          <div className="error">
            <h2>Error Loading Album</h2>
            <p>{albumError}</p>
            <p>Please check your internet connection and try again.</p>
            <button 
              className="new-search-button"
              onClick={handleNewSearch}
            >
              {searchResults && searchResults.length > 0 ? 'Back to Results' : 'New Search'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Show album (full details)
  if (!album) {
    return (
      <div className="album-page">
        <div className="album-container">
          <div className="error">No album data available</div>
          <button 
            className="new-search-button"
            onClick={handleNewSearch}
          >
            {searchResults && searchResults.length > 0 ? 'Back to Results' : 'New Search'}
          </button>
        </div>
      </div>
    )
  }
  
  const albumCredits = album.credits?.albumCredits || []
  const trackCredits = album.credits?.trackCredits || {}
  
  // Debug: Log album credits to console
  console.log('Album credits data:', albumCredits)
  console.log('Album credits object:', album.credits)
  
  return (
    <div className="album-page">
      <div className="album-container">
        <button 
          className="new-search-button"
          onClick={handleNewSearch}
          style={{ marginBottom: '2rem' }}
        >
          {searchResults && searchResults.length > 0 ? 'Back to Results' : 'New Search'}
        </button>
        
        {/* Wikipedia Content */}
        {(wikipediaContent || loadingWikipedia || wikipediaError) && (
          <section className="wikipedia-section">
            <h2 className="wikipedia-heading">Wikipedia</h2>
            {loadingWikipedia ? (
              <div className="wikipedia-loading">Loading Wikipedia content...</div>
            ) : wikipediaError ? (
              <div className="wikipedia-error">
                <span className="error-indicator">⚠️</span>
                <span className="error-message">{wikipediaError}</span>
                <button 
                  className="error-retry-button"
                  onClick={retryWikipedia}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : wikipediaContent && wikipediaContent.extract ? (
              <div className="wikipedia-content">
                <p className="wikipedia-text">{wikipediaContent.extract}</p>
                {wikipediaContent.url && (
                  <a 
                    href={wikipediaContent.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="wikipedia-link"
                  >
                    Continue reading at Wikipedia...
                  </a>
                )}
              </div>
            ) : null}
          </section>
        )}
        
        {/* Album Identity */}
        <section className="album-identity">
          {album.coverArtUrl && (
            <div className="cover-art" style={{ backgroundColor: 'var(--card)' }}>
              <img 
                src={album.coverArtUrl} 
                alt={`${album.title} cover`}
                loading="eager"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  console.error('Failed to load cover art:', album.coverArtUrl)
                  e.target.style.display = 'none'
                }}
              />
            </div>
          )}
          <div className="album-header">
            <h1 className="album-title">{album.title}</h1>
            <p className="album-artist">{album.artistName}</p>
            {album.releaseYear && (
              <p className="album-year">{album.releaseYear}</p>
            )}
          </div>
        </section>

        {/* Album Art Gallery - Show if we have images, are loading, or have error */}
        {(() => {
          const shouldRender = galleryImages.length > 0 || loadingGallery || galleryError
          console.log('[Gallery Debug] Conditional render check:')
          console.log('[Gallery Debug]   galleryImages.length:', galleryImages.length)
          console.log('[Gallery Debug]   loadingGallery:', loadingGallery)
          console.log('[Gallery Debug]   galleryError:', galleryError)
          console.log('[Gallery Debug]   shouldRender:', shouldRender)
          return shouldRender
        })() && (
          <section className="album-art-gallery-section">
            <div className="gallery-header">
              <h2>Album Art Gallery</h2>
              {(() => {
                const shouldShowButton = !galleryError
                console.log('[Gallery Debug] Button visibility check:')
                console.log('[Gallery Debug]   galleryError:', galleryError)
                console.log('[Gallery Debug]   shouldShowButton:', shouldShowButton)
                return shouldShowButton
              })() && (
                <button
                  className="gallery-toggle-button"
                  onClick={() => {
                    console.log('[Gallery Debug] Button clicked - galleryExpanded was:', galleryExpanded)
                    setGalleryExpanded(!galleryExpanded)
                    console.log('[Gallery Debug] Button clicked - galleryExpanded now:', !galleryExpanded)
                  }}
                  type="button"
                >
                  <span>
                    {galleryExpanded 
                      ? 'Hide gallery' 
                      : loadingGallery 
                        ? 'Loading album art...' 
                        : `View all album art (${galleryImages.length} image${galleryImages.length !== 1 ? 's' : ''})`
                    }
                  </span>
                <svg
                  className={`gallery-chevron ${galleryExpanded ? 'expanded' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              )}
            </div>
            
            {galleryError ? (
              <div className="gallery-error">
                <span className="error-indicator">⚠️</span>
                <span className="error-message">{galleryError}</span>
                {/* Debug info on mobile - show error details */}
                {isMobile && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.8rem', 
                    color: 'var(--muted2)',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    Debug: Check console for [Gallery Debug] logs
                  </div>
                )}
                <button 
                  className="error-retry-button"
                  onClick={retryGallery}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : (() => {
              console.log('[Gallery Debug] Gallery content render check:')
              console.log('[Gallery Debug]   galleryError:', galleryError)
              console.log('[Gallery Debug]   galleryExpanded:', galleryExpanded)
              console.log('[Gallery Debug]   shouldShowContent:', !galleryError && galleryExpanded)
              return !galleryError && galleryExpanded
            })() && (
              <div className="gallery-content">
                {loadingGallery ? (
                  <div className="gallery-loading">Loading album art...</div>
                ) : galleryImages.length === 0 ? (
                  <div className="gallery-empty">No additional album art available.</div>
                ) : (
                  <div className="gallery-grid">
                    {(() => {
                      console.log('[Gallery Debug] Rendering gallery grid with', galleryImages.length, 'images')
                      return galleryImages.map((img, index) => {
                      // Use 500px thumbnail if available, fallback to 250px, then small, then full image
                      const thumbnailUrl = img.thumbnails?.['500'] || 
                                         img.thumbnails?.['250'] || 
                                         img.thumbnails?.small || 
                                         img.image
                      
                      const imageTypes = img.types && img.types.length > 0 
                        ? img.types.join(', ') 
                        : (img.front ? 'Front' : img.back ? 'Back' : 'Image')
                      
                      return (
                        <div 
                          key={img.id || index} 
                          className="gallery-item"
                          onClick={() => {
                            setSelectedImage(img)
                            // Push history state when lightbox opens so back button closes it first
                            window.history.pushState(
                              { lightboxOpen: true, albumId: album?.albumId },
                              '',
                              window.location.href
                            )
                          }}
                        >
                          <img
                            src={thumbnailUrl}
                            alt={`${imageTypes} - ${album.title}`}
                            loading="lazy"
                            onError={(e) => {
                              console.error('Failed to load gallery thumbnail:', thumbnailUrl)
                              e.target.style.display = 'none'
                            }}
                          />
                          <div className="gallery-item-overlay">
                            <span className="gallery-item-type">{imageTypes}</span>
                          </div>
                        </div>
                      )
                    })
                    })()}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Image Lightbox Modal */}
        {selectedImage && (
          <div 
            className="image-lightbox"
            onClick={() => setSelectedImage(null)}
          >
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="lightbox-close"
                onClick={() => setSelectedImage(null)}
                aria-label="Close"
              >
                ×
              </button>
              <img
                src={selectedImage.image}
                alt={selectedImage.types?.join(', ') || 'Album art'}
                onError={(e) => {
                  console.error('Failed to load full-size image:', selectedImage.image)
                  e.target.style.display = 'none'
                }}
              />
              {selectedImage.types && selectedImage.types.length > 0 && (
                <div className="lightbox-caption">
                  {selectedImage.types.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editions */}
        {album.editions && album.editions.length > 0 && (
          <section className="editions-section">
            <h2>Editions</h2>
            <div className="editions-list">
              {(editionsExpanded ? album.editions : album.editions.slice(0, 1)).map((edition) => (
                <div key={edition.editionId} className="edition-info">
                  <div className="edition-details">
                    {edition.date && (
                      <span className="edition-date">{edition.date.substring(0, 4)}</span>
                    )}
                    {edition.country && (
                      <span className="edition-country">{edition.country}</span>
                    )}
                    {edition.formatSummary && (
                      <span className="edition-format">{edition.formatSummary}</span>
                    )}
                    {edition.status && (
                      <span className="edition-status">{edition.status}</span>
                    )}
                    {edition.label && (
                      <span className="edition-label">{edition.label}</span>
                    )}
                    {edition.catalogNumber && (
                      <span className="edition-catalog">{edition.catalogNumber}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {album.editions.length > 1 && (
              <button
                className="editions-toggle"
                onClick={() => setEditionsExpanded(!editionsExpanded)}
                aria-expanded={editionsExpanded}
              >
                <span className="editions-toggle-text">
                  {editionsExpanded 
                    ? 'Show less' 
                    : `Show all ${album.editions.length} editions`}
                </span>
                <svg
                  className={`editions-toggle-icon ${editionsExpanded ? 'expanded' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </section>
        )}

        {/* Tracklist */}
        {loadingTracklist && (
          <section className="tracklist-section">
            <h2>Tracklist</h2>
            <div className="loading">Loading tracklist...</div>
          </section>
        )}
        {!loadingTracklist && album.tracks && album.tracks.length > 0 && (
          <section className="tracklist-section">
            <h2>Tracklist</h2>
            <ol className="tracklist">
              {album.tracks.map((track) => (
                <li key={track.trackId} className="track-item">
                  <span className="track-position">{track.position}</span>
                  <span className="track-title">{track.title}</span>
                  {track.durationMs && (
                    <span className="track-duration">{formatDuration(track.durationMs)}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Credits */}
        <section className="credits-section">
          <h2>Credits</h2>
          
          {loadingCredits && (
            <div className="loading">Loading credits...</div>
          )}
          
          {!loadingCredits && (
            <>
          {/* Album-level credits */}
          {albumCredits.length > 0 && (
            <div className="credits-group">
              <button
                className="track-credit-title-button"
                onClick={toggleAlbumCreditsExpanded}
                aria-expanded={albumCreditsExpanded}
              >
                <span className="track-credit-title-text">Album</span>
                <svg
                  className={`track-credit-chevron ${albumCreditsExpanded ? 'expanded' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              
              {albumCreditsExpanded && (
                <ul className="credits-list">
                  {albumCredits.map((credit, idx) => (
                    <li key={idx} className="credit-item">
                      <span className="credit-name">{credit.personName}</span>
                      <span className="credit-role">{credit.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Track-level credits */}
          {album.tracks && album.tracks.length > 0 && album.tracks.some(t => t && t.trackId && trackCredits[t.trackId] && trackCredits[t.trackId].length > 0) && (
            <div className="credits-group">
              <h3>Tracks</h3>
              {album.tracks.map((track) => {
                if (!track || !track.trackId) return null
                const credits = trackCredits[track.trackId]
                if (!credits || credits.length === 0) return null
                
                // Group credits by role type
                const performers = credits.filter(c => 
                  c.role === 'Performer' || 
                  c.role.toLowerCase().includes('vocals') ||
                  c.role.toLowerCase().includes('guitar') ||
                  c.role.toLowerCase().includes('bass') ||
                  c.role.toLowerCase().includes('drums') ||
                  c.role.toLowerCase().includes('piano') ||
                  c.role.toLowerCase().includes('keyboard')
                )
                const production = credits.filter(c => 
                  c.role.toLowerCase().includes('producer') ||
                  c.role.toLowerCase().includes('engineer') ||
                  c.role.toLowerCase().includes('mix') ||
                  c.role.toLowerCase().includes('mastering')
                )
                const other = credits.filter(c => 
                  !performers.includes(c) && 
                  !production.includes(c)
                )

                const isExpanded = expandedTracks.has(track.trackId)
                
                return (
                  <div key={track.trackId} className="track-credits">
                    <button
                      className="track-credit-title-button"
                      onClick={() => toggleTrackExpanded(track.trackId)}
                      aria-expanded={isExpanded}
                    >
                      <span className="track-credit-title-text">{track.title}</span>
                      <svg
                        className={`track-credit-chevron ${isExpanded ? 'expanded' : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="track-credit-details">
                        {/* Songwriting info */}
                    {track.songwriting && (
                      <div className="credit-category">
                        <span className="category-label">Songwriting</span>
                        <ul className="credits-list">
                          {track.songwriting.writers && track.songwriting.writers.map((name, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{name}</span>
                              <span className="credit-role">Writer</span>
                            </li>
                          ))}
                          {track.songwriting.composers && track.songwriting.composers.map((name, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{name}</span>
                              <span className="credit-role">Composer</span>
                            </li>
                          ))}
                          {track.songwriting.lyricists && track.songwriting.lyricists.map((name, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{name}</span>
                              <span className="credit-role">Lyricist</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Publishing info */}
                    {track.publishing && track.publishing.publishers && (
                      <div className="credit-category">
                        <span className="category-label">Publishing</span>
                        <ul className="credits-list">
                          {track.publishing.publishers.map((name, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{name}</span>
                              <span className="credit-role">Publisher</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recording info (studios/locations) */}
                    {album.recordingInfo && album.recordingInfo[track.trackId] && (
                      <div className="credit-category">
                        <span className="category-label">Recording</span>
                        <ul className="credits-list">
                          {album.recordingInfo[track.trackId].studios && album.recordingInfo[track.trackId].studios.map((studio, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{studio}</span>
                              <span className="credit-role">Studio</span>
                            </li>
                          ))}
                          {album.recordingInfo[track.trackId].locations && album.recordingInfo[track.trackId].locations.map((location, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{location}</span>
                              <span className="credit-role">Location</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {performers.length > 0 && (
                      <div className="credit-category">
                        <span className="category-label">Performers & Instruments</span>
                        <ul className="credits-list">
                          {performers.map((credit, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{credit.personName}</span>
                              <span className="credit-role">{credit.role}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {production.length > 0 && (
                      <div className="credit-category">
                        <span className="category-label">Production & Technical</span>
                        <ul className="credits-list">
                          {production.map((credit, idx) => (
                            <li key={idx} className="credit-item">
                              <span className="credit-name">{credit.personName}</span>
                              <span className="credit-role">{credit.role}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                        {other.length > 0 && (
                          <ul className="credits-list">
                            {other.map((credit, idx) => (
                              <li key={idx} className="credit-item">
                                <span className="credit-name">{credit.personName}</span>
                                <span className="credit-role">{credit.role}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {albumCredits.length === 0 && 
           (!album.tracks || !album.tracks.some(t => trackCredits[t.trackId] && trackCredits[t.trackId].length > 0)) && (
            <div className="no-credits">
              Credits not documented for this album.
            </div>
          )}
            </>
          )}
        </section>
        {!isMobile && (
          <div className="help-link-container">
            <button className="help-link" onClick={handleOpenHelp}>
              Help
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlbumPage
