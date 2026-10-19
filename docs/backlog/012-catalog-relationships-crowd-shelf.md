# 012 — Catalog and relationship management crowds the shelf

**Status:** Backlog — explicit owner UI report; relocation not implemented.
**Reported:** 2026-10-19 America/Chicago.

## Observed problem

Owner opened the diamond (Catalogs & relationships) from the shelf and found the
catalog/resource management panel crowded and visually unattractive. The panel
combines catalog creation, bookmark creation, JSON export, filtering, resource
metadata, notes, tags, references and relationship controls in a constrained shelf.
Source confirms this uses `library-dialog` in `explorer.html` and `graph.js`.
This is a usability/layout issue; no catalog corruption has been established.

## Accepted direction

Remove this management panel from the shelf and put catalog/relationship editing
on a separate dedicated page. Keep the shelf elegant and focused. Whether the
diamond becomes a link to that page or is removed from the shelf is a design
choice still to resolve; do not silently delete the feature or its data.

Preserve existing resource/catalog IDs, memberships, tags, notes, locators,
relationship directions/types and JSON export. Preserve authenticated companion
access and revision-conflict handling. Do not confuse Atlas resource bookmarks
with Chrome bookmarks or auto-migrate/delete either dataset.

## Reproduction and closure

Open the shelf, click the diamond, inspect the management panel at narrow shelf
width. Closure requires a dedicated page with usable catalog filtering, creation,
resource tags/notes, membership, linking and export, plus a simple intentional
entry path from the shelf. The large management dialog must no longer open inside
the shelf. Verify existing data before/after and actual Chrome layouts at narrow
and wide sizes, keyboard navigation, errors and companion reconnection. Until
implemented and verified, leave this issue open.
