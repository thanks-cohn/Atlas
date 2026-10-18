# 004 — Linked bookmark preview misses an existing saved image

**Status:** Backlog — not started.
**Reported:** 2026-10-18, explicit owner report and screenshot.

## Problem and evidence

In the image preview's expanded Bookmarks section, selecting a linked bookmark displays “No image saved for this bookmark.” even though the owner reports an image is already saved for it. The supplied screenshot, image(20261018-125115).png, shows the focused linked bookmark “Mechatronics - Wikipedia” with that empty state. The screenshot establishes the visible failure; the saved-cover record and root cause have not been independently inspected in this change. Do not treat the message as proof the asset is absent.

Expected: resolve and display the linked bookmark's saved representative image using the same authoritative cover lookup as the board. Clicking it should retain the agreed linked-image inspection behavior; the original bookmark URL remains available.

## Investigation scope and constraints

Trace the focused bookmark identity passed from the linked-item list to getImage/imageFor, and compare it with the identity/key used to save its cover. Inspect exact URL deduplication, Chrome IDs, authored-card identities, stored linked-bookmark snapshots, cache refresh and local/URL cover handling. Key mismatch or stale snapshots are hypotheses, not established causes.

Reuse the shared image resolver and current source of truth rather than creating another cover store or requesting another upload. Preserve existing covers, parent-card images, tags, notes, links and model evidence. Do not silently fetch a new cover or overwrite a saved image to conceal the problem. Distinguish loading, lookup/read failure and genuinely absent image states. Respect future independent image-entry ownership.

## Completion evidence

Reproduce with an already covered bookmark linked from another card, and record the exact saved key and preview lookup identity without exposing private URLs in public fixtures. Verify image display before/after reload, duplicate bookmark IDs sharing a URL, both local and URL images, newly changed covers, authored/native parent cards and unavailable cover storage. Confirm clicking the linked image changes only the inspection view and does not retarget generation/annotations to the wrong image. Verify a genuinely coverless bookmark still has the correct empty state. Record inspected paths, actual cause, tests and Chrome visual evidence before marking Done.

**Starting points:** `extension/pinboard-preview-sections.js`, `extension/pinboard.js` imageFor/getImage wiring, `extension/bookmark-covers.js`, `extension/pinboard-preview-connections.js`, saved-cover storage and preview tests.
