# iOS Scaffold Checkpoint

## Current Stable State
- iOS scaffold is stable on `main` for mock-data-only development.
- App runs in iOS Simulator.
- Search -> Results -> Album Detail flow works.
- Producer Search shell exists.
- Help / Data Sources content exists.
- Album Detail currently shows Tracklist, Credits, Editions, and External Links sections.

## Product Scope Status
- No real APIs are active yet.
- No producer traversal is implemented yet.

## Runtime Lesson Learned
- Stale Metro state can look like a code bug.
- Before diagnosing UI regressions, do a hard restart:
  - `npm start -- --clear`
  - restart Expo Go / Simulator session

## Workflow Rules

### Direct-to-main (tiny iOS-only)
Use direct-to-main for small, low-risk iOS scaffold edits limited to:
- `apps/ios-liner-notez/src/screens/*`
- `apps/ios-liner-notez/scripts/verify-scaffold.mjs`

Tier 1 verification:
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
