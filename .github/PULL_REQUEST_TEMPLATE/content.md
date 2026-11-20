<!--
Content pull request: new or changed adhkar in src/content/packs/*.json.
Open with ?template=content.md. Never add text from memory.
-->

## Content change

Pack: `src/content/packs/<pack>.json` (version bumped: yes / no)

| Field | Value |
| --- | --- |
| Dhikr id (permanent) | |
| Arabic text (with harakat) | |
| Count | |
| Transliteration (Somali orthography) | |
| Somali meaning | |
| Source reference (collection and number, or Qur'an sura:aya) | |
| Reviewer name and qualification | |

## Checklist

- [ ] Arabic text, count and meaning match the source exactly.
- [ ] New or changed entries are `"reviewStatus": "draft"`. A reviewer sets `"reviewed"` in a separate commit.
- [ ] Ids are new or unchanged; no id is renamed or reused.
- [ ] `npm run build:content` was run and `src/content/packs.generated.ts` is committed.
- [ ] `npm run validate:content` passes.
