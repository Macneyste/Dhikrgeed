# Building and releasing

## Build profiles (`eas.json`)

| Profile | Output | Use |
| --- | --- | --- |
| `development` | debug APK | testing on a phone with Metro |
| `preview` | release APK | testers, GitHub Releases, Maestro flows, performance measurements |
| `production` | release AAB | Google Play |

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

`runtimeVersion` follows the app version (`policy: "appVersion"`).

Signing keys are managed by EAS (`eas credentials`) or kept outside the repository. Never commit a keystore, `credentials.json` or `google-services.json`; the pre-commit hook and `npm run security` refuse them.

## Over-the-air updates: not enabled

Phase 2 §5.1 asks for an EAS Update channel. It is **not** set up, on purpose. EAS Update downloads JavaScript over the internet, but Dhikrgeed promises no network use: release builds have no `INTERNET` permission (`plugins/withNoInternetInRelease.js`) and `npm run security` rejects network calls. Turning updates on would mean:

1. allowing `INTERNET` in release builds,
2. adding `expo-updates` and an allowlist entry in the security check for its update request,
3. changing the privacy text in Settings and the README.

That is a product decision for the maintainers. Until it is made, JS fixes ship as new builds.

## Release checklist

1. `npm run check` passes and `npm run validate:content -- --release` passes.
2. Build `preview` and run the Maestro flows on a low-end phone (see `.maestro/README.md`).
3. Update `CHANGELOG.md` (Somali and English) and bump `version` and `android.versionCode` in `app.json`.
4. Tag: `git tag vX.Y.Z && git push --tags`.
5. Google Play: upload the `production` AAB, staged rollout 10% → 50% → 100%.
6. GitHub Releases: attach the `preview` APK and its SHA-256 (`sha256sum dhikrgeed-X.Y.Z.apk`) in the notes.
