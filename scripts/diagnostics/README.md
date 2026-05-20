# Diagnostics Scripts

Manual, developer-only diagnostics for investigating Liner Notez data-source behavior.

These scripts are not part of the app runtime, scaffold verification, or CI. They may use live network APIs and can take a while to run.

## Producer Search POC

`diagnose-producer-search.mjs` probes MusicBrainz release-level producer relationships for a bounded set of producer names.

It is read-only:

- does not modify app state
- does not write local data files
- does not change MusicBrainz data
- prints findings, evidence, metrics, and optional JSON to stdout

It does require live MusicBrainz network access and respects a small request delay between calls.

Example:

```sh
node scripts/diagnostics/diagnose-producer-search.mjs --limit 10 "George Martin"
```

Use it when evaluating Producer Search coverage, request cost, ranking ideas, or future recording-level fallback tradeoffs.
