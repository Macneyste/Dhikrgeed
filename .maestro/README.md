# End-to-end flows (Maestro)

Run on a **release** build (`preview` profile) on a real, preferably low-end, Android phone before every tag:

```bash
npx eas-cli build --platform android --profile preview   # or a local assembleRelease
adb install -r dhikrgeed.apk
maestro test .maestro/
```

| Flow | Checks |
| --- | --- |
| `onboarding.yaml` | welcome screen once, then Home |
| `count-and-resume.yaml` | count 40, kill the app, relaunch: still 40 |
| `complete-round.yaml` | 33/33/34 completes, counting stops, new round |
| `undo-across-item.yaml` | undo after item 1 completes goes back to 32 |
| `backup-roundtrip.yaml` | export, change data, import with confirmation, data restored |
| `reminders-toggle.yaml` | reminder on (with permission) and off |

Notes:

- Flows start from a cleared app state, so they never touch real data.
- `backup-roundtrip.yaml` drives Android's share sheet and file picker. Their labels vary by phone; see the `env` block at the top of the flow.
- CI has a manual job (`.github/workflows/e2e.yml`, "Run workflow" on GitHub) that runs these on an emulator. `backup-roundtrip.yaml` is tagged `device-only` and skipped there, because the system share sheet differs on emulators.
