# Local explorer implementation contract — v1

This is a subordinate implementation packet, not a change to Forever Works Standard 0.1 or the accepted product destination. Owner direction is the premium product contract and build assignment. Behavior described as proven must be tied to the latest test receipt/handoff; source, UI screenshots, model validation and OS/browser runtime proof are distinct evidence.

## Fixed, constrained and fluid

Fixed obligations in this slice are exact authenticated client binding; explicit revocable folder grants; no privileged effects outside those grants; no symlink traversal; no overwrite by default; honest partial/unknown outcomes; stable logical graph IDs; and portable user-authored notes, catalogs, tags and relationships. A graph locator grants no filesystem access. Native install never authorizes a root implicitly. This implementation changes no accepted canonical intent, capability, invariant or constraint record.

Constrained behavior is intentionally bounded: 100 selected entries per operation, 20,000 scanned entries per folder, 1,000 entries per page, 2 MiB previews, 256 MiB/10,000 entries/64 levels per recursive copy, 32 request connections and 10-second socket idle timeouts. Files larger than preview/copy limits remain visible; unsupported actions report explicit errors. Listing is live filesystem enumeration, not a recursively indexed search service. Name filtering applies to the displayed directory. Copies preserve file bytes, not full backup metadata/ACL/xattrs, timestamps or hard-link topology.

Fluid mechanisms here are Linux directory descriptors, `renameat2`, SQLite, JSON, Python, HTTP, Native Messaging and the DOM client. A replacement must reproduce independent tests and portable exports, preserve authority boundaries and separately prove the target platform. Linux success does not establish Windows/Android success.

## State and interactions

`atlas_companion.State` owns native client bindings, root identities and receipts. Its private directory must not overlap a browser-visible grant. Only token digests are stored; native bootstrap also retains a private local HMAC key. Explicit CLI operations create/revoke bindings and read/write grants. Browser HTTP cannot grant roots or invent native credentials.

The extension worker accepts only its own extension pages and a finite route allowlist, stores credentials in trusted session storage and communicates only with the numeric loopback companion. There are no content scripts or arbitrary remote URLs in this authority channel. UI clipboard metadata is separate from the OS clipboard and expires. Context menus invoke actual operations, not shell commands.

`atlas_core.GraphStore` owns portable metadata only, with schema version 1, atomic revision updates and optimistic conflicts. Its format remains `atlas.catalog.v1`. Strict validation rejects unknown fields and corrupt references; imports replace explicitly without silently merging identities. Local locators use `<grant-id>/<relative/slash/path>`. Successful rename/move/alternate restoration reconciles locator prefixes without changing resource IDs. Physical copies intentionally create no inferred logical equivalence. Trash retains the original logical locator so unavailable content remains represented and restoration can recover it.

Receipts are inserted before filesystem effects. Completed same-ID/same-argument retries return the saved outcome; reused IDs with different arguments conflict; unfinished intents report `OUTCOME_UNKNOWN` without replay. File effects, graph reconciliation and receipt completion are not one atomic cross-store transaction. A crash after a filesystem effect can leave a pending receipt and require human reconciliation. The UI Activity view supports recovery from recorded trash after reload; it does not permanently delete content.

## Security and remaining limits

All traversal uses held directory descriptors and no-follow opens; final mutation publication uses atomic no-replace rename. Roots are checked against their granted device/inode. Internal `.atlas-*` paths are reserved and hidden; symlinks/special files are inaccessible. Bounded copies stage within the destination; failures clean the unpublished stage. Interrupted processes can leave hidden copy staging for explicit inspection. Cross-device moves are refused rather than silently converting to copy/delete.

HTTP requires one exact numeric Host, one paired extension Origin and one bearer header. JSON is bounded and rejects duplicate keys, transfer encoding and nonfinite numbers. Unauthenticated preflight and nonce possession proofs do not authorize file effects. Native wake proves the server's private-key possession before sending credentials, uses a port-bound fresh challenge and retains the same TCP connection for authenticated health. Manual pairing assumes the user starts/trusts the expected local listener; prefer the installed proof-checking bootstrap when evaluating local listener impersonation threats.

This is not a production security certification. Hostile processes with the same OS account can already access that account's private application state and are not isolated by this design. External concurrent directory mutation, crash consistency across filesystem/metadata/receipts, revocation during already-running work, quota/recovery retention, file-content changes during copies and broad grant selection require further adversarial review. Revocation denies subsequent checks; it cannot reverse completed effects or promise cancellation of an operation already executing.

File clipboard integration is internal across explorer views; copying a computed hash to the OS clipboard requires a separate explicit user click. No permanent deletion, arbitrary shell/execute endpoint, auto-install, ungranted scan, wildcard CORS authorization or network-exposed listener is introduced. R2, native bookmarks ingestion, archives, OS file clipboard integration, full transfer cancellation, Windows packaging, Chrome Store acceptance and blinded cross-language reconstruction remain separate work.

See `GRAPH_STORAGE_V1.md`, `RECOVERY.md`, `../COMPANION_API.md`, `../NATIVE_BOOTSTRAP.md` and `../../codex/HANDOFF_LATEST.md` for exact interfaces, commands and evidence.
