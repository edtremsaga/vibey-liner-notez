# Repo Index

## Project Overview
- Vite + React single-page app for album-focused liner note exploration.
- Primary UI orchestration is in `src/pages/AlbumPage.jsx`.

## Major Directories
- `src/pages`: page-level UI (`AlbumPage.jsx`) and page tests
- `src/services`: external API integration (`musicbrainz.js`)
- `src/components`: reusable UI pieces (cards, help, error boundary, etc.)
- `src/contexts`: app context providers (`HelpContext`)
- `src/utils`: cache, fetch timeout helper, debug, formatting, validation
- `docs`: operational and QA documentation

## Key Services
- `src/services/musicbrainz.js`
- `src/utils/albumCache.js`
- `src/utils/fetchWithTimeout.js`

## Main UI Components / Entry Points
- `src/main.jsx` -> app mount
- `src/App.jsx` -> shell + providers + analytics
- `src/pages/AlbumPage.jsx` -> search/results/detail/navigation/background ops

## Key Data Models
- `album.v1.json`: canonical album schema contract
- Runtime album object assembled in `fetchAlbumData(...)` in `src/services/musicbrainz.js`

## Test Structure
- Tests live under `src/**/__tests__`
- Coverage areas: app regression, page flows (producer/background/navigation), services, utils, error boundary

## Important Runtime Flows
- Album search: search form -> results list -> album detail
- Producer search: producer query -> optional producer disambiguation -> results -> album detail
- Album detail background fetches: gallery + Wikipedia with error/retry UI
- Back navigation: custom history state + `popstate` handling in `AlbumPage.jsx`
