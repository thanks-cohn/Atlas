# ATLAS implementation handoff — 2026-10-15

## Outcome and authority

Owner instruction: implement the premium explorer assignment on `main`, preserve all inheritance/security contracts, and commit/push within the session. Starting HEAD was `cf2847c3dc213aefd68f6bb92a612be6ad4dc6b9`; all history is preserved. Before push, upstream advanced by three documentation commits through `b63f14c`; these were retained by rebasing this implementation and keeping both the new portable-environment proposal index and Linux quickstart. The proposal remains non-normative and adds no mandatory WebVM dependency. The task began with four passing graph tests and no companion/client. The cloud checkout originally called its local branch `work`; implementation switched to local `main` tracking `origin/main` without resetting any work.

Delivered a real Linux development filesystem explorer with a MV3 client, explicit scoped companion, durable metadata and reversible operations. This is a substantial functional development slice, **not** a production release or evidence of Windows/Chrome Store approval. Canonical `forever/` records remain unchanged. Their normative upstream and independent schema checks now pass at a pinned upstream commit; structural conformance does not mean the full capability destination is implemented.

Read `AGENTS.md`, the Forever Works inheritance, `docs/implementation/LOCAL_EXPLORER_V1.md`, `docs/COMPANION_API.md`, `docs/implementation/GRAPH_STORAGE_V1.md` and `docs/implementation/RECOVERY.md` before continuing. These are agent-neutral behavioral interfaces; there is no requirement to retain Python, SQLite, HTTP or this UI if independently verified replacements preserve meaning and authority.

## Implemented files and working behavior

- `src/atlas_companion/`: standard-library Linux loopback server and explicit CLI. Exact paired extension Origin + bearer + numeric Host required. Read-only/writable folder grants are CLI-created, revocable and pinned to root device/inode. Browser requests cannot grant roots. Private state cannot overlap a root grant. Tokens are random; only digests persist.
- `security.py` / `filesystem.py`: descriptor-relative no-follow traversal, no symlinks/special files, no-overwrite atomic publication, paginated real listing, bounded preview, on-demand stable-source SHA-256, mkdir, rename, recursive copy/copy-as, same-filesystem move, recoverable root-local trash and receipt-authorized restore. Actual bytes were verified. Cross-device move is explicitly refused.
- `state.py`: SQLite native bindings, grants and durable operation receipts. A completed same-ID/same-request retry replays its result; argument conflict and uncertain unfinished intent are explicit. Activity exposes recent authorized outcomes, with revoked scopes filtered out.
- `src/atlas_native/` and `scripts/install_native_host.py`: explicit Linux development Native Messaging installation with one exact allowed extension origin and **no automatic root grants**. Native host verifies a fresh port-bound private-key HMAC over the same connection used for authenticated health, wakes the fixed companion command if absent, rotates a token and returns it only via bounded framing. Impostor-listener and unsafe-installation tests pass. This remains checkout/interpreter-dependent, not a standalone binary.
- `extension/`: polished responsive full-tab/side-panel client; authorized roots and lazy folder tree, breadcrumbs/editable path, history/parent/refresh, list/grid, sorting/current-folder filter, mouse/Ctrl/Shift/keyboard selection, context menus, internal cross-view copy/cut/paste with expiry, browsable Copy To/Move To destinations, duplicate, mkdir, rename, trash/undo, confirmed internal folder drag/drop (copy; Shift move), properties, text/image previews and hash controls. Unsupported types show a truthful fallback. No shell/open-with endpoint exists.
- `extension/graph.js`: real local resource registration, manual HTTP(S) bookmark resources, tags, notes, catalogs, memberships, typed links and portable JSON export. Resources survive reload and local moves reconcile locators without changing IDs. This is not permission to read Chrome's bookmark database.
- `extension/activity.js`: durable Activity/recovery across page reload, partial-failure details, original-location restore and unknown-outcome guidance. No permanent deletion or blind mutation retry.
- `src/atlas_core/`: strict complete v1 validation, duplicate-key rejection, portable export/import, transactional SQLite GraphStore with optimistic revisions and concurrent-writer tests. Native grants/secrets remain separate from graph exports.
- `scripts/`: foreground launcher, real CLI/HTTP smoke, browser DOM integration, worker contract tests, exact-pinned upstream validation and deterministic unsigned extension ZIP packaging. CI now runs Python, worker contract and real CLI smoke checks. Optional browser/schema proof dependencies are pinned in `requirements-dev.txt`; runtime remains standard-library only.

## Reproduce setup

Use the existing checkout; cloud tasks are isolated already. Do not create a worktree unless explicitly requested. From repository root, Python 3.12 is the tested baseline:

```sh
python scripts/check_project.py
node scripts/test_extension_broker.mjs
python scripts/smoke_companion.py
python scripts/browser_smoke.py --artifacts artifacts/browser
python scripts/validate_forever_upstream.py /tmp/atlas-forever-works
python scripts/package_extension.py
```

The last validator command needs a clean separate `thanks-cohn/forever-works` checkout at `ebeb65f786ba0d9ba0e730dddd8047937348257a`; follow `docs/DEVELOPMENT.md`. Browser proof needs the pinned optional Playwright and installed Chromium. It uses disposable roots/state and a test-only `chrome` transport bridge. Screenshots/logs/package outputs are ignored artifacts, not committed personal data.

For actual manual use on a browser permitting extension installation:

1. Load `extension/` unpacked via `chrome://extensions`; copy the actual extension ID.
2. Grant a narrow disposable root with `./scripts/run_companion.sh grant /absolute/test/folder --write` (omit `--write` for read-only).
3. Either run `pair --extension-id ID` and `serve`, then enter the printed private token in Connect; or explicitly install `python scripts/install_native_host.py --extension-id ID --consent --browser chromium` and choose **Connect installed companion**. Use `--browser chrome` for Chrome. See `docs/NATIVE_BOOTSTRAP.md`.
4. When overriding native state, put `--state-dir /private/path` before companion subcommands and use the same state with the installer. State defaults to `~/.local/share/atlas` and must remain outside granted roots.
5. Revoke using `./scripts/run_companion.sh revoke --extension-id ID` / `revoke --grant GRANT_ID`. Do not commit tokens/private state/catalogs. Installer prints exact files to remove for explicit uninstall.

## Observed proof and limits

See `docs/evidence/implementation-2026-10-15.json` for exact final commands, runner results, environment and implementation digests. `docs/evidence/forever-validation-2026-10-15.json` records unchanged canonical record digests and the two normative oracles.

- Final Python suite: **54 tests passed**, including graph concurrency/import rollback, real HTTP, malformed authority/body denial, actual filesystem effects, 1,017-entry pagination, hashing, revoked scopes, operation replay/unknown outcomes, trash recovery after reopening state, private-state exclusion and Linux process/native framing tests. Inspect runner output for any future skips; the current run had none.
- Worker: **9/9** contract tests executing the actual worker in Node VM with controlled Chrome/fetch doubles. Sender/route restrictions, credentials, manual/native pairing health and side-panel fallback are exercised. This is not an MV3 execution proof.
- CLI smoke: real subprocess CLI + HTTP + filesystem byte/denial checks passed.
- Browser: real Chromium 154 rendered the unchanged UI and invoked the actual companion through a **test-only transport bridge**. Tests cover folder tree, new-folder/Copy To, confirmed drag/drop, cross-tab clipboard, right-click Copy/Paste, rename, hash, preview, duplicate, trash/undo, graph/bookmark/tag/catalog/link reload persistence, Cut/Paste, Activity recovery after reload, filtered Shift selection, narrow layout and no JS page errors.
- Normative model: real pinned upstream validator + independent JSON Schema Draft 2020-12 passed for manifest and all nine records. Upstream Python suite also passed six tests.
- Packaging: deterministic extension-only unsigned ZIP built; identical rebuilds are checked. No Store submission or publication occurred.
- **Actual MV3 / Chrome Native Messaging callback: NOT_RUN.** The environment's managed Chromium policy has `ExtensionInstallBlocklist:["*"]`; CDP explicitly rejects unpacked extension loading. The policy was preserved. DOM bridge tests cannot prove worker fetch Origin behavior, extension CSP/permissions, host discovery or browser lifecycle. Linux standalone native framing/process wake was separately exercised.
- **Windows, PyInstaller standalone packaging, Android, R2, Store approval, external security audit and blinded reconstruction: NOT_RUN / NOT_IMPLEMENTED.** No corresponding success is implied.

## Premium contract completion map

| Area | Status in this run |
| --- | --- |
| P0 navigation/list/grid/sort/selection/context menu | Implemented and DOM-tested; actual MV3 gate remains |
| P0 real copy/cut/paste/rename/mkdir/move/duplicate | Implemented; byte/denial tests; no overwrite/replace policy UI |
| P0 trash/restore/partial receipts | Implemented; recovery survives reload; custom local trash, no permanent delete |
| P0 internal folder DnD | Implemented/tested; no external uploads, cross-provider queue or cancellation |
| P0 preview/properties/hash | Text/image/bounded hash implemented; PDF/media/archive advanced previews incomplete |
| P0 scale/search | 1,017 actual entries verified; folder pagination capped20k; DOM not virtualized; name filter only |
| P1 catalogs/tags/notes/links/manual bookmarks | Implemented persistent graph UI/export; no Chrome bookmark ingestion, nested collections or graph canvas |
| P1 R2/other-product providers | Not implemented; no credentials requested or fabricated |
| P2 distribution/updates/platform parity | Linux explicit development bootstrap only; standalone/signing/Windows/Android/Store incomplete |

## Remaining risks and exact next work

1. **First next gate: actual Chrome runtime.** Use a user-authorized machine/browser allowing unpacked extensions; do not bypass this managed policy. Load this source, inspect extension ID, explicitly install native host and grant only a disposable directory. Verify actual extension worker sends the exact Origin the server requires on GET and POST; verify preflight, CSP, side-panel/full-tab behavior and token isolation. Exercise right-click copy/paste and compare filesystem bytes. Kill helper, click installed connect, restart browser and validate host wake/credential rotation/reconnection. Record exact Chrome/OS versions and negative outcomes. DOM/Node tests are supporting oracles only.
2. **Before broader authority or release:** independently adversarially test symlink swaps, externally renamed ancestor directories, source changes during copies, malicious local listeners, concurrent revocation/in-flight batches and unsafe state/installation paths. No production security claim has been earned. Manual pairing assumes the expected trusted listener; native proof protects bootstrap listener identity. Hostile code under the same OS account is not isolated from its own private state.
3. **Reconciliation/crash gate:** filesystem effects, graph update and receipt completion are separate transactions. Crash after rename can leave moved bytes plus pending receipt and stale metadata. Preserve/inspect `OUTCOME_UNKNOWN`; never automatically replay an uncertain mutation. Add deterministic kill-at-each-boundary tests and explicit reconciliation tooling. Interrupted copies can leave hidden `.atlas-copy-*` staging; do not indiscriminately delete user files. Trash and receipt retention/quotas need explicit product policy; current receipt DB retains history for idempotency.
4. **Premium operation UX:** bounded transfer queue/cancellation; explicit non-destructive conflict rename/skip choices; live progress; safe cross-device transfers with journal; virtualization; richer previews; full undo/history reconciliation. Current conflicts fail safely, cross-device moves fail explicitly, tree shows at most100 subdirectories per expanded node and internal DnD is same-view only. Copied bytes do not promise ACL/xattr/timestamp/executable-bit preservation or a consistent snapshot of concurrently edited files.
5. **Platform and provider work:** design and independently test Windows reparse-point/handle-safe provider before enabling it. Build/sign/install/uninstall PyInstaller package on actual Windows; Linux success does not transfer. Add separately authorized Chrome bookmarks and R2 read-only adapters, test offline/revoked credentials, then writes. Never put credentials in portable graph exports or content scripts.
6. **Graph/reconstitution:** preserve v1 IDs/notes/tags/relationships, add explicit migration fixtures for future schemas, export/import UI and independently held-out compatibility tests. The canonical capability records remain planned because their full accepted obligations are not fulfilled. Add accepted implementation/evidence records only using upstream schemas and exact reviewed proof; do not manufacture requirement completion.

No pending permission or secret is required for the implemented local workflow. Publication and Chrome Store submission were not requested or performed. Push status is reported in the final response; inspect Git history/remote before resuming rather than trusting this document as live state.
