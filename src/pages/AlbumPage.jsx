import { useState, useEffect, useRef } from 'react'
import { fetchAlbumData, fetchAlbumBasicInfo, searchReleaseGroups, searchByProducer, fetchCoverArt, fetchAllAlbumArt, fetchWikipediaContentFromMusicBrainz, clearProducerSeenRgIds } from '../services/musicbrainz'
import { formatDuration } from '../utils/formatDuration'
import { getCachedAlbum, setCachedAlbum } from '../utils/albumCache'
import { debugLog, debugWarn } from '../utils/debug'
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
  
  // Mount status tracking - prevents state updates after component unmounts
  const isMountedRef = useRef(true)
  
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
  const [currentImageIndex, setCurrentImageIndex] = useState(null) // Index of currently displayed image in gallery
  
  // Wikipedia content state
  const [wikipediaContent, setWikipediaContent] = useState(null)
  const [loadingWikipedia, setLoadingWikipedia] = useState(false)
  const [wikipediaError, setWikipediaError] = useState(null) // Error state for Wikipedia
  
  // Help section state (from context)
  const { showHelp, openHelp, closeHelp } = useHelp()
  
  // Mobile detection state for responsive UI
  const [isMobile, setIsMobile] = useState(false)
  
  // iPhone Chrome detection for back link visibility
  const [isIPhoneChrome, setIsIPhoneChrome] = useState(false)
  
  // Detect mobile screen size and iPhone Chrome
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480)
    }
    
    // Detect iPhone Chrome
    const userAgent = navigator.userAgent || ''
    const isChrome = /CriOS/.test(userAgent) || 
                    (/Chrome/.test(userAgent) && !/Safari/.test(userAgent)) ||
                    (/Chrome/.test(userAgent) && /Android/.test(userAgent))
    const isIPhone = /iPhone|iPod/.test(userAgent)
    const isIPhoneChromeDetected = isChrome && isIPhone
    
    // Debug: Log detection for troubleshooting
    debugLog('[Back Link Debug]', {
      userAgent: userAgent.substring(0, 100),
      isChrome,
      isIPhone,
      isIPhoneChromeDetected,
      isMobile: window.innerWidth <= 480
    })
    
    setIsIPhoneChrome(isIPhoneChromeDetected)
    
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
  
  // Update URL when search type changes (only on search page, not results/album pages)
  useEffect(() => {
    // Only update history if we're on the search page (not results or album pages)
    // Be very strict: only replace if page is explicitly 'search' or no state exists (initial load)
    const currentState = window.history.state
    const isOnSearchPage = !currentState || currentState.page === 'search'
    
    // Don't replace history if we're on results or album pages
    if (!isOnSearchPage) {
      debugLog('[History] Skipping searchType replaceState - not on search page:', {
        currentState,
        isOnSearchPage
      })
      return
    }
    
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
  
  // Initialize browser history on page load and restore state from URL if needed
  useEffect(() => {
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    
    // Only restore from URL if no history state exists (direct navigation or page refresh)
    if (window.history.state === null) {
      // Check if we're on a results page
      if (pathname === '/results') {
        const urlType = urlParams.get('type')
        if (urlType === 'producer') {
          const producerName = urlParams.get('producer')
          const producerMBID = urlParams.get('mbid')
          if (producerName) {
            debugLog('[History] Restoring producer search from URL:', { producerName, producerMBID })
            setSearchType('producer')
            setSearchProducer(producerName)
            // Note: We can't restore full search results from URL, user would need to search again
            // But we can restore the search type and producer name
            const pageFromUrl = urlParams.get('page')
            const pageNumber = pageFromUrl ? parseInt(pageFromUrl, 10) : 1
            const historyState = {
              page: 'results',
              searchType: 'producer',
              fromPage: 'search',
              pageNumber: pageNumber,
              producerName,
              producerMBID
            }
            window.history.replaceState(historyState, '', window.location.href)
          }
        } else if (urlType === 'album') {
          const artist = urlParams.get('artist')
          const album = urlParams.get('album')
          const releaseType = urlParams.get('releaseType')
          if (artist) {
            debugLog('[History] Restoring album search from URL:', { artist, album, releaseType })
            setSearchType('album')
            setSearchArtist(artist)
            if (album) setSearchAlbum(album)
            if (releaseType) setReleaseType(releaseType)
            // Note: We can't restore full search results from URL, user would need to search again
            const pageFromUrl = urlParams.get('page')
            const pageNumber = pageFromUrl ? parseInt(pageFromUrl, 10) : 1
            const historyState = {
              page: 'results',
              searchType: 'album',
              fromPage: 'search',
              pageNumber: pageNumber,
              artist,
              album: album || null,
              releaseType: releaseType || null
            }
            window.history.replaceState(historyState, '', window.location.href)
          }
        }
      } else if (pathname.startsWith('/album/')) {
        // Extract album ID from URL
        const albumIdMatch = pathname.match(/^\/album\/([^/]+)/)
        if (albumIdMatch) {
          const albumId = albumIdMatch[1]
          debugLog('[History] Restoring album from URL:', albumId)
          const historyState = {
            page: 'album',
            albumId,
            fromPage: 'results',
            searchType: urlParams.get('type') || 'album'
          }
          window.history.replaceState(historyState, '', window.location.href)
          // Store albumId to load - will be handled by a separate useEffect
          // that watches for URL-based album loading
          setLoadingAlbum(true)
          // Note: We'll need to trigger loadAlbum, but since it's defined later,
          // we'll use a ref or state to trigger it. For now, set a flag.
          // Actually, we can call it directly since function declarations are hoisted
          // But to be safe with React, we'll use a state-based approach
          // Set albumId in a way that triggers loading - we'll add a useEffect for this
        }
      } else {
        // Regular search page - initialize history state
        const initialHistoryState = {
          page: 'search',
          searchType: searchType,
          initialized: true
        }
        window.history.replaceState(
          initialHistoryState,
          '',
          window.location.href
        )
        debugLog('[History] Initialized history state for search page:', initialHistoryState)
      }
    }
  }, []) // Only run once on mount
  
  // Handle URL-based album loading (when user navigates directly to /album/...)
  useEffect(() => {
    const pathname = window.location.pathname
    if (pathname.startsWith('/album/') && !album && !loadingAlbum && window.history.state?.page === 'album') {
      const albumIdMatch = pathname.match(/^\/album\/([^/]+)/)
      if (albumIdMatch) {
        const albumId = albumIdMatch[1]
        debugLog('[History] Loading album from URL:', albumId)
        loadAlbum(albumId)
      }
    }
  }, [album, loadingAlbum]) // Re-run when album/loadingAlbum changes
  
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
        debugLog(`[Prefetch] Skipping: missing required data`, {
          hasName: !!producerName,
          hasMBID: !!producerMBID,
          hasRelations: !!releaseRelations,
          atEnd: currentOffset >= totalCount
        })
        return
      }
      
      // Mark as triggered to prevent duplicate prefetches
      prefetchTriggeredRef.current = true
      
      debugLog(`[Prefetch] Next button enabled - starting prefetch automatically`, {
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
        debugLog('[Prefetch] Cleanup: Cancelling in-flight prefetch (producer changed)', {
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
        const producerResultsHistoryState = {
          page: 'results',
          searchType: 'producer',
          fromPage: 'search',
          producerName,
          producerMBID
        }
        // Build URL with search parameters (page 1 is implicit)
        const resultsUrl = buildResultsUrl(1)
        const producerResultsHistoryStateWithPage = {
          ...producerResultsHistoryState,
          pageNumber: 1
        }
        debugLog('[History] Pushing new history state for producer search results:', producerResultsHistoryStateWithPage)
        try {
          window.history.pushState(
            producerResultsHistoryStateWithPage,
            '',
            resultsUrl.toString()
          )
          // Verify the state was actually set (Chrome sometimes has issues)
          const verifyState = window.history.state
          if (!verifyState || verifyState.page !== 'results') {
            console.error('[History] WARNING: pushState may have failed. Expected state:', producerResultsHistoryStateWithPage, 'Actual state:', verifyState)
          }
        } catch (error) {
          console.error('[History] Error pushing producer search results state:', error, producerResultsHistoryStateWithPage)
        }
        
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
              debugLog(`[Prefetch] Explicitly triggering prefetch after search completion`, {
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
        
        // Push new history state for search results (pagination)
        const producerResultsHistoryState = {
          page: 'results',
          searchType: 'producer',
          fromPage: 'search',
          producerName: searchMeta?.producerName || producerName,
          producerMBID: searchMeta?.producerMBID || producerMBID
        }
        // Build URL with search parameters (page 1 is implicit)
        const resultsUrl = buildResultsUrl(1)
        const producerResultsHistoryStateWithPage = {
          ...producerResultsHistoryState,
          pageNumber: 1
        }
        debugLog('[History] Pushing new history state for producer search results (pagination):', producerResultsHistoryStateWithPage)
        try {
          window.history.pushState(
            producerResultsHistoryStateWithPage,
            '',
            resultsUrl.toString()
          )
          // Verify the state was actually set (Chrome sometimes has issues)
          const verifyState = window.history.state
          if (!verifyState || verifyState.page !== 'results') {
            console.error('[History] WARNING: pushState may have failed. Expected state:', producerResultsHistoryState, 'Actual state:', verifyState)
          }
        } catch (error) {
          console.error('[History] Error pushing producer search results state:', error, producerResultsHistoryState)
        }
        
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
              debugLog(`[Prefetch] Explicitly triggering prefetch after search completion`, {
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
        const resultsHistoryState = {
          page: 'results',
          searchType: 'album',
          fromPage: 'search',
          pageNumber: 1,
          artist: searchArtist.trim(),
          album: searchAlbum.trim() || null,
          releaseType: typeFilter || null
        }
        // Build URL with search parameters (page 1 is implicit, no need to add ?page=1)
        const resultsUrl = buildResultsUrl(1)
        try {
          window.history.pushState(
            resultsHistoryState,
            '',
            resultsUrl.toString()
          )
          debugLog('[History] Pushed search results state (album search):', resultsHistoryState)
          
          // Verify the state was actually set (Chrome sometimes has issues)
          const verifyState = window.history.state
          if (!verifyState || verifyState.page !== 'results') {
            console.error('[History] WARNING: pushState may have failed. Expected state:', resultsHistoryState, 'Actual state:', verifyState)
          }
        } catch (error) {
          console.error('[History] Error pushing search results state:', error, resultsHistoryState)
        }
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
      debugLog('[canGoNext] Returning false (early exit):', debugInfo)
      return false
    }
    
    const calculatedTotalPages = getTotalPages()
    
    // Normal pagination: enable if there's another page
    if (resultsPage < calculatedTotalPages) {
      debugLog('[canGoNext] Returning true (normal pagination):', { resultsPage, calculatedTotalPages, ...debugInfo })
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
        debugLog('[canGoNext] Producer search: prefetched results available, enabling Next:', {
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
          debugLog('[canGoNext] Producer search: on last page and reached end, disabling Next:', {
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
      
      debugLog('[canGoNext] Producer search check:', {
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
    
    debugLog('[canGoNext] Returning false (no conditions met):', debugInfo)
    return false
  }
  
  // Navigate to a specific page (handles both Previous and Next)
  // Prefetch next page function - now returns a Promise for awaitable completion
  const startPrefetchNextPage = async (producerName, producerMBID, currentOffset, releaseRelations, seenRgIds, totalCount) => {
    // Don't prefetch if already prefetching or if we're at the end
    if (prefetching || !releaseRelations || currentOffset >= totalCount) {
      debugLog(`[Prefetch] Skipping prefetch: prefetching=${prefetching}, hasRelations=${!!releaseRelations}, atEnd=${currentOffset >= totalCount}`)
      return null
    }
    
    debugLog(`[Prefetch] Starting prefetch for page 2 (currentOffset=${currentOffset}, totalCount=${totalCount})`)
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
        
        debugLog(`[Prefetch] Need ${albumsNeeded} more albums for page 2`)
        
        // Start fetching batches until we have enough
        let allResults = []
        let currentOffsetForPrefetch = currentOffset
        let currentSeenRgIds = seenRgIds
        
        while (allResults.length < albumsNeeded && currentOffsetForPrefetch < totalCount && !abortController.signal.aborted) {
          const nextOffset = currentOffsetForPrefetch
          debugLog(`[Prefetch] Fetching batch at offset ${nextOffset}... (have ${allResults.length}, need ${albumsNeeded})`)
          
          const searchResponse = await searchByProducer(
            producerName,
            producerMBID,
            nextOffset,
            null, // No progress for background prefetch
            releaseRelations,
            currentSeenRgIds
          )
          
          if (abortController.signal.aborted) {
            debugLog(`[Prefetch] Aborted`)
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
          
          debugLog(`[Prefetch] Batch at offset ${nextOffset}: found ${uniqueNewResults.length} new albums (${allResults.length} total), processed ${actualReleasesProcessed} releases`)
          
          // If we got no results or hasMore is false, we've reached the end
          if (newResults.length === 0 || hasMore === false) {
            debugLog(`[Prefetch] Reached end of available releases (hasMore=${hasMore})`)
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
          debugLog(`[Prefetch] ✅ Prefetched ${allResults.length} albums for page 2 (finalOffset=${currentOffsetForPrefetch})`)
        } else {
          debugLog(`[Prefetch] No albums prefetched (reached end)`)
          // If we reached the end with no results, update ref and state
          reachedEndRef.current = true
          setSearchMeta(prev => prev ? { ...prev, hasMore: false } : null)
        }
        
        return result
      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Aborted') {
          debugLog('[Prefetch] Prefetch was aborted')
          // Return null instead of throwing - prevents uncaught Promise rejection
          // Caller can check prefetchedResults for partial results if available
          return null
        } else {
          debugWarn('[Prefetch] Error prefetching next page:', error)
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
      debugLog(`[Pagination] handlePageChange blocked: searchResults=${!!searchResults}, searchMeta=${!!searchMeta}, loadingPage=${loadingPage}`)
      return
    }
    
    const calculatedTotalPages = getTotalPages()
    debugLog(`[Pagination] handlePageChange('${direction}'): currentPage=${resultsPage}, totalPages=${calculatedTotalPages}, canGoNext=${canGoNext()}`)
    let targetPage
    
    if (direction === 'next') {
      // For producer search: allow going to next page even if we're on last page of current results
      // (we'll fetch more releases to get more albums)
      // For album search: only allow if there's another page
      if (!searchMeta.isProducerSearch && resultsPage >= calculatedTotalPages) {
        debugLog(`[Pagination] Blocked: Already on last page (${resultsPage} >= ${calculatedTotalPages})`)
        return
      }
      targetPage = resultsPage + 1
    } else if (direction === 'prev') {
      // On page 1: clear results and return to search form
      if (resultsPage === 1) {
        debugLog(`[Pagination] On page 1: clearing results and returning to search form`)
        
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
      debugLog(`[Pagination] Going to previous page: ${resultsPage} -> ${targetPage}`)
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
    
    debugLog(`[Pagination] Page ${targetPage} (direction: ${direction}, goingBackwards: ${isGoingBackwards}): startIndex=${startIndex}, searchResults.length=${searchResults.length}, needsMoreData=${needsMoreData}`)
    if (searchMeta.isProducerSearch) {
      debugLog(`[Pagination] Producer search: producerOffset=${searchMeta.producerOffset || 0}, totalCount=${searchMeta.totalCount}`)
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
            debugLog(`[Producer Search Pagination] Prefetch in progress for page 2 - waiting for completion...`)
            
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
                debugLog(`[Producer Search Pagination] Prefetch was aborted - checking for partial results`)
                // Fall through to check prefetchedResults below
              } else if (prefetchResult && prefetchResult.results) {
                debugLog(`[Producer Search Pagination] Prefetch completed, using results (${prefetchResult.results.length} albums)`)
                
                // Store result to use directly (React state updates are async)
                prefetchResultToUse = prefetchResult
                // Also set state for consistency
                setPrefetchedResults(prefetchResult)
                // Use prefetchResultToUse directly below instead of prefetchedResults
              }
            } catch (error) {
              // Check for AbortError or 'Aborted' message
              if (error.name === 'AbortError' || error.message === 'Aborted') {
                debugLog(`[Producer Search Pagination] Prefetch was aborted - checking for partial results`)
              } else if (error.message === 'Prefetch timeout') {
                debugWarn(`[Producer Search Pagination] Prefetch timed out after 120s - giving prefetch a moment to complete`)
                // Don't abort prefetch on timeout - let it continue in background
                // Give prefetch a small grace period (1s) to complete before falling back
                // This handles cases where prefetch completes just after timeout
                await new Promise(resolve => setTimeout(resolve, 1000))
                debugLog(`[Producer Search Pagination] Grace period ended - checking if prefetch completed`)
                
                // Try to get prefetch result one more time (with very short timeout) in case it completed during grace period
                if (prefetchPromiseRef.current) {
                  try {
                    const quickResult = await Promise.race([
                      prefetchPromiseRef.current,
                      new Promise((_, reject) => setTimeout(() => reject(new Error('Still pending')), 100))
                    ])
                    if (quickResult && quickResult.results) {
                      debugLog(`[Producer Search Pagination] Prefetch completed during grace period - using ${quickResult.results.length} results`)
                      prefetchResultToUse = quickResult
                      setPrefetchedResults(quickResult)
                    }
                  } catch (quickError) {
                    // Prefetch still not ready - that's ok, will check state or proceed with manual fetch
                    debugLog(`[Producer Search Pagination] Prefetch still in progress after grace period`)
                  }
                }
                // Fall through - will check prefetchResultToUse or prefetchedResults below
              } else {
                debugWarn(`[Producer Search Pagination] Prefetch error: ${error.message} - falling back to manual fetch`)
              }
              // Fall through - will check prefetchedResults below if available
            }
          }
          
          // Abort prefetch if navigating to page 3+ or going back (don't need prefetch data)
          if (targetPage !== 2 && prefetching) {
            debugLog(`[Producer Search Pagination] Aborting prefetch - navigating to page ${targetPage} (prefetch only needed for page 2)`)
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
                    debugLog(`[Producer Search Pagination] Prefetch completed on final check - using ${finalCheck.results.length} results`)
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
            debugLog(`[Producer Search Pagination] Using prefetched results for page 2 (${prefetchResults.results.length} albums, finalOffset=${prefetchResults.finalOffset})`)
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
              debugLog(`[Producer Search Pagination] ✅ Displaying page ${targetPage} from prefetch: ${pageResults.length} albums (indices ${pageStart}-${pageEnd - 1} of ${filteredCombined.length}, page1Length=${actualPage1Length})`)
              setDisplayedResults(pageResults)
              setResultsPage(targetPage)
              
              // Update URL with page number
              const resultsUrl = buildResultsUrl(targetPage)
              const resultsHistoryState = {
                page: 'results',
                searchType: 'producer',
                fromPage: 'search',
                pageNumber: targetPage,
                producerName: searchMeta?.producerName,
                producerMBID: searchMeta?.producerMBID
              }
              try {
                window.history.pushState(resultsHistoryState, '', resultsUrl.toString())
                debugLog('[History] Pushed pagination history state (prefetch):', { page: targetPage })
              } catch (error) {
                console.error('[History] Error pushing pagination state:', error)
              }
            } else {
              // Fallback: calculate last valid page (shouldn't happen with prefetch, but handle it)
              const lastValidPage = Math.max(1, Math.ceil(filteredCombined.length / RESULTS_PER_PAGE))
              const lastPageStart = (lastValidPage - 1) * RESULTS_PER_PAGE
              const lastPageEnd = Math.min(lastPageStart + RESULTS_PER_PAGE, filteredCombined.length)
              const lastPageResults = filteredCombined.slice(lastPageStart, lastPageEnd)
              debugLog(`[Producer Search Pagination] ⚠️ Fallback: displaying page ${lastValidPage} from prefetch: ${lastPageResults.length} albums (indices ${lastPageStart}-${lastPageEnd - 1} of ${filteredCombined.length})`)
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
            debugWarn(`[Producer Search Pagination] Prefetch still running but no results - aborting prefetch before manual fetch`)
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
          
          debugLog(`[Producer Search Pagination] Target page ${targetPage} needs ${albumsNeededForPage} albums, currently have ${currentResults.length}`)
          
          // Keep fetching batches until we have enough albums for the target page OR no more releases available
          while (currentResults.length < albumsNeededForPage && currentOffset < totalReleases) {
            const nextOffset = currentOffset + 10 // Process next batch of 10 releases
            debugLog(`[Producer Search Pagination] Fetching batch starting at offset ${nextOffset}... (need ${albumsNeededForPage - currentResults.length} more albums)`)
            
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
              debugLog(`[Producer Search Pagination] Found ${uniqueNewResults.length} new albums (${currentResults.length} total now)`)
            } else {
              // No new albums in this batch
              currentOffset = nextOffset
              debugLog(`[Producer Search Pagination] No new albums in this batch, continuing...`)
              
              // If hasMore is false, we've reached the end - break out of loop
              if (hasMore === false) {
                debugLog(`[Producer Search Pagination] Reached end of available releases (hasMore=false)`)
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
              debugLog(`[Producer Search Pagination] Reached end of available releases (offset ${currentOffset} >= total ${totalReleases})`)
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
            debugLog(`[Producer Search Pagination] ✅ Displaying page ${targetPage}: ${pageResults.length} albums (indices ${pageStart}-${pageEnd - 1} of ${filteredResults.length})`)
            
            // Update URL with page number
            const resultsUrl = buildResultsUrl(targetPage)
            const resultsHistoryState = {
              page: 'results',
              searchType: 'producer',
              fromPage: 'search',
              pageNumber: targetPage,
              producerName: searchMeta?.producerName,
              producerMBID: searchMeta?.producerMBID
            }
            try {
              window.history.pushState(resultsHistoryState, '', resultsUrl.toString())
              debugLog('[History] Pushed pagination history state (producer fetch):', { page: targetPage })
            } catch (error) {
              console.error('[History] Error pushing pagination state:', error)
            }
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
            
            debugLog(`[Producer Search Pagination] ⚠️ Fallback: displaying page ${lastValidPage} with ${lastPageResults.length} albums (reached end)`)
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
            
            // Update URL with page number
            const resultsUrl = buildResultsUrl(targetPage)
            const resultsHistoryState = {
              page: 'results',
              searchType: 'album',
              fromPage: 'search',
              pageNumber: targetPage,
              artist: searchArtist || null,
              album: searchAlbum || null,
              releaseType: releaseType || null
            }
            try {
              window.history.pushState(resultsHistoryState, '', resultsUrl.toString())
              debugLog('[History] Pushed pagination history state (album fetch):', { page: targetPage })
            } catch (error) {
              console.error('[History] Error pushing pagination state:', error)
            }
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
      
      debugLog(`[Pagination] Displaying page from memory: targetPage=${targetPage}, pageStart=${pageStart}, filteredResults.length=${filteredResults.length}`)
      
      // Ensure we don't try to slice beyond available results
      if (pageStart >= filteredResults.length) {
        // Not enough results for this page - go back to last valid page
        const lastValidPage = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE))
        const lastPageStart = (lastValidPage - 1) * RESULTS_PER_PAGE
        const lastPageEnd = Math.min(lastPageStart + RESULTS_PER_PAGE, filteredResults.length)
        const lastPageResults = filteredResults.slice(lastPageStart, lastPageEnd)
        setDisplayedResults(lastPageResults)
        setResultsPage(lastValidPage)
        debugLog(`[Pagination] Not enough results for page ${targetPage} (have ${filteredResults.length} albums), displaying page ${lastValidPage}`)
      } else {
        const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, filteredResults.length)
        const pageResults = filteredResults.slice(pageStart, pageEnd)
        debugLog(`[Pagination] Slicing results: pageStart=${pageStart}, pageEnd=${pageEnd}, pageResults.length=${pageResults.length}`)
        setDisplayedResults(pageResults)
        setResultsPage(targetPage)
        
        // Update URL with page number and create history entry
        const resultsUrl = buildResultsUrl(targetPage)
        const resultsHistoryState = {
          page: 'results',
          searchType: searchMeta?.isProducerSearch ? 'producer' : 'album',
          fromPage: 'search',
          pageNumber: targetPage,
          producerName: searchMeta?.producerName,
          producerMBID: searchMeta?.producerMBID,
          artist: searchMeta?.isProducerSearch ? null : (searchArtist || null),
          album: searchMeta?.isProducerSearch ? null : (searchAlbum || null),
          releaseType: searchMeta?.isProducerSearch ? null : (releaseType || null)
        }
        
        try {
          window.history.pushState(
            resultsHistoryState,
            '',
            resultsUrl.toString()
          )
          debugLog('[History] Pushed pagination history state:', { page: targetPage, url: resultsUrl.toString() })
        } catch (error) {
          console.error('[History] Error pushing pagination state:', error)
        }
      }
    }
  }
  
  // Helper function to build results URL with page number
  function buildResultsUrl(pageNumber = 1) {
    const resultsUrl = new URL(window.location.origin + '/results')
    
    if (searchMeta?.isProducerSearch) {
      resultsUrl.searchParams.set('type', 'producer')
      if (searchMeta.producerName) {
        resultsUrl.searchParams.set('producer', encodeURIComponent(searchMeta.producerName))
      }
      if (searchMeta.producerMBID) {
        resultsUrl.searchParams.set('mbid', searchMeta.producerMBID)
      }
    } else {
      resultsUrl.searchParams.set('type', 'album')
      if (searchArtist) {
        resultsUrl.searchParams.set('artist', encodeURIComponent(searchArtist.trim()))
      }
      if (searchAlbum && searchAlbum.trim()) {
        resultsUrl.searchParams.set('album', encodeURIComponent(searchAlbum.trim()))
      }
      if (releaseType && releaseType !== 'Album') {
        resultsUrl.searchParams.set('releaseType', releaseType)
      }
    }
    
    // Add page number to URL (page 1 is implicit, but we'll include it for consistency)
    if (pageNumber > 1) {
      resultsUrl.searchParams.set('page', pageNumber.toString())
    }
    
    return resultsUrl
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
    
    // Don't clear searchResults - we need it for "Back to Search Results" button
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
        debugLog(`Loading album from cache: ${releaseGroupId}`)
        
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
          debugLog(`Using cached cover art URL: ${cachedAlbum.coverArtUrl}`)
        } else if (cachedAlbum.albumId) {
          // No cached URL - fetch it in background
          debugLog(`No cached cover art URL, fetching from API...`)
          // Try to get selectedReleaseId from cached album if available
          const selectedReleaseId = cachedAlbum.selectedReleaseId || 
                                    cachedAlbum.editions?.[0]?.id || 
                                    cachedAlbum.releases?.[0]?.id || 
                                    null
          fetchCoverArt(cachedAlbum.albumId, selectedReleaseId)
            .then(coverArtUrl => {
              if (coverArtUrl) {
                debugLog(`Fetched cover art URL: ${coverArtUrl}`)
                setAlbum(prev => prev ? { ...prev, coverArtUrl } : null)
                // Update cache with the new cover art URL for future use
                setCachedAlbum(cachedAlbum.albumId, { ...cachedAlbum, coverArtUrl })
              } else {
                debugLog(`No cover art URL found from API`)
              }
            })
            .catch(err => {
              debugWarn('Failed to load cover art:', err)
            })
        }
        
        return // Exit early, we have cached data
      }
      
      // Cache miss - fetch from API
      debugLog(`Cache miss, fetching album from API: ${releaseGroupId}`)
      
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
          if (coverArtUrl && isMountedRef.current) {
            setAlbum(prev => prev ? { ...prev, coverArtUrl } : null)
          }
        })
        .catch(err => {
          if (isMountedRef.current) {
            debugWarn('Failed to load cover art:', err)
            // Don't show error - cover art is optional
          }
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
      debugLog('[History] loadAlbum: About to push album history state:', {
        currentResultsPage: resultsPage,
        searchResultsLength: searchResults.length,
        fromPage: 'results'
      })
      
      const albumHistoryState = {
        page: 'album',
        albumId: releaseGroupId,
        fromPage: 'results',
        searchType: searchMeta?.isProducerSearch ? 'producer' : 'album',
        // Store search params for back navigation
        producerName: searchMeta?.producerName,
        producerMBID: searchMeta?.producerMBID,
        artist: searchMeta?.isProducerSearch ? null : (searchArtist || null),
        album: searchMeta?.isProducerSearch ? null : (searchAlbum || null)
      }
      // Build URL for album page
      const albumUrl = new URL(window.location.origin + `/album/${releaseGroupId}`)
      try {
        window.history.pushState(
          albumHistoryState,
          '',
          albumUrl.toString()
        )
        debugLog('[History] Pushed album details state:', {
          ...albumHistoryState,
          preservedResultsPage: resultsPage,
          note: 'resultsPage should be preserved at this point'
        })
        
        // Verify the state was actually set (Chrome sometimes has issues)
        const verifyState = window.history.state
        if (!verifyState || verifyState.page !== 'album') {
          console.error('[History] WARNING: pushState may have failed. Expected state:', albumHistoryState, 'Actual state:', verifyState)
        }
      } catch (error) {
        console.error('[History] Error pushing album details state:', error, albumHistoryState)
      }
    }
  }
  
  // Handle back navigation (for visible back link, especially iPhone Chrome)
  function handleBackNavigation() {
    // Try browser back button first
    try {
      // Check if we can go back
      if (window.history.length > 1) {
        window.history.back()
        return
      }
    } catch (error) {
      debugWarn('[History] window.history.back() failed, using fallback navigation:', error)
    }
    
    // Fallback: Programmatic navigation based on current state/URL
    const currentState = window.history.state
    const pathname = window.location.pathname
    
    // If we're on album page, go back to results
    if (pathname.startsWith('/album/')) {
      if (currentState && currentState.fromPage === 'results') {
        // Try to restore results URL from history state
        if (currentState.searchType === 'producer' && currentState.producerName) {
          const resultsUrl = new URL(window.location.origin + '/results')
          resultsUrl.searchParams.set('type', 'producer')
          resultsUrl.searchParams.set('producer', encodeURIComponent(currentState.producerName))
          if (currentState.producerMBID) {
            resultsUrl.searchParams.set('mbid', currentState.producerMBID)
          }
          window.history.pushState(
            { page: 'results', searchType: 'producer', fromPage: 'search', producerName: currentState.producerName, producerMBID: currentState.producerMBID },
            '',
            resultsUrl.toString()
          )
          // Trigger popstate-like behavior
          setAlbum(null)
          setAlbumError(null)
          if (searchResults && searchResults.length > 0) {
            setDisplayedResults(searchResults.slice(0, RESULTS_PER_PAGE))
            setResultsPage(1)
          }
          return
        } else if (currentState.searchType === 'album' && currentState.artist) {
          const resultsUrl = new URL(window.location.origin + '/results')
          resultsUrl.searchParams.set('type', 'album')
          resultsUrl.searchParams.set('artist', encodeURIComponent(currentState.artist))
          if (currentState.album) {
            resultsUrl.searchParams.set('album', encodeURIComponent(currentState.album))
          }
          if (currentState.releaseType) {
            resultsUrl.searchParams.set('releaseType', currentState.releaseType)
          }
          window.history.pushState(
            { page: 'results', searchType: 'album', fromPage: 'search', artist: currentState.artist, album: currentState.album, releaseType: currentState.releaseType },
            '',
            resultsUrl.toString()
          )
          setAlbum(null)
          setAlbumError(null)
          if (searchResults && searchResults.length > 0) {
            setDisplayedResults(searchResults.slice(0, RESULTS_PER_PAGE))
            setResultsPage(1)
          }
          return
        }
      }
      // Fallback: use handleNewSearch logic
      handleNewSearch()
    } else if (pathname === '/results') {
      // If we're on results page, go back to search
      const searchUrl = new URL(window.location.origin + '/')
      const urlParams = new URLSearchParams(window.location.search)
      const type = urlParams.get('type')
      if (type) {
        searchUrl.searchParams.set('type', type)
      }
      window.history.pushState(
        { page: 'search', searchType: type || 'album', initialized: true },
        '',
        searchUrl.toString()
      )
      setSearchResults(null)
      setSearchMeta(null)
      setDisplayedResults([])
      setResultsPage(1)
      setFetchedCount(0)
      setSearchError(null)
      setMultipleProducerMatches(null)
      setAlbum(null)
      setAlbumError(null)
    }
  }
  
  // Return to search form
  function handleNewSearch() {
    // Check current URL to determine what page we're on
    // This is needed because after browser back button, React state might not match URL
    const pathname = window.location.pathname
    const isOnResultsPage = pathname === '/results'
    
    // Check if we're on album page BEFORE clearing album state
    // Use URL pathname as fallback if React state doesn't match (e.g., after browser back)
    const wasOnAlbumPage = !!album || pathname.startsWith('/album/')
    
    setAlbum(null)
    setAlbumError(null)
    
    // If we were on album page and search results exist, return to results
    // Otherwise, clear everything for fresh search
    if (wasOnAlbumPage && searchResults && searchResults.length > 0) {
      // Return to search results - reset to first page
      setSearchError(null)
      setDisplayedResults(searchResults.slice(0, RESULTS_PER_PAGE))
      setResultsPage(1)
      
      // Update browser URL to match the results page (page 1)
      const resultsUrl = buildResultsUrl(1)
      const resultsHistoryState = {
        page: 'results',
        searchType: searchMeta?.isProducerSearch ? 'producer' : 'album',
        fromPage: 'search',
        pageNumber: 1,
        producerName: searchMeta?.producerName,
        producerMBID: searchMeta?.producerMBID,
        artist: searchMeta?.isProducerSearch ? null : (searchArtist || null),
        album: searchMeta?.isProducerSearch ? null : (searchAlbum || null),
        releaseType: searchMeta?.isProducerSearch ? null : (releaseType || null)
      }
      
      // Special case: If we're already on results page (e.g., after browser back button),
      // use replaceState instead of pushState to avoid creating duplicate history entries
      // This fixes the bug where clicking "Back to Search Results" from results page
      // would create a duplicate entry and break the browser back button
      if (isOnResultsPage && window.history.state?.page === 'results') {
        // Already on results page with correct state - just ensure state is up to date
        window.history.replaceState(
          resultsHistoryState,
          '',
          resultsUrl.toString()
        )
        debugLog('[History] Replaced results state from Back to Search Results button (already on results):', resultsHistoryState)
      } else {
        // Coming from album page - push new history entry
        window.history.pushState(
          resultsHistoryState,
          '',
          resultsUrl.toString()
        )
        debugLog('[History] Pushed results state from Back to Search Results button:', resultsHistoryState)
      }
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
      
      // Update browser URL to search page
      const searchUrl = new URL(window.location.origin + '/')
      if (searchType === 'producer') {
        searchUrl.searchParams.set('type', 'producer')
      }
      window.history.pushState(
        { page: 'search', searchType: searchType, initialized: true },
        '',
        searchUrl.toString()
      )
      debugLog('[History] Pushed search page state from New Search button')
    }
    setSortOption('newest') // Reset to default sort
    setExpandedTracks(new Set())
    setEditionsExpanded(false)
    setAlbumCreditsExpanded(true) // Reset album credits to expanded
    setGalleryExpanded(false) // Reset gallery to collapsed
    setSelectedImage(null) // Clear selected image
    setCurrentImageIndex(null) // Clear image index
    setWikipediaContent(null) // Clear Wikipedia content
    setLoadingWikipedia(false) // Reset Wikipedia loading state
  }
  
  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event) => {
      // Handle back button navigation based on history state being navigated TO
      const historyState = event.state
      
      // Detect browser for debugging
      const userAgent = navigator.userAgent || ''
      // Chrome detection: CriOS (Chrome iOS), or Chrome without Safari, or Chrome on Android
      const isChrome = /CriOS/.test(userAgent) || 
                      (/Chrome/.test(userAgent) && !/Safari/.test(userAgent)) ||
                      (/Chrome/.test(userAgent) && /Android/.test(userAgent))
      // Safari detection: Safari but not Chrome/CriOS
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/CriOS/.test(userAgent)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent)
      
      debugLog('[History] popstate event fired:', {
        browser: isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Unknown',
        isMobile,
        userAgent: userAgent.substring(0, 100), // First 100 chars for privacy
        historyState,
        historyStateType: typeof historyState,
        historyStateKeys: historyState ? Object.keys(historyState) : null,
        historyStatePage: historyState?.page,
        historyStateInitialized: historyState?.initialized,
        currentReactState: {
          hasAlbum: !!album,
          hasSearchResults: !!searchResults,
          searchResultsLength: searchResults?.length || 0,
          resultsPage: resultsPage,
          showHelp,
          hasSelectedImage: selectedImage !== null,
          currentPathname: window.location.pathname,
          currentSearch: window.location.search
        }
      })
      
      // Chrome-specific: Sometimes historyState can be undefined even when it should exist
      // Log a warning if we're in Chrome and historyState is unexpectedly null
      if (isChrome && !historyState && (album || searchResults)) {
        debugWarn('[History] Chrome: historyState is null but React state suggests we should have history. This may indicate a Chrome-specific issue.')
      }
      
      // Case 1: Lightbox is open → close lightbox and stay on album details page
      if (selectedImage !== null) {
        debugLog('[History] Closing lightbox, staying on album page')
        setSelectedImage(null)
        setCurrentImageIndex(null)
        // Don't push a new state - we're already on the album details page
        // The history stack is: search results → album details → lightbox open
        // After closing lightbox, we're back to album details page
        return
      }
      
      // Case 2: Coming back from help section → close help
      if (showHelp) {
        debugLog('[History] Closing help section')
        setShowHelp(false)
        return
      }
      
      // Case 3: Navigating back to search results page (from album details)
      // Check history state first - this is the source of truth for what page we're navigating TO
      if (historyState && historyState.page === 'results') {
        debugLog('[History] Case 3 MATCHED: Navigating back to search results page:', {
          historyState,
          preservedResultsPage: resultsPage,
          searchResultsLength: searchResults?.length || 0
        })
        
        // Restore search type if available
        if (historyState.searchType) {
          setSearchType(historyState.searchType)
        }
        
        // Clear album state to show search results
        setAlbum(null)
        setAlbumError(null)
        
        // Restore displayed results if we have search results in memory
        if (searchResults && searchResults.length > 0) {
          // Read page number from URL or history state
          const urlParams = new URLSearchParams(window.location.search)
          const urlPage = urlParams.get('page')
          const pageFromState = historyState.pageNumber
          const pageToRestore = pageFromState || (urlPage ? parseInt(urlPage, 10) : 1) || 1
          
          const pageStart = (pageToRestore - 1) * RESULTS_PER_PAGE
          const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, searchResults.length)
          const pageResults = searchResults.slice(pageStart, pageEnd)
          
          setDisplayedResults(pageResults)
          setResultsPage(pageToRestore)
          debugLog('[History] Case 3: Restored search results from memory - page', pageToRestore, '(from', pageFromState ? 'historyState' : urlPage ? 'URL' : 'default', ')')
        } else {
          // Search results not in memory - this shouldn't happen, but handle gracefully
          debugWarn('[History] Case 3: Search results not in memory when navigating back to results page')
          setSearchResults(null)
          setSearchMeta(null)
          setDisplayedResults([])
          setResultsPage(1)
        }
        return
      } else {
        debugLog('[History] Case 3 NOT MATCHED:', {
          hasHistoryState: !!historyState,
          historyStatePage: historyState?.page,
          expectedPage: 'results',
          reason: !historyState ? 'historyState is null' : `historyState.page is "${historyState.page}" not "results"`
        })
      }
      
      // Check BEFORE Case 4: Are we going back from album to results?
      // This should catch cases where historyState is missing/malformed but we have album + searchResults
      if (album && searchResults && searchResults.length > 0) {
        debugLog('[History] PRE-CASE 4 CHECK: Detected album → results navigation - RESTORING RESULTS PAGE:', {
          hasAlbum: !!album,
          hasSearchResults: !!searchResults,
          searchResultsLength: searchResults.length,
          preservedResultsPage: resultsPage,
          historyState,
          historyStatePage: historyState?.page,
          reason: 'Album and searchResults both present - restoring results page instead of going to search'
        })
        
        // Restore search type from searchMeta if available
        if (searchMeta && searchMeta.isProducerSearch) {
          setSearchType('producer')
        } else if (searchMeta && !searchMeta.isProducerSearch) {
          setSearchType('album')
        }
        
        // Clear album state to show search results
        setAlbum(null)
        setAlbumError(null)
        
        // Restore the correct results page - try URL first, then preserved state, then default to 1
        const urlParams = new URLSearchParams(window.location.search)
        const urlPage = urlParams.get('page')
        const pageFromUrl = urlPage ? parseInt(urlPage, 10) : null
        const pageToRestore = pageFromUrl || resultsPage || 1
        
        const pageStart = (pageToRestore - 1) * RESULTS_PER_PAGE
        const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, searchResults.length)
        const pageResults = searchResults.slice(pageStart, pageEnd)
        
        setDisplayedResults(pageResults)
        setResultsPage(pageToRestore)
        
        debugLog('[History] PRE-CASE 4 CHECK: Restored search results page', pageToRestore, 'with', pageResults.length, 'results (from', pageFromUrl ? 'URL' : 'preserved state', ')')
        return // Prevent Case 4 from executing
      } else {
        debugLog('[History] PRE-CASE 4 CHECK: NOT going back from album to results:', {
          hasAlbum: !!album,
          hasSearchResults: !!searchResults,
          searchResultsLength: searchResults?.length || 0,
          preservedResultsPage: resultsPage
        })
      }
      
      // Case 4: Navigating back to initial search page
      // Check if history state indicates we're going back to search page
      if (historyState && (historyState.page === 'search' || historyState.initialized === true)) {
        debugLog('[History] Case 4 MATCHED: Navigating back to initial search page:', {
          historyState,
          historyStatePage: historyState.page,
          historyStateInitialized: historyState.initialized,
          hasAlbum: !!album,
          hasSearchResults: !!searchResults,
          preservedResultsPage: resultsPage,
          warning: album && searchResults ? '⚠️ BUG: Has album + searchResults but going to search page!' : 'OK'
        })
        
        // Restore search type from history state if available
        // Support both 'searchType' (new) and 'type' (old) for backward compatibility
        const searchTypeToUse = historyState.searchType || historyState.type
        if (searchTypeToUse) {
          setSearchType(searchTypeToUse)
        }
        
        // Clear search results and return to main search form
        setSearchResults(null)
        setSearchMeta(null)
        setDisplayedResults([])
        setResultsPage(1)
        setFetchedCount(0)
        setSearchError(null)
        setMultipleProducerMatches(null)
        setAlbum(null)
        setAlbumError(null)
        // Keep search form values so user can see what they searched for
        // (Don't clear searchArtist, searchAlbum, releaseType, searchProducer)
        return
      }
      
      // Case 5: Fallback - use URL parsing if history state is null or doesn't match expected structure
      // This handles edge cases where history state might be missing or malformed (e.g., iPhone Chrome)
      if (!historyState || (!historyState.page && !historyState.initialized)) {
        debugLog('[History] No valid history state, using URL parsing fallback')
        
        const pathname = window.location.pathname
        const urlParams = new URLSearchParams(window.location.search)
        
        // Parse URL to determine what page we're navigating to
        if (pathname === '/results') {
          // Navigating to results page - restore from URL params
          const urlType = urlParams.get('type')
          if (urlType === 'producer') {
            const producerName = urlParams.get('producer')
            if (producerName) {
              debugLog('[History] URL fallback: Restoring producer search from URL')
              setSearchType('producer')
              setSearchProducer(producerName)
              // Note: Can't restore full results from URL, but we can restore search params
              setAlbum(null)
              setAlbumError(null)
              // Results would need to be re-fetched, but for now clear them
              setSearchResults(null)
              setSearchMeta(null)
              setDisplayedResults([])
              return
            }
          } else if (urlType === 'album') {
            const artist = urlParams.get('artist')
            if (artist) {
              debugLog('[History] URL fallback: Restoring album search from URL')
              setSearchType('album')
              setSearchArtist(artist)
              const album = urlParams.get('album')
              if (album) setSearchAlbum(album)
              const releaseType = urlParams.get('releaseType')
              if (releaseType) setReleaseType(releaseType)
              setAlbum(null)
              setAlbumError(null)
              setSearchResults(null)
              setSearchMeta(null)
              setDisplayedResults([])
              return
            }
          }
        } else if (pathname === '/' || pathname === '') {
          // Navigating to search page
          debugLog('[History] URL fallback: Returning to search page')
          const urlType = urlParams.get('type')
          if (urlType) setSearchType(urlType)
          setAlbum(null)
          setAlbumError(null)
          setSearchResults(null)
          setSearchMeta(null)
          setDisplayedResults([])
          setResultsPage(1)
          setFetchedCount(0)
          setSearchError(null)
          setMultipleProducerMatches(null)
          return
        }
        
        // Final fallback - use React state if URL parsing doesn't help
        debugLog('[History] URL fallback failed, using React state fallback')
        
        // If we have an album, assume we're going back to search results
        if (album && searchResults && searchResults.length > 0) {
          debugLog('[History] Fallback: Returning to search results (album → results)')
          setAlbum(null)
          setAlbumError(null)
          setDisplayedResults(searchResults.slice(0, RESULTS_PER_PAGE))
          setResultsPage(1)
          return
        }
        
        // If we have search results but no album, assume we're going back to search page
        if (!album && searchResults && searchResults.length > 0) {
          debugLog('[History] Fallback: Returning to search page (results → search)')
          // Restore search type from searchMeta if available
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
          return
        }
      }
      
      // Case 6: No special handling needed, let browser handle normally
      debugLog('[History] No special handling, letting browser handle normally')
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [searchResults, album, showHelp, selectedImage]) // Re-run when searchResults, album, showHelp, or selectedImage changes
  
  // Fetch gallery images in background after album loads
  useEffect(() => {
    if (album && album.albumId) {
      debugLog('[Gallery Debug] useEffect triggered - album.albumId:', album.albumId)
      
      // Reset gallery state when new album loads
      setGalleryImages([])
      setGalleryExpanded(false)
      setSelectedImage(null)
      setCurrentImageIndex(null)
      setGalleryError(null) // Clear previous errors
      
      // Create AbortController for this request
      const abortController = new AbortController()
      const TIMEOUT_MS = 10000 // 10 second timeout
      
      // Set timeout to abort request
      const timeoutId = setTimeout(() => {
        debugLog('[Gallery Debug] Timeout reached - aborting request')
        abortController.abort()
      }, TIMEOUT_MS)
      
      // Fetch gallery images in background with timeout
      debugLog('[Gallery Debug] Setting loadingGallery to true, clearing error')
      setLoadingGallery(true)
      setGalleryError(null)
      
      debugLog('[Gallery Debug] Calling fetchAllAlbumArt with albumId:', album.albumId)
      fetchAllAlbumArt(album.albumId, abortController.signal)
        .then(images => {
          debugLog('[Gallery Debug] fetchAllAlbumArt SUCCESS - images received:', images.length)
          debugLog('[Gallery Debug] Aborted?', abortController.signal.aborted)
          
          // Only update if this request hasn't been cancelled AND component is still mounted
          if (!abortController.signal.aborted && isMountedRef.current) {
            clearTimeout(timeoutId)
            debugLog('[Gallery Debug] Setting galleryImages to:', images.length, 'images')
            setGalleryImages(images)
            setGalleryError(null)
            debugLog('[Gallery Debug] State after success - images:', images.length, 'error:', null)
          } else {
            debugLog('[Gallery Debug] Request was aborted or component unmounted - not updating state')
          }
        })
        .catch(err => {
          debugLog('[Gallery Debug] fetchAllAlbumArt ERROR caught:', err)
          debugLog('[Gallery Debug] Error name:', err.name)
          debugLog('[Gallery Debug] Error message:', err.message)
          debugLog('[Gallery Debug] Aborted?', abortController.signal.aborted)
          
          // Only update if this request hasn't been cancelled AND component is still mounted
          if (!abortController.signal.aborted && isMountedRef.current) {
            clearTimeout(timeoutId)
            debugWarn('Error loading gallery images:', err)
            const errorMessage = err.message || 'Failed to load album art gallery'
            const finalError = errorMessage.includes('timeout') 
              ? 'Gallery loading timed out. Please try again.' 
              : errorMessage
            debugLog('[Gallery Debug] Setting galleryError to:', finalError)
            setGalleryError(finalError)
            debugLog('[Gallery Debug] State after error - images: 0, error:', finalError)
          } else {
            debugLog('[Gallery Debug] Request was aborted or component unmounted - not updating error state')
          }
        })
        .finally(() => {
          debugLog('[Gallery Debug] finally() called - Aborted?', abortController.signal.aborted)
          
          // Only update if this request hasn't been cancelled AND component is still mounted
          if (!abortController.signal.aborted && isMountedRef.current) {
            clearTimeout(timeoutId)
            debugLog('[Gallery Debug] Setting loadingGallery to false')
            setLoadingGallery(false)
          } else {
            debugLog('[Gallery Debug] Request was aborted or component unmounted - not updating loading state')
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
      setCurrentImageIndex(null)
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
          // Only update if this request hasn't been cancelled AND component is still mounted
          if (!abortController.signal.aborted && isMountedRef.current) {
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
          // Only update if this request hasn't been cancelled AND component is still mounted
          if (!abortController.signal.aborted && isMountedRef.current) {
            clearTimeout(timeoutId)
            debugWarn('Error loading Wikipedia content:', err)
            const errorMessage = err.message || 'Failed to load Wikipedia content'
            setWikipediaError(errorMessage.includes('timeout') 
              ? 'Wikipedia loading timed out. Please try again.' 
              : errorMessage)
          }
        })
        .finally(() => {
          // Only update if this request hasn't been cancelled AND component is still mounted
          if (!abortController.signal.aborted && isMountedRef.current) {
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
    debugLog('[Gallery Debug] retryGallery called')
    if (album && album.albumId) {
      debugLog('[Gallery Debug] Retry - Clearing error, setting loading to true')
      setGalleryError(null)
      setLoadingGallery(true)
      const abortController = new AbortController()
      
      debugLog('[Gallery Debug] Retry - Calling fetchAllAlbumArt with albumId:', album.albumId)
      fetchAllAlbumArt(album.albumId, abortController.signal)
        .then(images => {
          debugLog('[Gallery Debug] Retry SUCCESS - images received:', images.length)
          if (!abortController.signal.aborted && isMountedRef.current) {
            debugLog('[Gallery Debug] Retry - Setting galleryImages to:', images.length)
            setGalleryImages(images)
            setGalleryError(null)
            debugLog('[Gallery Debug] Retry - State after success: images:', images.length, 'error:', null)
          } else {
            debugLog('[Gallery Debug] Retry - Request was aborted or component unmounted')
          }
        })
        .catch(err => {
          debugLog('[Gallery Debug] Retry ERROR:', err)
          debugLog('[Gallery Debug] Retry ERROR name:', err.name)
          debugLog('[Gallery Debug] Retry ERROR message:', err.message)
          debugLog('[Gallery Debug] Retry ERROR stack:', err.stack)
          if (!abortController.signal.aborted && isMountedRef.current) {
            debugWarn('Error loading gallery images:', err)
            // Show more detailed error message for debugging
            const errorMsg = err.message || 'Failed to load album art gallery'
            const detailedError = `${errorMsg} (${err.name || 'Unknown error'})`
            debugLog('[Gallery Debug] Retry - Setting galleryError to:', detailedError)
            setGalleryError(detailedError)
          } else {
            debugLog('[Gallery Debug] Retry - Request was aborted or component unmounted, not setting error')
          }
        })
        .finally(() => {
          debugLog('[Gallery Debug] Retry finally() - Setting loadingGallery to false')
          if (!abortController.signal.aborted && isMountedRef.current) {
            setLoadingGallery(false)
          }
        })
    } else {
      debugLog('[Gallery Debug] Retry - No album or albumId available')
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
          if (!abortController.signal.aborted && isMountedRef.current) {
            if (content) {
              setWikipediaContent(content)
              setWikipediaError(null)
            } else {
              setWikipediaError(null)
            }
          }
        })
        .catch(err => {
          if (!abortController.signal.aborted && isMountedRef.current) {
            debugWarn('Error loading Wikipedia content:', err)
            setWikipediaError(err.message || 'Failed to load Wikipedia content')
          }
        })
        .finally(() => {
          if (!abortController.signal.aborted && isMountedRef.current) {
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
  
  // Lightbox navigation functions
  const goToNextImage = () => {
    if (currentImageIndex !== null && galleryImages.length > 0) {
      const nextIndex = currentImageIndex + 1
      if (nextIndex < galleryImages.length) {
        setCurrentImageIndex(nextIndex)
        setSelectedImage(galleryImages[nextIndex])
      }
    }
  }
  
  const goToPreviousImage = () => {
    if (currentImageIndex !== null && galleryImages.length > 0) {
      const prevIndex = currentImageIndex - 1
      if (prevIndex >= 0) {
        setCurrentImageIndex(prevIndex)
        setSelectedImage(galleryImages[prevIndex])
      }
    }
  }
  
  // Swipe gesture handlers
  const swipeStartRef = useRef(null)
  const swipeDistanceRef = useRef(0)
  
  const handleTouchStart = (e) => {
    if (galleryImages.length <= 1) return
    const touch = e.touches[0]
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
    swipeDistanceRef.current = 0
  }
  
  const handleTouchMove = (e) => {
    if (!swipeStartRef.current || galleryImages.length <= 1) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeStartRef.current.x
    const deltaY = touch.clientY - swipeStartRef.current.y
    
    // Only prevent default if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault()
    }
    
    swipeDistanceRef.current = deltaX
  }
  
  const handleTouchEnd = (e) => {
    if (!swipeStartRef.current || galleryImages.length <= 1) {
      swipeStartRef.current = null
      swipeDistanceRef.current = 0
      return
    }
    
    const swipeThreshold = 50 // Minimum pixels for swipe
    const distance = swipeDistanceRef.current
    
    if (Math.abs(distance) > swipeThreshold) {
      if (distance > 0) {
        // Swiped right - go to previous
        goToPreviousImage()
      } else {
        // Swiped left - go to next
        goToNextImage()
      }
    }
    
    swipeStartRef.current = null
    swipeDistanceRef.current = 0
  }
  
  // Mouse drag handlers for desktop trackpad
  const handleMouseDown = (e) => {
    if (galleryImages.length <= 1) return
    swipeStartRef.current = { x: e.clientX, y: e.clientY }
    swipeDistanceRef.current = 0
  }
  
  const handleMouseMove = (e) => {
    if (!swipeStartRef.current || galleryImages.length <= 1) return
    const deltaX = e.clientX - swipeStartRef.current.x
    swipeDistanceRef.current = deltaX
  }
  
  const handleMouseUp = (e) => {
    if (!swipeStartRef.current || galleryImages.length <= 1) {
      swipeStartRef.current = null
      swipeDistanceRef.current = 0
      return
    }
    
    const swipeThreshold = 50
    const distance = swipeDistanceRef.current
    
    if (Math.abs(distance) > swipeThreshold) {
      if (distance > 0) {
        goToPreviousImage()
      } else {
        goToNextImage()
      }
    }
    
    swipeStartRef.current = null
    swipeDistanceRef.current = 0
  }
  
  const handleMouseLeave = () => {
    swipeStartRef.current = null
    swipeDistanceRef.current = 0
  }
  
  // Keyboard navigation
  useEffect(() => {
    if (!selectedImage || galleryImages.length <= 1) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentImageIndex !== null && currentImageIndex > 0) {
          const prevIndex = currentImageIndex - 1
          setCurrentImageIndex(prevIndex)
          setSelectedImage(galleryImages[prevIndex])
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentImageIndex !== null && currentImageIndex < galleryImages.length - 1) {
          const nextIndex = currentImageIndex + 1
          setCurrentImageIndex(nextIndex)
          setSelectedImage(galleryImages[nextIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedImage(null)
        setCurrentImageIndex(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, currentImageIndex, galleryImages])
  
  // Show help section (replaces all other views)
  if (showHelp) {
    return <Help onClose={handleCloseHelp} />
  }
  
  // Show search form (initial state or after "New Search")
  if (!album && !searchResults && !loadingAlbum) {
    return (
      <div className="album-page">
        <div className="album-container">
          <div className={`search-description ${searchType === 'producer' ? 'producer-search-description' : ''}`}>
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
                <div className="input-with-clear">
                  <input
                    id="artist-name"
                    type="text"
                    value={searchArtist}
                    onChange={(e) => setSearchArtist(e.target.value)}
                    placeholder="e.g., David Bowie"
                    disabled={searching}
                    required
                  />
                  {searchArtist && (
                    <button
                      type="button"
                      className="clear-input-button"
                      onClick={() => setSearchArtist('')}
                      disabled={searching}
                      aria-label="Clear artist name"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="search-field">
                <label htmlFor="album-name">Album Name <span className="optional-label">(optional)</span></label>
                <div className="input-with-clear">
                  <input
                    id="album-name"
                    type="text"
                    value={searchAlbum}
                    onChange={(e) => setSearchAlbum(e.target.value)}
                    placeholder={albumPlaceholder}
                    disabled={searching}
                  />
                  {searchAlbum && (
                    <button
                      type="button"
                      className="clear-input-button"
                      onClick={() => setSearchAlbum('')}
                      disabled={searching}
                      aria-label="Clear album name"
                    >
                      ×
                    </button>
                  )}
                </div>
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
                  <div className="input-with-clear">
                    <input
                      id="producer-name"
                      type="text"
                      value={searchProducer}
                      onChange={(e) => setSearchProducer(e.target.value)}
                      placeholder="e.g., Quincy Jones"
                      disabled={searching || !!multipleProducerMatches}
                      required
                    />
                    {searchProducer && (
                      <button
                        type="button"
                        className="clear-input-button"
                        onClick={() => setSearchProducer('')}
                        disabled={searching || !!multipleProducerMatches}
                        aria-label="Clear producer name"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={searching || !!multipleProducerMatches}
                >
                  {searching && searchType === 'producer'
                    ? <>Searching music archives<span className="animated-ellipsis">...</span></>
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
          <div className="help-link-container">
            <button className="help-link" onClick={handleOpenHelp}>
              Help
            </button>
            <span className="help-link-separator">|</span>
            <a href="mailto:vibeycraft@gmail.com?subject=Vibey Music Looper Feedback" className="help-link">
              Feedback
            </a>
          </div>
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
          <button 
            className="back-link"
            onClick={handleBackNavigation}
            style={{ marginBottom: '1rem', display: 'block' }}
          >
            ← Back
          </button>
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
                    debugLog('[Previous Button] Clicked!', {
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
                      debugLog('[Previous Button] Button is disabled (loading), click ignored')
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
                      return <>Page 1 • Loading more<span className="animated-ellipsis">...</span></>
                    }
                    
                    // Normal pagination display
                    return <>Page {resultsPage} of {totalPages}</>
                  })()}
                </span>
                <button
                  className="pagination-button pagination-next"
                  onClick={() => {
                    debugLog('[Next Button] Clicked! canGoNext() =', canGoNext())
                    if (canGoNext()) {
                      handlePageChange('next')
                    } else {
                      debugLog('[Next Button] Button is disabled, click ignored')
                    }
                  }}
                  disabled={!canGoNext()}
                >
                  {loadingPage ? <>Loading<span className="animated-ellipsis">...</span></> : 'Next'}
                </button>
              </div>
            )}
          </section>
          <div className="help-link-container">
            <button className="help-link" onClick={handleOpenHelp}>
              Help
            </button>
            <span className="help-link-separator">|</span>
            <a href="mailto:vibeycraft@gmail.com?subject=Vibey Music Looper Feedback" className="help-link">
              Feedback
            </a>
          </div>
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
            {/* Hide "Back to Search Results" on desktop - browser back button is sufficient */}
            {(isMobile || !searchResults || searchResults.length === 0) && (
              <button 
                className="new-search-button"
                onClick={handleNewSearch}
              >
                {searchResults && searchResults.length > 0 ? 'Back to Search Results' : 'New Search'}
              </button>
            )}
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
          {/* Hide "Back to Search Results" on desktop - browser back button is sufficient */}
          {(isMobile || !searchResults || searchResults.length === 0) && (
            <button 
              className="new-search-button"
              onClick={handleNewSearch}
            >
              {searchResults && searchResults.length > 0 ? 'Back to Search Results' : 'New Search'}
            </button>
          )}
        </div>
      </div>
    )
  }
  
  const albumCredits = album.credits?.albumCredits || []
  const trackCredits = album.credits?.trackCredits || {}
  
  // Debug: Log album credits to console
  debugLog('Album credits data:', albumCredits)
  debugLog('Album credits object:', album.credits)
  
  return (
    <div className="album-page">
      <div className="album-container">
        <button 
          className="back-link"
          onClick={handleBackNavigation}
          style={{ marginBottom: '1rem', display: 'block' }}
        >
          ← Back
        </button>
        {/* Hide "Back to Search Results" on desktop - browser back button is sufficient */}
        {(isMobile || !searchResults || searchResults.length === 0) && (
          <button 
            className="new-search-button"
            onClick={handleNewSearch}
            style={{ marginBottom: '2rem' }}
          >
            {searchResults && searchResults.length > 0 ? 'Back to Search Results' : 'New Search'}
          </button>
        )}
        
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

        {/* Album Art Gallery - Show if we have images, are loading, have error, or successfully checked (no images) */}
        {(() => {
          // Show gallery section if:
          // - We have images, OR
          // - We're loading, OR
          // - We have an error, OR
          // - We've finished loading and have no images (successfully checked, no art available)
          const shouldRender = galleryImages.length > 0 || loadingGallery || galleryError || (!loadingGallery && !galleryError && album !== null)
          debugLog('[Gallery Debug] Conditional render check:')
          debugLog('[Gallery Debug]   galleryImages.length:', galleryImages.length)
          debugLog('[Gallery Debug]   loadingGallery:', loadingGallery)
          debugLog('[Gallery Debug]   galleryError:', galleryError)
          debugLog('[Gallery Debug]   album:', album !== null)
          debugLog('[Gallery Debug]   shouldRender:', shouldRender)
          return shouldRender
        })() && (
          <section className="album-art-gallery-section">
            <div className="gallery-header">
              <h2>Album Art Gallery</h2>
              {(() => {
                // Show button only if we have images or are loading (not for empty state or error)
                const shouldShowButton = !galleryError && (galleryImages.length > 0 || loadingGallery)
                debugLog('[Gallery Debug] Button visibility check:')
                debugLog('[Gallery Debug]   galleryError:', galleryError)
                debugLog('[Gallery Debug]   galleryImages.length:', galleryImages.length)
                debugLog('[Gallery Debug]   loadingGallery:', loadingGallery)
                debugLog('[Gallery Debug]   shouldShowButton:', shouldShowButton)
                return shouldShowButton
              })() && (
                <button
                  className="gallery-toggle-button"
                  onClick={() => {
                    debugLog('[Gallery Debug] Button clicked - galleryExpanded was:', galleryExpanded)
                    setGalleryExpanded(!galleryExpanded)
                    debugLog('[Gallery Debug] Button clicked - galleryExpanded now:', !galleryExpanded)
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
              // Show content if:
              // - No error AND (expanded OR no images to show message directly)
              const shouldShowContent = !galleryError && (galleryExpanded || galleryImages.length === 0)
              debugLog('[Gallery Debug] Gallery content render check:')
              debugLog('[Gallery Debug]   galleryError:', galleryError)
              debugLog('[Gallery Debug]   galleryExpanded:', galleryExpanded)
              debugLog('[Gallery Debug]   galleryImages.length:', galleryImages.length)
              debugLog('[Gallery Debug]   shouldShowContent:', shouldShowContent)
              return shouldShowContent
            })() && (
              <div className="gallery-content">
                {loadingGallery ? (
                  <div className="gallery-loading">Loading album art...</div>
                ) : galleryImages.length === 0 ? (
                  <div className="gallery-empty">No album art available for this title.</div>
                ) : (
                  <div className="gallery-grid">
                    {(() => {
                      debugLog('[Gallery Debug] Rendering gallery grid with', galleryImages.length, 'images')
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
                            const imageIndex = galleryImages.findIndex(g => g.id === img.id || g.image === img.image)
                            setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0)
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
            onClick={() => {
              setSelectedImage(null)
              setCurrentImageIndex(null)
            }}
          >
            <div 
              className="lightbox-content" 
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                className="lightbox-close"
                onClick={() => {
                  setSelectedImage(null)
                  setCurrentImageIndex(null)
                }}
                aria-label="Close"
              >
                ×
              </button>
              
              {/* Navigation buttons */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    className="lightbox-nav lightbox-nav-prev"
                    onClick={goToPreviousImage}
                    disabled={currentImageIndex === 0}
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    className="lightbox-nav lightbox-nav-next"
                    onClick={goToNextImage}
                    disabled={currentImageIndex === galleryImages.length - 1}
                    aria-label="Next image"
                  >
                    →
                  </button>
                </>
              )}
              
              <img
                src={selectedImage.image}
                alt={selectedImage.types?.join(', ') || 'Album art'}
                onError={(e) => {
                  debugWarn('Failed to load full-size image:', selectedImage.image)
                  e.target.style.display = 'none'
                }}
              />
              
              {/* Caption and counter */}
              <div className="lightbox-footer">
                {selectedImage.types && selectedImage.types.length > 0 && (
                  <div className="lightbox-caption">
                    {selectedImage.types.join(', ')}
                  </div>
                )}
                {galleryImages.length > 1 && (
                  <div className="lightbox-counter">
                    Image {currentImageIndex !== null ? currentImageIndex + 1 : 1} of {galleryImages.length}
                  </div>
                )}
              </div>
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
                className="track-credit-title-button album-credit-title-button"
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
        <div className="help-link-container">
          <button className="help-link" onClick={handleOpenHelp}>
            Help
          </button>
          <span className="help-link-separator">|</span>
          <a href="mailto:vibeycraft@gmail.com?subject=Vibey Music Looper Feedback" className="help-link">
            Feedback
          </a>
        </div>
      </div>
    </div>
  )
}

export default AlbumPage
