# 023 — Workspace dashboard qualification and remaining stages

Status: In progress; 2026-10-20 first read-only slice, not complete.

Owner brief: `docs/requests/ATLAS_STANDARD_WORKSPACE_DASHBOARD_IMPLEMENTATION_BRIEF.md`.
Source proof and missing features: `docs/implementation/WORKSPACE_DASHBOARD_V1.md`.

Observed: companion catalog is flat; there is no implemented R2 backend. New shell is covered by model/provider and DOM-double tests but local Chromium install failed (invalid download). Native recovery/Python startup tests reproduce the documented container failures. Do not call this a visually accepted dashboard or completed collections system.

Continue with the documented Chrome smoke matrix (Shelf/Story Gallery/defaults, independent panes/history/selection/pin/layout, actual authorized/disconnected local and Objects, keyboard/narrow/reduced-motion). Record screenshots, browser version and outcomes. Then add versioned recursive collection persistence and negative cycle tests without duplicating native bookmarks or source bytes; bounded media viewers; reference operations distinct from authorized transfers; conventional context/clipboard controls and complete breadcrumbs. UI labels and capabilities must stay honest until each is functional. Preserve current source IDs, grants, accepted pinboard performance and separately developed editor work.

Closure: each brief requirement has concrete executed evidence or an explicitly owner-accepted deferral; visual and native non-regression matrices have real browser/platform proof. Do not close this issue on DOM tests alone.

## 2026-10-20 — Stage 2 progress (still In progress)

Implemented actual pointer/touch resize edges, independently persisted heights, bounded previews and content tabs, safe context commands, deeper breadcrumbs and paged rendering. Real Chromium153 synthetic-provider interaction/geometry tests pass; before/after and narrow captures are under `docs/evidence/workspace-stage2/`. See `docs/implementation/WORKSPACE_DASHBOARD_STAGE_2.md` for exact proof. Full installed MV3 did not run locally because the available headless-shell build did not start the extension worker; new full-Chromium CI gate is pending. Actual desktop Chrome/native/Windows, screen-reader and low-memory acceptance remain open. Collections nesting, R2 and cross-pane mutation contracts remain deferred; do not mark this backlog Done.
