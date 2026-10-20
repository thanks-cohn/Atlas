# Atlas Workspace Follow-up — Single-Pane Preview on Right or Below

**Status:** Future implementation request; do **not** interrupt or expand the active Stage 2 workspace fix.  
**Prerequisite:** Complete and verify the current Atlas Workspace Stage 2 interaction/layout work first.  
**Reference:** `docs/requests/ATLAS_WORKSPACE_STAGE_2_VISUAL_AND_INTERACTION_COMPLETION.md`

## Owner's request

In **Single Pane** mode, the Atlas preview/content viewer should not be limited to the area underneath the hierarchy/file grid. Users should be able to put the preview **to the right** of the hierarchy instead, in the space ordinarily occupied by the second explorer pane. The user chooses the arrangement.

This is a **layout change to one explorer + its viewer**, not an instruction to activate a second independent source/browser pane.

## Expected interaction

- Provide a familiar, discoverable **Preview Position: Bottom | Right** control in the relevant View/layout menu; sensible icons and brief tooltips are fine.
- **Bottom:** the hierarchy/grid is above the selected-item preview, with a draggable horizontal divider.
- **Right:** the hierarchy/grid is on the left, and the selected-item preview is on the right, with a draggable vertical divider.
- The right-side preview occupies the available second-column space while Atlas is in Single Pane mode. It must display the selection from the left hierarchy, **not** become a separate navigator or source.
- Both layouts must support selected images, notes, object details, contents and other existing supported previews without inventing unsupported viewer types.
- Standard panel − minimize, □ maximize/restore and × close operations continue to work consistently, alongside user-adjustable splitters and any refined Stage 2 workspace controls.
- Preserve selected item, active viewer tab, pinned preview, hierarchy path, scroll state where feasible, and saved split ratios when changing preview orientation.
- Store the preference and recall it across workspace sessions. Prefer separately remembered ratios for Bottom and Right.
- If the user enables Dual Pane, retain the two independent explorer panes and existing layout. Do not silently replace the right explorer with the preview; preserve the Single Pane preference for when the user returns.
- At constrained widths, adapt gracefully: offer a predictable fallback/stacked presentation or ask rather than cramping either panel. Keep keyboard, touch, accessibility, reduced motion and minimum viable pane sizes.
- Focus on **familiar file-manager conventions, intuitive interactions, and aesthetic polish**, without a novel visual metaphor or toolbar bloat.

## Additional requirement — Remove redundant path row; hover-reveal second toolbar row

**Owner-confirmed exact scope (2026-10-20):** Apply these changes to **both explorer panes** while completing this *future* follow-up, not the currently active Stage 2 implementation.

1. **Preserve the first/top toolbar row exactly as it is.** Keep its existing buttons, positions, labels, and always-visible behavior. Do not move Grid/List controls into it or redesign it.
2. **Remove the redundant dedicated location/breadcrumb display row** that reads like `Local Files / Authorized folder / nut`; do not leave an empty placeholder row. This concerns that extra visible line, not the underlying path/navigation state or the location selector.
3. **Keep the existing second toolbar row, including Grid/List view controls, in its current order and positions.** Hide/collapse that row by default and reveal it on toolbar hover or explicit user interaction. No move of Grid/List to the first row.
4. The second row must also be discoverable and accessible via keyboard focus and click/tap for touch users; do not make it hover-only. Use a subtle, conventional disclosure affordance without altering the first row's existing control arrangement.
5. When collapsed, the hidden row must consume **no permanent vertical space**. Give that space back to the explorer grid and previews. Avoid distracting layout jitter when revealing/hiding (e.g., tasteful anchored overlay as appropriate).
6. Maintain all current functionality, navigation semantics, accessibility, responsive behavior, and reduced-motion support. Verify in single- and dual-pane layouts, including narrow widths and long paths.

**Visual priority:** First row always visible and **unchanged**; second row appears on hover/activation; the `Local Files / Authorized folder / nut` display row is removed; the rest of the height belongs to content.

## Implementation and acceptance

1. Read and build on the *completed* Stage 2 source branch/main state and its tests rather than racing changes against work already in progress.
2. Implement in the shared workspace layout/view-state model; do not duplicate explorer providers or alter source identity and mutation rules.
3. Demonstrate Single Pane + Preview Below, then switching to Single Pane + Preview Right. The viewer should use the right column and show the same selection.
4. Confirm visible edge dragging/resizing in both orientations and retention of independent split preferences across switching and restarting.
5. Verify full-window maximize/restore, close/reopen, state preservation and Dual Pane toggle without losing source navigation.
6. Test actual Chrome extension UI where possible, plus view-state/DOM tests; disclose any real-browser verification limitation.
7. Update Forever Works status/documentation, commit changes in a **new branch/PR**, and **do not merge automatically**.

**Definition of success:** In single-pane mode, a user can choose whether Atlas shows **Explorer above Preview** or **Explorer beside Preview**, exactly like configuring a familiar professional file manager. The panel remains fully draggable and aesthetically coherent.

**Delivery boundary:** This document is a queued *future* request, not a mandate to modify the ongoing Stage 2 implementation now.
