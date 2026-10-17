# Durable gallery library and explicit import states

Date: 2026-10-16 (America/Chicago). Extension 0.1.8 plus matching rebuilt companion.
Status: source implemented with focused native HTTP/JS tests; Windows and actual-browser evidence tracked separately.

## Why this changed

The owner reported that selecting files returned to “No files chosen,” then supplied the generic IMAGE_ADD_FAILED message. In 0.1.7 the picker was reset after processing, thumbnails were staged until Save, and saved image data lived only in extension-local storage. The generic failure did not distinguish input size, unsupported metadata, decoder failure or encoded-preview budget. No claim is made about which branch failed for the owner's particular file.

Owner requirement: personal media and page data must have a durable home outside Chrome so extension removal does not erase the only saved copy. The companion is the local storage bridge and later the authorized Cloudflare/R2 publishing bridge.

## Current import and save behavior

Choose Local Images now uses a custom button and persistent status/count rather than the misleading native empty-picker label. Selected files become visible draft images; the UI explicitly says they are **staged, not yet saved to disk**.

File type is checked by signature, so a valid PNG/JPEG/GIF/WebP with blank or unusual browser MIME metadata can be accepted. The input remains bounded to 10 MiB and 40 million decoded pixels. Preview generation tries progressively smaller quality/edge combinations before rejecting a preview above the encoded-cache limit.

Distinct errors include IMAGE_TOO_LARGE, IMAGE_TYPE_UNSUPPORTED, IMAGE_DECODE_FAILED, IMAGE_DIMENSIONS, IMAGE_CANVAS_UNAVAILABLE, IMAGE_PREVIEW_TOO_LARGE and GALLERY_PREVIEW_BUDGET. Existing images remain when a batch fails. Actual file decoding on the owner's Chrome still needs acceptance.

Save to Atlas Library:
1. Sends new local original bytes to the authenticated companion without modifying the source file.
2. Saves the page manifest, captions, order, bookmark association and preview references.
3. Uses a native transaction/revision check; retries of identical saved content are idempotent, conflicting content is rejected.
4. Updates Chrome's cache only after the native save succeeds.
5. Shows the companion directory after success.

Offline/old-helper errors keep changes in the editor and do not claim a durable save. A disk-save/cache-failure result is reported distinctly and can be recovered from the native library. URL images remain URLs; Atlas does not silently download or archive their remote originals.

## Where the durable data lives

The library uses **tables in the companion's existing private SQLite database**, within its existing user-specific state directory. It does not yet create a folder of individually browsable JPEG files.

Typical Windows default: `%LOCALAPPDATA%\\Atlas\\windows-state.sqlite3`.
Typical Linux default: `~/.local/share/atlas/state.sqlite3`.
An explicitly configured state directory can differ. The UI reports the actual directory; the authenticated library location action reports both directory and database filename.

Tables:
- library_meta: independent format version 1.
- library_assets: SHA-256 ID, MIME and exact image bytes (originals and previews).
- library_pages: UUID, native revision, page manifest and native bookmark binding.
- Indexed exact bookmark ID/URL lookup for recovery.

Existing platform-private database protections and transactions apply. No new arbitrary filesystem path, root grant or directory scanning permission is exposed. This is native disk storage, not Chrome local storage, IndexedDB or OPFS.

Chrome removal/cache clearing does not remove the companion database. Reopen and pair the same companion state, then explore the same native bookmark: its saved pages can be rediscovered and cached. Direct page routes can also read their saved UUID. Browser bookmark ID/URL changes still require a later explicit relinking workflow.

Companion state deletion, drive loss or deliberate library deletion can still lose data. A separate portable backup/export workflow is not completed by this slice. Back up the native state only through a coherent stopped-service or SQLite-aware procedure; no live-file-copy guarantee is claimed. Existing Windows uninstall preserves state; do not add destructive cleanup as a packaging shortcut.

## Existing 0.1.7 data

Save Existing Page to Atlas Library migrates a browser-only page after its bookmark binding is available. Previously saved local images have resized previews only; unavailable original bytes cannot be recreated. The UI says to reselect original files when needed.

New local files keep original File objects only while being edited, then preserve exact original bytes through the native asset action on Save. Closing before Save does not archive them; unsaved-change protection remains.

Canceled/partially failed saves can leave unreferenced original blobs, which are deliberately not deleted automatically. Future garbage collection must establish reference safety. Multiple libraries, user-selected relocation, standalone per-file export and full project backup remain future work.

## API and authority

See the new /v1/library section in [COMPANION_API.md](../COMPANION_API.md). The standard trusted-extension gate remains mandatory. Read actions may use normal bounded read recovery; writes are not automatically replayed after an uncertain response.

No Cloudflare credentials are introduced. Current sources remain URLs/local. R2 authorization, approved destination selection, verified upload, durable publication references and Pages deployment are explicitly future capabilities.

The eventual publishing adapter should reuse asset identities and manifests: ask to transfer local dependencies → upload to the chosen R2 location → verify → rewrite publication references → deploy through Pages. Local originals remain intact until independently verified; no cloud upload occurs in this increment.

## Trace and evidence

Implementation: extension/image-file.js, library-client.js, page.js, pages-store.js and bookmarks.js; src/atlas_companion/library.py and the existing authenticated server/broker.

First reproduced native route absence with failing persistence tests. Current focused local PASS:
- Three real native HTTP tests: unauthorized/invalid operations denied, exact original/preview bytes survive restart, ID safety, idempotent content saves and revision conflicts.
- Existing six companion HTTP security tests.
- JS gallery/bookmark suites and the 20 worker authority cases, now including non-replayed library writes.
- Image signature/adaptive encoder/error tests through browser primitive doubles.
- Python compilation, whitespace and unsigned extension packaging.

Shared tests run on actual Windows state/provider in test_windows_library.py and the existing Windows build workflow. Linux skips are not Windows proof. Actual Chrome decode/render/file picker and the owner's failed file are NOT_RUN locally. Full-suite native lifecycle limitations and hosted artifact status are recorded in the status ledger.

No guarantee is made that the exact owner failure is fixed until tested with the new build and its specific error feedback. This changes save durability, not the completed publishing product.

