# Native bookmarks in the existing shelf — first slice

Owner direction, 2026-10-15 (America/Chicago): expose actual browser bookmarks in Atlas, using familiar bookmark-manager exploration in the existing side panel. Keep it intuitive and standard; add richer features incrementally. The prior extended brief remains docs/requests/NATIVE_BOOKMARKS_IMPLEMENTATION_OWNER_BRIEF.md and is not declared complete by this slice.

## Fixed behavior and rationale

Bookmarks are Chrome's real tree, not a separately imported copy. Native hierarchy and sibling order remain unchanged. A Bookmarks workspace lives in explorer.html and the existing side panel. Browser access does not depend on companion connectivity: the companion provides local file access, while chrome.bookmarks supplies browser-owned data. No native token or new folder grant is involved.

The manifest declares bookmarks permission. Users must reload the updated extension and accept Chrome's permission prompt if shown. Use the same unpacked extension directory to retain its identity and native companion enrollment.

## Implemented in extension 0.1.5

Workspace button, expandable Folders tree with lazy child rendering, folder drill-down and breadcrumb/up navigation; global title/URL search; single-click selection, double-click/Enter opening and Up/Down/Home/End focus navigation; new bookmark/folder; rename/title and URL editing; move destination selector excluding self/descendants; confirmed bookmark/folder deletion with explicit warning about synced data and no Atlas undo. Browser-controlled roots and managed nodes do not expose edit actions. No automatic bookmark writes occur on view/load. Actual Chrome APIs enforce remaining browser restrictions and report failures.

Tree refresh follows native create/remove/change/move/reorder/import events (100ms debounce), panel focus and manual Refresh. Saved text uses textContent, never HTML. Executable javascript/data and unsupported special URL schemes are blocked by the open/edit UI; http/https/ftp/file are offered to Chrome tabs.create, which may still refuse a scheme under browser policy. No external favicon lookup or browsing-history upload is introduced. Fixed BOOKMARK_READ_FAILED / BOOKMARK_OPERATION_FAILED / BOOKMARK_URL_BLOCKED codes provide visible failures without dumping bookmark URLs into diagnostics.

## Fluid implementation and interfaces

bookmark-model.js owns pure indexing/search/trail/move-target and URL rules; bookmarks.js owns browser API calls and the shelf workspace. Native IDs are used only within the current Chrome profile. No durable Atlas resource identity mapping is claimed yet. Existing file UI retains its state and controls on return; its global keyboard handler yields while the bookmark workspace is active.

## Evidence and limits

node scripts/test_bookmarks.mjs passes pure tree/security cases and a DOM/API-double exercise of shelf navigation, preserved order, safe opening, blocked script URL, rename, search, read failure and return to files. Existing 20 worker contracts and preview-navigation tests pass. JavaScript syntax and deterministic extension packaging pass. Actual installed Chrome bookmark API/side-panel rendering is NOT_RUN locally; doubles are not browser proof. Existing native helper is unchanged; no helper reinstall is required for this extension-only feature.

Not implemented by this slice: a permanent split-pane folder sidebar, multiselect, drag/drop, cut/copy/paste, inline rename/context menus, favicons, Atlas stable-ID mapping, per-object notes/tags/catalog reuse, cross-resource relations, or publication. The existing sidebar Bookmarks button and folder list are the first access path, not a claim of full native-manager parity. Follow the owner brief for later increments, preserving availability vs relationships vs presentation vs publication as distinct concepts.
