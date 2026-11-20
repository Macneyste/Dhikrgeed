# Dhikrgeed — Master Prompt, Phase 2

**Soomaali (soo koobid):** Kani waa marxaladda labaad ee app-ka Dhikrgeed. Waxay ku daraysaa: tirinta badhamada codka, gariir kala duwan, shaashad aan demin, kayd la dhoofin karo, telefoonnada daciifka ah, cir isbeddela, beer, widget, Hijri iyo Jimce, Qibla, hab Ramadaan, iyo hagaajinno farsamo. Xeerka ugu muhiimsan: isbeddel kasta, xitaa mid yar, waa in si toos ah GitHub loogu diiwaangeliyaa: hal isbeddel → tijaabo → commit → push. Hooks-ka `.githooks` ayaa push-ka si toos ah u sameeya.

## 0. Before you start

This phase builds on Phase 1. Everything there still applies: design system, counting rules, security rules, `.gitignore`, folder structure.

Work in the folder `Dhikrgeed`, remote <https://github.com/Macneyste/Dhikrgeed>.

## 1. GitHub tracking: every change, however small, is committed and pushed

This is mandatory. It overrides any habit of batching work.

### One-time setup

```bash
npm run setup:hooks          # git config core.hooksPath .githooks
git remote -v                # must show origin → Macneyste/Dhikrgeed
```

- `.githooks/pre-commit` blocks private files (`.env`, keystores, `*.apk`, `*.aab`, `google-services.json`, `credentials.json`, `node_modules/`, `android/`, `ios/`, `.expo/`, `dist/`) and runs `npm test`.
- `.githooks/post-commit` pushes the commit to GitHub immediately (sets upstream on a new branch). If offline it prints a reminder; run `git push` later. `DHIKRGEED_NO_PUSH=1 git commit …` skips one push.

### The loop, after every single change

1. Make one change: one file, one fix, one feature step, even a one-line text or colour change.
2. Run the checks: `npm test` (always) and `npm run check`.
3. `git add -A` then `git status`: confirm only intended files are staged.
4. `git commit -m "<type>(<scope>): <what changed>"` → the hook pushes it.
5. Confirm with `git log --oneline -1` and `git status` (clean and up to date with origin).

Never end a task, a session or a reply with uncommitted or unpushed changes. If a check fails, fix it and commit the fix as its own commit; never commit broken tests.

### Commit messages (Conventional Commits)

`feat`, `fix`, `test`, `refactor`, `perf`, `style`, `docs`, `chore`, `ci`, `build`, `security`, `content`. Scope = area (counter, backup, sky, garden, widget, qibla, hijri, ramadan, i18n, release). Body (optional) says why.

### Branches for this phase

- Small fixes: straight to `main`.
- Each feature in §3–§4: `git switch -c feat/<scope>` → commit/push every step → open a pull request → merge when CI is green → `git switch main && git pull`.
- Tag releases: `git tag v0.2.0 && git push --tags`.

## 2. Guardrails (do not add)

- No leaderboards, points, "ajar" scores or comparisons between people. The tree and garden are motivation, never a measure of reward.
- No guilt notifications ("You missed yesterday!"). Reminders are only the ones the person turned on.
- No ads, no paid tier, no tracking or crash SDKs. Support = an optional donation link.
- No new adhkar text from memory. New content only through §5.4 with a reviewed source.

## 3. Phase 2a — must ship before the first public release

### 3.1 Count with the volume buttons (`feat/volume-keys`)

- Setting "Ku tiri badhamada codka" (default off). When on and the counter screen is focused, Volume Down = one count, Volume Up = undo. The key event is consumed (system volume does not change).
- Only while the counter screen is in the foreground; never in the background or other screens.
- Local Expo module `modules/volume-keys` (Kotlin) plus a config plugin that hooks `MainActivity.dispatchKeyEvent` for `KEYCODE_VOLUME_DOWN`/`KEYCODE_VOLUME_UP`, emitting an event to JS. JS subscribes in the counter screen and calls the same tap/undo as touch.
- TalkBack announcement every 10 counts and at each item change (not every count).
- Tests: a component test that a volumeDown event calls tap once.

### 3.2 Distinct haptics (`feat/haptics`)

Each count: `Haptics.selectionAsync()`. Item complete: `impactAsync(Medium)`. Round complete: `notificationAsync(Success)`. Undo: `impactAsync(Light)`. Only after the save transaction succeeds. Respect the Gariir setting. No crash on devices without a vibrator.

### 3.3 Keep the screen awake while counting (`feat/keep-awake`)

`useKeepAwake()` from `expo-keep-awake` on the counter screen only; released on leave and on completion.

### 3.4 Export and import a backup (`feat/backup`)

Because `allowBackup` is false, give people their own backup.

- Settings → "Kaydka": *Dhoofi kaydka* and *Soo celi kaydka*.
- Export: JSON file `dhikrgeed-backup-YYYY-MM-DD.json` via `expo-file-system` + `expo-sharing`. Contents: `{ "format": "dhikrgeed-backup", "version": 1, "exportedAt", "appVersion", "settings", "customDhikr", "sessions" }`. No device ids.
- Import: `expo-document-picker` (`application/json`), max 5 MB. Validate everything in a pure core function `parseBackup(json)` in `src/core/backup.ts`: format/version, types, id pattern `^[a-z0-9:-]{1,64}$`, counts within targets, custom dhikr through `validateCustomDhikr`, unknown keys dropped. Show a summary ("12 wareeg, 2 dikri gaar ah") and ask "Ku beddel xogta hadda?" before replacing. Import runs in one transaction; on any error nothing changes.
- Tests in `tests/core/backup.test.ts`: round-trip, wrong format, oversized counts, malicious strings, future version refused with a clear Somali message.

### 3.5 Low-end Android performance (`perf/low-end`)

- Target: smooth on a 2 GB RAM phone, tap-to-count under 100 ms, APK under 20 MB.
- Memoize Tree (re-render only when the stage changes) and Beads.
- `useNativeDriver: true` for the bead drop; skip it when reduced motion is on.
- Hermes on. Enable R8 and resource shrinking in release (`expo-build-properties`).
- Subset the Amiri font to the glyphs used and document the command in CONTRIBUTING.md.
- Measure on a real low-end device with a release build; record results in `docs/performance.md` (no invented numbers).

## 4. Phase 2b — the features that make it memorable (v1.1)

### 4.1 Sky that follows the time of day (`feat/sky`)

- `skyFor(now, prayerTimes)` in `src/core/sky.ts` → `'dawn' | 'day' | 'dusk' | 'night'` (dawn: fajr→sunrise; day: sunrise→asr; dusk: asr→maghrib; night: maghrib→fajr). Fallback to day with no city.
- Palettes (text contrast ≥ 4.5:1; night uses light text): dawn `#FDE7D6 → #F6C9B3 → #E9A98F`; day `#FFF6EF → #FCE8DD → #F7D7C8`; dusk `#FBD3B0 → #F2A57E → #C9786A`; night `#1E2340 → #2B3160 → #3D3F72` with 20–30 static white stars and grass darkened 40%.
- Crossfade over 1 s when the period changes; instant with reduced motion.
- Tests: boundaries for each period, midnight, missing times.

### 4.2 Garden (`feat/garden`)

"Beertayda": every completed round becomes a small tree in a grid, newest first, grouped by month. Tree accent = collection phase colour. Missing a day removes nothing; no streaks, no "broken" state. Tapping a tree shows collection, date and count. Data comes from completed sessions. Empty state: "Beertaadu way bilaabanaysaa."

### 4.3 Android home-screen widget (`feat/widget`)

`react-native-android-widget`, 2×2/4×2: next prayer + countdown and a Tasbiix button deep-linking to `dhikrgeed://session/tasbih` (allowlisted). Updates when reminders are rescheduled and every 30 min. Works offline.

### 4.4 Hijri date and Friday reminder (`feat/hijri`)

`src/core/hijri.ts`: Umm al-Qura conversion (table-based, tested against known dates) with a ±1/±2 day adjustment. Do not rely on Intl Islamic calendars. Home header shows e.g. "Khamiis, 29 Jumaada al-Uulaa 1448". Optional Friday reminder (default off): "Jimce wanaagsan: Suuratul Kahf iyo salawaat."

### 4.5 Qibla (`feat/qibla`)

`src/core/qibla.ts`: great-circle bearing to the Kaaba (21.4225, 39.8262), tested for Muqdisho, Nairobi, London, Minneapolis. Compass with `expo-sensors` Magnetometer, calibration hint ("Telefoonka ku wareeji qaab 8 ah"), bearing in degrees; bearing only without a sensor. No GPS.

### 4.6 Ramadan mode (`feat/ramadan`)

Auto-suggested during Ramadan, never forced; toggle in Settings. Suxuur (= Fajr) and Afur (= Maghrib) countdowns. Taraawiix rakaat counter and a last-ten-nights card. Text only from a reviewed source.

## 5. Engineering

- **5.1 EAS Build and Update:** `eas.json` profiles development, preview (APK), production (AAB); `runtimeVersion: { policy: "appVersion" }`; update channel for JS-only fixes, checked on launch only when online, never blocking. Signing credentials never committed.
- **5.2 Maestro e2e:** `.maestro/` flows onboarding, count-and-resume, complete-round, undo-across-item, backup-roundtrip, reminders-toggle. Run on a release build before every tag; manual CI job.
- **5.3 Distribution:** Google Play (AAB, staged rollout), APK on GitHub Releases with SHA-256, F-Droid metadata in `fastlane/metadata/android/{so,en-US}/`. Changelog in Somali and English.
- **5.4 Content packs:** adhkar in versioned JSON `src/content/packs/<pack>.json` validated by `validateContent` + `docs/content-schema.json`; content PR template; CI runs `npm run validate:content`; release builds use `--release`.
- **5.5 Bug report without tracking:** email draft (`expo-mail-composer`, fallback `mailto:`) with app version, Android version, device model and last 50 sanitized log lines. The person reviews and sends it.
- **5.6 Languages:** UI strings in `src/i18n/so.ts` (typed keys), `en.ts`/`ar.ts` skeletons, Somali default, RTL testing for Arabic, test fails on a missing key.

## 6. Definition of done

- Features behind settings where stated; defaults respect §2.
- `npm run check` and Maestro flows pass on a release build on a low-end Android phone.
- Backup round-trip restores everything; a malicious backup changes nothing.
- No private file in the repo; `git status` clean and in sync with origin after every task.
- Every change in this phase is visible as its own commit on GitHub.
