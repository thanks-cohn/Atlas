# 011 — Add Image selection does not update gallery or navigation

**Status:** Backlog — explicit owner report, unresolved.
**Reported:** 2026-10-19 America/Chicago.

Owner clicks Add Image, selects an image, but gallery count does not increase and
left/right navigation remains unavailable. This regresses the additive image-entry
contract. Whether the entry failed to persist or persisted but the view/cache did
not refresh is UNKNOWN. Existing DOM/API-double gallery tests do not establish the
owner Chrome path works. Do not claim the regression fixed based on those tests.

Reproduce on the existing card: open preview, Add Image, choose local image,
observe count/arrows, reopen and reload. Also exercise URL addition separately.
Inspect selection callback, image decode/origin hashing, storage quota/budget and
errors, imageTarget/selected identity, transaction result and cache/load races.
In particular, report save failure visibly in the still-visible preview rather
than only in a dismissed image dialog. Distinguish save from rendering failure.

Expected: preserve A and its annotations, append independent B, count becomes 2,
select B, enable arrows and keyboard navigation, preserve chosen default cover
until explicit starring. Same bytes selected again must still form an independent
entry with fresh identity. Failed additions retain A and show actionable feedback.
Do not overwrite the existing image or delete state to conceal the failure.

Close with actual Chrome local-file and URL evidence, persistence/reopen/reload,
count and looping arrows, cancellation/error paths, limits, duplicate bytes and
separate notes/tags. Record exact cause and regression tests before marking Done.

Starting points: extension/pinboard.js pickImage, image-file handler, appendImage,
paintImageNavigation, storage change listener; image-entries.js; image-file.js;
scripts/test_pinboard.mjs and scripts/test_image_entries.mjs.

## Fix candidate — 2026-10-19

Reproduced a cache rollback with a controlled delayed storage.get: begin gallery
load, commit add, finish old read -> cache loses the new entry (6 instead of 7).
image-entries.js now versions reads and invalidates older reads on committed writes.
The regression fails before and passes after this change. This is a proven defect,
not proof it is the only cause of the owner's report.

Local-file selection now keeps its chooser open during decode/hash/save; input is
inside that active modal, errors appear in image-status, retry controls reenable,
and chooser closes only on success. URL save surfaces actual error text too.
Actual file onchange integration test proves independent append, updated count,
new-entry selection, both arrows, unchanged default, retained original filename,
and visible decode failure with gallery preserved. Image entry/file/pinboard suites,
packaging and whitespace checks pass. Browser primitives are doubled; owner Chrome
file-picker/navigation/reload confirmation remains pending. Do not mark Done yet.
