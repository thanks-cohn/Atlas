# 002 — Note editor has no title field

**Status:** Backlog — not started.
**Reported:** 2026-10-18, explicit owner report.

## Problem and evidence

The owner reports that the preview's note-entry interface has no input for a note title. Record this as an open UI bug; it has not been independently reproduced in Chrome in this change. Notes need a deliberate title rather than relying on their body text to identify them in the list.

## Investigation scope and constraints

Inspect the shared preview note editor, native catalog note resources, authored-card note storage and migration paths. Determine whether titles are already stored but not editable, or require an additive field. Reuse the existing editor and adapters rather than introducing a separate notes dashboard. Preserve old note bodies, identities and links; define a readable fallback for untitled legacy notes without rewriting their content. Respect future per-image ownership in the additive-image proposal.

## Completion evidence

A user can enter a title and body, save, reopen and reload, and see the correct title in the note list for both native bookmark and authored-card notes. Existing untitled notes remain readable. Verify failed save/retry, keyboard use, narrow layout and isolation between cards/entries. Record actual paths, migration decisions, tests and Chrome evidence before marking Done.

**Starting points:** `extension/pinboard-preview-sections.js`, `extension/pinboard-preview-connections.js`, `extension/pinboard-blank.js`, preview HTML/CSS and related tests.
