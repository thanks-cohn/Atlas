# Atlas Workspace — Stage 2: Familiar, Beautiful, Fully Verified Explorer

**Status:** Implementation request, not proof of completion.  
**Baseline:** PR #4 merged to `main` as commit `4a96f97326fd9ee53d431c60ad7d85d79ce9eb08`.  
**Related:** `docs/requests/ATLAS_STANDARD_WORKSPACE_DASHBOARD_IMPLEMENTATION_BRIEF.md`, `docs/implementation/WORKSPACE_DASHBOARD_V1.md`, `docs/backlog/023-workspace-dashboard-qualification.md`, `docs/forever-works/ATLAS_FUTURE_VISION_AND_PRODUCT_BLUEPRINT.md`.

## Purpose

Continue the Atlas Dashboard using its existing single/dual-pane shared explorer architecture. This stage prioritizes **real Chrome verification, conventional behavior, clarity, aesthetic polish, and the originally envisioned hierarchy-over-content workspace**. Do not build an unrelated dashboard or change existing operating workflows without cause.

The intended first impression is: **“I've seen this before. I know what to do.”** Familiar software conventions are nonnegotiable. Aesthetic improvement should reinforce, not displace, comprehensibility.

## 1 — Audit what already exists

Inspect latest `main` and the implementation and backlog documents. Identify exactly which features are working, simulated, read-only, absent, or blocked by environment. Reuse existing providers and model APIs. Check Shelf entry points, standalone workspace, bookmark explorer, pinboards, current projects and settings. Do not damage them.

Read `AGENTS.md`, Forever Works verification conventions, and the current status ledger. Report baseline shortcomings without attributing known pre-existing native issues to new dashboard work.

## 2 — Verify in real Chrome

The previous stage could not complete true Chrome MV3 runtime and visual testing. Make a serious attempt to load the packaged extension in Chrome/Chromium, launch the Workspace from the actual Shelf button, and capture or inspect the resulting interface at representative desktop sizes including 1366×768. Verify tabs, sidebar, both panes, keyboard and context interactions, failure and disconnected states. If graphical browser access is blocked, be precise about what could not be verified; do not claim passing visual tests from DOM doubles alone.

Fix actual rendering defects, clipping, overflow, unusable widths, broken icons, focus failures, and obvious readability problems. Preserve compatibility with the extension's CSP and permissions.

## 3 — Standardize the entire visual language

Use ordinary file-manager and dashboard patterns:
- Consistent sidebar labels, icon styles, toolbars, breadcrumbs and selection.
- Familiar navigation: back, forward, up, enter, open, single-click select, sortable columns, list/grid controls where implemented.
- Familiar shortcuts and right-click commands where safe and meaningful.
- Consistent inline states for loading, empty libraries, unsupported provider operations, permission errors, disconnected sources, and successful saves.
- Attractive but restrained typography, spacing, surfaces, borders, shadows, motion and hover/selection styles.
- Clear distinction between destructive deletion and removing a reference.
- Reduced-motion support, keyboard focus, readable contrast and responsive behavior.

Prefer proven conventions/components over novel UI patterns. Avoid ornamental complexity, excessive permanent buttons, and new terminology users need to learn.

## 4 — Implement hierarchy-top / viewer-bottom inside each pane

Each explorer pane should have an independently navigable **upper hierarchy/map/tree/list region** and a **lower content viewer**, using real supported resource data. In dual-pane mode the familiar default is a **2×2 grid**:

```text
+---------------------------+---------------------------+
| Left hierarchy            | Right hierarchy           |
| Objects / Local / R2      | Objects / Local / R2      |
+---------------------------+---------------------------+
| Left selected content     | Right selected content    |
| Preview / Notes / Details | Preview / Notes / Details |
+---------------------------+---------------------------+
```

The upper hierarchy stays visible while the lower viewer displays the selected item's contents. Support truthful previews for existing data types and graceful fallback for unsupported types. In particular handle bookmark metadata, available image previews, note/text data, and existing local-file details, subject to provider capability. Do not eagerly fetch full large remote assets.

Use familiar lower viewer tabs where warranted: Preview, Contents, Notes, Details. For composite Atlas Objects, let the viewer expose existing child and related items, without claiming new data models are implemented if not supported.

Single-click selection previews below; opening/navigating into folders remains a distinct familiar action. Keep location navigation and preview selection independent.

## 5 — Pin, compare, expand and restore

Users should be able to **pin** a preview so they can navigate the hierarchy without changing it. Both panes may show separate pinned images or notes for comparison.

Implement predictable view-state operations:
- Drag-resize left/right vertical divider and upper/lower horizontal divider where practical.
- Expand **bottom viewers across both panes** to provide a larger visual comparison area or single enlarged focused view.
- Expand **top hierarchy regions across both panes** for large-scale organization.
- Expand/focus one full pane and restore previous layout.
- Visible maximize/restore affordances; do not rely only on a hidden gesture.
- Preserve location, selection, pinned preview, scroll/history (where practical) and prior split ratios during transitions.
- Persist users' layout preference appropriately across workspace restarts.
- Subtle smooth transitions respecting `prefers-reduced-motion`.

An expanded view is a presentation change; never mutate object records as a side effect.

## 6 — Collections and consistent actions

The baseline supports flat Collections. Investigate the safest natural path to nested Collections, using folder/subfolder conventions and cycle prevention. If feasible within this stage, complete nesting with tests; otherwise document a truthful next-step plan and keep existing Collections fully usable.

Where existing sources are read-only, do not render action buttons as functional if they are not implemented. Context menus may expose only actually safe actions. Avoid introducing R2 writes, bulk transfers, bucket visibility changes, or new file-deletion powers merely to fill the toolbar. Clearly separate Add Reference from physical Copy/Move/Transfer.

## 7 — Performance and implementation discipline

Target lightweight browsing on a modest laptop with roughly 4 GB RAM and a 1366×768 viewport. Lazy-load previews, bound list/rendering size, keep the DOM responsive, and avoid giant image decoding or unnecessary downloading. Protect keyboard and pointer interactions on densely populated lists.

Reuse the shared explorer and provider abstractions introduced by PR #4. Isolate UI view state from provider data and object identity. Do not replace native connectors, build Puck, create an entire R2 transfer system, or alter premium entitlements in this stage.

## 8 — Tests, deliverables and reporting

At minimum exercise:
1. Existing Shelf/diagonal-arrow Workspace launcher, bookmarks, pinboard, Story Gallery and settings entry points.
2. Single and dual explorer modes and independent pane navigation/search/sorting/selection.
3. 2×2 upper-hierarchy/lower-viewer layout and proper selection-to-preview behavior.
4. Pinning two previews and browsing without losing either.
5. Expand bottom across both panes, expand top, focus pane, and restore exact layout/state.
6. Split resizing and persisted view preferences.
7. Narrow desktop rendering and keyboard accessibility; reduced-motion.
8. Empty/unsupported/offline/unauthorized states, including R2 when not integrated.
9. Non-regression for existing providers and documented native test baseline.

Produce a PR with:
- Actual code changes implementing the strongest safe vertical slice.
- Automated tests and real browser/manual verification receipts where obtainable.
- Before/after screenshots when browser capture is possible.
- Precise status of implemented, tested, unverified and deferred capabilities.
- Updated status/implementation/backlog docs following Forever Works.
- No premature claims of feature completion, no silent merge.

## Design doctrine

**Standardized first. Intuitive always. Aesthetic wherever possible.**

The novelty lies in Atlas Objects, composition and seamless providers **underneath** ordinary controls. It should feel like a beautiful, trustworthy file explorer and creative workspace—not a puzzle the user must solve.
