# iOS Scaffold Checkpoint

## Current Stable State
- iOS scaffold is stable on `main` for read-only Search -> Results development.
- Current `main` includes live MusicBrainz Search -> Results behavior that matches the current React app search model.
- Recent iOS milestone commits:
  - Add iOS selected release publishing
  - `9b4646a` Add iOS selected release songwriting
  - `736c51b` Add iOS album-level credits
  - `a1420ba` Make iOS track credits collapsible
  - `0660575` Polish iOS track credits display
  - `a176dbd` Harden iOS album detail scrolling
  - `44fe230` Make iOS screens scrollable
  - `6a0a7bf` Add iOS selected release track credits
  - `b13a7f1` Add iOS selected release tracklist
  - `748d4b1` Make iOS album detail scrollable
  - `f7c39a4` Add iOS release group detail enrichment
  - `8051359` Update iOS checkpoint for real detail header
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
- iOS album search resolves a confident MusicBrainz artist identity before release-group lookup and uses artist MBID release-group search when possible.
- iOS Studio Albums search applies local release-group post-filtering so obvious demos, remixes, interviews, spokenword releases, singles, EPs, live albums, compilations, soundtracks, and all-bootleg/non-official album-type groups do not appear as studio albums.
- Results can reorder already-loaded artist-only results client-side with `Oldest first` / `Newest first`; artist-only Studio Albums defaults to `Oldest first` for chronological discography browsing.
- Results cards label first-release dates, call out `aka` disambiguation as `Also known as`, and show compact MusicBrainz edition counts when available.
- Album-only search is not supported.
- SearchScreen is now the real artist-first search entry point; the old mock album preview card has been removed.
- SearchScreen root copy now states the product promise around albums, credits, tracklists, editions, sources, and liner images while keeping the same artist-first behavior.
- SearchScreen keeps Artist name, Album title, and Release Type in session-only app state so users can return from Results or Album Detail and adjust a search without retyping.
- SearchScreen has subtle in-field clear controls for Artist name and Album title; clearing Album title restores the artist-only Release Type control.
- Search and Results copy/layout have been polished to better match the Album Detail experience without changing search behavior or data fetching.
- The prototype-style persistent top tab bar has been replaced with contextual navigation: Search is the root screen, Results and Album Detail are reached through the album lookup flow, and Producer Search / Help remain secondary actions from Search.
- Non-root screens keep primary back navigation near the top so Results, Album Detail, Producer Search, and Help / Data Sources do not require scrolling to navigate back.
- Producer Search shell works.
- Producer input works.
- Producer Search result rows are visible/readable.
- Tapping a mock producer result opens Album Detail.
- Album Detail shows real selected-result header data for Search results, enriches release-group Editions & Sources from MusicBrainz, loads the selected-release tracklist, and displays selected-release album-level credits, track-level credits, songwriting, and publishing when documented.
- Album Detail selected-release album-level credits are loaded from the existing selected-release response without adding another MusicBrainz request.
- Album Detail album-level credits render as a collapsed `Album` disclosure row inside Credits.
- Album Detail Credits includes a collapsed `Credit Highlights` row that derives scan-friendly producers, engineers/mixers/mastering, performers, songwriting, and publishing summaries from already-loaded selected-release data.
- Album Detail selected-release track credits are grouped by track, collapsed by default, and expandable with iOS-style disclosure chevrons.
- Album Detail Credits now defaults collapsed to keep dense album pages calmer while preserving full credit detail behind disclosure.
- Album Detail section-level disclosure controls use chevrons consistently for Tracklist, Credits, and Editions & Sources.
- Album Detail disclosure headers show compact summaries for Tracklist, Credits, and Editions & Sources so collapsed sections remain scannable.
- Album Detail supports optional primary cover art and release-group artwork gallery images from Cover Art Archive.
- Album Detail Editions & Sources now prioritizes human-readable selected-edition and source labels while keeping technical identifiers and links available for traceability.
- Album Detail Editions & Sources defaults collapsed so the first detail view stays focused on the album, tracklist, and credit overview.
- Album Detail Editions & Sources keeps Release-group editions and Technical links collapsed by default so the selected-edition view stays compact.
- Album Detail still renders selected mock album content for Producer Search mock results.
- Visible iOS app copy has been softened so the title reads `Liner Notez`, Album Detail uses user-facing helper text, and the main album card no longer shows the release-group MBID.
- Search, Results, Album Detail, Producer Search, and Help / Data Sources have screen-owned vertical scrolling for smaller iPhones.
- Album Detail scrolling works reliably after simulator restart.
- Help / Data Sources shows mock-scope, planned sources, and trust-rule content.
- Internal marker strings are removed from visible UI.
- Outdated “Placeholder screen for album search flow” copy is removed.
- `apps/ios-liner-notez/.expo/` is ignored as generated local Expo state.
- `apps/ios-liner-notez/dist/` remains ignored generated export output.

## Product Scope Status
- Read-only MusicBrainz Search -> Results is active for artist-first album results with release-type filtering for artist-only searches.
- Album Detail real-data scope now includes selected-result header data, release-group basic enrichment from MusicBrainz, primary cover art and release-group artwork gallery images from Cover Art Archive, selected-release edition metadata, the selected-release tracklist, selected-release album-level credits, selected-release track credits, selected-release songwriting, and selected-release publishing.
- Album Detail opens immediately from selected Results row data, then fetches release-group basic info, optional cover art/gallery images, selected-release edition metadata, selected-release tracklist data, selected-release album-level credits, selected-release track credits, selected-release songwriting, and selected-release publishing in the background.
- Producer Search remains mock-only; no producer traversal is implemented yet.
- This does not mean the iOS app is production-ready; several real-data and polish areas remain deferred.

## Search Behavior Contract
- Artist Name is required.
- Album Name is optional.
- Artist-only search returns MusicBrainz release-group album results by that artist.
- Artist + Album search narrows MusicBrainz release-group results to albums by that artist matching the album text.
- Album-only search is not a supported product flow and should not be presented as valid UI.
- Tapping a Search result opens Album Detail with selected MusicBrainz result header data.

## Search Quality Diagnosis: `REM`
- Earlier iOS searches for artist `REM` with Release Type `Studio Albums` could return unrelated MusicBrainz release groups such as `Fryderyk Chopin, Rem Urasin`, `Rém`, or `rem†non†rem`.
- Root cause: the iOS adapter sent a direct release-group text query:
  - `artist:"REM" AND primarytype:album NOT secondarytype:live NOT secondarytype:compilation NOT secondarytype:soundtrack`
- That query searches MusicBrainz release-group artist text and does not resolve the artist identity first.
- Earlier iOS search did not normalize `REM` to `R.E.M.`, inspect aliases, resolve an artist MBID, or post-filter release groups by exact artist identity.
- Earlier Studio Albums filtering only constrained release-group type/secondary-type; it did not validate the returned artist credit.
- The React web app uses the same broad release-group text-query model for album search, so this is a shared search-semantics issue rather than an iOS-only regression.
- The iOS search adapter now applies the recommended first search-quality fix:
  - Search MusicBrainz `/artist` for the entered artist.
  - Prefer the best exact normalized name or alias match.
  - Use the resolved artist MBID in the release-group search, likely via an artist-id query field such as `arid:<artistMbid>` plus the existing release-type query.
  - Keep existing release-type behavior, sorting, and Album Detail behavior unchanged.
- The iOS adapter keeps a broad release-group search fallback when artist resolution is uncertain.
- The iOS adapter also locally filters Studio Albums release groups by `primary-type` / `secondary-types` to remove obvious non-studio albums such as demos, remixes, interviews, spokenword releases, singles, EPs, live albums, compilations, and soundtracks.
- Phase 1 Studio Albums filtering also requires at least one `Official` release in the release group and excludes release groups whose known releases are all `Bootleg`.
- Mixed release groups with at least one `Official` release remain visible even when they also contain Bootleg or Promotion releases.
- This remains an iOS-first search-quality slice; the React web app still uses the broader release-group text-query model.
- Avoid a one-off `REM` -> `R.E.M.` hard-code.
- Later, consider promoting the same artist-identity search semantics into the React web app so iOS and web remain aligned.

## Album Detail Real-Data Path
- Current live path: Search -> Results -> Album Detail header -> release-group enrichment -> primary cover art/artwork gallery -> selected-release edition metadata -> selected-release tracklist -> selected-release album-level credits -> selected-release track credits -> selected-release songwriting -> selected-release publishing.
- The selected-release tracklist milestone is `b13a7f1` Add iOS selected release tracklist.
- The selected-release album-level credits milestone is `736c51b` Add iOS album-level credits.
- The selected-release track credits milestone is `6a0a7bf` Add iOS selected release track credits.
- The selected-release songwriting milestone is `9b4646a` Add iOS selected release songwriting.
- The selected-release publishing milestone is Add iOS selected release publishing.
- Tracklist uses `selectedReleaseId` from release-group enrichment.
- Tracklist and track credits use the same React-parity MusicBrainz selected-release endpoint:
  - `/release/{selectedReleaseId}?inc=recordings+artist-credits+recording-level-rels+release-rels+labels+artist-rels&fmt=json`
- iOS extracts only the small tracklist shape for now:
  - `trackId`
  - `position`
  - `title`
  - `durationMs`
- iOS extracts only selected-release track-level credits for now:
  - `personName`
  - `role`
  - `instrument`
  - `notes`
- iOS extracts selected-release album-level credits from release `relations` using the same compact credit shape.
- Album-level credits use the already-fetched selected-release response; iOS does not probe alternate releases for album credits yet.
- Album-level credits render as a collapsed `Album` disclosure row and use the same credit grouping labels as track credits when expanded.
- Credit Highlights are derived in the iOS UI from already-loaded album credits, track credits, songwriting, and publishing; they do not add MusicBrainz requests or schema fields.
- Credit Highlights show contributor names, roles, and track counts when the contributor came from track-level data.
- iOS extracts selected-release songwriting from already-fetched recording relations and nested work-level relations:
  - `writers`
  - `composers`
  - `lyricists`
- Songwriting appears inside expanded track credit rows before the general credit groups.
- Work-level songwriting uses `work-rels` and `work-level-rels` on the existing selected-release request; no per-track or per-work MusicBrainz requests are used.
- iOS extracts selected-release publishing from already-fetched recording relations:
  - label-target relations whose type includes `publisher`
  - `publishing.publishers`
- Publishing appears inside expanded track credit rows after Songwriting and before the general credit groups.
- No additional MusicBrainz request is used for selected-release publishing.
- Primary cover art uses Cover Art Archive and is optional/non-blocking.
- iOS prefers selected-release cover art when available and falls back to release-group cover art.
- Missing or failing cover art preserves the current no-art Album Detail layout silently.
- Artwork gallery images use Cover Art Archive release-group JSON, are limited to 20 images, and are optional/non-blocking.
- Album Detail shows `Album Art & Liner Images` thumbnails with product-facing copy and an image-count/full-screen cue when gallery images are available.
- Tapping primary cover art or an Album Art & Liner Images thumbnail opens a full-screen viewer with close, swipe paging, image count, type labels, and iOS ScrollView pinch zoom/pan.
- Gallery data is iOS-local for now; the shared album schema still only defines `coverArtUrl`.
- Selected edition metadata uses the already-fetched selected-release response and adds label, catalog number, barcode, format, and packaging when available.
- No additional MusicBrainz request is used for selected edition metadata.
- All-editions enrichment remains deferred.
- Track credits display milestone `0660575` groups available selected-release credits by track and credit category.
- Track credits disclosure milestone `a1420ba` keeps tracks collapsed by default and lets users expand individual tracks with chevrons while preserving multiple-expanded behavior.
- Multi-disc releases keep the current flat tracklist UI and use React-style positions such as `2-1`, `2-2`, etc.
- Recording places/studios remain deferred.
- React can display Recording rows for Studio and Location when `recordingInfo` exists, but reliable data likely requires extra `/recording/{id}?inc=place-rels` requests.
- React currently skips full-album per-recording place fetching because it is too slow; a typical album could require roughly 10-15 extra MusicBrainz requests.
- iOS should not implement recording places/studios yet. A future implementation should likely lazy-load recording info only when a track credit row is expanded, with caching and rate-limit protection.

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
  - the adapter returns artist-only results newest-first with title as the tiebreak; the iOS Results UI can reorder the already-loaded list client-side and defaults artist-only Studio Albums to Oldest first
- iOS now improves on the earlier broad React-parity search path by resolving confident artist MBIDs first and applying stricter local Studio Albums post-filtering.
- Phase 1 Studio Albums filtering uses MusicBrainz release status data already returned by `inc=releases`; it does not add title keyword blacklists, new release types, curated canonical lists, or external data sources.
- Manual smoke testing previously confirmed iOS search results had parity with the React app for R.E.M. and David Bowie.
- Current iOS search now intentionally diverges from the earlier broad React-parity path for artist identity resolution and obvious non-studio release-group cleanup.
- This is still not a full canonical studio-albums-only system.
- Do not start canonical studio albums cleanup here; that is a later shared React+iOS search-semantics project.

## Manual Smoke Status
- David Bowie / Aladdin Sane passed after `ec75193` and again after the selected-release tracklist milestone `b13a7f1`.
- Search used the artist-first flow with Artist `David Bowie` and Album `Aladdin Sane`.
- Release Type was hidden because Album Name had text.
- Results heading showed `Albums by David Bowie matching "Aladdin Sane".`
- Result count appeared and result rows were readable.
- First result was the expected real MusicBrainz result: `Aladdin Sane` / `David Bowie` / `1973-04-19`.
- Tapping the result opened Album Detail with matching real selected-result header data.
- Album Detail showed title, artist, date/year, release-group MBID, `Source: MusicBrainz`, and MusicBrainz release-group link.
- Album Detail opened immediately.
- Release-group enrichment loaded.
- Tracklist loaded from the selected release.
- Selected-release album-level credits loaded when documented.
- Selected-release track credits loaded when documented.
- Selected-release songwriting loaded when documented.
- Selected-release publishing loaded when documented.
- Album-level credits are shown as a collapsed `Album` row in Credits and expand with a chevron.
- Credit Highlights summarize loaded contributors without changing the underlying credit data.
- Songwriting appears in expanded track credit rows when writer/composer/lyricist data is documented.
- Publishing appears in expanded track credit rows when publisher label data is documented.
- Track credits are readable, grouped, collapsed by default, and expandable per track with chevrons.
- Tracklist, Credits, and Editions & Sources use consistent chevron disclosure controls.
- Album Detail scrolls fully, and Tracklist, Credits, Editions & Sources, and the full release-group link/content are reachable.
- Search, Results, Album Detail, Producer Search, and Help / Data Sources have appropriate scroll handling.
- Album Detail scrolling was hardened after simulator restart in `a176dbd`.
- Producer Search remained mock-only.
- Noisy secondary search results remain expected under current shared MusicBrainz/search semantics and are not an iOS-specific bug.

## Mock-Only / Deferred Scope
- Album Detail producer graph, all-editions metadata enrichment, canonical studio-albums cleanup, and rich liner-note sections are not loaded yet.
- Producer Search remains mock-only; no producer traversal is implemented yet.

## Known Deferred Work
- Canonical studio albums cleanup as a later shared React+iOS search-semantics project.
- Alternate-release fallback probing for album-level credits when the selected release has none.
- Recording places/studios.
- Producer graph.
- All-editions metadata enrichment.
- Artwork gallery schema promotion beyond the current iOS-local image list.
- Real Producer Search.
- Pagination or load more for larger result sets.
- Richer result cards.

## Recommended Next Safe Slice
- Manual UX review of the iOS Artwork viewer on a few image-heavy albums before adding more gallery features.
- Do not change MusicBrainz search query semantics, result filtering, sorting, canonical studio-albums behavior, selected-release tracklist behavior, selected-release album/track/songwriting/publishing behavior, recording places/studios, or Producer Search mock-only behavior in the next slice.

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
