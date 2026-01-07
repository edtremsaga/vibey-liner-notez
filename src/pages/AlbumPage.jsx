import { useState, useEffect } from 'react'
import { fetchAlbumData, fetchAlbumBasicInfo, searchReleaseGroups, fetchCoverArt, fetchAllAlbumArt, fetchWikipediaContentFromMusicBrainz } from '../services/musicbrainz'
import { formatDuration } from '../utils/formatDuration'
import { getCachedAlbum, setCachedAlbum } from '../utils/albumCache'
import Help from '../components/Help'
import './AlbumPage.css'

function AlbumPage() {
  // Search state
  const [searchArtist, setSearchArtist] = useState('')
  const [searchAlbum, setSearchAlbum] = useState('')
  const [releaseType, setReleaseType] = useState('Album') // Default to Album
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [searchMeta, setSearchMeta] = useState(null) // { totalCount, isArtistOnly, releaseType }
  const [displayedResults, setDisplayedResults] = useState([])
  const [resultsPage, setResultsPage] = useState(1)
  const [sortOption, setSortOption] = useState('newest') // 'newest', 'oldest', 'title-az', 'title-za'
  const [loadingPage, setLoadingPage] = useState(false) // Loading state for pagination
  const [fetchedCount, setFetchedCount] = useState(0) // Track how many results have been fetched from API
  const [hideBootlegs, setHideBootlegs] = useState(false) // Filter to hide bootleg records
  const [albumPlaceholder, setAlbumPlaceholder] = useState('e.g., Aladdin Sane (leave blank to see all albums)')
  const RESULTS_PER_PAGE = 20
  
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
  
  // Help section state
  const [showHelp, setShowHelp] = useState(false)
  
  // Get heading text based on release type
  function getResultsHeading(releaseType) {
    const headingMap = {
      'Album': 'Studio Albums Found',
      'EP': 'EPs Found',
      'Single': 'Singles Found',
      'Live': 'Live Albums Found',
      'Compilation': 'Compilations Found',
      'Soundtrack': 'Soundtracks Found'
    }
    return headingMap[releaseType] || 'Studio Albums Found'
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

  // Handle search form submission
  async function handleSearch(e) {
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
        
        // Mobile browser fix: Use replaceState on iOS to preserve history
        // Desktop browsers: Use pushState (works fine on desktop)
        const isMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
        
        if (isMobile) {
          // Mobile iOS fix: Replace current history entry instead of pushing new one
          // This preserves the initial page in history so back button works correctly
          console.log('[History] Mobile iOS detected - using replaceState for search results')
          window.history.replaceState(
            { fromSearch: true },
            '',
            window.location.href
          )
        } else {
          // Desktop: Push new history entry (current behavior works fine)
          console.log('[History] Desktop detected - using pushState for search results')
          window.history.pushState(
            { fromSearch: true },
            '',
            window.location.href
          )
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
    if (!searchResults || !searchMeta || !searchMeta.totalCount || searchMeta.totalCount <= 0) return 1
    const filteredResults = filterBootlegs(searchResults)
    const filteredCount = hideBootlegs ? filteredResults.length : searchMeta.totalCount
    const total = Math.ceil(filteredCount / RESULTS_PER_PAGE)
    return Math.max(1, total) // Ensure at least 1 page
  }
  
  function getFilteredCount() {
    if (!searchResults || !searchMeta) return searchMeta?.totalCount || 0
    if (!hideBootlegs) return searchMeta.totalCount
    const filteredResults = filterBootlegs(searchResults)
    return filteredResults.length
  }
  
  // Navigate to a specific page (handles both Previous and Next)
  async function handlePageChange(direction) {
    if (!searchResults || !searchMeta || loadingPage) return
    
    const calculatedTotalPages = getTotalPages()
    let targetPage
    
    if (direction === 'next') {
      if (resultsPage >= calculatedTotalPages) return
      targetPage = resultsPage + 1
    } else if (direction === 'prev') {
      if (resultsPage <= 1) return
      targetPage = resultsPage - 1
    } else {
      return
    }
    
    // Calculate end index based on filtered results
    const filteredResults = filterBootlegs(searchResults)
    const filteredCount = hideBootlegs ? filteredResults.length : searchMeta.totalCount
    const startIndex = (targetPage - 1) * RESULTS_PER_PAGE
    const endIndex = Math.min(startIndex + RESULTS_PER_PAGE, filteredCount)
    
    // Check if we need to fetch more from API
    if (endIndex > searchResults.length) {
      setLoadingPage(true)
      
      try {
        const albumName = searchAlbum.trim() || null
        const typeFilter = albumName ? null : releaseType
        const nextOffset = fetchedCount
        
        const searchResponse = await searchReleaseGroups(
          searchArtist.trim(), 
          albumName, 
          typeFilter, 
          nextOffset
        )
        
        const { results: newResults } = searchResponse
        
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
      const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, filteredResults.length)
      const pageResults = filteredResults.slice(pageStart, pageEnd)
      
      setDisplayedResults(pageResults)
      setResultsPage(targetPage)
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
      
      // Case 4: On search results page (no album) → return to main search page
      if (!album && searchResults && searchResults.length > 0) {
        // Clear search results and return to main search form
        setSearchResults(null)
        setSearchMeta(null)
        setDisplayedResults([])
        setResultsPage(1)
        setFetchedCount(0)
        setSearchError(null)
        // Keep search form values so user can see what they searched for
        // (Don't clear searchArtist, searchAlbum, releaseType)
        return
      }
      
      // Case 5: No special handling needed, let browser handle normally
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [searchResults, album, showHelp, selectedImage]) // Re-run when searchResults, album, showHelp, or selectedImage changes
  
  // Fetch gallery images in background after album loads
  useEffect(() => {
    if (album && album.albumId) {
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
        abortController.abort()
      }, TIMEOUT_MS)
      
      // Fetch gallery images in background with timeout
      setLoadingGallery(true)
      setGalleryError(null)
      
      fetchAllAlbumArt(album.albumId, abortController.signal)
        .then(images => {
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            setGalleryImages(images)
            setGalleryError(null)
          }
        })
        .catch(err => {
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            console.warn('Error loading gallery images:', err)
            const errorMessage = err.message || 'Failed to load album art gallery'
            setGalleryError(errorMessage.includes('timeout') 
              ? 'Gallery loading timed out. Please try again.' 
              : errorMessage)
          }
        })
        .finally(() => {
          // Only update if this request hasn't been cancelled
          if (!abortController.signal.aborted) {
            clearTimeout(timeoutId)
            setLoadingGallery(false)
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
    if (album && album.albumId) {
      setGalleryError(null)
      setLoadingGallery(true)
      const abortController = new AbortController()
      
      fetchAllAlbumArt(album.albumId, abortController.signal)
        .then(images => {
          if (!abortController.signal.aborted) {
            setGalleryImages(images)
            setGalleryError(null)
          }
        })
        .catch(err => {
          if (!abortController.signal.aborted) {
            console.warn('Error loading gallery images:', err)
            setGalleryError(err.message || 'Failed to load album art gallery')
          }
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setLoadingGallery(false)
          }
        })
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
    setShowHelp(true)
    // Push browser history entry so back button works
    window.history.pushState(
      { fromHelp: true },
      '',
      window.location.href
    )
  }
  
  // Function to close help section
  function handleCloseHelp() {
    setShowHelp(false)
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
              <span className="search-description-short">Search by artist to explore album focused liner note information</span>
              <span className="search-description-long"> — personnel, recording details, album art, and historical facts all sourced from documented music archives.</span>
            </p>
          </div>
          <section className="search-section">
            <h1 className="search-title">Search for an Album</h1>
            <form onSubmit={handleSearch} className="search-form">
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
                  <label>Release Type</label>
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
          </section>
          <p className="search-description-note">ⓘ Album information only — no audio playback or streaming</p>
          <div className="help-link-container">
            <button className="help-link" onClick={handleOpenHelp}>
              Help
            </button>
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
          <section className="search-results-section">
            <div className="search-results-header">
              <h2>{getResultsHeading(searchMeta?.releaseType || 'Album')}</h2>
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
                    Showing {displayedResults.length} of {getFilteredCount()} {getReleaseTypePlural(searchMeta.releaseType || 'Album')}
                    {hideBootlegs && searchMeta.totalCount > getFilteredCount() && (
                      <span className="filter-note">
                        {' '}({searchMeta.totalCount - getFilteredCount()} bootlegs hidden)
                      </span>
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
                  onClick={() => handlePageChange('prev')}
                  disabled={resultsPage <= 1 || loadingPage}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {resultsPage} of {getTotalPages()}
                </span>
                <button
                  className="pagination-button pagination-next"
                  onClick={() => handlePageChange('next')}
                  disabled={resultsPage >= getTotalPages() || loadingPage}
                >
                  {loadingPage ? 'Loading...' : 'Next'}
                </button>
              </div>
            )}
          </section>
          <div className="help-link-container">
            <button className="help-link" onClick={handleOpenHelp}>
              Help
            </button>
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
        {(galleryImages.length > 0 || loadingGallery || galleryError) && (
          <section className="album-art-gallery-section">
            <div className="gallery-header">
              <h2>Album Art Gallery</h2>
              {!galleryError && (
                <button
                  className="gallery-toggle-button"
                  onClick={() => setGalleryExpanded(!galleryExpanded)}
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
                <button 
                  className="error-retry-button"
                  onClick={retryGallery}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : galleryExpanded && (
              <div className="gallery-content">
                {loadingGallery ? (
                  <div className="gallery-loading">Loading album art...</div>
                ) : galleryImages.length === 0 ? (
                  <div className="gallery-empty">No additional album art available.</div>
                ) : (
                  <div className="gallery-grid">
                    {galleryImages.map((img, index) => {
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
                    })}
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
        <div className="help-link-container">
          <button className="help-link" onClick={() => setShowHelp(true)}>
            Help
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlbumPage
