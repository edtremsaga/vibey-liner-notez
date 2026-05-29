# iOS Smoke Test Results - May 2026

## Test Environment

- Device/simulator: iPhone 16e simulator
- iOS: 26.2
- Launch method: Expo dev launch
- Test style: manual smoke test with screenshots observed by Ed and ChatGPT
- Scope: first-pass functional/UX smoke, not exhaustive QA

## Overall Verdict

- Functional quality: PASS
- No crash observed
- No blocked core workflow observed
- No broken navigation observed
- No failed search/detail path observed
- App appears usable as a real beta candidate
- Several product-quality and terminology follow-ups were found

## Signed TestFlight Build 3 - iPhone Smoke Pass

Status: PASS

Context:

- Build: TestFlight build 3
- App version: 0.1.0
- Device: iPhone 11
- Tester setting: larger iPhone text size intentionally enabled for readability without reader glasses
- Scope: signed-build smoke, Dynamic Type review, core app flow, Producer Search follow-up

Confirmed:

- App launched successfully from TestFlight.
- No black screen observed.
- No startup diagnostic/error screen appeared.
- Search screen rendered.
- Album Search worked for R.E.M., Beck, The Beatles, and related follow-up searches.
- Results screen rendered and remained navigable.
- Album Detail rendered for selected albums.
- Selected edition and source details rendered.
- Release Credits rendered, including no-credit empty states when appropriate for the selected release.
- Tracklist rendered.
- Expandable track credits worked.
- Album Art & Liner Images loaded when public source records had images.
- Full-screen artwork viewer opened and swiped between images.
- Wikipedia album article links opened externally.
- Producer Search worked for Butch Vig.
- Producer Search results loaded and Load More worked.
- Producer Search result cards opened Album Detail.
- Back navigation from Producer Search result Album Detail returned to Producer Search.
- No obvious crash observed.

Follow-up found and addressed:

- During Build 3 testing, Producer Search / Producer-opened Album Detail showed stale album-search context in the app header, for example `Browsing albums by The Beatles` while viewing Butch Vig producer results.
- Follow-up fix `1b8833b` changed the header to route-aware Producer Search context.
- The fix was verified in Simulator/dev with the header showing `Producer credits for Butch Vig` and the detail back action showing `Back to Producer Search`.
- Because the fix landed after TestFlight build 3, a later TestFlight build will include it for real-device confirmation.

Non-blocking follow-up:

- Larger iPhone text size remains a real supported use case. The app is functional, but Help / Data Sources, dense credits, selected-edition details, and long technical links can still feel heavy. Keep this as an accessibility/Dynamic Type layout polish lane, not a blocker for the current internal beta.

## General Launch Notes

1. Expo/simulator launch timed out once via `xcrun simctl openurl`.
   - Severity: Low / environment
   - Result: app opened after retry/manual handoff
   - Assessment: not an app bug

2. Expo dev splash/build screen showed a white background while JavaScript bundled.
   - Severity: Low / watch item
   - Assessment: recheck later in standalone/TestFlight build before treating as a final splash issue

## Test Cases

### R.E.M. - Murmur

Status: PASS

Confirmed:

- Search results loaded.
- Oldest-first sorting worked.
- `Murmur` appeared first under studio albums.
- Album Detail opened.
- Cover art loaded.
- Album Art & Liner Images loaded with 11 images.
- Full-screen image viewer opened.
- Image viewer advanced between images.
- Tracklist loaded with 12 tracks.
- Track-level expandable credits worked.
- Album Credits loaded.
- Editions & Sources expanded.
- Technical Links expanded.
- Wikipedia link opened externally.
- Back to Results worked.
- Collapsed sections made the detail page readable and clean.

Required fixes: none.

Watch/polish:

- Expanded metadata sections can be dense, but collapsed layout is good.

### Nirvana Search / Results

Status: PASS

Confirmed:

- Studio Albums search returned 3 results.
- Oldest first sorted: `Bleach`, `Nevermind`, `In Utero`.
- Newest first sorted: `In Utero`, `Nevermind`, `Bleach`.
- Result count looked correct for studio albums.

### Nirvana - Nevermind

Status: PASS with product-quality watch note

Confirmed:

- Detail opened.
- Cover art loaded.
- Wikipedia link appeared.
- Album Art & Liner Images showed 1 image.
- Tracklist loaded.
- Track-level credits expanded.
- Album Credits correctly showed no separate album-level credits for selected release.
- Editions & Sources loaded.

Watch note:

- Selected edition was `1991-09-24 - Australia - Official - CD - DGC Records - DGCD-24425`.
- User expected a U.S. edition when available.
- Artwork showed only 1 image, possibly due to selected edition.

Severity: Medium product-quality follow-up.

Suggested later diagnosis:

- Review selected-release ranking logic.
- Prefer U.S. official releases when date/status/format are otherwise comparable.
- Do not blindly force U.S. if original/canonical release is clearly UK or another country.

### Nirvana - Bleach

Status: PASS

Confirmed:

- `Bleach` appeared first in oldest-first studio album results.
- Detail opened.
- Cover art and tracklist loaded.
- Track-level credits worked.
- Album Credits empty-state message appeared appropriately.
- Editions & Sources loaded.

### ELO - The Electric Light Orchestra

Status: PASS

Confirmed:

- Album Detail opened.
- Cover art loaded.
- Wikipedia link appeared.
- Album Art & Liner Images loaded with 5 images.
- Tracklist loaded with 9 tracks.
- Track-level expandable credits worked.
- Album Credits correctly showed no separate album-level credits for selected release.
- Editions & Sources loaded.
- Selected edition looked plausible: `1971-12-03 - United Kingdom - Official - 12" Vinyl - Harvest - SHVL 797`.
- Side-style track numbering worked: A1, A2, B1, etc.

Required fixes: none.

### ELO - Compilations

Status: PASS with terminology/product-clarity issue

Confirmed:

- Changing Release Type to Compilations worked.
- Results screen showed `Compilations by ELO`.
- Newest-first sorting worked.
- Results loaded.
- Opening a compilation/detail worked.
- Cover art loaded.

Issue:

- A result opened from Compilations showed detail metadata as `1974-11 - album`.
- This may be MusicBrainz primary type behavior, but it is confusing after choosing Compilations.

Severity: Low/Medium product clarity.

Suggested later diagnosis/fix:

- Clarify release type/context in detail metadata.
- Consider neutral wording for non-studio buckets.

### ELO - Live Albums

Status: PASS with sort-default watch note

Confirmed:

- Live Albums search returned results.
- Results loaded and opened.

Watch note:

- Live Albums defaulted to Newest first rather than Oldest first.
- This may be intentional, but UI does not explain why.

Severity: Low/Medium UX consistency.

Suggested later review:

- Decide whether all release types should preserve the user's last sort or use explicit type-specific defaults.

### ELO - Singles

Status: PASS with sort/terminology watch note

Confirmed:

- Singles search returned results.
- Newest-first sort worked.

Watch note:

- Singles defaulted to Newest first.
- Same album-centric terminology issue applies.

### Black Flag - Singles

Status: PASS with terminology/product-clarity issue

Confirmed:

- Singles search returned results.
- Sorting worked.
- `Louie Louie` opened and loaded artwork.
- Tracklist loaded.
- Track-level credits worked.
- `Thirsty and Miserable` opened and displayed a compact 2-track single-style release.
- Back to Results worked.

Issues:

- Results cards say `Open album detail` when browsing Singles.
- Detail metadata showed `1981 - album` for `Louie Louie` / `Thirsty and Miserable` even though user selected Singles and these are single/EP-like releases.

Severity: Low/Medium product clarity.

Suggested later fix:

- Change `Open album detail` to `Open details`.
- Consider neutral release-detail wording for Singles/EPs/Live/Compilations.

### Black Flag - EPs

Status: PASS with terminology issue

Confirmed:

- EPs search returned results.
- Newest-first sorting displayed recent EPs first.
- `Nervous Breakdown` opened.
- Cover art loaded.
- Wikipedia link opened correctly and showed `Nervous Breakdown` as an EP.
- Tracklist loaded.
- Editions & Sources loaded.
- Back to Results worked.

Issues:

- Results still say `Open album detail` in EPs.
- Detail header showed `1978-01-01 - album` for `Nervous Breakdown`, while Wikipedia and user expectation identify it as an EP.

Severity: Low/Medium product clarity.

Suggested later fix:

- Change `Open album detail` to `Open details`.
- Diagnose whether detail type display can use secondary type/context when primary MusicBrainz type is generic album.

### Dead Kennedys - Fresh Fruit for Rotting Vegetables

Status: PASS

Confirmed:

- Album detail opened.
- Cover art loaded.
- Wikipedia link appeared.
- Tracklist loaded with 14 tracks.
- Side-style track numbering worked.
- Track-level expandable credits worked.
- Album Credits empty-state message appeared appropriately.
- Editions & Sources loaded.
- Selected edition looked plausible: `1980-09 - United Kingdom - Official - 12" Vinyl - Cherry Red Records - B RED 10`.
- Back to Results button present.

Required fixes: none.

### Lady Gaga - MAYHEM / Modern Pop Album

Status: PASS with data-quality follow-up

Confirmed:

- Detail opened.
- Tracklist loaded.
- Editions & Sources loaded.
- Album Credits showed no separate album-level credits for selected release.

Observed:

- Selected edition included non-U.S. region/country examples, including Australia/Europe.
- User questioned whether there really are no album credits for this album.

Severity: Medium data-quality follow-up.

Suggested later diagnosis:

- Inspect MusicBrainz release relationships for selected Lady Gaga releases.
- Compare selected Europe/Australia editions against U.S. official editions.
- Confirm whether album-level credits exist in MusicBrainz for any selected release.
- Decide whether app should surface richer track/recording/release credits or explain source limits more clearly.

### Lady Gaga Soundtrack / Song-Style Case

Status: PASS with selected-edition/product-copy watch notes

Confirmed:

- A Lady Gaga-related soundtrack entry opened.
- Cover art loaded.
- Tracklist loaded.
- Album Art & Liner Images showed 1 image.
- Album Credits showed no separate album-level credits for selected release.
- Editions & Sources loaded.

Observed:

- Selected edition showed country code `AL`, which may be confusing to users.

Severity: Medium product-quality follow-up when combined with other selected-edition observations.

Suggested later fix:

- Prefer expected region where appropriate.
- Display full country names instead of raw country codes where possible.

## Cross-Cutting Issues

### A. Selected-Edition Preference Often Chooses Non-U.S. Or Unexpected Editions

Severity: Medium

Examples:

- Nirvana - `Nevermind` selected Australia CD.
- Lady Gaga selected Australia/Europe examples.
- Lady Gaga soundtrack/song-style case showed country code `AL`.

Why it matters:

- Selected edition affects cover art, liner images, catalog number, label, credits, and perceived correctness.

Suggested follow-up:

- Diagnose selected-release ranking logic.
- Prefer U.S. official releases when date/status/format are otherwise comparable.
- Preserve existing preference for official and appropriate release dates.
- Do not force U.S. when original/canonical release is clearly elsewhere.

### B. Album-Centric Wording Breaks Down Outside Studio Albums

Severity: Low/Medium

Examples:

- Release Type = Singles but primary button still says `Find Albums`.
- Results say `Open album detail` for Singles and EPs.
- `Back to Album Search` is slightly unclear because the main screen is titled `Explore Album Liner Notes`.
- Detail metadata may show `album` for EPs/singles/compilations due to MusicBrainz primary type.

Suggested fixes:

- Change `Back to Album Search` to `Back to Search`.
- Change `Open album detail` to `Open details`.
- Make primary button dynamic:
  - Studio Albums: `Find Albums`
  - Singles: `Find Singles`
  - EPs: `Find EPs`
  - Live Albums: `Find Live Albums`
  - Compilations: `Find Compilations`
- Change helper text under Release Type to neutral copy, such as `Choose what kind of releases to browse.`

### C. Sort Defaults Vary By Release Type

Severity: Low/Medium

Observed:

- Studio Albums defaulted to Oldest first.
- Live Albums, Singles, EPs, and Compilations appeared to default to Newest first.

Question:

- Is this intentional?

Suggested follow-up:

- Either document/clarify the behavior, preserve the user's last sort, or standardize defaults.

### D. Album-Credit Coverage Uncertainty

Severity: Medium data-quality follow-up

Observed:

- Several selected releases showed no separate album-level credits.
- This may be correct for MusicBrainz release-level data but may not match user expectations for known albums.

Suggested follow-up:

- Diagnose whether app is missing release-level relationships, track/recording-level credits, or credits on alternative editions.
- Improve source-limit messaging if needed.

### E. Dev-Only Launch/Splash Quirks

Severity: Low / watch

Observed:

- Expo dev launch timed out once.
- Dev build screen showed white background.

Suggested follow-up:

- Recheck in standalone/TestFlight build.

## Second Smoke Pass

Environment:

- Test style: targeted manual follow-up smoke after selected-edition, sort-preservation, and copy polish.

Results:

- Sort preservation: PASS. Results sort selection was preserved after opening Album Detail and returning to Results.
- Nirvana - `Nevermind`: PASS. Selected edition now shows United States / Official / 1991-09-24.
- Lady Gaga - `MAYHEM`: PASS. Selected edition now shows United States / Official / 2025-03-07; Tracklist loads; the credit empty-state path works.
- ELO - `The Electric Light Orchestra`: PASS. Selected edition remains United Kingdom / Official / 1971-12-03 / Harvest / SHVL 797; the U.S. exact-date tie-break did not override the UK original.
- Dead Kennedys - `Fresh Fruit for Rotting Vegetables`: PASS. Selected edition remains United Kingdom / Official / 1980-09; month-only ties were not forced to U.S.
- Black Flag Singles - `Louie Louie`: PASS with terminology issue. Single opens correctly; artwork, Tracklist, and Editions & Sources load. Remaining issue: detail credits label was still album-centric.
- Black Flag EPs - `Nervous Breakdown`: PASS with terminology/data-type issue. EP opens correctly; artwork viewer and detail load. Remaining issue: detail page still used album-centric wording.
- ELO Compilations: PASS. Detail opens; Tracklist, credit empty-state copy, and Editions & Sources load.

Follow-up addressed:

- `Album Credits` renamed to `Release Credits`.
- Empty-state copy now says `release-level credits` instead of `album-level credits`.

## Latest Manual Smoke Pass After `4b928f1`

Environment:

- Test style: targeted manual smoke pass after `4b928f1` / `Release Credits` terminology polish.

Results:

- Bad-spelling Album Search no-results state: PASS. Typo example `Dvid Bowiea` returned a clear `No albums found` state and did not crash.
- Results sort preservation: PASS.
- Selected-edition sanity check: PASS.
- Help / Data Sources basic content check: acceptable, with a future focused copy review still recommended.
- Producer Search - `Brian Eno`: PASS functionally. Candidate/result flow worked, Load More worked, and the result count increased after loading more.
- Producer Search - `Fear of Music` follow-up: PASS / not a bug. Release Credits matched Album Search for the same selected release, so the empty Release Credits state appears to be selected-release data behavior rather than a Producer Search bug.
- Producer Search - `Quincy Jones`: PASS functionally. Candidate selection worked, results loaded, Load More worked, and the result count increased from the initial batch.
- Producer Search - `George Martin`: PASS. Loading state appeared, results loaded, and a producer result opened Album Detail successfully.
- Weak/nonsense Producer Search queries: PASS. Examples `Zzzzzzzz`, `Quincy Jonez`, and random text returned clear `No producer candidates found` states and did not crash.
- Producer Search clear controls: PASS.
- Offline/reconnect spot check: PASS. With Wi-Fi off, Album Search showed a calm `Music data search error` message; reconnect behavior was acceptable.
- No crashes observed.
- No blocking navigation failures observed.
- No stale `Album Credits` wording observed in tested screens.

Non-blocking follow-ups:

- Producer Search may need expectation-setting copy that searches can take a moment because release-level MusicBrainz credits are being checked.
- Producer result action copy says `Open album detail`, which is inconsistent with Album Search's newer `Open details` wording.
- Producer result numbering looks questionable/cramped, for example `1.Outside...`; consider removing visible numbering.
- Producer Search result count copy may be misleading before Load More; consider `found so far`.
- Producer Search sort controls may be useful later, but should not be implemented yet.
- Help / Data Sources should get a focused copy review before TestFlight readiness.

Follow-up addressed:

- Producer Search now sets expectations that release-level producer-credit checks can take a moment.
- Producer result cards now use `Open details`.
- Producer result card titles suppress leading numeric prefixes for display.
- Producer result count copy now says results are `found so far`.
- Help / Data Sources visible copy was replaced with final polished product help covering album tips, Producer Search guidance, missing-credit expectations, source attribution, independence language, privacy notes, and support contact.

## Signed TestFlight iPhone Smoke Pass After ExpoAsset Fix

Environment:

- Device: iPhone 11.
- Build path: signed TestFlight build after the missing native `ExpoAsset` module startup fix.
- Test style: manual smoke with screenshots observed by Ed and ChatGPT.

Results:

- App launches successfully from TestFlight on iPhone 11.
- No black screen.
- No startup diagnostic/error screen.
- Search screen renders.
- Results render for R.E.M. studio albums.
- Album Detail renders for R.E.M. `Murmur`.
- Selected edition/source details render.
- Release Credits render.
- Tracklist renders.
- Expandable track credits work.
- Album Art & Liner Images section loads.
- Artwork gallery shows 11 images.
- Full-screen artwork viewer opens and swipes.
- Back navigation appears present.
- No obvious crash observed.

Non-blocking follow-up:

- The iPhone screenshots appear to use very large Dynamic Type / accessibility text sizing. The app remains functional, but dense screens become cramped: large headings dominate the screen, cards show limited content at once, Release Credits and Tracklist are readable but dense, image viewer controls are very large, and artwork labels truncate. Review iPhone accessibility / Dynamic Type layout as a follow-up, not a blocker for this signed-build smoke pass.

## Build 3 iPhone Smoke-Test and Screenshot Checklist

Purpose:

- Verify Dynamic Type chrome polish on iPhone 11.
- Verify splash / launch polish if added before Build 3.
- Confirm no regression from the `ExpoAsset` startup fix.
- Capture possible App Store screenshots.

Settings to test:

- Ed's normal larger iPhone text size.
- Normal/default iPhone text size.
- Wi-Fi on.
- Wi-Fi off or poor-network conditions.

Screens to test and optionally capture:

- Search screen.
- Results screen.
- Album Detail hero / selected edition.
- Release Credits.
- Expanded Tracklist credits.
- Artwork gallery.
- Full-screen artwork viewer.
- Producer Search.
- Help / Data Sources.

Known test records:

- R.E.M. - `Murmur`: use for selected edition, Release Credits, expanded Tracklist credits, artwork gallery, and full-screen artwork viewer.
- Nirvana - `Nevermind`: use for U.S. selected-edition sanity.
- Lady Gaga - `MAYHEM`: use for modern-release selected edition, Tracklist, and empty Release Credits behavior.
- Black Flag - `Louie Louie` / `Nervous Breakdown`: use for single / EP terminology sanity.
- Brian Eno or Quincy Jones: use for Producer Search candidate selection, results, Load More, and Album Detail handoff.

Pass / fail notes:

- Launch: app opens from TestFlight/Home Screen without black screen or startup diagnostic.
- Dynamic Type: Ed's larger text size remains readable, but headings, buttons, section controls, artwork labels, and image-viewer controls no longer dominate the layout.
- Default text size: screens still look normal and not artificially small.
- Splash / launch: if polish is included, launch should feel intentional and should not show placeholder/default visual artifacts.
- Network handling: Wi-Fi off or poor-network search shows a calm error state and does not crash.
- Screenshots: capture App Store candidate screenshots at default text size unless accessibility screenshots are intentionally desired.

## Recommended Post-Smoke Priority

1. Diagnose selected-edition ranking and U.S./expected-region preference.
   - Status: exact full-date Official U.S. tie-break addressed in the follow-up selected-edition ranking polish.
2. Fix low-risk terminology/copy issues:
   - `Back to Album Search` -> `Back to Search`
   - `Open album detail` -> `Open details`
   - dynamic search button by release type
   - neutral Release Type helper text
   - Status: addressed in the follow-up iOS release-type copy polish.
3. Diagnose album-credit coverage for representative albums.
   - Status: Release Credits empty-state copy clarified for selected-release release-level credits vs Tracklist credits.
4. Revisit sort defaults by release type.
5. Recheck splash behavior only after standalone/TestFlight build.
