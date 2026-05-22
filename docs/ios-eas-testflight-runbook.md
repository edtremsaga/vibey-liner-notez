# iOS EAS / TestFlight Runbook

## Purpose

This is a minimal local runbook for preparing a future Liner Notez iOS EAS build and TestFlight upload. It is not a record that the app is ready for submission.

Do not run build, submit, login, credential, upload, or publish commands until Ed is ready to start the Expo/Apple release workflow.

## Current Local Baseline

- Expo app path: `apps/ios-liner-notez`
- App name: `Liner Notez`
- Slug: `liner-notez`
- Scheme: `linernotez`
- Bundle identifier: `com.edtremblay.linernotez`
- Version / build: `0.1.0` / `1`
- Platform: iOS only
- Orientation: portrait
- UI style: dark
- Icon and splash assets are configured in `apps/ios-liner-notez/app.json`.

## Local Preflight

Run these from the repo root before any build setup:

```bash
git status --short
npm run verify:ios-scaffold
cd apps/ios-liner-notez && CI=1 npx expo export --platform ios
```

Expected result:

- Git status is clean before starting release setup.
- Static iOS verification passes.
- Local Expo export succeeds.

## Manual Smoke Gate

Before a TestFlight build, run the manual checklist:

- `docs/ios-v1-smoke-checklist.md`

Record the device or simulator, iOS version, date, tester, pass/fail result, and follow-up issues in the checklist table.

## External Prerequisites

Ed needs these outside the repo before EAS/TestFlight work:

- Expo account with access to the project.
- Apple Developer Program membership.
- App Store Connect access.
- Confirmation that `com.edtremblay.linernotez` is the final bundle identifier.
- App Store Connect app record for Liner Notez.
- Privacy policy URL.
- Support URL.
- Final App Store privacy answers.
- Screenshots and final metadata review.

## Future EAS Setup Commands

These commands are listed for planning only. Do not run them during normal coding or documentation tasks.

From `apps/ios-liner-notez`:

```bash
npx eas-cli build:configure
```

This creates or updates EAS build configuration and may require Expo login.

Later, after config and credentials are ready:

```bash
npx eas-cli build -p ios --profile preview
```

or:

```bash
npx eas-cli build -p ios --profile production
```

These commands require Expo/EAS service access and iOS signing credentials.

For TestFlight/App Store upload later:

```bash
npx eas-cli submit -p ios
```

This requires App Store Connect access, Apple credentials, or an App Store Connect API key.

## Credential Boundary

Do not configure these from an ordinary app-code task:

- Expo login.
- Apple login.
- EAS credentials.
- Apple certificates.
- Provisioning profiles.
- App Store Connect API keys.
- App Store Connect app records.
- EAS submit settings.

Those steps should happen in a dedicated release setup session.

## Suggested First EAS Config Shape

When Ed is ready, create a minimal `eas.json` with separate local intent:

- `preview`: internal TestFlight-style build for smoke testing.
- `production`: release candidate build.

Keep runtime behavior unchanged. Do not add analytics, crash reporting, payments, accounts, or push notifications just for build setup.

## Submission Materials Checklist

Before upload or App Review:

- Manual smoke checklist passed.
- Privacy notes reviewed: `docs/ios-privacy-notes.md`.
- Metadata draft reviewed: `docs/ios-app-store-metadata-draft.md`.
- Final privacy policy URL available.
- Final support URL available.
- App icon and splash reviewed on device.
- Screenshots captured.
- Build number incremented if this is not the first uploaded build.
- App Store privacy answers manually confirmed.

## Safe Local Verification After EAS Config Edits

After any local config-only edit, run:

```bash
npm run verify:ios-scaffold
cd apps/ios-liner-notez && CI=1 npx expo export --platform ios
git status --short
```

Do not treat local export as a substitute for a real signed EAS build; it only proves the current Expo bundle/export path still works.
