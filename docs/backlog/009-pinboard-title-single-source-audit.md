# 009 — Audit one authoritative pinboard name

**Status:** Backlog — owner-directed audit, not a proven duplicate-data defect.

Saved-name startup flash fixed in a5255ee with early title resolution and deferred
heading reveal. Owner further requires shelf, heading, browser tab, rename editor
and collection selector to read one authoritative current title per board. Audit
all creation/read/rename paths and legacy default-title storage; original bookmark
provenance must not become an alternate board name. Do not retain old names solely
for history. Migrate only where evidence shows duplicate authority; preserve board
identity and contents. Test shelf-to-page rename, existing/default boards, reload,
and concurrent tabs. Startup fix alone does not close this source-of-truth audit.
