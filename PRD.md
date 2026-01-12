# Product Requirements Document (PRD)
## liner notez v1

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Active Development

---

## 1. Product Overview

### 1.1 Product Vision
liner notez helps users rediscover albums the way they were meant to be experienced. The app provides comprehensive album-focused liner note information — personnel, recording details, album art, and historical facts — all sourced from documented music archives.

### 1.2 Key Principles
- **Album information only** — no audio playback or streaming
- **Data integrity** — no data invention; only use values from MusicBrainz API responses
- **Schema compliance** — all data must conform to `album.v1.json` schema
- **Missing data** = "not documented", not errors

### 1.3 Data Sources
- **Album information**: MusicBrainz (community-maintained music database, CC0 license)
- **Cover art**: Cover Art Archive (CC0 license)
- **Wikipedia summaries**: Wikipedia (CC BY-SA license)

---

## 2. Core Features

### 2.1 Album Search (Primary Use Case)

#### 2.1.1 Search Functionality
**User Flow**: Search for albums by artist name and optional album name

**Search Inputs**:
- **Artist Name** (required): Text input field
  - Examples: "David Bowie", "The Beatles"
- **Album Name** (optional): Text input field
  - If provided: Search for specific album
  - If blank: Show all albums by artist (filtered by release type)
  - Example: "Aladdin Sane"

**Release Type Filter** (only shown when album name is blank):
- **Studio Albums**: Original studio recordings (excludes Live, Compilation, Soundtrack)
- **EPs**: Extended play releases
- **Singles**: Single releases
- **Live Albums**: Live recordings
- **Compilations**: Compilation albums
- **Soundtracks**: Soundtrack albums

**Search Behavior**:
- Search button triggers API call to MusicBrainz
- Results displayed in paginated list (20 results per page)
- Results sorted by year (newest first) by default
- Bootleg releases can be filtered out

#### 2.1.2 Search Results Display
**Result Items Show**:
- Album cover art (when available)
- Album title
- Artist name
- Release year (when available)

**Sorting Options**:
- **Newest**: Albums sorted by release year, newest first
- **Oldest**: Albums sorted by release year, oldest first
- **Title A-Z**: Albums sorted alphabetically by title
- **Title Z-A**: Albums sorted reverse alphabetically by title

**Filtering**:
- **Hide bootlegs**: Checkbox to exclude bootleg releases from results

**Pagination**:
- "Previous" and "Next" buttons
- Each page shows 20 results
- Page indicator shows "Page X of Y"

#### 2.1.3 Navigation
- Click any album from results → Navigate to Album Detail Page
- Browser back button: Returns to search page (or search results if on detail page)
- "Back to Results" / "New Search" button:
  - On Album Detail Page: Returns to search results
  - On Search Results Page: Clears search and returns to main search form

---

### 2.2 Producer Search (Secondary Use Case)

#### 2.2.1 Search Functionality
**User Flow**: Search for albums by producer name

**Search Input**:
- **Producer Name** (required): Text input field
  - Examples: "Quincy Jones", "Rick Rubin", "George Martin"
  - User enters producer name to find all albums produced by that person

**Search Behavior**:
- **Relationship-based search**: Uses MusicBrainz relationship data (not indexed search)
- **Client-side filtering**: Filters relationships to find "producer" role (handles variants: "producer", "executive producer", "co-producer", etc.)
- **Implementation approach**:
  1. Find producer's MBID (MusicBrainz Identifier) via Artist Search API
  2. Fetch releases with artist relationships using `inc=artist-rels` parameter
  3. Client-side filter relationships array to find producer roles
  4. Group results by release-group to get albums

**Technical Requirements**:
- Must not assume MusicBrainz search API indexes producer credits
- Must use relationship-based queries with client-side filtering
- Must handle incomplete data gracefully (some releases may not have producer relationships)
- Must respect MusicBrainz rate limiting (1 request per second)

#### 2.2.2 Search Results Display
**Producer Search Results**:
- **Same result format as Album Search**: Reuses existing search results component
- **Result Items Show**:
  - Album cover art (when available)
  - Album title
  - Artist name
  - Release year (when available)
- **Future Enhancement** (optional): Show which producer(s) worked on each album in result list

**Sorting Options**:
- Same as Album Search: Newest, Oldest, Title A-Z, Title Z-A

**Filtering**:
- Same as Album Search: Hide bootlegs checkbox

**Pagination**:
- Same as Album Search: 20 results per page

#### 2.2.3 Navigation
- **Same navigation flow as Album Search**:
  - Click any album from results → Navigate to Album Detail Page (same component)
  - Browser back button: Returns to producer search page (or results if on detail page)
  - "Back to Results" / "New Search" button: Returns to producer search form or results

#### 2.2.4 User Interface
- **Separate search page**: Producer search has its own dedicated page (separate from Album Search)
- **Navigation pattern**: Tab navigation or link button to switch between "Search Albums" and "Search by Producer"
- **Mobile optimization**: Producer search page must be optimized for mobile (no scrolling required, similar to Album Search)

---

### 2.3 Album Detail Page

#### 2.3.1 Overview
Comprehensive album information displayed after selecting an album from search results. Works for both Album Search and Producer Search results.

#### 2.3.2 Page Sections

**Wikipedia Summary**:
- Brief overview from Wikipedia (when available)
- Includes historical context, recording details, and critical reception
- Link to full Wikipedia article

**Album Identity**:
- Album cover art
- Album title
- Artist name
- Release year
- Sticky positioning on desktop (normal scrolling on mobile)

**Album Art Gallery**:
- Browse all available album art images (up to 20 images)
- "View all album art" button to expand gallery
- Lightbox view for full-size images
- Click any image to view in lightbox

**Editions**:
- Complete list of all physical and digital editions
- Shows: Release status, country, date, label, catalog number, barcode
- Collapsible section: "Show all X editions" button

**Tracklist**:
- Complete list of tracks with:
  - Position/number (e.g., "A1", "B3", or "1")
  - Title
  - Duration (when available)
  - Songwriting credits (writers, composers, lyricists)
  - Publishing information

**Credits**:
- **Album Credits** (expanded by default):
  - Personnel who worked on the album as a whole
  - Includes: producers, engineers, musicians, and other contributors
  - Collapsible: Click "Album" header to collapse/expand
- **Track Credits** (collapsed by default):
  - Individual credits for each track
  - Shows: performers, instruments, and production roles
  - Collapsible: Click track title to expand and see credits

#### 2.3.3 Progressive Loading
- Stage 1: Basic info (title, artist, year, cover art) loads first
- Stage 2: Tracklist loads in parallel
- Stage 3: Credits and additional details load in parallel
- All stages are non-blocking; user can interact with loaded content while other sections load

---

## 3. Technical Requirements

### 3.1 Data Schema
- **Authoritative Schema**: `album.v1.json` defines the data contract
- **Hard Rules**:
  - Do not add features outside the PRD
  - Do not invent fields not defined in the schema
  - Missing data = "not documented", not errors

### 3.2 API Integration
- **MusicBrainz API**:
  - Base URL: `https://musicbrainz.org/ws/2`
  - Rate limiting: Max 1 request per second
  - User-Agent header required (except on mobile for CORS compatibility)
  - Request timeout: 15 seconds
- **Cover Art Archive**:
  - Base URL: `https://coverartarchive.org`
  - No User-Agent header on mobile (CORS compatibility)
- **Wikipedia API**:
  - REST API: `https://en.wikipedia.org/api/rest_v1/page/summary/{pageTitle}`
  - Fallback to older API format for iOS compatibility

### 3.3 Caching
- **Album data cache**: 30-day expiration
- **LRU (Least Recently Used) cleanup**: Automatic cache size management
- **Cover art URL caching**: URLs are cached along with album data
- **Cache storage**: Browser localStorage

### 3.4 Error Handling
- **Error boundaries**: React Error Boundary component catches render errors
- **Network errors**: User-friendly error messages
- **Missing data**: Graceful degradation (show "not documented" instead of errors)
- **API timeouts**: 15-second timeout with user-friendly error messages
- **Rate limiting**: Automatic request throttling (1 request per second)

### 3.5 Mobile Optimization
- **Responsive design**: Mobile-first approach
- **Search page**: No scrolling required on mobile (optimized layout)
- **Release type**: Dropdown on mobile (buttons on desktop)
- **Album detail page**: Normal scrolling (no sticky positioning on mobile)
- **Help button**: Visible in header on mobile
- **Lightbox**: Works on mobile (prevents body scroll when open)

---

## 4. User Experience Requirements

### 4.1 Search Experience
- **Primary use case**: Album search (artist/album name)
- **Secondary use case**: Producer search (producer name)
- Both searches lead to the same results page and album detail page
- Clear navigation between search types

### 4.2 Results Display
- Consistent result format regardless of search type
- Fast initial load (basic info first)
- Progressive loading for additional details
- Clear loading states and error messages

### 4.3 Navigation
- Intuitive browser back button behavior
- Clear "Back to Results" / "New Search" buttons
- Mobile-friendly navigation

### 4.4 Help & Documentation
- Help button accessible from all pages
- Comprehensive help guide with FAQs
- Clear data source attribution

---

## 5. Future Enhancements (Out of Scope for v1)

- Individual song searches
- Audio playback or streaming integration
- User accounts or saved albums
- Social features (sharing, comments)
- Advanced filtering (by year range, label, etc.)
- Export/print functionality
- Dark mode toggle (currently uses system preference)

---

## 6. Success Metrics

### 6.1 User Experience
- Search results load within 3 seconds
- Album detail page loads basic info within 2 seconds
- Zero unhandled errors (all errors caught by Error Boundary)
- Mobile experience matches desktop functionality

### 6.2 Technical Performance
- API requests respect rate limiting (1 request/second)
- Cache hit rate > 50% for repeat views
- Progressive loading completes within 10 seconds
- Lightbox opens smoothly on all devices

---

## 7. Constraints & Limitations

### 7.1 Data Availability
- Producer credits may be incomplete in MusicBrainz database
- Some albums may not have producer relationships documented
- Wikipedia summaries only available for albums with Wikipedia articles
- Cover art availability depends on Cover Art Archive uploads

### 7.2 Technical Constraints
- MusicBrainz API rate limiting (1 request/second)
- CORS restrictions on mobile (User-Agent header must be removed)
- iOS Safari fetch() limitations (requires timeout and error handling)
- No server-side processing (all API calls from client)

### 7.3 Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

---

## 8. Revision History

- **2024-01-XX**: Initial PRD creation
- **2024-01-XX**: Added Producer Search feature (Section 2.2)

---

## 9. Approval

**Product Owner**: [TBD]  
**Technical Lead**: [TBD]  
**Date**: [TBD]
