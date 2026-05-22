# iOS Privacy Notes

## Purpose / Scope

These are code-based privacy notes for the current Liner Notez iOS app. They are intended to support later App Store privacy answers, privacy policy drafting, TestFlight metadata, and app review readiness.

This is not legal advice and is not a final privacy policy. Re-audit before App Store submission, especially if analytics, crash reporting, accounts, payments, persistence, or build services are added later.

## User-Provided Inputs

The current iOS app accepts these typed inputs so users can perform music metadata searches:

- Artist name
- Optional album title
- Producer name

These values are held in React in-memory state during the app session. The current iOS app does not save search history or favorites.

## Data Transmitted To Third-Party Services

The iOS app sends music lookup data to public metadata services so it can retrieve album, release, track, credit, producer, artwork, and related source information.

- Artist, album, and producer search terms are sent to MusicBrainz to perform searches and candidate lookups.
- MusicBrainz identifiers selected from results are used for album detail, release, tracklist, credit, and producer-credit requests.
- Cover Art Archive is used for artwork metadata and image URLs.
- Wikidata is used for album sitelink lookup when MusicBrainz provides a Wikidata relation.
- Wikipedia article URLs are opened externally when available. The current iOS app does not fetch Wikipedia summary text.

Based on current iOS code, the app does not intentionally send account, contact, location, photo, device identifier, Apple ID, payment, or advertising identifier data.

## Local Storage / Persistence

No app-owned persistent local storage was found in the current iOS source/config:

- No AsyncStorage
- No localStorage
- No SQLite
- No SecureStore
- No app filesystem writes
- No saved favorites
- No persisted search history

The app uses in-memory UI/session state for current search fields, selected album detail, producer search state, and image loading/failure state.

The artwork viewer uses React Native image loading and `Image.prefetch` for responsiveness. Platform image caching may occur, but the current iOS app does not implement its own persistent metadata cache.

## Tracking / Analytics / Accounts / Payments

Based on current iOS code and `apps/ios-liner-notez/package.json`, the iOS app does not include:

- Analytics or tracking SDKs
- Ads
- Crash reporting SDKs
- Login or accounts
- Payments or purchases
- Push notifications
- Location, contacts, photos, camera, microphone, Apple ID, ATT, or IDFA access

The root web app package includes `@vercel/analytics`, but that appears to be web-only and is not imported by the iOS app source or listed in the iOS app package dependencies.

## App Store Privacy-Answer Draft Notes

These are draft, code-based notes only. Confirm final App Store answers manually.

Likely not collected by the current iOS app:

- Contact information
- Health and fitness
- Financial information
- Location
- Contacts
- Photos, audio, or other user media
- Browsing history
- Device identifiers
- Purchases
- Diagnostics or crash data
- Advertising or tracking data
- Account/profile data

Important nuance:

- User-entered search terms are transmitted to third-party public metadata services to perform app functionality.
- The app does not appear to store those terms persistently or link them to an account.
- Apple privacy-form interpretation should be confirmed manually, especially whether user-entered music search terms sent to third-party APIs need to be disclosed as search history, user content, or another category.

## Draft Privacy-Policy Wording

Draft wording for later review:

Liner Notez does not require an account. The current iOS app does not intentionally collect personal information, sell personal data, show ads, or use tracking.

When you search for artists, albums, or producers, your search terms and selected music metadata identifiers may be sent to public music metadata services such as MusicBrainz, Cover Art Archive, Wikidata, and Wikipedia so the app can retrieve album, credit, artwork, and related source information.

The current iOS app does not save search history or favorites. Metadata comes from third-party public sources and may be incomplete, outdated, duplicated, or incorrect.

## Current Gaps / Follow-Up

- Confirm Apple App Privacy answers manually before submission.
- Create a final privacy policy URL before App Store submission.
- Re-audit if analytics, crash reporting, accounts, payments, persistent storage, notifications, permissions, EAS/build services, or other third-party SDKs are added.
- Re-check the final production build configuration and App Store metadata before TestFlight/App Store submission.
