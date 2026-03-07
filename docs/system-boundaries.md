# System Boundaries

## External APIs
- MusicBrainz Web Service (`https://musicbrainz.org/ws/2`) via `src/services/musicbrainz.js`
- Cover Art Archive (`https://coverartarchive.org`) via `src/services/musicbrainz.js`
- Wikidata API (`wbgetentities`) via `src/services/musicbrainz.js`
- Wikipedia APIs (REST summary + legacy fallback) via `src/services/musicbrainz.js`
- Vercel Analytics in `src/App.jsx`

## Core Services
- `src/services/musicbrainz.js`: search, album data assembly, producer search, cover art, Wikipedia pipeline, API rate/timeout handling
- `src/utils/albumCache.js`: localStorage cache for album data
- `src/contexts/HelpContext.jsx`: help UI state provider/hooks

## Data Source Rules
- Album-shaped output targets `album.v1.json`
- Runtime album data is assembled from external APIs, primarily MusicBrainz
- Missing data is treated as “not documented,” not fabricated

## Background Operations
- After album load, background fetches run for gallery (`fetchAllAlbumArt`) and Wikipedia (`fetchWikipediaContentFromMusicBrainz`)
- Both background flows have UI error/retry handling in `src/pages/AlbumPage.jsx`
- Producer search includes pagination/prefetch behavior and abort handling

## UI Navigation Model
- Main app flow is implemented in `src/pages/AlbumPage.jsx` as state-driven view transitions
- Navigation/back behavior relies on browser history state + `popstate` handling
- URL params are used for search mode and partial restoration

## Do Not Invent
- Do not invent APIs or services not present in this repository
- Do not invent album metadata
- Do not invent alternate navigation models
- Do not assume React Router drives navigation when code uses custom history logic

## Non-Goals / Forbidden Changes
- No audio playback or streaming features
- No undocumented runtime architecture rewrites without explicit approval
- Do not alter API contracts without updating tests/docs in the same change
