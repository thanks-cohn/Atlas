# Workspace layout stability — 2026-10-20

Owner regressions following PR8: horizontal and vertical swaps must preserve expansion and each panel's dimensions. Follow-up adds reliable splitter rails through repeated minimize/restore/swap/resize operations. Source, selection, preview and permission ownership remain fixed; only presentation-state calculations are fluid.

## Stage 1 — Swaps are arrangement transitions

The regression came from all swap handlers invoking `restoreAll()` before changing positions. That discarded session expansion and active resize allocations and reinstated the normal header/slot dimensions. Horizontal width ratios and vertical region proportions themselves were already oriented to their associated column/Explorer, so resetting them was unnecessary.

`workspace-arrangement.js` now expresses position permutations independently of maximize/restore. The same permutation updates the normal restore baseline. Thus Restore removes temporary expansion/resizing while retaining a deliberate new arrangement and its panel-associated normal dimensions. Reordering uses the existing DOM and identity-guarded scroll restoration; providers, previews and jobs are not recreated. Reordering during expansion persists the rearranged normal baseline, never temporary focused resize values.

Executed local evidence: Chromium153.0.8010.0 rendered tests with synthetic Chrome/provider APIs reproduce the pre-fix shrink and pass after the fix for manually resized, partially expanded, fully expanded, mixed Explorer/Preview expansion and expanded-plus-pointer-resized layouts. Both directions preserve dimensions (within 2 CSS pixels for fractional grid rounding), expansion modes, total column height, selection, navigation breadcrumbs, pins, scroll and live media identity, with no extra native reads. See `scripts/test_workspace_swaps_browser.mjs`; its JSON receipt/screenshots default to `/tmp/atlas-swap-browser`. This is not installed-MV3/Windows or physical-device proof.

## Stage 2 — Splitter lifecycle

Investigation and repeated-operation verification continue in this same development branch. Do not interpret Stage1 tests as proof that the separately reported missing-rail issue is fixed.
