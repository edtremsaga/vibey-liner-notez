import { useState, useEffect } from 'react'
import { fetchAlbumData } from '../services/musicbrainz'
import { formatDuration } from '../utils/formatDuration'
import './AlbumPage.css'

// Hardcoded Release Group MBID for Aladdin Sane
const ALADDIN_SANE_MBID = '50f8710f-3ae6-319b-85a7-afe783f13449'

function AlbumPage() {
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAlbum() {
      setLoading(true)
      setError(null)
      
      try {
        const albumData = await fetchAlbumData(ALADDIN_SANE_MBID)
        setAlbum(albumData)
      } catch (err) {
        console.error('Error fetching album data:', err)
        setError(err.message || 'Failed to load album data from MusicBrainz')
      } finally {
        setLoading(false)
      }
    }

    loadAlbum()
  }, [])

  if (loading) {
    return (
      <div className="album-page">
        <div className="loading">Loading album from MusicBrainz...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="album-page">
        <div className="error">
          <h2>Error Loading Album</h2>
          <p>{error}</p>
          <p>Please check your internet connection and try again.</p>
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="album-page">
        <div className="error">No album data available</div>
      </div>
    )
  }

  const albumCredits = album.credits?.albumCredits || []
  const trackCredits = album.credits?.trackCredits || {}

  return (
    <div className="album-page">
      <div className="album-container">
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
              {album.editions.map((edition) => (
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
          </section>
        )}

        {/* Tracklist */}
        {album.tracks && album.tracks.length > 0 && (
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

                return (
                  <div key={track.trackId} className="track-credits">
                    <h4 className="track-credit-title">{track.title}</h4>
                    
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
        </section>
      </div>
    </div>
  )
}

export default AlbumPage
