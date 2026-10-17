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


### Companion diagnostics viewport — 2026-10-17

Owner screenshot/report: Chrome connection Uninstall action clipped below the visible area unless maximized. Root cause confirmed in fixed, non-scrolling packed UI. Added scrollable management viewport with both scrollbars and mouse wheel support, keeping content at its requested minimum size rather than clipping actions at small window sizes/high DPI. Text and tree controls retain their own wheel handling. Actual Tk smoke now checks uninstall bounds after scrolling at 660x500. Local dispatch unit tests PASS (2); local Tk smoke NOT_RUN because xvfb-run unavailable. Windows hosted native-widget/build verification pending. debug.exe already dispatches directly to --desktop --advanced; no command prompt should be needed. Owner-observed launch delay cause UNKNOWN; dispatch test is not double-click timing proof.

## 2026-10-17 — gallery trilogy and Collection Studio (0.1.9)

Owner authorized retiring the previous gallery presentation in favor of Atelier, Fieldnotes and Nocturne, with professional studio editing. Implemented optional galleryStyle atop existing gallery documents: absent means Atelier; page identity, bookmark links and originals preserved; no native API change. All three have distinct composition, with native save, preview, per-image title/caption and earlier/later/remove controls. Nocturne adds focusable keyboard navigation and thumbnail filmstrip. “Premium tier” interpreted as quality, not an invented billing rule. See GALLERY_STUDIO_V1.md for purpose/implementation split, migration, authority, evidence and independent hosted demo.

Focused PASS: gallery studio/store/viewer behavior (DOM doubles), bookmarks (DOM/API doubles), 20 worker contract tests and three real HTTP/SQLite library tests including style recovery across restart. Browser rendering/touch/screen-reader NOT_RUN. Package: dist/atlas-extension-0.1.9.zip. Existing 0.1.8 durable-library helper remains compatible. Cloud publishing and automatic installation are not implemented. Full local suite receipt follows below.

Full local `python scripts/check_project.py`: 141 tests, 3 failures, 3 errors, 32 skips; NOT PASS. Failures/errors concern native wake/supervisor readiness in this Linux execution environment, matching the prior documented limitation. Local model linkage: 22 records valid (not normative schema proof). Focused library/storage tests pass in the same suite. New-page Add Item dialog also offers all three gallery styles, with Atelier default. No claim to actual Chrome or frozen Windows verification for this release.


## 2026-10-17 — Nocturne / Solstice, owner-directed correction (0.1.10)

Owner rejected Atelier and Fieldnotes as bare/basic and requested a complete opposite to Nocturne. Removed both from creation/editor choices; preserved readable legacy data. Nocturne is default, Solstice adds white modern contact-sheet composition with aligned uncropped works, bold sans-serif titles and compact labels. Legacy named styles display Solstice until next explicit save; absent-style records display Nocturne. Content, IDs, originals and library authority unchanged. Updated existing hosted design Site to Solstice root + Nocturne; retired URL redirects. Gallery/store/editor and bookmark tests PASS (DOM/API doubles), syntax/package checks PASS. Actual browser visual review NOT_RUN. Full native suite was not repeated for this presentation-only change; prior documented native wake/supervisor limitations remain. See GALLERY_STUDIO_V1.md correction addendum. Existing durable-library helper remains compatible.

## 2026-10-17 — structured Nocturne viewing room (0.1.11)

Owner rejected flat row/font composition and portrait side bands, requested different dark header/body. Removed full-width letterbox background; intrinsic image frame remains uncropped. Added caption rail, compact intro, divided controls/collection label and framed thumbnails, responsive stacking. Near-black header and charcoal body distinguish chrome from content. No content/storage/schema/helper changes. Gallery and bookmark behavior checks PASS (DOM/API doubles), package PASS; updated actual Chrome visual review NOT_RUN. Before screenshot inspected. Hosted design study unchanged; scope is extension screenshot. See GALLERY_STUDIO_V1.md addendum for exact intent/mechanism.

## 2026-10-17 — Nocturne padding and neutral graphite palette (0.1.12)

Owner screenshot confirmed stage image touched top and controls/labels sat flush. Found padding:0 on collection plus inherited older green-black nocturne class on the gallery itself. Added 22–44px room inset, intro/caption spacing and coordinated neutral graphite header/body/room; image remains uncropped and height bounded. No data/native/helper change. Gallery behavior checks and package PASS; after Chrome visual review NOT_RUN. See GALLERY_STUDIO_V1.md. This supersedes 0.1.11 palette/spacing values.

## 2026-10-17 — Nocturne editorial rail composition (0.1.13)

Owner screenshot still felt basic: oversized heading and disconnected navigation left broad unused space. Replaced standalone full-width thumbnail footer with a unified title/caption/arrows/contact-strip rail alongside intrinsic uncropped image. Compact collection heading, subtle graphite light falloff, warm-paper edit action, hover/focus expand affordance; responsive stacking retained. Source is a composition change, not a claim of actual Chrome screenshot proof. Gallery and bookmark checks PASS (DOM/API doubles), package PASS. No native/data/helper change; previous full-native-suite limitations unchanged. Actual updated visual acceptance NOT_RUN. See GALLERY_STUDIO_V1.md addendum.

## 2026-10-17 — make twenty-image import practical (0.1.14)

Owner clarified 20-image layout test is goal, not a 200MB preference. Shared gallery preview budget now allocated over current+incoming local works, with adaptive re-encoding of oversized existing previews and finer encoder fallback steps. Originals/identity/annotations unchanged; batch failure leaves prior draft intact. 20-encoder and 20-file import-to-24/save tests PASS (browser primitives/DOM doubles), existing gallery tests PASS, package PASS. Current 24-image and 10MiB/input limits remain; no helper change. Actual owner batch/Chrome NOT_RUN. See GALLERY_STUDIO_V1.md for quality tradeoff and future original-resolution loading gap.

## 2026-10-17 — include showcase content in main (0.1.15)

Corrected Site-only delivery mismatch: extension now includes same 24-image URL/title/caption sample collection, available in Edit Gallery → Try 24 sample images. Draft-only load/preview, confirmation before replacing nonempty draft, Cancel preserves saved page; explicit Save persists sample content. Both current gallery styles supported. Samples do not auto-overwrite real pages or import native originals. Gallery/bookmark checks PASS (DOM/API doubles), package PASS; actual Chrome visuals NOT_RUN. Existing helper compatible. See GALLERY_STUDIO_V1.md.

## 2026-10-17 — expandable sample articles / unboxed Nocturne (0.1.16)

Owner asked for five-paragraph texts but clarified full articles must appear only after expanding their slot; initial deck is first sentence. Wrote original 5-paragraph essays for all24 URL samples. Added optional bounded image.article, per-image editor textarea, textContent paragraph renderer with native details/summary, first-sentence deck, reset on navigation. Native HTTP/restart test proves optional body preserved by existing helper. Returned Nocturne to unboxed image, horizontal thumbnails underneath, title/reading slot below; removed enclosing card and side-rail composition. Existing data and samples not overwritten automatically. Gallery and bookmark checks PASS (DOM/API doubles), native library3tests PASS, package PASS. Actual Chrome after-visual review NOT_RUN. See GALLERY_STUDIO_V1.md.

## 2026-10-17 — full article in image viewer, not main-page disclosure (0.1.17)

Owner clarified with expanded-view screenshot. Main page now first-sentence preview only, no Read full article/+ control. Image click shows complete article in focusable independent scrolling reading region under smaller fixed-in-view image; previous/next resets reading scroll and changes both. Dark/light main scrollbar and viewer/thumbnail scrollbars slim/theme-matched. No data/helper change. Gallery and bookmark checks PASS (DOM/API doubles); package PASS. Actual Chrome visual/scroll behavior NOT_RUN. Hosted design study unchanged this revision. See GALLERY_STUDIO_V1.md correction.

## 2026-10-17 — single-scroll editorial reader (0.1.18)

Corrected owner screenshot confirms inner article scrollbar plus outer background scroll. Replace fixed-image/nested reading pane with one full article dialog scroller; root/body explicitly locked while open and gallery scroll restored on close. ArrowUp/Down/Page/Home/End target dialog, Left/Right switches stories and resets scroll. Added collection/title/deck/reading-time/image/body/footer hierarchy and locally bundled OFL Newsreader font with full license. Main page remains preview-only. Gallery/bookmark contract checks PASS (DOM/API doubles), package PASS. Actual Chrome wheel/focus/font/aesthetic verification NOT_RUN. No storage/helper change; hosted study unchanged. See GALLERY_STUDIO_V1.md.


### 0.1.19 — Gallery / Story template and deletion
Owner direction: keep Gallery as the object type; name its image-to-article template Story. Nocturne and Solstice remain visual styles. The existing wire representation kind=page/template=gallery is retained for companion compatibility; these UI terms do not promise a new general page composer.

Delete beside each gallery under Associated Items records a versioned deletion marker. Native-backed galleries require a successful companion save before the browser copy is marked deleted. Imported originals and Chrome bookmarks remain. The deletion marker is stored through the existing save-page contract (no helper upgrade required); linked-page lists and direct readers hide it, and stale editors cannot save over a locally deleted page. Refresh reconciles newer disk revisions, including deletions. This is logical deletion, not physical erasure or a trash/restore interface; retained markers can be recovered manually. Old extension versions do not recognize markers. Offline devices or already-open readers can display stale state until refresh.

Sample loading preserves the draft gallery title and introduction; it replaces image/story entries only, and still requires Save. No automatic guesses are made about names already overwritten.

Verification: focused page/bookmark DOM and API-double tests, project checker, extension package. Actual Chrome visual/runtime verification NOT_RUN.

0.1.19 evidence: page and bookmark scripts PASS; four real authenticated HTTP/SQLite library tests PASS including marker persistence across restart and retained image assets. Project checker: 22 linked records valid; broader 141-test run has 3 failures, 3 errors, 32 skips in existing native startup/supervisor areas. Thus full suite is not green. Extension ZIP packages successfully; Chrome/Windows UI verification NOT_RUN.


### 0.1.20 — Ready-made gallery showcase
Owner rationale: visitors may never create a gallery; provide immediate access to a complete example before asking them to compose anything. A Gallery showcase entry in the existing shelf sidebar opens the default page route with 24 hosted sample images, titles, captions and full articles, using Story / Nocturne. No bookmark creation, upload or companion pairing is required to browse. The first visit seeds a separate browser-local page under a reserved ID; subsequent visits preserve edits and do not overwrite existing galleries or names. Editing and durable saving use the existing editor/companion behavior. This entry opens a new extension tab; it does not replace the shelf's initial file-explorer view. Sample image loading needs internet access.

Cloudflare authorization, R2 and deployment are future context only and unchanged by this addition. Evidence: page route initialization and repeat-visit preservation tests plus existing bookmark tests and extension packaging PASS (DOM/API doubles); actual Chrome UI NOT_RUN. Prior broader native startup/supervisor failures remain unresolved as recorded above.


### 0.1.21 — Current story heading above the focused image
Owner correction: each image should show the same title as its associated article, rather than repeating a generic collection title. Nocturne's primary heading and browser tab now follow the focused image.title (the same field used by the article reader) on initial load, thumbnail selection and arrow navigation. The smaller collection label retains page.title. Missing image titles fall back to the collection title. Solstice retains its collection heading and individual image titles. Saved titles/content are not rewritten. Thumbnail accessible names use story titles too. Focused page and bookmark tests and package PASS; actual Chrome visual verification NOT_RUN.


### 0.1.22 — Uncluttered Nocturne filmstrip
Owner correction from screenshot: remove the repeated story title, count and sentence below the thumbnail strip; the focused story title already appears above the main image. The stage now contains the image alone. Hide the filmstrip's horizontal scrollbar while retaining horizontal overflow, thumbnail clicks and previous/next controls plus left/right keyboard navigation. This applies to the draft preview too. Full articles remain accessible by clicking the main image. Article reader scrolling and the main document's vertical scrolling are preserved. Page/bookmark checks and packaging PASS; actual browser visual verification NOT_RUN.


### 0.1.23 — Gallery masthead and story terminology
Owner requests a larger, more deliberate ATLAS / GALLERY identity and Stories rather than images in the gallery count. Masthead now separates prominent ATLAS lettering from the smaller tracked GALLERY designation, with responsive sizing. Legacy saved collection names exactly equal to Title (case insensitive) receive a display fallback: the sample collection title when all images match bundled sample URLs, otherwise Collected Stories. Real custom names and saved records remain untouched; this is presentation, not an inferred rename. Nocturne still shows the focused article title above its image, while Solstice retains a collection heading. Page/bookmark tests and packaging PASS; actual Chrome rendering NOT_RUN.


### 0.1.24 — Presentation preview
Owner requests removal of the visible Story template label and a Preview action exited with Escape. Header now omits that label. Preview hides authoring/storage actions and status while preserving the brand, gallery, navigation and article interactions. Escape restores authoring controls and focus to Preview; an open article reader or publication dialog handles its own Escape first. This is presentation state only, not fullscreen browser mode, deployment, or saving; Chrome's own side panel is outside this page's control. Editor draft preview remains a separate existing function. Focused page/bookmark tests and extension package PASS; actual Chrome focus/Escape/visual verification NOT_RUN.


### 0.1.25 — New Story galleries start complete
Owner clarification: a separate showcase is insufficient. Creating a Gallery with the Story template must immediately produce the 24-image collection, with titles, captions and five-paragraph articles; no extra editor/sample-loading step. The existing Add Item creation path now seeds those records atomically with the new gallery and bookmark association, retaining the entered collection title and selected visual style. Creation tells users these are replaceable sample stories. Existing galleries are not migrated or overwritten. Browser-local creation remains usable without the companion; durable saving still follows existing explicit Save behavior. Focused page/bookmark tests and extension packaging PASS; Chrome UI NOT_RUN. Cloudflare/R2 unchanged.


### 0.1.26 — Structured collection description
Owner requests better padding and hierarchy for the description beside the Nocturne heading. Blank-line paragraphs now render as separate text-only paragraph elements in the gallery and draft preview. Nocturne uses a wider editorial aside, subtle left divider, inset padding, more legible opening paragraph and smaller subdued subsequent paragraphs separated by spacing and a fine rule. Mobile stacks the aside beneath the heading. Text content and saved records are unchanged; subsequent paragraphs are styled as supporting text, not semantically reclassified as credits. Page/bookmark tests and packaging PASS; browser visual verification NOT_RUN.


### 0.1.27 — Solstice editorial hierarchy and wider article canvas
Owner feedback: light gallery reads as pale panels with dropped-in text; number/title/caption lack differentiation. Owner clarified that the overall structure is fine: refine the individual card layout. Solstice preserves the existing grid and image framing while giving each card an outer fine border, consistent inset padding, a separated caption area, numbered gutter, bundled Newsreader serif story headings and softer sans-serif captions. Responsive grid and article-opening behavior remain. Reader width increases to a 1320px outer canvas / 980px aligned heading, body and footer, with a larger uncropped hero image; mobile remains a single column. Purpose is publication-like hierarchy across screen sizes, not blanket enlargement of all text. No data, helper or Cloudflare changes. Page/bookmark behavior tests and packaging PASS; actual browser visual QA NOT_RUN, so aesthetic success remains for owner review.


### 0.1.28 — Solstice image-to-story opening motion
Owner requests image growth followed by a changing background. Solstice image clicks now measure the source photograph and animate the reader hero from that rectangle into its expanded position using the native Web Animations API (520ms eased transform). The reader background transitions from warm paper to dark, with staggered heading/article fades. Reduced-motion preferences bypass this transition. Navigation and closing cancel active opening animations; data, scrolling and Escape behavior remain unchanged. No framework/dependency added. Existing page/bookmark behavior tests and packaging PASS; actual Chrome motion/visual verification NOT_RUN.

0.1.28 continuation: base-1.1 verified at commit 4bc2a144be9d613b5a878c5190369da81e7f1e0e before publishing. Owner also requests a larger STORIES masthead in the expanded reader: bundled Newsreader serif, smaller ATLAS and muted separator, responsive wrapping for controls. Motion preserves image aspect ratio and ignores stale image-load callbacks after navigation/close. Focused animation-branch tests cover interpolation, cancellation and reduced motion using DOM/API doubles; actual Chrome motion remains NOT_RUN.


### 0.1.29 — Restrained reader masthead
Owner rejects the serif STORIES treatment as Halloween-like. The shared reader masthead now uses a clean system sans-serif at semibold weight, moderate uppercase tracking and slightly reduced scale. ATLAS remains the smaller companion label. Article typography and motion unchanged. Existing page/bookmark tests and packaging PASS; owner visual review still required.


### 0.1.30 — Nocturne darkroom reveal
Owner requests distinct but equally considered image-opening motion for Nocturne. Its reader now fades out of the dark gallery, with a subtle 1.025-to-1 hero settle and brief 2px-to-zero focus treatment, followed by staggered heading and article arrival. Solstice retains its expanding source-image transition. Both use the native animation API, reduced-motion bypass, navigation/close cancellation and stale-load guards. No new dependencies or storage changes. Focused DOM/API motion branch tests (both styles, cancellation and reduced motion) and existing bookmark checks plus packaging PASS. Actual Chrome visual/motion verification NOT_RUN; premium aesthetic quality remains for owner review.


### 0.1.31 — Distinct light Solstice reader
Owner asks Solstice expanded articles to contrast with Nocturne using grey and white. Solstice now has a soft grey reader canvas, white article surface, pale translucent masthead, charcoal typography and subdued grey-green metadata/dividers. Buttons and scrollbar receive matching light styling; the opening animation resolves to the same grey canvas rather than dark. Nocturne's dark styling and newly introduced darkroom motion remain. Shared reader dimensions, single-scroll behavior and Escape retained. Both motion paths and existing page/bookmark checks plus packaging PASS with DOM/API doubles; actual Chrome visual/motion verification NOT_RUN.


### 0.1.32 — Nocturne reliability over effects
Owner reports the Nocturne transition as choppy and explicitly prioritizes restrained, dependable presentation on constrained hardware. Source inspection found the dialog was visible before image load, then the load callback started opacity-zero/backwards-fill animations, potentially hiding and re-revealing already visible content. Large-image blur/scale plus four staggered effects and toolbar backdrop filtering added avoidable rendering work; hardware frame-time profiling has NOT_RUN.

Replace Nocturne opening with one immediate 180ms opacity .92-to-1 fade on reading content. No blur, geometry animation, background animation, staggered delays or image-load-triggered reveal. Pass the already displayed source image into opening and reserve its intrinsic dimensions on the reader hero to prevent initial load-driven layout shifts. Nocturne toolbar uses an opaque background without backdrop blur. Reduced motion skips animation and close/navigation cancels it. Solstice motion remains unchanged apart from image dimension reservation. Focused tests cover cold-image immediate opening, stale callbacks, dimension reservation, cancellation and reduced motion; page/bookmark checks and package PASS. Actual Chrome frame-time / constrained-device / visual testing NOT_RUN.


### 0.1.33 — Sequential image then text
Owner accepts distinct image-first rhythms: Solstice expands/settles, then text fades; Nocturne image emerges from darkness, then text fades. Opening now has explicit waiting/image/text phases set before the dialog is displayed. Nocturne uses only a 280ms image opacity fade; Solstice uses 440ms geometry/background motion. Text starts after the image animation's finished promise, fading heading and body together for 220ms with no translation, blur or stagger. Image errors/cancellation clear visibility gates; generation guards discard stale loads/completions. Reduced-motion bypass remains. Tests verify actual promise ordering, cold image waiting, cancellation, stale callbacks, error release and reduced motion using DOM/API doubles. Page/bookmark checks and packaging PASS; real Chrome motion / constrained hardware frame-time validation NOT_RUN.


### 0.1.34 — Unhurried Nocturne pacing
Owner asks for slower, more elegant timing. Nocturne image opacity reveal increases from 280ms to 520ms with a gentle ease-in/out curve; the subsequent text fade increases from 220ms to 380ms. No additional effects or idle pause. Solstice timing remains 440ms image / 220ms text. Sequencing, cancellation and reduced-motion behavior retained. Focused page/bookmark tests and package PASS; actual Chrome aesthetic/performance verification NOT_RUN.


### 0.1.35 — Whole image centered before the article
Owner requires the clicked image to appear whole and centered before surrounding article content. Both styles now reveal the uncropped hero at the viewport center below the toolbar, then settle it into the article position over 240ms, then reveal heading/body. Nocturne keeps its 520ms image opacity reveal (no zoom/blur) and 380ms text fade; Solstice keeps source-image expansion and 220ms text fade. Transform-only settling preserves the image rather than changing layout. Existing contain sizing and max viewport height remain; reduced motion opens directly in the finished layout. Promise-order tests verify centering/settling precede text, cancellation and errors release visibility, and reduced motion bypasses. Page/bookmark tests and package PASS; real Chrome motion/visual and constrained-device verification NOT_RUN.


### 0.1.36 — Escape / Back return motion
Owner requests closing transitions, specifically Solstice shrinking the image back into its card and restoring the grid. Escape's native cancel event and Back now share a guarded close path. With visible source/hero geometry, Solstice keeps a temporary uncropped image above the dialog, fades reader text/toolbar for 140ms, then shrinks the image to its card while the reader canvas clears over 420ms. The gallery underneath is never rerendered and its original scroll is restored. If the hero/card is offscreen or missing (e.g. deep article scroll), a short fade avoids flying from invalid geometry. Nocturne first fades heading/body over 160ms, then dissolves the reader/image into the unchanged dark gallery over 300ms, with no zoom or blur. Reduced motion and interrupted opening close immediately; repeated Escape cannot queue exits and story navigation is gated while closing. Temporary images/animations are cleaned up. Focused page tests cover Escape, repeated close, shrink geometry, cleanup and reduced motion; bookmark checks and packaging PASS. Chrome visual/focus/constrained-hardware runtime verification NOT_RUN.


### 0.1.37 — Native-bookmark Pinboard vertical slice
Owner requests a Pinboard creation choice and immediate real-bookmark example, using Pinterest-like masonry and lazy incremental browsing suitable for a modest machine. Added shelf Pinboard entry and Add Item → Pinboard (title + folder selection), with linked local board definitions/deletion. Images reuse uploaded covers, direct image bookmarks or known exact associated image references; no-image cards show URL and +. Image opens internal detail/notes/tags, title/URL visits source. Initial 24 cards / batches 24 / maximum 96 mounted before Next set replaces them. This bounds DOM work rather than loading all 1,000 cards. No dependencies added.

See PINBOARD_V1.md for data, purpose, limitations and reconstruction. New pinboard tests exercise 1,000-bookmark fixture and DOM bound, plus creation/deletion in bookmark tests. Pinboard/bookmark/gallery checks and package PASS with API/DOM doubles. Actual Chrome aesthetics, focus and 4 GB memory/frame-time testing NOT_RUN. Pinboard settings/covers remain browser-local; companion backup, publishing, React wrapper and unrestricted infinite virtualization NOT_IMPLEMENTED. Existing native startup/supervisor suite failures remain unresolved; native code is unchanged.


### 0.1.38 — Pinboard continuous window, image filter and image URL choice
Owner requests image-only filtering, distant-card eviction with a configurable retained count, and Atlas loading cards on fast scrolling. Implemented Only show bookmarks with images, persistent 24–144 nearby-card limit (default 72), 24-card masonry block window with measured/estimated spacers, frame-coalesced scroll work and ResizeObserver measurement. Evicted card nodes are rebuilt on return. Added static Atlas A/loading placeholders, avoiding shimmer loops.

Owner also requests + to support URL versus local image sources: implemented a source chooser now, sharing safe public URL covers with the shelf. Expanded cover validator retains local raster previews and rejects unsafe/credential-bearing/tokenized URL references. Pinboard remains Chrome-local; no R2/publishing/native changes. See PINBOARD_V1.md addendum for algorithm and limits. Pinboard/bookmark/gallery tests and packaging PASS, including 1,000 records, window bounds, eviction/rebuild, settings/filter persistence, placeholders and URL-source validation. Real-browser masonry scroll anchoring and actual constrained-device memory/performance NOT_RUN. DOM eviction is not a guarantee that Chrome immediately discards decoded-image caches.


### 0.1.39 — Compact white/red pinboard identity
Owner requests more professional spacing, structure and a red/white visual direction. Refined the Atlas mark, heading scale, input spacing, image-led card captions and URL/+ tiles. Settings content now opens as an anchored popover rather than expanding the toolbar and pushing cards below the fold. Filter and settings remain aligned in one compact responsive row; technical window counts are removed from the primary status sentence (the cap remains explicit in settings). Rendering/window logic and stored data unchanged. Existing pinboard/bookmark/gallery checks and extension packaging PASS; actual Chrome aesthetics and responsive visual QA NOT_RUN.


### 0.1.40 — Balanced bookmark cover chooser
Owner identifies low plus glyphs and an unbalanced image-source dialog. The URL-card plus is now drawn with two centered CSS strokes, retaining its button text and accessible name. Replaced the floating Cancel and nested detail padding with a shared-inset header, named close button, full-width upload/URL actions and a divided pair of source choices. Narrow screens retain consistent insets. Existing IDs and source/save behavior are unchanged; no storage or permission changes. Pinboard/bookmark/gallery checks and packaging PASS with DOM/API doubles; actual Chrome visual/focus verification NOT_RUN.


### 0.1.41 — Opt-in bookmark cover fetching
Owner requests automatic covers instead of manual work per bookmark, scoped to the current pinboard collection/search; visible discovery by default, all-in-collection throttled processing, skip existing, save successes, progress and cancel/resume. Owner explicitly names the separate missing-cover card button **Fetch**; + retains upload/URL selection.

`fetch-covers.js` retrieves Open Graph/Twitter/image_src metadata without instantiating remote HTML, running scripts, opening tabs or sending cookies/referrers. Downloads use one worker, a 500ms inter-job gap, 12-second timeout, 2 MiB HTML / 5 MiB image byte bounds and existing raster conversion (40k-character preview budget). Saves share existing bookmark cover storage and lock, recheck exact current bookmark ID+URL and never overwrite a concurrent cover. Successes persist locally; the unchanged four-million-character total cover quota can pause a large job. This is a preview cache, not original-image archival.

Fetch requires Chrome optional HTTP(S) website permission because image/CDN origins are discovered at runtime; CSP connect-src now permits HTTP(S), but host permission still controls extension cross-origin access. Declining permission leaves existing covers unchanged. No content scripts or general URL-fetch message API added. Only supplied current collection/search nodes are eligible; all mode does not render those nodes or crawl other folders. The existing All bookmarks collection may itself contain the whole library if explicitly selected; there is no silent expansion from a selected folder to the library. The image-only presentation filter does not narrow all-mode fetching, so hidden missing-cover items in that same collection can gain images.

Visible mode prunes offscreen pending jobs and discovers newly visible mounted cards on scroll; an active job can finish after scrolling. Cancel aborts active network work and drops pending jobs. Resume rebuilds remaining work from current collection plus persisted attempted-ID+URL outcomes; successes and unavailable attempts are skipped. Per-card Fetch explicitly retries that item. Scope changes stop the run; no automatic restart on reload. One last scope checkpoint per pinboard/default entry, Chrome-local. Queue belongs to the open page, not a background worker; tab closing stops work. Same-board concurrent tabs may overwrite progress checkpoints, but shared cover writes remain serialized.

Unsupported: redirects (requests use redirect:error rather than following untrusted destinations), login-only/dynamic preview pages, SVG/AVIF-only images. Unavailable items remain manual + cards. Literal IP, localhost/local and credential/tokenized URLs are rejected; this is not DNS-level isolation against public hostnames resolving privately. No R2, publishing, native helper changes or unlimited storage. No guarantee every website permits retrieval.

Verification: `node scripts/test_fetch_covers.mjs` PASS for metadata priority, unsafe URL rejection, byte bounds, cookie-free options, permission denial, collection membership, serial jobs, visible-only discovery, durable successful progress and cancel/retry with API doubles. Existing pinboard/bookmark/gallery tests and extension packaging PASS. Actual Chrome permission prompt/network behavior, responsive styling and 4 GB runtime QA NOT_RUN. Chrome reference: https://developer.chrome.com/docs/extensions/develop/concepts/network-requests and https://developer.chrome.com/docs/extensions/reference/api/permissions.


### 0.1.42 — Fetch in place, sticky controls and viewport coverage
Owner reports cover saves jumping back up the board, requests sticky fetch controls, and supplies a screenshot of a mostly blank virtual scrolling region. Source inspection confirms every successful fetch called `render()`, clearing all mounted blocks and height measurements. Fetch completion now replaces only the corresponding mounted card; offscreen completions only update stored cover data. A visible neighboring card anchors geometry changes immediately and after image decode, without pulling back a user who scrolled meanwhile. The virtual window/spacers and unrelated card nodes remain intact.

Fetch controls are a single sticky white/red panel near the viewport top, with mode, progress and Cancel available while scrolling. No duplicate stateful controls. Mobile hides only the explanatory paragraph to keep controls compact.

Virtual batch selection now considers viewport height before keeping a batch above the reader. Mounted-window exchanges schedule a follow-up measurement rather than depending only on ResizeObserver delivery. Image wrappers reserve aspect ratio before lazy decoding; successfully decoded ratios are retained as lightweight URL-to-ratio metadata across eviction/rebuild, avoiding repeated collapsed-to-full image layout changes. Failed image references fall back to URL cards for this session instead of repeatedly rebuilding failed image placeholders. Card caps remain unchanged; very small caps and exceptionally tall viewports remain a coverage limitation. Screenshot evidence does not independently isolate every cause of blank space, so Chrome runtime reproduction and scroll-anchor validation remain NOT_RUN.

Focused pinboard tests PASS for unchanged neighboring DOM/spacers/scroll on cover completion, offscreen no-op, geometry retention through eviction and viewport-aware capped selection. Fetch queue/bookmark/gallery checks and packaging PASS. Actual Chrome scrolling/sticky/responsive testing could not run: browser executable unavailable and attempted Playwright browser download returned an invalid archive. No new runtime dependency or permission/storage-format changes. Next: verify slow and fast bidirectional scrolling with mixed covers and URL cards on real Chrome, especially at the 24-card setting.
