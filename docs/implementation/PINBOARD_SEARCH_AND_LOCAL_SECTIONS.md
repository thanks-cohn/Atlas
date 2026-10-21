> Organizational UI refinement: [ordered flow and Images](CARD_SECTION_FLOW_AND_IMAGES.md) supersedes the per-item selector and boxed Section presentation below; ownership/storage guarantees remain.

# Pinboard searchable tags and local Sections

Owner direction, 2026-10-20: improve the existing Card pop-out. Create a Section locally; reuse only its organizational name globally. Never combine content implicitly.

## Fixed obligations and constrained implementation

Existing preview toggles, note drafts/editing, linked bookmark chooser/focus/image actions, tags, settings, native authority and content adapters remain authoritative. No subsystem replacement or new permission. The optional organization adapter wraps the shared preview renderer used by authored Cards, bookmark Cards and image entries. Fluid choices are the compact controls and the extension-local sidecar format.

The tag picker now filters existing vocabulary immediately, ranks exact matches first and sorts other matches alphabetically. Arrow Down moves to results; Enter adds the first match; the existing list's Enter/double-click toggle, Add Tag, attached-tag removal, retry and Create & Add remain. Case/NFKC-equivalent labels collapse, and creating a known tag reuses its existing spelling. Already attached normalized labels are not re-added. Search never runs inference or changes source visibility settings.

## Local Sections and shared names

Open Notes or Bookmarks to reveal the far-right **+ Section** action. Choose **Create New Section** or **Choose Existing Section**. The latter provides an A–Z searchable list. Existing content stays unsectioned until explicitly assigned with its adjacent Section selector. New content uses the existing editor/chooser, then the same selector. Each area offers local rename, up/down ordering and Remove. Removal retains contents, leaves them unsectioned and retains the shared name. Empty Sections are allowed. Escape closes the naming dialog and returns focus; controls use native buttons, inputs and selects.

Two Cards using Architecture get two independent local Section IDs referencing one shared name ID. Rename changes only that local Section's name association. It does not rename a global category or any other Section. Choosing the same category again in the same Card/area reuses its existing active Section; Notes and Bookmarks can each have a distinct instance.

## Portable data contract, version 1

`extension/card-sections.js` stores organization only, never note text, bookmark payloads or copied content:

- `atlas.section-names.v1`: registry entries `{id, key, label, createdAt, actor}`. Keys use NFKC, trimmed/collapsed whitespace and lowercase. Labels are limited to 120 characters; names survive removal of local instances.
- `atlas.card-sections.v1:<encoded owner>`: `{version:1, owner, revision, sections, memberships, history}`. Local Section records have independent IDs, owner, area, nameId, creation time and optional removal tombstone. Array order is presentation order.
- Membership keys encode `[previewContext, area, existingItemReference]`; values are local Section IDs. Notes reference the existing note ID; bookmarks reference the existing exact URL. Image-entry contexts retain their existing IDs. A Section may organize references from the Card's image contexts; this never moves items between contexts.
- Authored owners use their existing scoped Card key. Bookmark owners use bookmark placement ID plus exact URL, preserving distinct local Section identity even where the legacy catalog resolves content by URL. Changing a bookmark URL leaves old organizational evidence stored rather than attaching it silently to new content.
- Explicit legacy image materialization migrates only membership context references to the retained first image entry. Inline legacy note identity is kept consistent with the existing preview. Recovery keeps the organizational sidecar; restoration of the same image ID resolves the same references.
- All writes share the existing `atlas-pages-v1` lock, read latest data and atomically save registry/document. Unknown document versions reject mutation. A failed write does not update cached state. Journal entries retain actor/time, reassignment evidence, previous name IDs and detached references. Cross-Card or cross-area Section IDs are rejected. Capacity guards: 5,000 names and 1,000 local Section records per Card (including tombstones).

These IDs/reference-only associations preserve the distinction between resource ownership, local membership and shared category identity needed by future Atlas Objects/compositions. This is an additive extension format, not a claim of a new native catalog schema or normative Forever Works conformance. Future adapters must explicitly map these references and retain provenance; matching name IDs must never trigger content merging.

## Executed verification

- All 24 extension contract scripts in `.github/workflows/verify.yml` PASS locally, including new `scripts/test_card_sections.mjs`, existing preview/content adapters, tag editor, authored Cards, image entries/Recovery and workspace regressions.
- `scripts/test_pinboard_popout_browser.mjs` PASS in actual headless Chromium 153.0.8010.0 with real shipped renderer/store/control modules and synthetic content/Chrome storage adapters: create, searchable A–Z reuse, distinct Architecture instances across Cards, assignment of notes/bookmarks, adding and independently editing content, reorder, saved reload, independent rename/removal, no transfer, normalized tag search/Enter/duplicate prevention, 390px dark dialog bounds and Escape focus restoration. This test is now in browser CI.
- Existing `scripts/test_pinboard_folder_tags_browser.mjs` PASS against the full Pinboard page in Chromium 153, with synthetic Chrome APIs: settings, folder visibility persistence, shared picker/manual labels, multiple boards, actual authored content/Section create-save-assign-close/reopen and explicit legacy image materialization. A newly added image starts without copied notes; navigating back resolves the original note in its original Section after context migration.
- Storage tests include wrong-owner/area rejection, context migration, retained removal evidence and atomic storage failure. Content is deliberately never an input to the organization store.
- `python scripts/package_extension.py` and project linkage/check results are recorded in the continuation ledger. Inspect that ledger for exact Python environment limitations.

## Boundaries and continuation

Installed MV3/companion/Windows acceptance for this change is NOT_RUN locally; synthetic browser adapters are not proof of that integration. Physical screen-reader, touch and large-library performance acceptance remain unqualified. No automatic cross-window organization refresh is promised; reopen/change context or open the name chooser to refresh its registry. Storage failures retain existing content and show errors.

Objects Dashboard aggregation, explicit composition/merging, templates, native/R2 section APIs, portable export/import UI and global category management are deferred. Names and memberships are separate to permit these later without changing content ownership. Existing bookmark catalog exact-URL sharing semantics are unchanged; Sections do not promise to isolate legacy underlying note bodies that were already shared by the catalog.

Next: review the PR and verify the installed extension with actual authored and companion-backed Cards; then design explicit export/Object adapters. Do not infer approval to merge.
