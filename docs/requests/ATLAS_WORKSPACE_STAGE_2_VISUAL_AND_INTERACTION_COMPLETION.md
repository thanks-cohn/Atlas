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

## 5A — Standard window controls and adaptive floating commands (owner clarification, 2026-10-20)

**Window-control convention.** Each independently managed hierarchy/viewer region should offer recognizable **− minimize**, **□ maximize/restore**, and **× close** controls with tooltip and accessible labels. Minimize retracts the region but preserves its state; maximize promotes it into the full usable dashboard area (including space ordinarily occupied by the large introductory Workspace heading); restore returns to the precise previous layout; close hides the *view only*, never deletes a source or cancels a job. Closing the second main pane makes the remaining pane fill width; **Dual Pane** reopens the hidden pane retaining its prior location, selection, pinned preview and split preferences. Provide a predictable path to restore even when maximized and guard against hiding the last available navigation/control affordance.

**Adaptive command positioning.** When **one pane/region is maximized or promoted to the top**, don't leave global action buttons behind it or let them become inaccessible. **Reflow the relevant existing toolbar controls into the newly available, visible unoccupied space** alongside/adjacent to the promoted pane, with stable grouping and keyboard focus order. Do not let controls overlap content, jump randomly, or obscure the pane's own −/□/× controls. The maximized content should consume the reclaimed header area as intended.

**When both upper regions or both panes occupy the top/full available area**, consolidate displaced global controls into an **expandable three-horizontal-lines (hamburger) menu**, implemented as a tasteful small **floating/sticky bottom-right launcher** above workspace content. Clicking/tapping it reveals the existing commands (e.g. Dual Pane, Restore Layout, Activity & Recovery, Expand Hierarchies/Viewers) grouped with readable labels; do **not** duplicate separate command implementations or bury the Restore action without discovery. Closing the menu returns focus safely to the launcher.

**Auto-hide behavior:** The *expanded floating menu* retracts after the user moves pointer/focus away, following a short forgiving delay, and the resting bottom-right launcher fades/retracts unobtrusively after pointer inactivity. The launcher must remain readily recoverable on hover near the corner, keyboard focus/shortcut or tap. **Never make essential controls hover-only**: support touch, keyboard/screen-reader, reduced-motion, visible focus, sufficient target sizes and discovery on first use. Do not hide it while the menu is open, focused, hovered, being interacted with, or while a confirmation dialog is open. Respect safe-area/taskbar boundaries and avoid covering active image controls/scrollbars; provide a minimal persistent or discoverable affordance if otherwise inaccessible.

**Aesthetic treatment:** subtle motion, consistent spacing and iconography, refined translucency/contrast where appropriate, no jitter or content occlusion, and no unnecessary fixed decorative header. Prefer conventional responsive overflow-menu patterns over surprising custom animation.

**Verification:** Real Chrome/manual and automated layout-state tests must cover single maximized pane and relocated controls; both regions promoted and hamburger visibility; command operation from the floating menu; hover-away inactivity, mouse reentry, keyboard/touch recovery, resize, scroll, navigation and restored layout with exact retained pane state. Include at least 1366×768 and a narrow viewport. Do not represent this behavior as shipped without verification.

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
