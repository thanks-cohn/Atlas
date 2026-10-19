# 022 — Preview opening must be read-only

Owner direction: prolonged scrolling and preview use must remain responsive, and Escape must return immediately. Existing images, generated tags, human tags, notes, bookmarks and Recovery must survive performance changes.

## Evidence and diagnosis

`docs/evidence/performance-2026-10-19/OWNER_READONLY_PREVIEW_BASELINE.json` records renderer revision5 for about108seconds and301 items. Seven generated-index refreshes averaged53.57ms (maximum98.7ms), compared with1963ms in the earlier renderer4 capture. These were different workloads and durations, not a controlled speedup benchmark.

Input queue delay still reached2068ms. Seven gallery transactions took5008.6–12060.9ms elapsed, averaging6592.8ms. The span starts inside the gallery lock and includes asynchronous storage operations; it does not prove continuous CPU blocking for that duration. Source inspection found ordinary opening of an unvisited legacy card called ensureImages, migrating it and rewriting shared gallery storage. Heap ended below its initial value; this capture does not establish a monotonically retained memory leak.

## Implemented source change — renderer revision6

Opening a preview is read-only. Cached content opens immediately; delayed asset/metadata hydration is guarded against a closed or superseded preview. Legacy images project as a single image with1 /1 navigation and a selected default indicator, without creating a gallery. Existing persisted galleries retain their normal entry navigation. Storage notifications refresh only an open preview and preserve connection drafts.

Migration now happens when an explicit action requires image-entry ownership. Generating tags materializes the selected legacy image before saving results and transfers the captured Things/Anime choices to its entry identity. Explicit removal materializes the intended image and preserves the existing Recovery transaction. Add-image behavior remains covered by the existing regression. Human metadata keeps its supported legacy adapters until gallery migration; no storage format was changed.

Fixed: image ownership, deduplicated tag projection, persisted annotations, Recovery and user-selected models. Constrained: existing storage schema and transaction atomicity. Fluid: migration timing and read-only preview projection. This does not remove existing records, cached results or user content.

## Verification and remaining work

Node pinboard tests pass, including50 legacy preview open/close cycles with zero migrations and zero writes, explicit legacy removal with Recovery, delayed setup/Escape, generated-image ownership and image addition. Image-entry, generation, preview-section and performance-debug suites pass. Required Python project check ran170 tests:3 failures,3 errors,33 skipped; native bootstrap/supervisor READY checks remain blocked/failing in this container. All22 model links validate. No real Chromium benchmark ran; owner-browser improvement is pending.

Explicit gallery mutations still copy/budget/write shared gallery storage and may remain slow. Background tagging after leaving a card remains tracked separately in007. Tiny-batch aesthetic startup remains a proposal, not implemented here. Keep022 and018 open until a sustained owner capture validates responsiveness.

Revert boundary: parent commit eef42ed0853255049a39e82e7c4879e79c1f9574; this change is isolated in the following commit titled `Make pinboard preview browsing read-only`.
