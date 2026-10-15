# ATLAS local companion protocol

Protocol identifier: `atlas.local.v1`. This document describes the current Linux development implementation, subordinate to the enduring authority/identity contracts. The transport and runtime can be replaced only with preservation of accepted behavior, grants, portable metadata and independent denial tests.

## Authority and deployment

The companion is a separately user-started Python process on `127.0.0.1:17892`. It does not authorize native installation or start a remote listener. An optional Linux Native Messaging development bridge can explicitly register an exact extension identity and wake the fixed companion command; see DEVELOPMENT.md. Production standalone installers remain separate work. Windows is unsupported by the current descriptor-safe filesystem provider and must not inherit Linux runtime claims.

Pairing is an explicit local CLI operation for one exact Chrome extension ID (`[a-p]{32}`). It generates a cryptographically random bearer token, returns it once and retains only its SHA-256 digest with `chrome-extension://<id>` in local state. Re-pairing rotates that origin's token. Privileged requests require both the exact paired Origin and the bearer credential; knowing an extension ID, being on localhost or passing CORS is insufficient. The extension's service worker owns transport and credentials; there are no website content scripts receiving native credentials.

Grant creation and revocation are local CLI operations. Browser requests cannot manufacture grants or change pairing. Grants default to read-only; mutations require an explicitly writable grant. A grant names a root and records its device/inode identity; replacement requires re-granting. The whole filesystem `/` is rejected. The API exposes grant IDs and relative resource paths rather than granting arbitrary absolute-path access.

State is kept in `state.sqlite3`, schema version 1, inside the chosen state directory (directory mode 0700, database 0600). Tables hold paired-client digests, root grants and operation receipts. This is separate from the portable catalog data. Do not export bearer credentials or native authorization into catalog exports. The OS account and same-user local malware are outside a strong isolation boundary; keep state private.

## HTTP wire contract

All routes require exact `Host: 127.0.0.1:<configured-port>`, a single paired `Origin: chrome-extension://<id>`, and, except the possession-proof endpoint, a single `Authorization: Bearer <token>`. No cookies authorize requests. CORS preflight accepts only paired origins, GET/POST and Authorization/Content-Type headers; preflight never grants file access. Query strings, URL fragments and unknown route/method pairs are denied. Responses have `Cache-Control: no-store` and JSON content type.

POST bodies require `Content-Type: application/json`, one valid Content-Length and 1 byte–2 MiB of object JSON. Transfer-Encoding, duplicate JSON keys and nonfinite numbers are rejected. Request sockets have a 10-second timeout; at most 32 request connections are handled concurrently. Success is `{ok:true,...result}`; failures are `{ok:false,error:{code,message}}` with a non-success HTTP status. Inspect file-operation receipt results even when the transport succeeds.

| Method | Route | Result / request |
| --- | --- | --- |
| POST | `/v1/bootstrap-proof` | Known exact Origin and valid Host, no bearer; `{nonce:<64 lowercase hex>}` yields HMAC-SHA256 private-key proof bound to nonce and actual port. Does not pair or grant filesystem authority. |
| GET | `/v1/health` | Protocol, ready status, Linux platform and resource limits; authenticated. |
| GET | `/v1/grants` | Existing authorized root IDs, labels, paths and read/write capability labels. |
| POST | `/v1/list` | Authorized directory listing; request described below. |
| POST | `/v1/hash` | On-demand SHA-256 of an authorized regular file, at most 256 MiB; detects observed source changes during hashing. |
| GET | `/v1/receipts` | Up to 100 recent authorized operation summaries, including unknown outcomes and recovery IDs; revoked-grant receipts are omitted. |
| POST | `/v1/read` | Bounded authorized file preview; request described below. |
| POST | `/v1/operate` | Mutation receipt; actions described below. |
| GET | `/v1/catalog` | Portable graph snapshot and revision. |
| POST | `/v1/catalog` | `{action,args,expected_revision?}` dispatched to the versioned graph store; conflict is explicit. |

Graph catalog mutations use the graph store's supported action allowlist. Provider authorization remains separate: cataloging a locator never grants access to that native path. Read the core schema/fixtures for exact graph mutation structures, and use expected revisions to avoid silent lost updates.

## Filesystem boundary

Paths use relative slash-separated components; absolute paths, `.`/`..`, backslashes, NUL, empty intermediate components, oversized names and reserved `.atlas-*` traversal are rejected. The Linux provider holds directory descriptors and uses `dir_fd` plus `O_NOFOLLOW` instead of trusting an earlier canonical-string check. Symlinks and special files are inaccessible, including symlink roots and symlink directory components. Grant root device/inode is revalidated before use. Read/list cannot silently expand scope; unsupported platforms fail closed.

Atomic no-replace rename uses Linux `renameat2(RENAME_NOREPLACE)` and fails if unavailable. Destination conflicts must not silently overwrite existing content. Trash staging is recoverable local staging, not a promise of freedesktop desktop-trash integration or permanent deletion/undo support on every provider. Native same-user concurrent filesystem mutation and crash durability require additional adversarial review before production claims.

## Filesystem request bodies

List and preview inputs use `{"grant":"<grant-id>","path":"relative/path"}`. Listing also accepts integer `offset` (default 0) and `limit` (1–1000, default 500); results are directories first then case-insensitive names. Enumeration rejects folders over 20,000 scanned entries. Preview returns base64 `data`, byte `size`, MIME hint and file `name`; it reads regular files only, at most 2 MiB. MIME is a filename-derived hint, not a trusted parser verdict.

Mutation bodies use `id`, `action` and relevant arguments:

| Action | Arguments | Observable effect |
| --- | --- | --- |
| `mkdir` | `destination:{grant,path}`, `name` | Creates one new directory; conflict does not overwrite. |
| `rename` | One `sources:[{grant,path}]`, `name` | Renames within the same parent. |
| `copy` | `sources:[{grant,path}]`, `destination:{grant,path}` | Copies bytes/tree into destination with existing basename. Source may be read-only; destination must be writable. |
| `move` | Same as copy | Atomic no-replace rename; cross-device moves return `CROSS_DEVICE` rather than copy/delete. |
| `trash` | `sources:[{grant,path}]` | Moves each entry into private root-local `.atlas-trash` and returns opaque `trash_id`. |
| `restore` | One `sources:[{grant,path:<trash_id>}]`, `destination:{grant,path}` | Restores a recorded trashed entry under its original basename; destination conflict is denied. |

Batches are bounded to 100 selected entries. A recursive copy is bounded to 256 MiB, 10,000 entries and 64 directory levels. A single-source copy may provide a validated `name` override for duplicate/copy-as. Copy stages content before publishing the final destination, rejects symlinks/special files and excludes reserved trash staging. It is a byte-copy operation, not a complete backup/ACL/xattr/hardlink-preservation tool. A failed batch may have completed earlier entries; inspect every result.

Mutation responses contain `receipt` and `replayed`; the receipt holds `id`, `action`, `status` (`completed`, `partial` or `failed`), `results` and completion time. Each result has `source`, `ok` and either destination/recovery information or a structured `error:{code,message}`. Returning a receipt does not mean every item succeeded.

## Operation receipts and recovery

Mutation callers supply a fresh operation ID (16–80 ASCII letters, digits, underscores or hyphens; UUID is recommended). The canonical request is durably inserted before effects. A completed retry with identical arguments returns the stored result. Reusing an ID with different arguments returns `ID_CONFLICT`; an interrupted pending receipt returns `OUTCOME_UNKNOWN`, requiring inspection before a deliberately new operation. It must never automatically replay an uncertain write. This gives bounded retry protection, not a claim of an atomic transaction spanning SQLite and every filesystem syscall.

Revalidate granted authority before issuing operations; revocation is effective even if an old UI still displays cached entries. Multi-item batches may report partial failure; callers must show actual outcomes rather than labeling the whole batch successful. A disconnected helper is unavailable until restarted manually or through the explicitly installed native bridge. Native connect verifies a private bootstrap-key possession proof before rotating/sending a new bearer token; CORS or the proof response itself grants no filesystem access. State also retains the private 32-byte `bootstrap.key` (regular file, owned by the OS user, mode 0600); it must never appear in exports.

## Verification and remaining gates

Run `python scripts/check_project.py` and inspect the actual companion tests and latest handoff. Passing Python tests does not prove Chrome native installation, Windows security, DNS rebinding resistance under all browser variants, lifecycle recovery, OS sleep/reboot behavior, or production security. Maintain independent malicious-Origin, wrong-token, Host, traversal, symlink/race, revoked grant, read-only grant, conflict, partial-copy and duplicate-retry oracles when replacing this transport or provider.
