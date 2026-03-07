# Manual Smoke Checklist: Album + Navigation Flow

Use this checklist before merging changes that touch search/results/album navigation behavior.

## Preconditions
- Run app locally (`npm run dev`)
- Use a desktop browser first
- Start from `/` with a hard refresh

## Smoke Steps
1. Search by artist only (example: `David Bowie`) and submit.
2. Confirm results page appears with heading `Studio Albums Found`.
3. Confirm at least two result rows render.
4. Click one album result to open album detail.
5. Confirm album detail view shows `Tracklist` and `Credits`.
6. Use browser back button once.
7. Confirm results page is restored (same heading and list visible).
8. Click the same album again, then click visible `← Back` link on album page.
9. Confirm results page is restored again.
10. Open Help from results page, then use browser back.
11. Confirm Help closes and you return to results page state.
12. If gallery images are available, open lightbox, press browser back once, and confirm only lightbox closes (stay on album page).

## Mobile Width Spot Check
1. Set viewport to <= 480px.
2. Open an album from results.
3. Confirm `Back to Search Results` button is visible on album page.
4. Tap it and confirm return to results list.

## Pass Criteria
- No blank screen, no stuck loading state, and no broken back navigation in the steps above.
- Search results and album detail transitions are reversible via back navigation.
