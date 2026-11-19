# Security policy

## Reporting a vulnerability

Please report vulnerabilities **privately** through GitHub Security Advisories:
<https://github.com/Macneyste/Dhikrgeed/security/advisories/new>

Do not open a public issue for security problems. Include the app version, the Android version and the steps to reproduce. We aim to reply within 7 days.

## What the app promises

- No network access at runtime; release builds have no `INTERNET` permission.
- No accounts, analytics, crash reporting or ad SDKs.
- Only `POST_NOTIFICATIONS` and `VIBRATE` are requested; location, camera, microphone, contacts, storage, overlay and exact-alarm permissions are blocked.
- Android backup is disabled, so local data stays on the device.
- All SQL uses bound parameters. Custom dhikr text is sanitised (control and bidi-override characters removed) and rendered as plain text only.
- Deep links and notification data are checked against an allowlist of routes and id patterns.
- Signing keys and credentials are never committed. If a secret is ever committed, rotate it; deleting the file is not enough.

`npm run security` and `npm audit --omit=dev --audit-level=high` run in CI on every push and pull request.
