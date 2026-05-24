# Codex Liner Notez iOS Safe Change Protocol

## Purpose

Use this protocol for small, safe Codex changes to the Liner Notez iOS app. It packages the repeated workflow used for iOS copy, verifier, documentation, and narrow behavior fixes.

The goal is to keep changes reviewable, verified, and tied to the current app state without retyping the same guardrails in every prompt.

## When to Use This Protocol

Use this protocol for:

- Narrow iOS app edits in `apps/ios-liner-notez`.
- iOS documentation updates in `docs`.
- Verifier updates in `apps/ios-liner-notez/scripts/verify-scaffold.mjs`.
- Small UI copy, empty-state, navigation-label, or presentation polish.
- Small, well-scoped iOS behavior fixes with clear acceptance criteria.
- Checkpoint updates after manual smoke testing.

## When Not to Use It

Do not use this protocol for:

- Broad app redesigns.
- Large MusicBrainz service rewrites.
- React/web app changes.
- App Store submission, EAS build, EAS submit, Expo login, Apple login, uploads, credentials, or provisioning.
- New analytics, tracking, accounts, payments, push notifications, or persistence.
- Exploratory product strategy without a concrete repo task.

## Required Preflight Checks

Start from the expected repo path:

```bash
cd "/Users/edwardtremblay/Library/CloudStorage/OneDrive-Personal/vibe coding/vibey liner notez"
pwd
git status --short
test -f package.json
test -f AGENTS.md
test -f apps/ios-liner-notez/app.json
test -f apps/ios-liner-notez/scripts/verify-scaffold.mjs
test -f docs/ios-scaffold-checkpoint.md
```

For app behavior or screen tasks, also check the specific screen or service files named by the task.

Stop immediately if:

- `pwd` is not the expected repo.
- Required files are missing.
- `git status --short` shows unexpected existing changes that affect the requested files.
- The task would require credentials, upload, submission, or external release tooling.

## Mode Selection

### Diagnose Only

Use diagnose-only mode when the user asks for an audit, recommendation, root-cause analysis, or next-step proposal.

Rules:

- Do not edit files.
- Do not commit.
- Ground findings in inspected files, docs, scripts, or git history.
- Report commands run and final git status.

### Edit

Use edit mode when the user asks for a concrete code, copy, verifier, config, or documentation change.

Rules:

- Keep the diff narrow.
- Preserve existing behavior unless the task explicitly asks to change it.
- Update verifier checks only when needed for the changed behavior or copy.
- Update docs only when the task asks for it or when the checkpoint would otherwise become stale.
- Verify before committing.

### Documentation Only

Use documentation-only mode when the task is a checkpoint, runbook, smoke result, privacy note, metadata draft, or protocol update.

Rules:

- Do not edit runtime app code.
- Do not edit MusicBrainz services.
- Do not edit verifier scripts unless a documentation-related assertion is stale.
- Keep docs factual and concise.

## Safe Edit Protocol Rules

Follow `AGENTS.md`:

- Analyze first.
- Produce a plan when the work is non-trivial.
- Treat the user's edit prompt as approval for the requested narrow implementation.
- Prefer minimal, surgical edits.
- Do not refactor unrelated code.
- Preserve existing behavior unless explicitly asked to change it.
- Update or add tests/verifier checks for changed behavior when practical.
- If more than two fixes are attempted for the same issue, stop and re-analyze.
- If system architecture is unclear, explain before editing.

## iOS App Scope Boundaries

Default allowed areas for iOS work:

- `apps/ios-liner-notez/src/App.js`
- `apps/ios-liner-notez/src/screens/*.js`
- `apps/ios-liner-notez/src/services/*.js`
- `apps/ios-liner-notez/scripts/verify-scaffold.mjs`
- `apps/ios-liner-notez/app.json` only for explicit config tasks
- `docs/*.md` for checkpoint, smoke, privacy, metadata, and runbook updates

Default avoid areas unless explicitly requested:

- React/web app code in `src`.
- Shared package schema/model changes.
- Build credentials or release submission files.
- Generated Expo output such as `.expo` or `dist`.

## Verifier Update Rules

Update `apps/ios-liner-notez/scripts/verify-scaffold.mjs` when:

- Visible UI copy changes and the verifier checks the old copy.
- A required screen flow, guard, or helper changes.
- A regression guard can be added with a small deterministic static or fixture check.

Do not update the verifier when:

- The task is documentation-only and verifier assumptions are still current.
- The check would require live MusicBrainz, Cover Art Archive, Wikidata, Wikipedia, Apple, or Expo network behavior.
- The check would broaden scope beyond the requested change.

Prefer:

- Static checks for screen copy and wiring.
- Small local fixture checks for pure helpers.
- Clear failure messages that describe the expected current behavior.

Avoid:

- Live API checks.
- Broad mock-fetch harnesses unless explicitly requested.
- Brittle checks for unrelated formatting.

## Documentation Update Rules

Update docs when:

- The user asks for a checkpoint, runbook, smoke result, privacy note, metadata note, or protocol.
- A completed app change affects the documented current state.
- Manual smoke testing validates or changes the readiness picture.

Keep documentation updates:

- Concise.
- Date or commit aware when useful.
- Clear about manual validation versus automated verification.
- Honest about remaining gaps.

Do not use documentation updates to smuggle in new product scope.

## Required Verification Commands

For iOS app, verifier, config, or docs changes, run:

```bash
npm run verify:ios-scaffold
cd apps/ios-liner-notez && CI=1 npx expo export --platform ios
```

Also run before committing:

```bash
git diff --stat
git status --short
```

For diagnose-only tasks, verification is optional unless it helps answer the question.

Do not run:

- `eas build`
- `eas submit`
- `expo login`
- Apple login or credential commands
- Upload, publish, or submission commands

## Commit and Push Rules

Commit only after verification passes.

Before staging:

```bash
git status --short
git diff --stat
```

Stage only intended files. Use the commit message requested by the user when provided.

Push after a successful commit when the user asks for push.

After push, confirm:

```bash
git status --short
```

## Final Report Format

For edit tasks, report:

- Files changed.
- Summary of what changed.
- Confirmation that behavior did or did not change.
- Verification commands and results.
- Commit hash.
- Push result.
- Final `git status --short`.

For diagnose-only tasks, report:

- Commands run.
- Findings.
- Recommended next step.
- Final `git status --short`.

For documentation-only tasks, report:

- Files changed.
- Summary of doc updates.
- Verification results.
- Commit hash.
- Push result.
- Final `git status --short`.

## Stop Conditions

Stop and report before editing if:

- The repo path is wrong.
- Required files are missing.
- Existing changes touch the same files and are not clearly part of the request.
- The task requires credentials, uploads, EAS build/submit, Apple submission, or account setup.
- The requested change would alter MusicBrainz request behavior when the task says copy/docs only.
- The change grows beyond the named scope.
- Verification fails and the cause is not a narrow obvious fix.
- Two attempted fixes fail for the same issue.

## Compact Reusable Codex Prompt Skeleton

```text
Mode: [diagnose only | edit | documentation only]. Keep the change narrow.

Task:
[Describe one concrete Liner Notez iOS task.]

Repo path:
/Users/edwardtremblay/Library/CloudStorage/OneDrive-Personal/vibe coding/vibey liner notez

Before doing anything:
cd "/Users/edwardtremblay/Library/CloudStorage/OneDrive-Personal/vibe coding/vibey liner notez"
pwd
git status --short
test -f package.json
test -f AGENTS.md
test -f apps/ios-liner-notez/app.json
test -f apps/ios-liner-notez/scripts/verify-scaffold.mjs
test -f docs/ios-scaffold-checkpoint.md
[Add task-specific file checks.]

Stop immediately if this is not the expected repo or if required files are missing.

Scope:
- [Allowed files/areas.]
- [Explicit constraints.]
- Preserve existing behavior unless this task explicitly changes it.
- Do not run EAS build, EAS submit, Expo login, Apple login, upload, submit, publish, or auth commands.

Acceptance criteria:
- [Concrete expected outcomes.]
- Verification passes.
- Final git status is clean after commit/push, if this is an edit task.

Verification:
npm run verify:ios-scaffold
cd apps/ios-liner-notez && CI=1 npx expo export --platform ios

Commit:
[Commit message, if applicable.]

Stop after reporting:
- Files changed or commands run
- Summary
- Verification results, if run
- Commit hash, if committed
- Push result, if pushed
- Final git status --short
```
