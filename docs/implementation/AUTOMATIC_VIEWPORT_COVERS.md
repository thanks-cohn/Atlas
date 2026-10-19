# Automatic viewport bookmark covers

Owner direction, 2026-10-19: fetch visible bookmark covers by default instead of
requiring Fetch each session. Remember an unsuccessful attempt to avoid endless
calls; explicit manual per-card retry may try again.

Fixed obligations: never replace an existing/chosen cover, preserve gallery entry
identity and human/model metadata, respect optional website permission and saved
storage budget, omit cookies/referrer, never execute fetched page scripts.
Constrained: one request at a time, 500ms queue spacing, existing 12s timeout and
response/raster limits; automatic discovery uses mounted cards intersecting the
viewport plus200px. Offscreen queued work is removed on discovery. Already active
requests may finish unless navigation/cancel stops them. Fluid: checkbox wording,
checkpoint version and future scheduling mechanisms.

`fetch-covers.js` defaults `atlas.coverFetch.automatic.v1` to true. Board settings
contains Automatically fetch visible bookmark covers; explicit false persists
independently of other view preferences. On startup only permissions.contains is
called: no website permission prompt without a gesture. Existing broad site access
allows automatic work; otherwise Fetch (or explicit re-enabling the checkbox)
requests website access. Manual All mode remains explicit and collection-scoped.
Cancel pauses automatic work for the current session; toggling or manual Fetch
resumes it. Scope/filter changes rebuild viewport work without retrying misses.

Per-board `atlas.coverFetch.v1.<board-id-or-default>` checkpoint is now version2.
It retains the `{bookmark id}|{URL}` attempt map independently of current filters;
version1 attempt maps are accepted. Success, skip and unavailable outcomes prevent
repeated calls in this board, including after reload. Changing a bookmark URL
creates a new identity. The per-card Fetch action explicitly clears that entry
before retry. A failed checkpoint write or storage-full condition pauses work.
The UI does not claim a fetched preview is an original image backup.

Verification: `test_fetch_covers.mjs` covers permission denial, unsafe URLs,
bounded cookie-free retrieval, serial queue, manual resume/cancel, automatic
startup with already granted access, viewport exclusion, persistent failed
attempts across rediscovery/filter changes/reload, explicit retry, saved opt-out
and zero requests/prompts without permission. `test_pinboard.mjs` passes existing
1,000-card, cover preservation, authored and additive-gallery regressions. Actual
Chrome network/UI behavior remains owner acceptance, not proven by doubles.
