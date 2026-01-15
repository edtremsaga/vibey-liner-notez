import './Help.css'

function Help({ onClose }) {
  return (
    <div className="help-page">
      <div className="help-container">
        <button className="help-close-button" onClick={onClose}>
          ← Back
        </button>
        
        <h1 className="help-title">liner notez - Help Guide</h1>
        
        <section className="help-section">
          <h2>What is liner notez?</h2>
          <p>liner notez helps you rediscover albums the way they were meant to be experienced. Search by artist to explore album focused liner note information — personnel, recording details, album art, and historical facts all sourced from documented music archives.</p>
          <p className="help-note">ⓘ <strong>Album information only — no audio playback or streaming.</strong></p>
        </section>

        <section className="help-section">
          <h2>Getting Started</h2>
          
          <h3>Searching for Albums</h3>
          <ol>
            <li><strong>Enter an Artist Name</strong> (required)
              <ul>
                <li>Type the name of the artist you want to explore</li>
                <li>Example: "David Bowie"</li>
              </ul>
            </li>
            <li><strong>Enter an Album Name</strong> (optional)
              <ul>
                <li>Leave blank to see all albums by the artist</li>
                <li>Or enter a specific album name to find that album directly</li>
                <li>Example: "Aladdin Sane"</li>
              </ul>
            </li>
            <li><strong>Select a Release Type</strong> (only shown when album name is blank)
              <ul>
                <li><strong>Studio Albums</strong>: Original studio recordings (excludes Live, Compilation, Soundtrack)</li>
                <li><strong>EPs</strong>: Extended play releases</li>
                <li><strong>Singles</strong>: Single releases</li>
                <li><strong>Live Albums</strong>: Live recordings</li>
                <li><strong>Compilations</strong>: Compilation albums</li>
                <li><strong>Soundtracks</strong>: Soundtrack albums</li>
              </ul>
            </li>
            <li><strong>Click Search</strong> to find albums</li>
          </ol>

          <h3>Searching by Producer</h3>
          <p>Find all albums produced by a specific producer:</p>
          <ol>
            <li><strong>Click the "Search by Producer" tab</strong> at the top of the search page</li>
            <li><strong>Enter a Producer Name</strong> (required)
              <ul>
                <li>Type the name of the producer you want to explore</li>
                <li>Example: "Quincy Jones", "Rick Rubin", "George Martin"</li>
              </ul>
            </li>
            <li><strong>If multiple producers match your search</strong>:
              <ul>
                <li>You'll see a list of matching producers</li>
                <li>Click on the correct producer to view their albums</li>
                <li>Producers are distinguished by location, type, or other identifiers</li>
              </ul>
            </li>
            <li><strong>Click Search</strong> to find albums produced by that person</li>
          </ol>
          
          <p className="help-note">ⓘ <strong>Note:</strong> Producer search finds albums where the producer is credited with any producer role (producer, executive producer, co-producer, etc.). Results may vary depending on how producer credits are documented in music archives.</p>

          <h3>Viewing Search Results</h3>
          <p>Search results display:</p>
          <ul>
            <li>Album cover art</li>
            <li>Album title</li>
            <li>Artist name</li>
            <li>Release year (when available)</li>
          </ul>
          
          <p><strong>Sorting Options</strong>:</p>
          <ul>
            <li><strong>Newest</strong>: Albums sorted by release year, newest first</li>
            <li><strong>Oldest</strong>: Albums sorted by release year, oldest first</li>
            <li><strong>Title A-Z</strong>: Albums sorted alphabetically by title</li>
            <li><strong>Title Z-A</strong>: Albums sorted reverse alphabetically by title</li>
          </ul>
          
          <p><strong>Filtering</strong>:</p>
          <ul>
            <li><strong>Hide bootlegs</strong>: Check this box to exclude bootleg releases from results</li>
          </ul>
          
          <p><strong>Pagination</strong>:</p>
          <ul>
            <li>Use "Previous" and "Next" buttons to navigate through multiple pages</li>
            <li>Each page shows 20 results</li>
            <li>Page indicator shows "Page X of Y"</li>
          </ul>
          
          <p><strong>Click any album</strong> to view its detailed information</p>
        </section>

        <section className="help-section">
          <h2>Album Detail Page</h2>
          <p>When you click on an album from search results, you'll see comprehensive information:</p>
          
          <h3>Wikipedia Summary</h3>
          <p>Brief overview of the album from Wikipedia, including historical context, recording details, and critical reception. Includes a link to read the full Wikipedia article.</p>
          
          <h3>Album Identity</h3>
          <p>Album cover art, title, artist name, and release year. The album identity section stays visible at the top when scrolling through the page.</p>
          
          <h3>Album Art Gallery</h3>
          <p>Browse all available album art images for the album. Click "View all album art" to expand the gallery, then click any image to view it in a lightbox. Limited to 20 images per album.</p>
          
          <h3>Editions</h3>
          <p>Complete list of all physical and digital editions of the album, showing release status, country, date, label, catalog number, and barcode. Click "Show all X editions" to expand the complete list.</p>
          
          <h3>Tracklist</h3>
          <p>Complete list of tracks with position/number, title, duration, songwriting credits (writers, composers, lyricists), and publishing information.</p>
          
          <h3>Credits</h3>
          <p><strong>Album Credits</strong> (expanded by default):</p>
          <p>Personnel who worked on the album as a whole, including producers, engineers, musicians, and other contributors. Click the "Album" header to collapse/expand.</p>
          
          <p><strong>Track Credits</strong>:</p>
          <p>Individual credits for each track, showing performers, instruments, and production roles. Click on any track title to expand and see its credits.</p>
        </section>

        <section className="help-section">
          <h2>Navigation</h2>
          
          <h3>Browser Back Button</h3>
          <ul>
            <li><strong>From Album Detail Page</strong>: Returns to search results (if you came from search)</li>
            <li><strong>From Search Results</strong>: Returns to the main search page</li>
            <li><strong>From Main Search</strong>: Normal browser behavior</li>
            <li>Works on most browsers and devices (MacBook Safari/Chrome, iPhone Safari, etc.)</li>
          </ul>
          
          <h3>"← Back" Link (iPhone Chrome)</h3>
          <p>A visible "← Back" link appears at the top of the page when using Chrome on iPhone. This provides a reliable way to navigate back if the browser's back button doesn't work as expected.</p>
          <ul>
            <li><strong>Where it appears</strong>: Results page and Album Detail page (iPhone Chrome only)</li>
            <li><strong>How it works</strong>: Click the link to go back to the previous page</li>
            <li>Automatically appears only on iPhone Chrome for better navigation reliability</li>
          </ul>
          
          <h3>"Back to Search Results" / "New Search" Button (Mobile)</h3>
          <ul>
            <li><strong>On Album Detail Page (Mobile)</strong>: Returns to your search results</li>
            <li><strong>On Search Results Page (Mobile)</strong>: Clears search and returns to main search form</li>
            <li>This button is only visible on mobile devices</li>
            <li>On desktop, use the browser back button instead</li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Tips & Best Practices</h2>
          
          <h3>Getting Better Search Results</h3>
          <ul>
            <li>Use the artist's full name as it appears in music databases</li>
            <li>For specific albums, enter both artist and album name for best results</li>
            <li>If you don't see expected results, try variations of the artist name</li>
          </ul>
          
          <h3>Understanding Release Types</h3>
          <ul>
            <li><strong>Studio Albums</strong> shows only original studio recordings, excluding live albums, compilations, and soundtracks</li>
            <li>Use release type filters to narrow results when searching for a specific type</li>
            <li>Bootleg releases can be filtered out using the "Hide bootlegs" checkbox</li>
          </ul>
          
          <h3>Data Sources</h3>
          <ul>
            <li>Album information: <strong>MusicBrainz</strong> (community-maintained music database)</li>
            <li>Cover art: <strong>Cover Art Archive</strong></li>
            <li>Wikipedia summaries: <strong>Wikipedia</strong></li>
            <li>All data is sourced from documented music archives</li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Frequently Asked Questions</h2>
          
          <div className="help-faq">
            <p><strong>Q: Why don't I see audio playback or streaming?</strong></p>
            <p>A: liner notez focuses exclusively on album information and liner notes. We don't provide audio playback or streaming services.</p>
          </div>
          
          <div className="help-faq">
            <p><strong>Q: Why are some albums missing release years?</strong></p>
            <p>A: Some older or bootleg releases may not have documented release dates in the music archives.</p>
          </div>
          
          <div className="help-faq">
            <p><strong>Q: Why don't all albums have Wikipedia summaries?</strong></p>
            <p>A: Wikipedia summaries are only available for albums that have Wikipedia articles linked through MusicBrainz/Wikidata.</p>
          </div>
          
          <div className="help-faq">
            <p><strong>Q: Can I search for songs instead of albums?</strong></p>
            <p>A: Currently, liner notez focuses on album-level information. Individual song searches are not supported.</p>
          </div>
          
          <div className="help-faq">
            <p><strong>Q: How do I report incorrect information?</strong></p>
            <p>A: Album data comes from MusicBrainz. To correct information, visit <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer">musicbrainz.org</a> and contribute corrections there.</p>
          </div>
          
          <div className="help-faq">
            <p><strong>Q: Why are some album covers missing?</strong></p>
            <p>A: Cover art availability depends on what's been uploaded to the Cover Art Archive. Not all releases have cover art available.</p>
          </div>
          
          <div className="help-faq">
            <p><strong>Q: How many album art images can I view?</strong></p>
            <p>A: The gallery shows up to 20 images per album to ensure good performance.</p>
          </div>
          
          <div className="help-faq">
            <p><strong>Q: Why do some albums load faster than others?</strong></p>
            <p>A: Previously viewed albums are cached locally in your browser for faster repeat views. First-time views fetch data from the MusicBrainz API.</p>
          </div>
        </section>

        <section className="help-section">
          <h2>Technical Information</h2>
          <ul>
            <li><strong>Data License</strong>: MusicBrainz data is CC0 (public domain)</li>
            <li><strong>Cover Art License</strong>: Cover Art Archive images are CC0</li>
            <li><strong>Wikipedia License</strong>: Wikipedia content is CC BY-SA</li>
            <li><strong>Cache</strong>: Album data is cached locally in your browser for faster repeat views (30-day expiration)</li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Need More Help?</h2>
          <p>For questions about the data:</p>
          <ul>
            <li><strong>MusicBrainz</strong>: <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer">musicbrainz.org</a></li>
            <li><strong>Cover Art Archive</strong>: <a href="https://coverartarchive.org" target="_blank" rel="noopener noreferrer">coverartarchive.org</a></li>
          </ul>
          <p>For feedback about liner notez:</p>
          <ul>
            <li><strong>Send Feedback</strong>: <a href="mailto:vibeycraft@gmail.com?subject=Vibey Music Looper Feedback">vibeycraft@gmail.com</a></li>
          </ul>
        </section>

        <div className="help-footer">
          <p><em>liner notez - Rediscover albums the way they were meant to be experienced.</em></p>
        </div>
      </div>
    </div>
  )
}

export default Help

