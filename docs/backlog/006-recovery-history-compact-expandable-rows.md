# Bug / UX refinement — Recovery history should use compact expandable rectangular rows

**Status:** Open — owner-reported UX issue and proposed design; not implemented or verified.  
**Recorded:** 2026-10-18  
**Area:** Atlas extension → Recovery / history of deleted items

## Problem

The Recovery history view should not present entries as oversized or awkward blocks. Before interaction, the display should be compact, orderly, visually polished, and easy to scan.

## Desired behavior

- Show deleted entries as **small, aesthetically designed rectangular tiles arranged in vertical rows**.
- Each collapsed rectangle clearly shows the **name/title of the item that was deleted** (and minimal useful status/type information only if it does not clutter the presentation).
- **Clicking a row expands that particular item in place**, revealing its relevant recovery details/actions; clicking again should collapse it.
- Keep the initial collapsed list compact and legible; do not show all detail/action controls for every item at once.
- Place the rows inside a **bounded, vertically scrollable Recovery history area**. The user can scroll down through deleted entries without the whole panel ballooning.
- Preserve the actual recovery and deletion semantics, stable entry identity, existing references and permission boundaries; this is a UI refinement, not authorization for new destructive operations.
- Ensure keyboard activation (Enter/Space), visible focus states, readable labels, and restrained expand/collapse motion with reduced-motion support.
- Empty history should have a clear, visually considered empty state.
- **Future enhancement:** introduce **numbered pagination** for long Recovery histories. Record now, do not mislabel it as implemented or require it for the immediate compact-row redesign.

## Acceptance ideas

1. A Recovery history with several deleted items starts as compact named rectangles, one entry per row.
2. A single click expands only the chosen entry to show appropriate details and permitted recovery controls.
3. Collapse restores the original row height and tidy visual rhythm.
4. The history list scrolls inside its intended bounded viewport without clipping controls.
5. Long histories remain usable, and a separate future pagination ticket can be implemented without replacing the row component.
6. Existing restore/identity checks and non-destructive reference-only Recovery behavior continue to work.

**Scope:** Record as a bug/design issue for a future implementation pass. No code changes requested by this note.
