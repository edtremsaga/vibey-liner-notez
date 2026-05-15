# iOS Scaffold Checkpoint

## Current Stable State
- iOS scaffold is stable on `main` for read-only Search -> Results development.
- Current `main` includes live MusicBrainz Search -> Results behavior that matches the current React app search model.
- Recent Search -> Results milestone commits:
  - `efd78db` Correct iOS search to artist-first flow
  - `0a3f499` Add iOS release type filtering
  - `b373d6f` Align iOS album search with React behavior
  - `34ba2b9` Ignore Expo local state
- App runs in iOS Simulator.
- Search -> Results -> Album Detail flow works.
- Search requires an artist name, supports an optional album title for narrowing, and shows Release Type for artist-only searches.
- Album-only search is not supported.
- SearchScreen is now the real artist-first search entry point; the old mock album preview card has been removed.
- Producer Search shell works.
- Producer input works.
- Producer Search result rows are visible/readable.
- Tapping a mock producer result opens Album Detail.
- Album Detail renders selected mock album content.
- Album Detail shows Tracklist, Credits, Selected Edition, and External Links.
- Help / Data Sources shows mock-scope, planned sources, and trust-rule content.
- Internal marker strings are removed from visible UI.
- Outdated “Placeholder screen for album search flow” copy is removed.
- `apps/ios-liner-notez/.expo/` is ignored as generated local Expo state.
- `apps/ios-liner-notez/dist/` remains ignored generated export output.

## Product Scope Status
- Read-only MusicBrainz Search -> Results is active for artist-first album results with release-type filtering for artist-only searches.
- Album Detail remains mock-only.
- Producer Search remains mock-only; no producer traversal is implemented yet.

## Search Behavior Contract
- Artist Name is required.
- Album Name is optional.
- Artist-only search returns MusicBrainz release-group album results by that artist.
- Artist + Album search narrows MusicBrainz release-group results to albums by that artist matching the album text.
- Album-only search is not a supported product flow and should not be presented as valid UI.
- Tapping a result may still route to existing mock Album Detail behavior until real Album Detail is implemented.

## Release Type Behavior
- Release Type is only visible for artist-only searches, when Album Name is empty.
- Release Type is hidden and ignored when Album Name has text.
- Default value is `Album` / Studio Albums.
- Options match the React app:
  - `Album` / Studio Albums
  - `EP` / EPs
  - `Single` / Singles
  - `Live` / Live Albums
  - `Compilation` / Compilations
  - `Soundtrack` / Soundtracks

## React Parity Status
- iOS artist-only MusicBrainz adapter now follows current React behavior:
  - `limit=100`
  - `offset=0`
  - `inc=releases`
  - bootleg detection uses the same MusicBrainz bootleg status id
  - artist-only results are sorted newest-first with title as the tiebreak
- Manual smoke testing confirmed iOS search results now have parity with the React app for R.E.M. and David Bowie.
- This milestone is React parity, not stricter canonical studio-albums-only filtering.
- Do not start canonical studio albums cleanup here; that is a later shared React+iOS search-semantics project.

## Mock-Only Scope
- Album Detail remains mock-only.
- Producer Search remains mock-only; no producer traversal is implemented yet.

## Known Deferred Work
- Canonical studio albums cleanup as a later shared React+iOS search-semantics project.
- Results screen polish that preserves current search/query behavior exactly.
- Real Album Detail loading.
- Real Producer Search.
- Pagination or load more for larger result sets.
- Cover art or richer result cards.

## Recommended Next Safe Slice
- Polish the iOS Results screen presentation while preserving current Search -> Results query behavior exactly.
- Do not change MusicBrainz query semantics, result filtering, sorting, or mock-only Album Detail routing in that slice.

## Runtime Lesson Learned
- If the simulator does not reflect source changes, stale Metro/Expo session state can look like a code bug.
- Before assuming a code bug, do a hard restart:
  - `npm start -- --clear`
  - fully restart Expo Go / iOS Simulator session

## Workflow Rules

### Direct-to-main (tiny iOS-only)
Use direct-to-main for small, low-risk iOS scaffold edits limited to:
- `apps/ios-liner-notez/src/screens/*`
- `apps/ios-liner-notez/scripts/verify-scaffold.mjs`

Tier 1 verification only for those changes:
- `npm run verify:ios-scaffold`
- `cd apps/ios-liner-notez && CI=1 npx expo export --platform ios`

### Escalate to branch/PR/full checks
Create a branch/PR and run expanded checks for changes touching:
- package/dependency/config/Metro files
- shared core/schema/fixtures
- real API/network code
- caching/storage
- navigation architecture
- producer traversal implementation
- web runtime files
