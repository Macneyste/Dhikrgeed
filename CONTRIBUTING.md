# Contributing to Dhikrgeed

Thank you for helping. Code, comments and commit messages are in English; UI text is Somali; dhikr text is Arabic.

## Workflow

1. Create a branch for anything larger than a small fix: `git switch -c feat/<name>`.
2. Make one focused change.
3. Run `npm run check` and fix anything that fails.
4. Run `git status` and make sure no ignored, private or secret file is staged.
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`, `style:`, `ci:`, `security:` with a short scope, for example `feat(counter): drop bead animation on tap`.
6. Open a pull request.

## Code rules

- `src/core` and `src/content` are pure TypeScript with no React Native imports. Use explicit `.ts` extensions and `import type` so Node can run them directly.
- Add native packages with `npx expo install <pkg>`.
- Never use `fetch`, `XMLHttpRequest`, `eval`, web views or HTML rendering. Never build SQL from strings; use `?` parameters.
- Never log custom dhikr text.

## Adding or changing adhkar (religious content)

Content must never be written from memory.

1. Each entry needs a reliable **source** (for example a hadith collection and number, or a Qur'an reference) in the `source` field.
2. Arabic text, transliteration, Somali meaning and count must match that source.
3. New or changed entries start as `reviewStatus: 'draft'`.
4. A reviewer with suitable knowledge checks the entry and, in a separate commit, sets `reviewStatus: 'reviewed'`. The pull request must say who reviewed it.
5. Bump `CONTENT_VERSION` in `src/content/collections.ts` when bundled text or targets change. Running rounds keep their own snapshot, so nobody's count changes mid-round.
6. Ids are permanent. Never rename or reuse a dhikr or collection id.

`npm run validate:content -- --release` must pass before a public release.
