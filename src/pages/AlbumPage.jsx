import { useState } from 'react'
import { fetchAlbumData, fetchAlbumBasicInfo, searchReleaseGroups, fetchCoverArt } from '../services/musicbrainz'
import { formatDuration } from '../utils/formatDuration'
import './AlbumPage.css'

function AlbumPage() {
  // Search state
  const [searchArtist, setSearchArtist] = useState('')
  const [searchAlbum, setSearchAlbum] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchError, setSearchError] = useState(null)
  
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

  // Handle search form submission
  async function handleSearch(e) {
    e.preventDefault()
    
    if (!searchArtist.trim() || !searchAlbum.trim()) {
      setSearchError('Please enter both artist name and album name')
      return
    }
    
    setSearching(true)
    setSearchError(null)
    setSearchResults(null)
    setAlbum(null)
    setAlbumError(null)
    
    try {
      const results = await searchReleaseGroups(searchArtist.trim(), searchAlbum.trim())
      
      if (results.length === 0) {
        setSearchError('No album found. Please check spelling and try again.')
      } else if (results.length === 1) {
        // Single result - show basic info immediately, then load full album
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
        // Multiple results - show list
        setSearchResults(results)
      }
    } catch (err) {
      console.error('Error searching albums:', err)
      setSearchError(err.message || 'Failed to search albums. Please try again.')
    } finally {
      setSearching(false)
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
    
    setSearchResults(null)
    setEditionsExpanded(false) // Reset editions collapse state when loading new album
    setLoadingBasicInfo(false) // Basic info already shown from search results
    setLoadingTracklist(true)
    setLoadingCredits(false)
    
    try {
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
    } catch (err) {
      console.error('Error fetching album data:', err)
      setAlbumError(err.message || 'Failed to load album data from MusicBrainz')
    } finally {
      setLoadingAlbum(false)
      setLoadingBasicInfo(false)
      setLoadingTracklist(false)
      setLoadingCredits(false)
    }
  }
  
  // Return to search form
  function handleNewSearch() {
    setAlbum(null)
    setAlbumError(null)
    setSearchResults(null)
    setSearchError(null)
    setSearchArtist('')
    setSearchAlbum('')
    setExpandedTracks(new Set())
    setEditionsExpanded(false)
  }
  
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
  
  // Show search form (initial state or after "New Search")
  if (!album && !searchResults && !loadingAlbum) {
    return (
      <div className="album-page">
        <div className="album-container">
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
                <label htmlFor="album-name">Album Name</label>
                <input
                  id="album-name"
                  type="text"
                  value={searchAlbum}
                  onChange={(e) => setSearchAlbum(e.target.value)}
                  placeholder="e.g., Aladdin Sane"
                  disabled={searching}
                  required
                />
              </div>
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
        </div>
      </div>
    )
  }
  
  // Show loading state (searching or loading album)
  if (searching || loadingAlbum) {
    return (
      <div className="album-page">
        <div className="loading">
          {searching ? 'Searching for albums...' : 'Loading album from MusicBrainz...'}
        </div>
      </div>
    )
  }
  
  // Show search results list (multiple results)
  if (searchResults && searchResults.length > 1) {
    return (
      <div className="album-page">
        <div className="album-container">
          <section className="search-results-section">
            <h2>Multiple Albums Found</h2>
            <p className="results-count">Found {searchResults.length} matching albums. Please select one:</p>
            <ul className="results-list">
              {searchResults.map((result) => (
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
            <button 
              className="new-search-button"
              onClick={handleNewSearch}
            >
              New Search
            </button>
          </section>
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
              New Search
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
            New Search
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
          New Search
        </button>
        
        {/* Album Identity */}
        <section className="album-identity">
          {album.coverArtUrl && (
            <div className="cover-art">
              <img 
                src={album.coverArtUrl} 
                alt={`${album.title} cover`}
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
              <h3>Album</h3>
              <ul className="credits-list">
                {albumCredits.map((credit, idx) => (
                  <li key={idx} className="credit-item">
                    <span className="credit-name">{credit.personName}</span>
                    <span className="credit-role">{credit.role}</span>
                  </li>
                ))}
              </ul>
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
      </div>
    </div>
  )
}

export default AlbumPage
