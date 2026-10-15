# Browser/native lifecycle implementation

This is an implementation contract, subordinate to the agent-neutral companion reconstruction and recovery requirements. Linux native-process evidence below does **not** establish actual Chrome MV3, browser restart, OS resume/reboot or Windows behavior.

## One-time enrollment and returning use

The trusted worker `extension/background.js` accepts messages only from its own exact extension origin. The first successful **Connect installed companion** action invokes the fixed `org.atlas.companion` native host with `{action:'connect'}`. It validates protocol `atlas.local.v1`, numeric port 17892 and the candidate credential, then authenticates HTTP health before storing the token in `chrome.storage.session`.

Only `{nativeEnrolled:true}` is saved durably in `chrome.storage.local`; no credential is written there. The flag is a nonsecret recovery hint, never authorization. Both storage areas are restricted to trusted extension contexts. The native host must independently reject a different or revoked extension identity. Existing grants remain native-owned and do not arise from this hint.

A returning explorer calls `ensure-ready` without opening a pairing dialog. A valid session token is health-checked. If it is absent/stale and enrollment was explicitly remembered, the native host verifies/wakes the companion and supplies a rotated session credential. `chrome.runtime.onStartup` supplies an additional demand trigger only when enrollment was remembered. Concurrent recovery requests share one native connection attempt. No browser/OS power-state execution guarantee follows from these triggers.

Manual token pairing is an optional development fallback. It deliberately clears the native enrollment hint, so it never silently authorizes native wake. Its session credential does not persist across full browser restart. Disconnect removes the browser token and automatic-wake hint; it does not revoke durable native grants or uninstall the companion. Native management is the place to revoke scope/enrollment.

## Recovery and mutation safety

The worker permits one recovery attempt and one read retry for list, read, hash, health, grants, receipts and GET catalog following a transport failure or stale-token 401. Unsupported routes cannot reach transport. Native calls have a 15-second deadline. Health/list/read/grants/receipts have 8-second HTTP deadlines, hashes 30 seconds, and writes 120 seconds. There is no timer loop or infinite retry.

Before submitting a filesystem or catalog mutation, the worker performs authenticated readiness checks and may wake an already-dead companion. The mutation is then submitted **once**. A lost response after submission yields `OUTCOME_UNKNOWN`, including the operation ID when supplied; neither filesystem nor graph mutations are automatically replayed, even with the same ID.

An unknown marker remains in session storage across ordinary successful reads and newly opened explorer pages. A final matching operation receipt clears it; a pending receipt does not. The user can inspect Activity/files or catalogs and explicitly dismiss the connection warning. Dismissal changes no durable receipt and does not prove success or replay any effect. Metadata requests without an operation journal require manual inspection of the current graph/revision.

The UI shows READY, STARTING, OFFLINE, NEEDS_INSTALL, NEEDS_PAIRING, NEEDS_GRANT, NEEDS_REPAIR and OUTCOME_UNKNOWN. It does not automatically open repeated pairing dialogs. **Add location** sends only `{action:'manage'}` to the trusted native host. Scope selection occurs in that native interface; the browser cannot create a grant through HTTP. Returning focus/refresh reloads granted locations.

## Reproduced evidence

- `node scripts/test_extension_broker.mjs`: 18 worker-contract cases in Node VM, including remembered enrollment, startup, manual/new-identity separation, concurrent/bounded read recovery, mutation preflight, no mutation replay, unknown receipt reconciliation and credential isolation.
- `node scripts/test_recovery_broker_native.mjs`: shipped worker decisions plus actual Linux framed native host, possession proof, authenticated HTTP and disposable helper processes. Proves first enrollment, fresh-worker credential rotation, helper SIGKILL followed by native read recovery, helper kill before one mutation submission, response loss after an actual byte-copy with no replay, grant revocation surviving wake, and changed extension identity denial. The test-only runtime adapter supplies Chrome's Origin header and records exact disposable child PIDs for cleanup. It does not install or exercise Chrome callbacks.
- `python scripts/browser_smoke.py --artifacts artifacts/browser-recovery`: Chromium DOM with explicitly injected test-only runtime/storage bridge and real companion HTTP. Existing file workflows plus lifecycle state rendering and deliberate unknown-outcome inspection pass without unsolicited pairing dialogs. Screenshots are ignored artifacts.

Actual MV3/native integration remains NOT_RUN where managed browser policy disables unpacked extensions. Do not bypass that policy or promote VM/DOM proof into Chrome, OS resume/reboot, Windows installer or Store approval claims.
