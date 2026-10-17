# Proposal — Atlas Capture, Persistent Clipboard and Verified R2 Archive

**Status:** Owner-directed product proposal; not evidence of implementation.  
**Date:** 2026-10-17  
**Area:** Browser shelf, native companion, local storage, Cloudflare R2  
**Principle:** Capture method, clipboard retention, media storage, and deletion are independent decisions.

## 1. Purpose

Make copied text, images and screenshots retrievable from the Atlas browser extension without requiring that all content remain on local disk. Preserve normal operating-system screenshot behavior while offering a dedicated Atlas capture shortcut and configurable retention. Provide a searchable visual history that can promote deliberate items into bookmarks, boards, catalogs, notes and other Atlas relationships.

Do not conflate the active OS clipboard with Atlas's durable history, or saved Atlas entries with permanent curated library objects.

## 2. Capture modes and shortcuts

- **Ordinary OS capture** (e.g. Windows `Win+Shift+S`) retains the OS behavior and destination. Atlas must not hijack it.
- **Atlas Capture** uses a separate configurable shortcut for supported screen/region/tab captures. Capture directly into Atlas-controlled storage rather than the OS Pictures/Screenshots folder. Support immediate copy-to-clipboard, optional local preservation, and R2 archival.
- Optionally provide **Capture and Archive** as a distinct shortcut/action for a screenshot deliberately destined for R2. A shortcut must be conflict-checked and user-editable.
- Where browser permissions limit capture, use supported extension capture APIs and/or consented native helper functionality. Do not promise global desktop captures from a normal web page.
- Users decide independently which streams feed persistent screenshot history: OS captures only, Atlas captures only, both, or neither. These are **history ingestion** settings, not restrictions on ordinary Ctrl+V. Avoid duplicate stored content when the same screenshot arrives via multiple streams; preserve event provenance when useful.
- The helper may monitor OS screenshots/clipboard only with explicit consent. OS capture detection may depend on what is copied into the clipboard, not unrestricted access to Windows screenshot activity.

## 3. First-class Atlas Clipboard on the extension shelf

- A **Clipboard** view is readily accessible in the existing Atlas browser-extension shelf, not hidden in a separate app. Show latest entries, text/media filters, search, preview, recopy/paste, pin, tags, notes, promote to collections/boards/bookmark associations, delete and restore where supported.
- Clipboard records originated by any supported application may enter the same library through the paired Windows/Linux native companion. Browser-originated entries can use the same model.
- When an archived R2 image is copied again, retrieve it through authorized access, write it to the OS clipboard, and remove ephemeral transfer files safely afterward. Preview via a privacy-respecting thumbnail or on-demand R2 fetch even if the local original was deleted.
- Persistent Atlas clipboard history survives restart when enabled, within storage quotas and performance limits; it need not be literally infinite. Include search indexes, pagination/lazy loading and retention/size controls.
- A normal Ctrl+V always refers to the OS's **current clipboard**. Atlas history is a separate indexed store; deleting Atlas's local source file does not itself clear or guarantee persistence of the live OS clipboard contents.

## 4. Separate policies for text and media

Text policy (independent):
- Save eligible copied text, URLs, code and snippets in the local Atlas data store (default proposal: local-only if text history is enabled).
- Alternative modes: explicitly saved only, or disabled.
- Provide search and reuse, plus per-item promotion, deletion, tags and notes. Text must not be automatically sent to R2 merely because image backup is enabled.

Media policy (independent):
- Modes: local-only; local with manual R2 archive; automatic R2 archive; do not retain history.
- Images/screenshots and supported media formats may be archived to R2, while Atlas stores a compact local record containing object key, provenance, dimensions, type, checksum, status, tags, relationships, and optionally a small user-approved thumbnail.
- R2 storage choices must not unexpectedly include unrelated original files merely copied from elsewhere.
- Distinguish a screenshot/media item's **Atlas-managed copy** from its original in another application's folder. Never silently delete arbitrary user source files.

## 5. Verified archive and immediate local cleanup

Provide an explicit user setting: **“Remove local copy automatically after verified R2 archival”** (wording subject to UX review).

If enabled, the lifecycle is:
1. Capture to an Atlas-controlled staging location or bounded temporary buffer, not the normal Windows Screenshots folder.
2. Upload to the authorized R2 destination with stable object identity, metadata and a retryable queue.
3. Verify completion, content length and cryptographic checksum against the originating bytes. Perform a retrievability/restore check, rather than equating a successful request with a proven recoverable archive.
4. Atomically persist the R2 locator and recovery manifest, including a durable local entry and any necessary portable recovery metadata. Ensure UI updates can recover after crashes.
5. **Only after proven recoverability**, delete the Atlas-managed local full-resolution copy automatically, without a second prompt if this policy was deliberately enabled. Keep the entry visible and usable in the extension.
6. If upload, verification, manifest persistence or recovery testing fails, **retain the local file**, surface the error, and retry without silent loss.

Remote-first mode may use temporary local bytes without keeping a persistent full-resolution screenshot, subject to the same verification-before-cleanup invariant. Avoid claiming absolute deletion from caches, clipboard history, cloud replicas or OS memory; disclose those boundaries.

Users may instead elect to retain local copies or manually offload them. Show meaningful per-entry states: queued, uploading, verifying, archived, locally cleared, error, restore pending.

## 6. Delete operations are separate

- **Clear Atlas local media:** remove only verified, Atlas-managed local copies; preserve R2 object and library record.
- **Delete remote R2 media:** a separate deliberate operation, with an impact preview of bookmarks, boards, published pages and other references; confirmation/recovery policy as appropriate.
- Support user-configured R2 retention (indefinite by default; future opt-in lifecycle expiry), recovery/trash where feasible, and warnings about broken references. Never treat unpinning/removing a card as automatic destruction of the original library asset.

## 7. Native companion, extension, permissions and privacy

- The native companion handles authorized OS-wide clipboard observation, screenshot capture where required, safe file staging, verification, restore and interoperable OS clipboard writes. The MV3 extension owns the shelf UI and requests these capabilities through authenticated, scoped, paired communications.
- Preserve the existing security boundary: loopback CORS is not authorization; extension identity, scoped grants, secure pairing, origin and request checks, and revocation are required.
- Make continuous clipboard recording **opt-in**, prominently paused/disablable, with exclusions for password managers, private browsing, sensitive processes, large objects and disallowed formats. Do not upload a general clipboard feed to R2 without express media-specific selection.
- Protect stored histories and metadata at rest, avoid logging clipboard contents or signed R2 credentials, and avoid loading full-sized remote objects until requested.
- Respect Windows/Linux differences and required accessibility/screen capture permissions. Treat Chrome Web Store and OS policies as separate compatibility and review gates.

## 8. Acceptance tests (future implementation)

1. Atlas screenshot shortcut captures a selected area, can place it immediately on the OS clipboard, and writes no unexpected copy to Pictures/Screenshots.
2. OS screenshot shortcut continues to work normally.
3. Each of OS-only, Atlas-only, both and neither history-ingestion settings behaves correctly; duplicate captures do not duplicate stored full images.
4. Text can remain in a persistent local searchable history while media is uploaded, verified, and removed locally.
5. A successfully offloaded image remains visible in the shelf and can be previewed, restored and copied back to the OS clipboard from R2.
6. Simulated network failure, bad checksum, truncated R2 object, manifest write failure, helper crash and interrupted retry **do not cause local source deletion**.
7. Deleting a local verified copy does not remove its R2 reference; deleting an R2 object presents independent explicit controls and reference impact.
8. Items copied from third-party files never cause those original files to be removed.
9. Disabled monitoring and sensitive-app exclusions genuinely prevent ingestion; revocation prevents unauthorized native/remote access.
10. Persistent history remains responsive with large item counts through lazy loading, deduplication and compact metadata.

## 9. Delivery staging

- **A — Capture UX:** Atlas shortcut, screenshot to clipboard, Atlas-local destination; preserve OS shortcut.
- **B — Clipboard history:** native helper capture/monitoring, extension shelf access, text/media split and exclusions.
- **C — Verified R2 archival:** object/manifest integrity, queue/retries, immediate verified cleanup, restore and recopy.
- **D — Library integration:** search, tags, notes, associations, pinning, visual presentation and safe deletion/retention.

The order is proposed, not implementation status. Before work begins, map the feature to existing Forever Works contracts and security obligations, and explicitly measure which runtime paths have actually been verified.
