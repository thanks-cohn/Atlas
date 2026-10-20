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

### Mandatory: directly draggable panel edges (owner clarification)

The existing workspace's grid regions currently feel **fixed-size**. This is a usability defect, not an optional enhancement. Users must be able to **grab the boundary between panes and drag to resize it** in the actual running interface:

- Vertical splitter between left and right panes adjusts their relative widths.
- Horizontal splitter above each lower content viewer adjusts the upper hierarchy and lower preview heights; **each side can have a different vertical split**.
- If a viewer or hierarchy spans both columns, its exposed split boundaries remain intuitive and resizable wherever the layout permits.
- Provide visible edge hover feedback, a modest grip and correct resize cursors (`col-resize`, `row-resize`); pointer drag should update dimensions smoothly without selecting page text or dragging objects accidentally.
- Mouse and touch/pointer interactions as supported; keyboard-accessible separator adjustment with ARIA semantics where feasible.
- Enforce reasonable minimum useful panel sizes and support collapse/expand; do not silently make content inaccessible.
- Double-click an active divider to restore a sensible default ratio.
- Persist user-defined ratios and restore them after refresh/restart; expansion/restore must not erase custom dimensions.
- **Test real edge dragging** (not only saved ratio models, sliders, or maximize buttons). Include automated interaction checks and manual Chrome validation where possible.

**Acceptance:** A user can place the pointer directly on a visible pane edge, drag it, and immediately see the two adjacent panels change size. No panel is locked to a hard-coded height or width in standard split mode.

## 5A — Familiar window controls, predictable toolbar, and elegant adaptive overflow (owner refinement, 2026-10-20)

**Priority order: intuitiveness and established conventions first; aesthetic refinement second, without sacrificing either.** Users must not need to learn a new layout-control language. Keep the interface visually restrained and beautifully composed, but test discoverability against ordinary desktop file explorers and IDEs.

### Window controls must mean what they conventionally mean
- **− Minimize:** retract a hierarchy/viewer region to a small recognizable title bar/tab; do not delete its contents or forget its state.
- **□ Maximize / Restore:** expand the selected region to the available dashboard viewport, reclaiming the oversized introductory Workspace header/unused space. Keep **Restore visible directly on the maximized region**, never only in an overflow menu. Restore its exact previous split sizes, location, scroll, selection and pinned preview.
- **× Close:** remove the *view* from the layout, not the object, files, data or active background job. Closing the right main pane lets the remaining pane occupy the width. **Dual Pane** reopens the hidden pane at its previous location/state.
- Place controls consistently in the relevant pane title bar, with standard order, familiar icons, tooltips, keyboard semantics and useful click targets. Prevent closing the last usable way to restore navigation.
- Retain draggable splitters and the user's custom dimensions. Closing, minimizing and maximizing are distinct operations.

### Predictable toolbar reflow, not wandering buttons
- Keep essential controls in a consistent location, in a compact visible toolbar or the active pane's title bar. Do not relocate them arbitrarily to whichever empty space exists.
- When a pane expands upward into the header area, **reflow the surrounding actions to a predetermined toolbar position** alongside the expanded area, provided adequate space; otherwise put **secondary** commands in a conventional overflow menu.
- When both regions occupy the available upper area, minimize surrounding chrome and collect displaced secondary commands in a **small bottom-right floating menu** with a recognizable three-line icon. Keep a **visible Restore control on the active maximized region** regardless of menu state.
- The overflow menu should expose clearly labeled existing commands such as Dual Pane, Activity & Recovery and other layout choices, using the same actual actions (not independent duplicate implementations). Keep commonly used essential actions visible where room permits.
- No obscured content, layout jumps, overlapping controls or random command order.

### The floating menu should be discreet, never undiscoverable
- The bottom-right launcher remains **visibly discoverable** at rest. A small icon/dock may subtly dim or become translucent after inactivity, but **must not fully disappear** or require users to guess an invisible hover zone.
- Open by **click/tap**; hover may optionally preview/open, but never as the sole access method. Expanded flyout may close after pointer and keyboard focus leave it following a forgiving delay; do not dismiss while hovered, focused, being used, or while a dialog is open.
- Support Escape to close, appropriate focus return, keyboard/screen-reader labels, touch targets, reduced motion and sufficient contrast. Avoid blocking underlying scrollbar, images or other interactive content; respect safe areas and narrow viewports.
- A visually appealing compact translucent dock, subtle shadow, refined motion and clean spacing are encouraged **only when functionality and accessibility remain obvious**.

### Acceptance and evidence
1. A first-time user can identify −, □/Restore, ×, Dual Pane and the overflow menu without instruction.
2. Maximize actually recovers height consumed by the dashboard header; Restore is always directly reachable and recovers prior state and ratios.
3. One maximized region keeps essential controls predictable; both expanded regions put displaced secondary commands in the bottom-right menu without losing access.
4. The menu is visibly discoverable after inactivity, clickable and tappable, keyboard accessible, and does not obscure active content.
5. Closing a pane preserves data and other pane state; reopening Dual Pane restores navigation, selection and preferences.
6. Actual Chrome testing where available, plus regression tests for maximize/minimize/close/restore, reflow, flyout dismissal and focus, 1366×768 and narrow widths; report browser verification limitations honestly.

**Design rule:** *Content may expand freely; essential controls must stay recognizable, discoverable and predictable.*

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
