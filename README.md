# Dhikrgeed

**Dhikrgeed** (*dhikr* + *geed*, "tree") is an open-source Android app for counting dhikr. Every tap counts one dhikr: a bead drops from the tasbih string and a tree grows from a seed to a tree full of fruit as the round progresses.

> **Soomaali:** Dhikrgeed waa app furan (open source) oo lagu tiriyo dikriga. Taabasho kasta waa hal dikri, geedkuna wuu koraa ilaa uu miro ka bixiyo. Wuxuu shaqeeyaa internet la'aan, akoon la'aan iyo xayeysiis la'aan. Xogtaadu telefoonkaaga ayay ku jirtaa oo keliya.

## Principles

- Works fully **offline**. Release builds do not have the `INTERNET` permission at all.
- **No account, no login, no ads, no analytics, no tracking SDKs.**
- Progress is saved locally (SQLite) after every tap and resumes exactly where you left.
- The tree is motivational only. The app never claims to measure reward.

## Features (v1)

- Tasbih 33 / 33 / 34, after-prayer adhkar, morning and evening adhkar
- Custom dhikr with your own text and target
- History with a weekly view
- Five daily prayer times calculated on the device for a city you choose (no location permission), with optional local reminders
- Accessibility: large text, TalkBack labels, reduced motion, 48 dp touch targets

## Content review status

All bundled adhkar are marked `draft`. A qualified person must review every text, transliteration, meaning and count before a public release. `npm run validate:content -- --release` fails until that is done. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Requirements: Node 22 or newer (see `.nvmrc`), and Android Studio or an Android device for a development build.

```bash
npm ci
npx expo install --fix   # align native package versions with the Expo SDK
npm run check            # typecheck, lint, unit + component tests, content and security checks
npm run android          # build and run a development build on Android
```

| Script | What it does |
| --- | --- |
| `npm test` | Pure core tests with `node:test` (no app dependencies needed) |
| `npm run test:components` | Counter screen tests with jest-expo |
| `npm run validate:content` | Structural checks of bundled adhkar (`-- --release` also requires review) |
| `npm run security` | Fails on network calls, eval, raw HTML, SQL template strings, hidden characters, tracked secrets or permission drift |
| `npm run format` | Prettier |

Always add native packages with `npx expo install <pkg>`.

## Project layout

```
app/               Expo Router screens (thin)
src/core/          Pure TypeScript rules: counting, progress, validation, reminders
src/content/       Bundled adhkar and collections
src/db/            expo-sqlite migrations and repositories
src/services/      Session writes, prayer times, notifications
src/components/    Scene, Tree, Beads, PhaseCards and shared UI
src/hooks/, src/theme/
tests/core/        node:test unit tests
tests/components/  jest-expo component tests
plugins/           Expo config plugins
```

## Licence

Code is MIT ([LICENSE](LICENSE)). Fonts are under the SIL Open Font License; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). To report a security issue, see [SECURITY.md](SECURITY.md).
