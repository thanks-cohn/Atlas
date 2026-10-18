# 001 — Audit remnants of the retired tag-selection system

**Legacy identifier:** ATLAS-TAGS-001

**Status:** Backlog — not started; remaining conflicts are not yet proven.
**Reported:** 2026-10-18, explicit owner request.
**Context:** The immediate ranking implementation in `4d599f6` replaces the older select/apply/Enter and ALL-match tag-filter flow. Removing the visible controls alone is not sufficient evidence that every old dependency has gone.

### Required investigation

- Inspect all pinboard entry points, bookmark and blank-board views, previews, tag editors, search, refresh, settings, storage listeners and cover-fetch scope for retired selection assumptions.
- Look for old Apply/Enter handlers, duplicate listeners, pending/applied state, stale ALL-match filtering, obsolete controls/styles, unused helpers and imports. Remove obsolete implementation rather than hiding it.
- Inspect persisted browser settings and older data shapes for references to the retired interaction. Establish whether migration or safe ignoring is needed; do not delete saved human tags, model outputs, removal decisions, cards or bookmarks as cleanup.
- Check current documentation and tests for obsolete behavior presented as current. Retain historical rationale with explicit supersession.
- Reproduce from both an existing Chrome profile with earlier Atlas versions and a fresh profile; include reload/restart, changing boards, preview interaction, rapid search/selection changes and asynchronous tag saves.
- Verify that clicked tags and typed `tag:tag1,tag2` feed the same normalized graded ranking, with partial and zero matches retained. Ordinary search words filter independently. Enter keeps native button/input behavior. Alt+Q clears selection; Escape closes popups. Highlighting never determines whether a tag stays attached.

### Completion evidence

Record inspected paths, each actual remnant and its disposition, data-compatibility decisions, regression checks and real Chrome reproduction results. Confirm there is one active ranking path with no retired Apply/filter path reachable. Mark untested environments UNKNOWN; do not close this issue solely because source searches or DOM doubles pass.

**Starting points:** `extension/pinboard.js`, `pinboard-model.js`, `pinboard.html`, `pinboard.css`, `pinboard-blank.js`, `pinboard-tag-editor.js`, `fetch-covers.js`, related tests and the Forever Works status ledger.
