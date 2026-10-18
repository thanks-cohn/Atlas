# 003 — Saved notes cannot be deleted from the preview

**Status:** Backlog — not started.
**Reported:** 2026-10-18, explicit owner report.

## Problem and evidence

The owner reports no way to delete older saved notes in the preview. Record this as an open UI bug; this change does not claim independent Chrome reproduction or a fix. Users need an intuitive explicit removal action for existing notes.

## Investigation scope and constraints

Inspect the note-list/expanded-note UI and both native/catalog and authored-card persistence adapters. Add a discoverable, aesthetically placed removal action through the existing notes surface. Establish whether the operation removes a card-to-note association or deletes an exclusively owned note; never destroy a shared note or another card's data implicitly. Preserve stable identities and provenance, and account for future per-image ownership. Resolve active drafts and asynchronous save/remove races explicitly. Do not implement the action by hiding note elements while leaving their saved association active.

## Completion evidence

An existing saved note can be explicitly removed and stays removed after closing/reopening the preview and restarting/reloading. Other notes/cards/entries remain unchanged. Verify empty-list state, native and authored notes, shared references, failed removal/retry, keyboard access and narrow layout. Record removal semantics, affected paths, tests and actual Chrome evidence before marking Done.

**Starting points:** `extension/pinboard-preview-sections.js`, `extension/pinboard-preview-connections.js`, `extension/pinboard-blank.js`, catalog unlink/delete contracts and related tests.
