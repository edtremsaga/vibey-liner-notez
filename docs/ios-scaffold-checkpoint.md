# iOS Scaffold Checkpoint

## Current Stable State
- iOS scaffold is stable on `main` for read-only Search -> Results development.
- Current `main` includes live MusicBrainz Search -> Results behavior that matches the current React app search model.
- Recent Search -> Results milestone commits:
  - `ec75193` Add real iOS album detail header
  - `4e6afa3` Polish iOS results screen
  - `efd78db` Correct iOS search to artist-first flow
  - `0a3f499` Add iOS release type filtering
  - `b373d6f` Align iOS album search with React behavior
  - `34ba2b9` Ignore Expo local state
- App runs in iOS Simulator.
- Search -> Results -> Album Detail flow works.
- Tapping a real MusicBrainz result opens Album Detail with real selected-result header data.
- Search requires an artist name, supports an optional album title for narrowing, and shows Release Type for artist-only searches.
- Album-only search is not supported.
- SearchScreen is now the real artist-first search entry point; the old mock album preview card has been removed.
- Producer Search shell works.
- Producer input works.
- Producer Search result rows are visible/readable.
- Tapping a mock producer result opens Album Detail.
- Album Detail shows real selected-result header data for Search results and enriches release-group Editions & Sources from MusicBrainz.
- Album Detail still renders selected mock album content for Producer Search mock results.
- Help / Data Sources shows mock-scope, planned sources, and trust-rule content.
- Internal marker strings are removed from visible UI.
- Outdated “Placeholder screen for album search flow” copy is removed.
- `apps/ios-liner-notez/.expo/` is ignored as generated local Expo state.
- `apps/ios-liner-notez/dist/` remains ignored generated export output.

## Product Scope Status
- Read-only MusicBrainz Search -> Results is active for artist-first album results with release-type filtering for artist-only searches.
- Album Detail real-data scope is limited to selected-result header data plus release-group basic enrichment from MusicBrainz.
- Album Detail opens immediately from selected Results row data, then fetches release-group basic info in the background.
- Producer Search remains mock-only; no producer traversal is implemented yet.

## Search Behavior Contract
- Artist Name is required.
- Album Name is optional.
- Artist-only search returns MusicBrainz release-group album results by that artist.
- Artist + Album search narrows MusicBrainz release-group results to albums by that artist matching the album text.
- Album-only search is not a supported product flow and should not be presented as valid UI.
- Tapping a Search result opens Album Detail with selected MusicBrainz result header data.

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

## Manual Smoke Status
- David Bowie / Aladdin Sane passed after `ec75193`.
- Search used the artist-first flow with Artist `David Bowie` and Album `Aladdin Sane`.
- Release Type was hidden because Album Name had text.
- Results heading showed `Albums by David Bowie matching "Aladdin Sane".`
- Result count appeared and result rows were readable.
- First result was the expected real MusicBrainz result: `Aladdin Sane` / `David Bowie` / `1973-04-19`.
- Tapping the result opened Album Detail with matching real selected-result header data.
- Album Detail showed title, artist, date/year, release-group MBID, `Source: MusicBrainz`, and MusicBrainz release-group link.
- Tracklist and Credits remained not loaded yet. Release-group Editions & Sources are the only enrichment scope.
- Producer Search remained mock-only.
- Noisy secondary search results remain expected under current shared MusicBrainz/search semantics and are not an iOS-specific bug.

## Mock-Only / Deferred Scope
- Album Detail tracklist, credits, full edition metadata, cover art, and rich liner-note sections are not loaded yet.
- Producer Search remains mock-only; no producer traversal is implemented yet.

## Known Deferred Work
- Canonical studio albums cleanup as a later shared React+iOS search-semantics project.
- Real Album Detail tracklist/credits loading.
- Full selected-release edition metadata.
- Real Producer Search.
- Pagination or load more for larger result sets.
- Cover art or richer result cards.

## Recommended Next Safe Slice
- Polish the iOS Album Detail deferred-section copy while preserving current release-group enrichment behavior exactly.
- Do not change MusicBrainz query semantics, result filtering, sorting, or Producer Search mock-only behavior in that slice.

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
