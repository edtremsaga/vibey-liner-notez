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

## Recommended Post-Smoke Priority

1. Diagnose selected-edition ranking and U.S./expected-region preference.
2. Fix low-risk terminology/copy issues:
   - `Back to Album Search` -> `Back to Search`
   - `Open album detail` -> `Open details`
   - dynamic search button by release type
   - neutral Release Type helper text
   - Status: addressed in the follow-up iOS release-type copy polish.
3. Diagnose album-credit coverage for representative albums.
4. Revisit sort defaults by release type.
5. Recheck splash behavior only after standalone/TestFlight build.
