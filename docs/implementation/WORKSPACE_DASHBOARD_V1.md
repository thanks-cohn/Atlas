# Atlas Workspace — first read-only vertical slice

2026-10-20. Owner direction: `docs/requests/ATLAS_STANDARD_WORKSPACE_DASHBOARD_IMPLEMENTATION_BRIEF.md`.
Status: implementation source and automated contract/DOM-double proof; not a completed dashboard or browser-qualified release.

## Investigation and preservation boundary

Started from main at 2be9ad3. Main already contains owner-accepted renderer6 and the responsive milestone. `implement/rich-photo-tagging` remains a separate older branch; GitHub search returned no open PRs. Do not merge that branch over current main. Existing source has no R2 authorization/list/transfer backend and no Puck editor. Projects are the existing `atlas.page.v1.*` records. Companion graph resources/catalogs remain separate from native Chrome bookmarks and page records.

Fixed: resource/source identities, permission boundaries, all existing Shelf/bookmark/pinboard/library behavior, companion authentication and grants, Story Gallery and editor destinations. Constrained: current catalog supports flat memberships, not recursive Collections; local UI bound remains 20,000 entries. Fluid: isolated view module, presentation, layout preferences. No canonical record or stored content migration, no new permission, credential, dependency, native write or inferred grant.

## Implemented

- Shelf top-right diagonal arrow opens `workspace.html`. Existing `explorer.html` remains available through the workspace's Explorer & settings link; Shelf itself and Story Gallery default behavior remain intact.
- One explorer shell instantiated twice, with provider adapters for native bookmark folders, existing saved pages, companion resources, existing flat catalog memberships, and authorized local grant/folder listing. R2 gives an explicit unsupported message.
- Independent history, parent navigation, provider selection, search, alphabetical name sorting, list/grid, selection (Ctrl/Meta/Shift), selected details and pinned details. Enter opens a folder or an explicit source/project; Up/Down moves focus and Space selects through native button behavior.
- Single/dual panes. Each hierarchy appears above its own detail viewer; top-only, bottom-only and individual pane maximize/restore retain the live pane instances, navigation, pin, selection and scroll. Width/height range controls are keyboard accessible. Persisted layout preferences contain only dual mode and split ratios.
- Responsive vertically stacked dual panes below 900px. Restrained hover animation, reduced-motion support, visible keyboard focus, labels and status text. Visual quality still needs real browser verification.
- Existing Activity/recovery module reused. Explorer remains the destination for setup, graph editing, actual file operations and existing media previews.

## Deliberately unfinished

This is the request's stages 1–2 and partial stages 4–6, not completion of stages 3–8. No nested Collection creation/rename/move/cycle checks; no collection-as-resource migration; no dashboard reference edits/export; no source deletion, clipboard, cross-pane transfer or drag/drop; no context menus; no image/media rendering in the new viewer; no Preview/Contents/Notes tab set; no draggable separators; no full ancestor breadcrumb chain (root + current only); no advanced sorts/filters; no persisted pane navigation/selection across reload; no Home recent/pinned/activity aggregation; no Puck integration, R2 auth or transfer queue. The existing explorer still provides its original capabilities.

Do not add recursive collections as an unrelated browser-local shadow catalog. Extend the versioned companion graph contract with migration, validated cycles and identity-preserving memberships first, then expose editing in this shared shell. Provider adapters currently expose read/list only: absence of a mutation is intentional and must not be inferred as transfer success.

## Executed verification

- `node scripts/test_workspace.mjs`: PASS independent state/history/selection, name ordering/filter, pin retention, branch-history truncation, ratio clamping, real adapter contracts through API doubles, source identity, R2 unsupported and revoked-grant denial.
- `node scripts/test_workspace_ui.mjs`: PASS renderer construction, single/dual visibility, click selection, pinned folder navigation, expansion/restore and other-pane preservation (DOM double, not Chromium).
- All 24 `scripts/test_*.mjs` suites at first sweep: 23 PASS, native recovery integration FAIL (`scripts/test_recovery_broker_native.mjs`, assertion at line42). Added UI test passes separately.
- `python scripts/check_project.py`: 22 model records linked; 170 tests, 3 failures, 3 errors, 33 skips. Failures/errors are native bootstrap/supervisor helper startup/READY cases, matching the documented container baseline. Full suite is not green; no native source changed.
- JS syntax, `git diff --check`, and unsigned extension packaging: PASS.
- Real Chromium/MV3, Windows/native and visual checks: NOT_RUN. Playwright Chromium download was attempted but supplied invalid/truncated ZIPs; no usable local browser installed.

## Browser acceptance / continuation

Load unpacked `extension/` in Chrome. Open Shelf and use ↗. Check bookmarks without helper, saved project open, Story Gallery and pinboard links. Pair through Explorer, then compare authorized local folder and Objects/Collections in two panes. Disconnect/revoke helper and Refresh: visible error, no successful listing. Select/Shift/Ctrl items, change sort/filter, navigate back/forward independently, pin a detail then open another folder. Expand each region/pane, restore and compare selection/history/scroll; resize, reload to confirm ratios. Check keyboard/focus and reduced motion at 1366×768 and narrow width. Run existing media/file operations in Explorer to establish non-regression. Do not label visual polish, device accessibility or native flows verified until this is executed.
