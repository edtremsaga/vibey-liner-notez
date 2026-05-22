# iOS v1 Smoke Checklist

Use this runbook before treating the current iOS app as v1/prototype-complete or before starting TestFlight/App Store work. This is manual validation; it complements static verification and does not replace `npm run verify:ios-scaffold` or Expo export.

## Run Record

| Date | Tester | Simulator/device | iOS version | App commit | Result | Notes / follow-ups |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | Pass / Fail |  |

## Preconditions

- [ ] Git status is clean before testing.
- [ ] `npm run verify:ios-scaffold` passes.
- [ ] `cd apps/ios-liner-notez && CI=1 npx expo export --platform ios` passes.
- [ ] App starts cleanly in the iOS Simulator or on a device.
- [ ] Network is available for normal happy-path testing.
- [ ] Tester records device/simulator, iOS version, app commit, pass/fail, notes, and follow-up issues above.

## Album Search

- [ ] Artist + album search works: search `David Bowie` with `Aladdin Sane` and confirm Results load.
- [ ] Artist-only Studio Albums search works: search `R.E.M.` or `REM` and confirm unrelated `Rem` / `Rém` style results do not dominate.
- [ ] Album-only search is not presented as a supported flow; Artist name remains required.
- [ ] Artist and Album title clear controls appear only when text exists and clear the expected field.
- [ ] Release Type is available for artist-only searches and hides when Album title narrows the search.
- [ ] Rapid repeated searches do not leave older results overriding the latest submitted search.

## Results

- [ ] Result cards are readable on a common iPhone-sized screen.
- [ ] Result cards show title, artist credit, first release date when available, disambiguation when present, and edition count when useful.
- [ ] Sort controls work for artist-only results.
- [ ] Tapping a result opens Album Detail.
- [ ] Empty/no-result behavior is understandable when no albums match.
- [ ] Network/API error copy is calm and user-facing if a search fails.

## Album Detail

- [ ] Header shows album title, artist, release date/year, type, and cover art when available.
- [ ] Source-backed Wikipedia link appears and opens when available.
- [ ] Album Art & Liner Images appears when artwork gallery data is available.
- [ ] Tracklist loads and shows track numbers/titles/durations.
- [ ] Tracks with documented credits show a subtle expandable affordance.
- [ ] Expanding track rows shows existing track credits, songwriting, publishing, performer/instrument, and production/technical details when documented.
- [ ] Album Credits opens separately and shows album/release-level credits only.
- [ ] Album Credits empty state makes clear that track credits may appear in Tracklist above.
- [ ] Editions & Sources opens and shows selected edition, sources, source links, and technical links behind disclosures.
- [ ] Back to Results returns to the same Results state.
- [ ] Back to Album Search returns to retained Search fields.
- [ ] Reopening the same album from Results reloads details instead of staying in a partial state.

## Artwork Viewer

- [ ] Tapping cover art or a gallery thumbnail opens full-screen artwork.
- [ ] Loading feedback appears instead of a blank screen while an image loads.
- [ ] Swiping between multiple images works.
- [ ] Close control is easy to find and returns to Album Detail.
- [ ] Failed or unavailable image behavior is understandable and does not crash the app.

## Producer Search

- [ ] Producer Search opens from Album Search.
- [ ] Searching `Quincy Jones` shows candidate selection rather than silently choosing.
- [ ] Selecting the intended Quincy Jones candidate starts producer result lookup.
- [ ] Producer result cards show album title, artist credit, release metadata, and evidence text.
- [ ] Load More appends additional unique results or explains when no new albums were found in the batch.
- [ ] Tapping a producer result opens Album Detail.
- [ ] Back to Producer Search preserves producer input, selected producer, and loaded results.
- [ ] Producer Search clear control resets input, candidates, selected producer, results, loading/error state, and Load More state.

## Help / Data Sources

- [ ] Help / Data Sources opens from Album Search.
- [ ] Back button says `Back to Album Search`.
- [ ] Source roles are visible for MusicBrainz, Cover Art Archive, Wikidata, and Wikipedia.
- [ ] Producer Search limits are described honestly.
- [ ] Important notes explain that third-party metadata may be incomplete, duplicated, outdated, or incorrect.
- [ ] Support contact `vibeycraft@gmail.com` is visible.
- [ ] Privacy/network-data note and source/non-affiliation disclaimer are present and readable.

## Offline / Bad Network Spot Check

- [ ] With network unavailable or unreliable, Album Search shows an understandable error and does not crash.
- [ ] Album Detail optional sources such as artwork or Wikipedia remain non-blocking when unavailable.
- [ ] Producer Search candidate lookup/result lookup shows understandable errors and does not crash.
- [ ] After restoring network, normal Album Search and Producer Search can run again.

## Accessibility / Usability Spot Checks

- [ ] Primary tap targets feel usable on a common iPhone-sized screen.
- [ ] Text is readable and not obviously clipped.
- [ ] Long album, track, and credit names wrap acceptably.
- [ ] Image viewer Close control is easy to use.
- [ ] Basic dynamic text risk is noted if larger accessibility text sizes are not fully tested.

## Suggested Test Cases

- [ ] R.E.M. - `Murmur`
- [ ] R.E.M. - `Green`
- [ ] David Bowie - `Aladdin Sane`
- [ ] Nirvana - `Bleach`
- [ ] Quincy Jones Producer Search candidate and result flow
- [ ] One obscure or sparse-metadata album chosen during the test run

## Exit Criteria

- [ ] No must-fix runtime blockers remain.
- [ ] Any failed checks have a recorded follow-up issue or note.
- [ ] Static verification and manual smoke results are both recorded.
- [ ] Remaining production work is limited to known release-readiness tasks such as `app.json`, icons/splash, versioning, privacy details, metadata, and TestFlight/App Store setup.
