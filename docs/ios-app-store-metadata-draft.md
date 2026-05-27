# iOS App Store Metadata Draft

## Purpose / Status

This document is draft support material for future Liner Notez iOS TestFlight and App Store work. It is not final App Store copy and does not mean the app is ready for submission.

Before submission, complete manual smoke testing, final icon/splash assets, screenshots, privacy/support URLs, App Store privacy answers, and build/TestFlight setup.

## App Identity

- App name: Liner Notez
- Bundle identifier: `com.edtremblay.linernotez`
- Version / build: `0.1.0` / `1`
- Platform: iOS only
- Orientation: portrait
- UI style: dark

## One-Line Positioning

Explore album credits, artwork, and music metadata from public sources.

## App Store Subtitle Candidates

Each candidate is intended to fit Apple's 30-character subtitle limit.

- Album credits explorer
- Music metadata explorer
- Liner notes for albums
- Explore album credits
- Album credits and artwork

## Promotional Text Candidates

Option A:

Explore album credits, tracklists, artwork, editions, and producer connections from public music metadata sources.

Option B:

Look up albums, browse documented credits, and open source-backed artwork and context when available.

Option C:

An album-first way to explore music credits, liner images, producer links, and source-backed metadata.

## Full App Store Description Draft

Liner Notez is an album-first music metadata app for exploring albums, tracklists, credits, artwork, editions, source links, and producer connections.

Search by artist to browse albums and open detailed album pages. When public metadata is available, Liner Notez can show selected-release tracklists, album-level credits, expandable track credits, songwriting, publishing, instruments, artwork and liner images, source links, and related Wikipedia album links.

Producer Search helps find albums connected to a producer through documented MusicBrainz producer-credit relationships. Producer results are source-backed and intentionally bounded; the app does not claim to show a complete producer discography.

Liner Notez uses public third-party metadata sources such as MusicBrainz, Cover Art Archive, Wikidata, and Wikipedia links. Metadata can be incomplete, duplicated, outdated, or incorrect, and credits can vary by release, country, edition, reissue, or source. Liner Notez does not invent credits and does not act as an official label, artist, publisher, royalty, copyright, or legal-credit authority.

No account is required.

## Keywords Draft

Candidate keyword pool:

`albums,credits,liner notes,music metadata,artists,producers,tracklists,album art,discography,release notes,music history,records,songwriting`

Notes:

- Avoid trademark-heavy keyword stuffing.
- Do not imply official label/artist affiliation.
- Final keyword list should be checked against Apple's current character limit and metadata rules.

## TestFlight Beta Notes Draft

Please try the main album workflow and the Producer Search workflow:

- Search by artist and optional album title.
- Browse Results and open Album Detail.
- Check album header details, tracklist, Album Credits, and Editions & Sources.
- Expand track rows with documented credits.
- Open Album Art & Liner Images and swipe through artwork.
- Try Producer Search with an ambiguous producer such as Quincy Jones.
- Open a Producer Search result into Album Detail and return to Producer Search.
- Open Help / Data Sources and review source/disclaimer copy.
- Spot-check offline or bad-network behavior if convenient.

Known limits for this beta:

- Metadata comes from public third-party sources and may be incomplete or surprising.
- Producer Search uses documented release-level producer credits and does not promise a complete producer discography.
- Recording-level producer fallback is not implemented.

## Review Notes Draft

Liner Notez does not require an account or special credentials. The app uses public music metadata services to retrieve album, release, credit, artwork, and related source information. Metadata may be incomplete because it depends on third-party public data.

There are no purchases, payments, subscriptions, user accounts, ads, or tracking features in the current iOS app.

## Privacy / Support URLs

- Privacy policy URL: `https://vibeycraft.com/liner-notez/privacy`
- Support URL: `https://vibeycraft.com/liner-notez/support`
- Marketing URL: optional / TBD

Internal source material:

- `docs/ios-privacy-notes.md`
- Help / Data Sources screen copy

Do not use internal docs paths as public App Store URLs.

## Data Source / Non-Affiliation Wording

Liner Notez uses public metadata sources including MusicBrainz, Cover Art Archive, Wikidata, and Wikipedia links where available. Public metadata may be incomplete, duplicated, outdated, or incorrect.

Liner Notez is independent and is not affiliated with or endorsed by MusicBrainz, MetaBrainz, Cover Art Archive, Wikidata, Wikipedia, artists, labels, rights holders, or Apple unless explicitly stated.

## Screenshot Plan

Capture screenshots after final manual smoke testing and visual review:

- Album Search
- Results
- Album Detail top section
- Tracklist with expanded credits
- Album Credits
- Album Art & Liner Images viewer
- Producer Search candidate selection or results
- Help / Data Sources

## Remaining Metadata Gaps

- Optional marketing URL
- App screenshots
- Final manual simulator/device smoke pass
- EAS/TestFlight build setup
- Final App Store privacy answers
- Final review of App Store copy, subtitle, promotional text, keywords, and screenshots
