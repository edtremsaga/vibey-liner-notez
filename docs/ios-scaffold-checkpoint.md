# iOS Scaffold Checkpoint

## Current Stable State
- iOS scaffold is stable on `main` for read-only Search -> Results development.
- Current `main` includes artist-first MusicBrainz album search in the Search -> Results slice.
- App runs in iOS Simulator.
- Search -> Results -> Album Detail flow works.
- Search requires an artist name, supports an optional album title for narrowing, and shows Release Type for artist-only searches.
- Producer Search shell works.
- Producer input works.
- Producer Search result rows are visible/readable.
- Tapping a mock producer result opens Album Detail.
- Album Detail renders selected mock album content.
- Album Detail shows Tracklist, Credits, Selected Edition, and External Links.
- Help / Data Sources shows mock-scope, planned sources, and trust-rule content.
- Internal marker strings are removed from visible UI.
- Outdated “Placeholder screen for album search flow” copy is removed.

## Product Scope Status
- Read-only MusicBrainz Search -> Results is active for artist-first album results with release-type filtering for artist-only searches.
- Album Detail remains mock-only.
- Producer Search remains mock-only; no producer traversal is implemented yet.

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
