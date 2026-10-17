# Current state and cold continuation ledger

**Initial foundation:** 2026-10-15. Historical status; agents must inspect code and commit history for later changes.

## Exists

- Agent-neutral project purposes and multistage dependency plan under `docs/forever-works/`.
- Canonical Forever Works 0.1 model under `forever/` with manifest, project intent, 3 capabilities, 3 invariants, 1 hard constraint and 1 historical decision. Provenance states owner direction; no claim of implemented behavior.
- Experimental Python catalog graph `src/atlas_core/catalog.py` supporting resources with locators, catalog membership, tags, typed links, JSON export/reload and tests under `tests/`.
- Local standard-library verification entry `scripts/check_project.py` with basic referential checks and unit execution.

## Does not exist / is not proven

- Production database with transactional concurrency and robust migrations.
- Normative upstream Forever Works Standard 0.1 schema validation on all records, unless independently run and recorded by a successor.
- Chrome extension, Python companion server, authenticated pairing, user-granted filesystem bridge, native host, PyInstaller distributable and Windows/Linux wake tests.
- Cloudflare R2 credentials/adapter, real bookmark source adapter, archive tooling, Android app, real cross-product integration.
- Runtime conformance evidence, Chrome Web Store acceptance, commercial product revenue, cold-agent reconstruction proof.

## Next bounded increments

**N1 — canonical validation and graph hardening:** pin/check upstream validator or bring in independently verified compatible adapter; test provenance, references and the normative schema; add stable domain JSON schema and negative tests; transactional save, import/export migration and conflict handling, without breaking current experimental fixtures. Document migration of the prototype if needed.

**N2 — constrained companion:** trusted test directory grants, authenticated read-only API, no shell, path race/symlink protections, deny-unpaired and malicious webpage probes. Only after secure negative tests pass.

**N3 — client implementation:** MV3 UI that pairs with installed companion and exercises one real authorized file listing plus bookmark↔local file pairing in persistent catalog.

**N4 — real packaging and recovery:** PyInstaller on Windows; installer with per-user native-host registration, wake + reconnect, verified kill/restart and OS lifecycle tests; Linux separately.

Later work follows `BUILD_PROGRAM.md` milestone ordering. Agents may work concurrently on contracts, a11y, tests, providers and UI if the interface versions are fixed; no concurrent feature gets to borrow another's proof.

## Rules for ledger revisions

Append dated status with exact checks/OS results. Distinguish attempted, working, unverified and blocked. Do not erase prior unknowns merely because a build compiled. Store evidence as checksummed test receipts; secrets/logged absolute sensitive paths excluded.

## How to reconstruct cold

Use `RECONSTITUTION_PROTOCOL.md` with verified canonical records and full independence from historical language/framework; preserve source as evidence, not as mandatory dependence. Fix accepted external behavior; let internal mechanism change.

## 2026-10-15 — Linux functional explorer implementation

This dated entry supersedes the initial implementation inventory above while preserving its history. Owner direction was `codex/BUILD_PREMIUM_ATLAS_END_TO_END.md`; accepted canonical meaning and upstream Standard 0.1 were not changed.

**Implemented:** `src/atlas_companion/` provides exact-origin/token/Host-authenticated Linux loopback access to explicit read/write folder grants; descriptor-safe listing/preview/hash, real mkdir/rename/copy/move and recoverable trash/restore, bounded operations, durable idempotency/unknown-outcome receipts and authorized history. `src/atlas_native/` and `scripts/install_native_host.py` add explicit exact-origin Linux development native bootstrap/wake without granting roots, and verify the server before disclosing credentials. `src/atlas_core/store.py` adds transactional revisioned graph persistence; v1 validation/import and successful-move locator reconciliation preserve logical IDs. `extension/` implements full-tab/side-panel source, polished functional file navigation/selection/context operations/internal clipboard and drag/drop, properties, hash, safe text/image preview, persistent catalogs/tags/notes/bookmark resources/typed links and recovery after reload.

**Actual evidence:** Python 3.12.14 on Linux, `python scripts/check_project.py`: **54 tests passed, no skips**. `node scripts/test_extension_broker.mjs`: **9/9 worker contract tests passed** using Node VM doubles. Real CLI/HTTP smoke passed. Chromium 154 DOM + real companion via test-only transport passed 14 workflow categories with byte/digest/persistence assertions, narrow390px layout and no page JavaScript errors. Standalone Linux native process wake/framing, installer authority, malicious-listener refusal and credential rotation are exercised by Python tests. The upstream Forever Works validator at `ebeb65f786ba0d9ba0e730dddd8047937348257a` and independent Draft2020-12 schema oracle validate the unchanged manifest plus nine records; upstream's six Python tests passed. Deterministic unsigned extension ZIP built with an identical rebuild.

**Not proven:** actual MV3 worker/CORS/Chrome Native Messaging callback. Managed Chromium blocks unpacked extensions, and its policy was preserved. DOM and Node doubles do not replace that platform gate. Windows/PyInstaller standalone packaging, Android, R2, native Chrome bookmark ingestion, advanced previews, Store acceptance, production security and blinded reconstruction remain incomplete/unrun. There is no implicit cross-platform PASS. File effects, graph reconciliation and receipts are not an atomic cross-store transaction; pending outcomes require inspection, not blind replay. No production release is claimed.

**Receipts and continuation:** `docs/evidence/implementation-2026-10-15.json` records exact commands, source digests and scope; `docs/evidence/forever-validation-2026-10-15.json` pins canonical inputs. `docs/implementation/LOCAL_EXPLORER_V1.md` declares fixed/constrained/fluid aspects, security bounds and reconstruction-facing interfaces; storage and recovery contracts are alongside it. `codex/HANDOFF_LATEST.md` contains reproducible setup, P0/P1/P2 progress, limitations and exact next gates. Begin next with authorized real-Chrome runtime and native callback proof, then adversarial race/crash/revocation reconciliation before extending privilege or Windows/provider capabilities. Preserve all existing invariants, versioned records, test oracles and truthful UNKNOWN outcomes.

## 2026-10-15 — Linux standalone companion and recovery

Owner assignment `codex/BUILD_RECOVERY_SUPERVISOR_AND_INTEGRATE.md` now has a functional Linux slice: bundled PyInstaller/Tk setup/location manager, no-Python user installation, exact-ID registration, persistent deliberately broad root grants with private state/runtime exclusions, transactional authority schema2 migration, remembered browser enrollment/session credential rotation, bounded automatic native recovery, strict attested-incarnation pidfd stale-helper recovery, optional explicitly enabled per-user supervisor and reversible owned-file installation. No shell API or implicit root grant is introduced; graph format/protocol stay compatible.

Evidence:82 Python tests,18 worker contracts,7 real native-host/HTTP recovery categories,16 Chromium DOM/real-helper categories, actual native widgets and standalone native-wake/byte-copy with Python absent from PATH passed. All17 canonical records pass pinned upstream and independent schema validators. Exact source/artifact hashes and proof limits are in `docs/evidence/recovery-implementation-2026-10-15.json`; current continuation is `codex/HANDOFF_LATEST.md` and end-user setup is `packaging/README.md`.

Actual Chrome callbacks remain NOT_RUN under managed policy; OS logon/systemd/sleep/reboot, clean-machine ABI, Windows, signing, Store and soak proof remain outstanding. The current binary is Linux x86_64/glibc2.41, unsigned. The owner requested Windows next: preserve the existing portable code/contracts while implementing and independently testing Windows handle/reparse/ACL/process/registry semantics; do not weaken Linux safeguards or bypass platform guards. Chute RC1 is pinned historical architecture, not copied licensed code or ATLAS Windows certification.

### Windows continuation started

Following Linux delivery `fbc2fd3`, a Windows-only held-handle read/list provider and actual-Windows workflow tests were added as a bounded first increment. It is not enabled in the integrated companion; Windows ACL state, mutations, native installer and lifecycle remain unfinished. Local grammar checks pass; native Windows tests require the Windows runner. See `docs/implementation/WINDOWS_PORT_V1.md` and workflow evidence rather than assuming platform parity.

Actual Windows continuation evidence:workflow38775102540 passed on Windows Server2025 (7pass/1 Linux-onlyskip; all5 kernel tests executed). This proves only the new read/list boundary, not a complete Windows helper or Windows10/11 desktop lifecycle. Linux CI and unsigned installer workflow also passed; the Ubuntu22.04/glibc2.35 binary was independently downloaded and retested for no-Python native wake/bytes/GUI. See `docs/evidence/windows-and-linux-ci-2026-10-15.json` and latest handoff for artifact download and remaining gates.


## 2026-10-15 — integrated Windows companion and recovery proof

This supersedes the historical Windows-foundation-only status above. Main now contains independent Windows NT-handle filesystem operations, persistent SID-owned protected-DACL authority, exact-origin HKCU native installation, bundled native-management UI, attested process-incarnation recovery, and an opt-in per-user login supervisor. Shared graph/HTTP/MV3 contracts and Linux implementations remain intact. No Chute source was copied; pinned historical architecture and all17 canonical records remain unchanged.

Actual Windows Server2025 workflow38779850667 passed40 unit cases (39 passed/1 expected Linux-only skip), actual native Tk management with disposable controlled dialogs, and the real frozen x86_64 executable acceptance: no-Python native wake/HTTP byte copy; mkdir/rename/move/trash/restore; precise process stop/re-wake; real NtSuspendProcess hang recovery; durable grants/receipts; live upgrade; immediate opt-in supervisor and failed-helper restoration; disable/revocation persistence; live owned uninstall. Download and SHA256 are in the latest handoff and `docs/evidence/windows-companion-recovery-2026-10-15.json`. Downloaded binary digest, size and Windows-CRLF source fingerprint were independently checked. Linux development CI38779850655 passed122 Python cases (93 passed/29 Windows-only skips),18 worker contracts and actual Linux native/worker integration.

Actual Chrome Native Messaging callbacks remain NOT_RUN under managed browser policy. Physical Windows10/11 sleep, hibernation, shutdown/reboot/logon, Linux systemd power cycles, clean-machine frozen GUI, publisher signing, Store approval, idle/power measurements and soak remain separate gates. A suspended process is not physical OS suspension. Windows recursive directory copy/cross-volume move remain explicitly unsupported; filesystem/graph/receipts still lack a shared atomic crash transaction. Preserve OUTCOME_UNKNOWN and never blindly replay a submitted mutation. See latest handoff for exact continuation; desktop lifecycle proof is next.


## 2026-10-15 — owner-requested native manual-token fallback

Owner observed a locally READY helper while the loaded extension rejected native
pairing with "Pair this exact extension ID using the local CLI." Root cause of
that installed-build mismatch remains UNKNOWN. Added a Manual pairing (debug)
native tab with exact-ID entry, explicit token generation, masked/revealable
read-only field, Copy token and Clear displayed token. Reuses State.pair through
Management.pairing_token: explicit local consent, ID-bound digest storage,
rotation of the previous credential, no new file grants, no HTTP token endpoint.
Fixed authority and grants contracts remain unchanged; presentation is fluid.

Verification: scripts/check_project.py and tests/test_management.py cover consent,
invalid ID rejection, old-token invalidation, wrong-origin denial and unchanged
grants. scripts/smoke_desktop.py now exercises the real new widgets, clipboard,
masking and clearing in platform CI. Local environment has no display/Xvfb;
actual Windows widgets/frozen EXE and user's Chrome acceptance require the new
Windows workflow artifact. No claim that manual pairing repairs startup/native
registration or guarantees this user's browser connectivity. Next: download new
artifact, test manual pairing and actual folder listing; inspect the concrete
browser error if HTTP authentication still fails.

Executed local result: management suite PASS (4 tests). Full check_project run:
123 tests, 3 failures, 3 errors, 29 Windows skips; failures/errors concern native
subprocess wake/supervisor startup with missing /proc child identity or helper
not reaching READY in this execution environment. Full suite is NOT PASS. New
management tests passed within that run. Actual Tk smoke NOT_RUN locally (no
Xvfb/display). Windows CI remains the platform-specific build/GUI gate.


## 2026-10-15 — observed Chrome worker GET without Origin

Owner supplied network evidence: GET /v1/health returned INVALID_ORIGIN/403;
Chrome 154 worker sent Sec-Fetch-Site: none and a bearer, but no Origin header.
This was an origin-gate failure before token validation, not proof of an invalid
token. Implemented extension v0.1.1 explicit X-Atlas-Extension-Origin identity
selector. Helper accepts it only for authenticated requests without Origin and
with Sec-Fetch-Site: none; exact enrolled extension identity and bound bearer
remain mandatory. A supplied Origin must match; website/null origins, missing or
wrong tokens, revoked identities and missing identity still fail closed.
Unauthenticated bootstrap/preflight retains real-Origin requirement. This header
is not independent authority and does not grant files. Native consent remains fixed.

Verification: 23 companion HTTP/security tests PASS including the observed GET
shape and negatives; 18/18 Node worker tests PASS. Local native recovery integration
still fails on helper startup in this execution environment; actual Chrome manual
pairing and folder display remain NOT_RUN until owner installs both new builds.
Windows artifact now includes the matching extension ZIP so helper-only updates
do not leave the old request code running. Replace files in the existing unpacked
extension folder and Reload to preserve its ID. Windows CI verifies frozen helper
and actual token widgets separately; it is not actual Chrome acceptance proof.


## 2026-10-15 — preserve Working v1, then improve existing preview

First committed docs/releases/WORKING_V1.md at 1193e7332a63f3211e54c38354903ba926df3a5a,
pinning the owner-confirmed source 6d974083daf7379d55d10a0da92a4cf01bf9da1c.
Only afterward implemented Left/Right and two equivalent buttons in the existing
details preview, current visible sort/filter order, wraparound, persisted
image/audio/video defaults and opt-in text/PDF. Added built-in audio/video controls
and local-blob PDF frame; no separate viewer layout, provider or native transport.
See PREVIEW_CONTINUITY.md and canonical capability.preview-navigation /
decision.preview-continuity. Records preserve requirements; acceptance remains
planned until actual browser verification, rather than equating source with proof.

Node navigation tests and JavaScript syntax/package checks PASS locally. No local
Chromium/Playwright runtime is available: actual keyboard DOM, PDF plugin and
codec playback NOT_RUN. Existing 2 MiB native preview read cap remains; large
media streaming is not implemented. Next: verify folder navigation in installed
Chrome and later design bounded authenticated streaming/document scrolling.


## 2026-10-15 — owner-configurable preview size and actionable placeholder

Supersedes the earlier 2 MiB implementation limit. General preview maximum is
30 MiB by default; saved per-extension overrides take precedence. Existing
preview settings have extension dropdown, adjacent size input, Save and reset to
general. Common extensions and current-folder extensions populate the dropdown.
Oversize files show a type badge and a direct Settings action, using the effective
limit rather than hardcoded 30. Linux and Windows providers independently validate
max_bytes (up to 128 MiB implementation ceiling); both enforce bounded reads.
Ownership rationale and current memory tradeoffs are in PREVIEW_CONTINUITY.md.

Verification: new default/invalid-limit and real 3 MiB file read tests PASS (2);
existing companion HTTP tests PASS (6); navigation tests and JS syntax PASS.
Earlier full suite: 124 tests, 3 failures/3 errors in local native subprocess
startup/recovery, 29 Windows skips; 19 model links valid, not normative schema
proof. Actual Chrome settings/placeholder UI and 30 MiB media playback NOT_RUN
locally. Windows build gates verify actual platform implementation separately.


## 2026-10-15 — simple setup and stage diagnostics

Owner requested automatic ID/home/other-folder setup and a usable debug interface
/API after blank shelves, native timeout/manual reconnect and WinError 32 repair.
Implemented quick_setup.py consented sequence, simple desktop front page with
advanced controls, Windows quiet subsequent launch with readiness fallback;
45-second native browser deadline replaces mismatched 15-second timeout versus
20-second service wake. Added bounded extension/native stage journals, trusted
extension debug-report/debug-probe APIs, authenticated /v1/diagnostics, independent
UI boot fallback and native copy-report tab. No tokens, headers or file paths are
included. Repair file locks remain explicitly reported, not silently bypassed.

Local PASS: 20 worker tests, 3 diagnostics tests, 4 quick-setup tests, 23 companion
HTTP/security tests. Actual Windows widget/frozen checks require CI; Chrome and
user-interactive/sign-in lifecycle acceptance NOT_RUN. For rationale, exact code
coverage, contracts and limits read DIAGNOSTICS_AND_SIMPLE_SETUP.md. The attached
bookmark implementation brief is preserved separately, not implemented here.

Local full check result for this increment: 133 tests, 3 failures and 3 errors in
native wake/supervisor subprocess startup in this environment; 29 Windows-only
skips. Full suite NOT PASS. New diagnostics/setup tests passed in that run.
20 model records passed local linkage (not normative schema validation).

Owner refinement: package debug.exe as the separate original detailed setup/repair
window. atlas-companion.exe remains the simple ID/home/other-folder normal flow.
The debug filename dispatches to --desktop --advanced only on no-argument launch;
command-line service/native modes remain unchanged. Both share existing state.


## 2026-10-15 — native bookmark access in the existing side panel

Owner confirmed companion works; see OWNER_ACCEPTANCE_2026-10-15.md for bounded
user evidence and remaining clipped label/distribution issues. Owner next requested
standard, intuitive native bookmark-manager exploration inside Atlas, with richer
features added later. Extension 0.1.5 adds bookmarks permission and an independent
shelf workspace for native folder navigation/search/open/create/edit/move/delete,
preserved order and browser event refresh. Local model/DOM-double tests, worker
contracts and packaging pass; actual Chrome installation/rendering NOT_RUN here.
See NATIVE_BOOKMARKS_FIRST_SLICE.md for interfaces, rationale and explicit scope
limits. Full extended bookmark/grouping brief remains incomplete.


## 2026-10-16 — preserve baseline and document card-workspace direction

Pinned pre-change main 9c4ca96a4c7a1e0372661bf09508a323504e99cd on baseline/atlas-before-card-workspace-2026-10-16; see docs/releases/BASELINE_2026-10-16.md. Added CURRENTLY_WORKING_ON_CARD_WORKSPACE.md capturing explicit owner design, rationale, open questions and planned acceptance. No source, runtime behavior or schemas changed. Documentation links and baseline pointer checked; no new runtime test result claimed. Remote Git tag push unavailable due to missing shell credentials; baseline branch and exact commit preserved instead. Next: resolve the selected first vertical slice and inspect current code before implementing; full-gallery opening must not conflict with image-click disclosure. Other slices remain planned.


## 2026-10-16 — modular composition governs initial presets

Owner clarified that the image-first arrangement is a first extension preset, not the final architecture. Updated CURRENTLY_WORKING_ON_CARD_WORKSPACE.md: user-switchable image/video/article/gallery focus, note-first connected media, tag-related regions and interchangeable columns/rows/carousels. Start with a carousel-style modular preset; earlier masonry pinboard remains a distinct planned presentation. Preserve content/identity/associations independently from arrangement and interaction settings; retain ALL-tag semantics and privacy. Added planned alternate-composition, persistence and export checks. Documentation-only change: no source/schema/runtime alteration or runtime PASS claim. Next: define the first carousel surface and bounded preset/component contract before implementation; do not hardcode image-first ownership into data storage.


## 2026-10-16 — durable curation, premium templates and reconstructable Atlas

Appended the owner's publishing/reconstruction vision and recent gallery/article/carousel clarifications to CURRENTLY_WORKING_ON_CARD_WORKSPACE.md. Personal collecting and writing, including years-old material, should remain reusable for publishing. Initial gallery-centric preset includes persistent single/multi-image top carousel (multi default two previews each side), article-card slice and a distinct full-article extension page. Templates remain modular and any-object-centric. Preserved professional aesthetic quality, modest dependable code, explicit purpose/decision/implementation/evidence trace coverage and eventual cold reconstruction goals without asserting implemented behavior or guaranteed completeness. Existing source and baseline remain unchanged. Verification: documentation append/preservation and remote content checked; no runtime test claim. Next: select and specify a bounded first functional outline, its state/navigation contracts and planned proof before coding.


## 2026-10-16 — Horizons v1 first-party extension-page proposal

Added PROPOSAL_HORIZONS_V1.md and linked the WIP/index. Captures latest owner composition: one hero preview each side, search bar, lower horizontal tag-column carousel, distinct approximate matches and Enter recentering, row expansion and separate article-page navigation. Requires from-scratch first-party page/carousel logic; external libraries serve as motion references only. Records rationale, proposed state boundaries, acceptance checks and unresolved input/responsive/query contracts. Documentation-only change; no runtime implementation, packaging or PASS claim. Next: resolve the first slice's route/data/state contract against current source, then implement a bounded real page and record actual browser evidence.


## 2026-10-16 — bookmark disclosure, image above items, current-tab titles

Extension 0.1.6 implements separate triangle exploration and title activation. Preview/cover stays above native child rows and available exact-URL Atlas notes/tags/outgoing relationships; left arrow/Up/Esc restore context. Explicit local raster image selection, bounded saved covers, direct image URL fallback and related direct web image fallback work without new permissions or helper endpoints. Metadata still needs a paired companion; no automatic webpage thumbnail scraper. Read BOOKMARK_IMAGE_DISCLOSURE.md for owner rationale, exact code/storage contracts and limitations (cover sync/export and stable native-to-graph ID mapping remain incomplete). Canonical capability.bookmark-disclosure and decision.bookmark-disclosure preserve accepted intent, not browser runtime proof.

Local Node bookmark API/DOM-double suite PASS including image chooser encoding and negative cases; existing worker 20/20 contract suite PASS. Actual Chrome render/file picker/current-tab acceptance NOT_RUN locally (no Chromium). Full Python check: 135 tests, 3 failures, 3 errors, 29 Windows skips; failures/errors concern native wake/supervisor readiness in this environment, as previously recorded. Full suite NOT PASS. No Python/native source changed in this increment. The run checked 20 pre-change model records before the two new canonical records were added; Post-change model linkage PASS: 22 records. Independent normative schema check NOT_RUN: local jsonschema/referencing dependencies unavailable. Unsigned ZIP version 0.1.6 can be generated with scripts/package_extension.py. No helper binary update. Next: install in the same existing unpacked folder, Reload, verify representative image position, return behavior and that titles update the existing tab.


## 2026-10-16 — Add Item, Pages and a distinct Gallery template

0.1.7 capitalizes Associated Items and adds Add Item → Page with Gallery as the default template, separate from planned Horizons. Dedicated UUID page route, title/text, local raster and public HTTP(S) image URLs, captions/order and expanded image viewer are implemented in first-party modules. Pages and bookmark placements are separate versioned local records. Shared Web Lock and revision checks prevent stale editor overwrites. R2 is future only: Publishing Check identifies local images and explains upload consent/destination requirements; it does not upload or deploy. Read ASSOCIATED_PAGES_AND_GALLERY.md for limits, quota/resource policy, local-only data/export caveats and explicit owner reasoning.

Local PASS: new page store/editor/viewer API/DOM-double suite; bookmark creation/disclosure regression suite; existing 20 worker authority contracts; control-ID, whitespace and packaging checks. Actual Chrome rendering/decoding/locks and aesthetic acceptance NOT_RUN locally. No native/Python changes; prior full-suite native readiness blocker remains unchanged, not retested without a new native risk. Next: owner verifies Add Item/Gallery and URL+local images in Chrome; integrate export/migration and authenticated R2 in later bounded slices.


## 2026-10-16 — durable library and actionable image import feedback

Owner reported misleading No files chosen and generic IMAGE_ADD_FAILED, then required saving outside Chrome and a future companion-to-R2/Pages publishing path. Implemented 0.1.8 custom image chooser/status, signature-based type recognition, adaptive preview encoding and distinct failures. Matching native companion adds authenticated /v1/library actions, original/preview blobs and page manifests in existing private state SQLite storage; no arbitrary filesystem grant/path or cloud request. Save commits to native storage before browser cache; explicit legacy migration and exact bookmark/UUID recovery exist. See DURABLE_GALLERY_LIBRARY.md and COMPANION_API.md for authority, bounds, actual storage format/location, failure/retry behavior and limitations. Requires updating both extension and helper. No claim to reconstruct originals missing from older browser-only previews.

Focused local PASS: three real native-library HTTP tests, six existing HTTP/security tests, gallery/bookmark JS doubles, 20 worker authority cases including library-write no-replay, adaptive encoder tests, compilation and packaging. Actual owner image decode/Chrome UI NOT_RUN. Shared Windows library tests added to existing Windows build; platform evidence pending hosted run. Full local Python suite: 141 tests, 3 failures, 3 errors and 32 Windows skips; failures/errors remain native wake/supervisor readiness in this execution environment. The library tests pass in the same suite. Full suite NOT PASS. No actual R2 auth/upload or Pages deployment implemented. Next: verify matching frozen Windows helper plus extension and owner gallery save/reload/recovery, then design export/backup and approved cloud transfer.


### Hosted verification receipt for durable library

Source d33c9b22e0355ce343ee53822283c3fe5cc36c13: hosted development run [38995372032](https://github.com/thanks-cohn/Atlas/actions/runs/38995372032) PASS; Windows run [38995372023](https://github.com/thanks-cohn/Atlas/actions/runs/38995372023) PASS including actual Windows library tests, build, widgets and frozen native/HTTP smoke. Matching Windows helper package: [artifact 12086164731](https://github.com/thanks-cohn/Atlas/actions/runs/38995372023/artifacts/12086164731), 14-day retention. Install matching helper and extension 0.1.8 together, preserving existing state and extension ID. Actual owner image/Chrome rendering and cloud publishing remain NOT_RUN. Receipt: evidence/DURABLE_LIBRARY_2026-10-16.json.


### Gallery action placement — 2026-10-17

Explicit owner correction: utility buttons belong together at the top right; they must not interrupt the gallery composition between header and content. Moved the existing library-save action into a labelled header action group beside Publishing Check and Edit Gallery, shortened its label to Save to Atlas Library, and reused the existing button styling. The group wraps with consistent spacing on narrow layouts. Button remains hidden until page state determines it is needed. Storage and pairing behavior are unchanged. Verification: node scripts/test_pages.mjs PASS (API/DOM doubles); actual Chrome visual rendering NOT_RUN. Uploaded screenshot was unavailable at its supplied scratch path; placement was confirmed from current HTML/CSS.


### Gallery utility text and captions — 2026-10-17

Owner screenshot confirmed raw storage path and success message interrupted the gallery above its title. Keep operational information in the header: path now lives in a keyboard-accessible Storage details disclosure alongside actions; live feedback occupies a restrained right-aligned header line. Preserve errors and storage provenance rather than suppressing them. Improve image captions with 16px Georgia, comfortable line height, contrast and spacing; expanded-view captions use 17px. No external fonts/dependencies. Page behavior checks PASS (node scripts/test_pages.mjs; API/DOM doubles). Screenshot inspected; updated Chrome rendering NOT_RUN.
