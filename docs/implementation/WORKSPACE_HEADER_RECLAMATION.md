# Workspace expansion reclaims header space

Owner clarification, 2026-10-20. This contract supersedes the full-region/full-pane maximize semantics in WORKSPACE_WINDOW_CONTROLS.md and the earlier Section 5A implementation. Changes continue on the existing development branch; no provider/resource rewrite.

## Behavior

Maximize changes allocation, not visibility. In an ordinary vertical column, maximizing Explorer adds the former heading area to Explorer while retaining Preview's exact pixel height. Maximizing Preview adds that space to Preview while retaining Explorer's exact content height plus title bar. The column stops at the dashboard's top inset. Neither the opposite section nor the other column is hidden, including narrow layouts. The other column retains its normal section heights. Single-pane mode reserves the compact command header rather than showing the floating menu.

Only explicit × closes a section. Explorer × now closes Explorer alone, rather than closing Explorer and its Preview together. Preview × closes Preview alone. The last section in a column cannot be closed, and Restore layout reopens closed sections. Existing minus/title-bar minimization remains explicit and separate. Close is presentation state only: resources, preview state/DOM and background work remain owned by their existing modules.

A first expansion captures layout preferences, physical region sizes, focus and identity-guarded scroll positions. Restore returns the original dimensions and arrangement, including customized split values and selection/pinned-preview state. Temporary splitter changes during expansion do not overwrite normal saved preferences. Deliberate navigation while expanded is retained rather than undone. Grid tracks keep the neighboring region's measured pixel height; they do not proportionally grow both sections.

When one of two columns expands, the same global controls relocate above the unexpanded column. Only when both columns expand does the bottom-right three-line menu appear, with a small footer allocation so it does not cover a content scrollbar. Ordinary and single-column layouts keep visible global controls. Existing menu keyboard, hover, focus, delay and modal protections remain.

⇅ on a section bar exchanges Explorer and Preview vertically in that column. ⇄ exchanges the two Explorers or the two Previews across columns according to the bar used. Swap sides exchanges both columns. These are exchanges of the existing presentation elements, not copies of resources. Preview ownership remains attached to its original Explorer and selection even when displayed on the other side. The row and column edges retain their existing pointer-captured and keyboard resize implementation; vertical drag direction follows reversed section order. `reversed`, `swapped` and `viewerSwapped` are additive, default-false fields in the existing version-1 layout preferences. Legacy saved layouts stay readable.

### Subsequent swap and rail correction

[Workspace layout stability](WORKSPACE_LAYOUT_STABILITY.md) corrects the earlier implementation's implicit Restore during swaps. Placement changes now retain expansion and active dimensions, and the normal restore baseline follows the chosen arrangement. Rail availability and moved section state are covered by repeated-operation regression tests. Restore reverses temporary expansion/resizing, not a deliberate later position exchange.

## Fixed and fluid

Fixed: source identity, grants, selection/history, pinned preview, bounded parsing, background jobs, local/R2 capability truth and existing splitter accessibility. Fluid: presentation state, CSS grid tracks, DOM placement and toolbar placement. No new permissions, dependencies, inference, transfer APIs or native filesystem effects. Single-pane Preview Right configuration and queued breadcrumb/toolbar redesign are separate follow-up work; this change exchanges existing sections in the current 2×2 layout.

## Executed proof

- State/model/renderer and preview Node tests pass, including legacy layout migration and nonexclusive expansion.
- Actual Chromium 153.0.8010.0, synthetic Chrome/provider APIs: upper expansion preserves lower pixel height; lower expansion preserves upper pixel height; both sections stay visible; unchanged other-column heights; exact geometry/selection/pin/scroll restoration; one-column toolbar placement and both-column-only floating menu; independent Explorer close and reopening; existing media DOM survives vertical/side exchanges; moved Preview controls operate on its new column; reversed keyboard divider control; no extra native read caused by rearrangement; narrow 900/390px sections remain available.
- Existing rendered workspace regression suite passes after revising only the superseded exclusive-expansion expectations. Existing menu hover/focus/delay/modal safety checks remain in the window test. Updated actual-MV3 test expects independent Explorer close instead of whole-column close.
- Extension packaging passes. Local browser is a headless-shell build: installed MV3/Windows runtime proof belongs to hosted CI, not this rendered-page result. Physical touch, screen-reader reading order after CSS reordering, owner hardware/performance and desktop visual acceptance remain unqualified.

Screenshots are generated by `scripts/test_workspace_window_browser.mjs` under ATLAS_WINDOW_EVIDENCE (default `/tmp/atlas-window-browser`); CI retains its own artifacts. No historic evidence receipt is relabeled as proof of these new semantics. Next: run the updated hosted browser/MV3 and native boundary suites, inspect the installed extension on the owner's Windows Chrome, then address the separate Single Pane Preview Right request.
