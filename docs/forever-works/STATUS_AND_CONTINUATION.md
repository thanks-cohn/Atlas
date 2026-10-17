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


### 0.1.43 — Viewport-first card slots and bottom-right Fetch dock
Owner confirms the 0.1.42 blank region still occurs on downward scrolling: retained offscreen batches consume the card limit while visible items disappear. Owner further proposes keeping lightweight card locations independent from later image loading. The previous batch/spacer implementation is replaced rather than presented as verified by the earlier mathematical batch checks.

Fixed obligations: preserve bookmark/source identity, cover storage, queue scope, existing card cap, direct image preview and URL actions. Constrained: prioritize every viewport-intersecting card before any overscan, retain total scroll extent independently from mounted nodes, and reserve lightweight geometry before image decode. Fluid: masonry placement/window mechanism. Runtime now computes deterministic shortest-column x/y/width/height slots for all current items from known URL-card dimensions or cached image ratio plus a fixed two-line caption area. Only visible-first selected slots and nearest neighbors become mounted cards (up to the configured cap); batch containers are now display:contents grouping only. The board's explicit height owns total scroll extent, so estimated top/bottom spacers no longer move live content. Individual slots are absolute within the board. Columns can reduce at very small card limits to keep a viewport of compact cards within budget. Raster ratios remain metadata after node eviction; no retained bitmap requirement. Loading placeholders occupy the image slot until decode. Fetch completion still preserves unaffected DOM nodes; cover arrival can legitimately grow a formerly compact URL slot, with visible-card anchoring during the subsequent layout update. This does not promise every card's original y-position is immutable after edits or cover additions.

The fetch UI is a fixed bottom-right details panel: compact Fetch covers summary; mouse hover expands it upward, native click/keyboard toggles remain available, focus inside protects editing from pointer-leave dismissal, and Escape closes it. Mode/progress/cancel stay inside the panel instead of a full-width obstruction. No new permissions, dependencies or storage migrations.

Verification: pinboard regression now uses actual per-card coordinate math in the DOM double. A mixed 1,000-item fixture is scrolled down/up through seven positions at all five card caps; every model viewport-intersecting slot is mounted and total card count stays within cap. Pointer hover/touch branches, retained cover geometry and in-place save regressions PASS. Fetch/bookmark/gallery tests and packaging PASS. These are DOM/API-double proofs, not a claim of Chrome paint/frame-time, touch/screen-reader or real-device aesthetic validation. Chrome runtime NOT_RUN (browser unavailable). Next: inspect the owner's real mixed collection while rapidly reversing direction, fetching visible covers and resizing. Legacy `visibleBlocks` export remains for compatibility/history tests but is no longer used by the renderer.


### 0.1.44 — Compact widths independent of card budget
Owner screenshot shows the 0.1.43 capacity-aware column reduction stretching URL cards into two oversized columns. Owner wants the familiar compact Pinterest-like density. Fixed: card width follows available screen width (~210–260px desktop), with up to seven columns on wide screens and two on small screens. Card-budget choice no longer widens cards.

To preserve the owner's stronger requirement that visible cards stay mounted, every viewport-intersecting slot is selected even when a very low budget cannot fit the viewport. Remaining nearby slots fill only unused configured budget. Thus total mounted cards are bounded by max(configured budget, current viewport intersection count), rather than an absolute cap that can remove visible cards. Settings now explicitly say Nearby card budget and explain visible cards always remain. This replaces the earlier strict-cap obligation where it conflicts with compact cards plus complete viewport coverage. No whole-library DOM rendering; distant slots retain only geometry. Tests cover mixed 1,000 records in both scroll directions across all budget choices, asserting compact width, complete viewport membership and the new precise bound. Existing fetch/bookmark/gallery checks and packaging PASS; real Chrome visual/device validation NOT_RUN.


### 0.1.45 — Bookmark tags on pinboard cards
Owner requests four or five aesthetically presented bookmark tags per card in the Pinterest-inspired board. Both image-led and URL-only cards now display up to five muted rounded pills in a compact two-row, three-column strip. Longer labels ellipsize visually with full text in the native title tooltip. Additional tags produce a +N button opening the existing detail view with every tag, including on image-free cards (the missing hero is hidden). All labels use textContent; no user HTML is instantiated. Duplicate/blank labels are normalized for presentation only; no stored tag changes.

Tags come from the existing exact web-URL Atlas association index. Card geometry reserves 60px only when tags exist so absolute masonry selection remains aware of the footer. Image/caption width, image/source actions, Fetch/+ and nearby-window policy remain. Refresh now rereads optional paired companion catalog metadata, letting saved tag edits appear without reopening the pinboard. No automatic cross-tab polling or new tag editor introduced; when the companion is unavailable, this page cannot acquire new native Atlas tags. Existing successfully read metadata remains for this session on transient read failure.

Regression tests PASS for five-pill bound and +N count, full-detail tag list, duplicate normalization, untrusted label text, image-free tags, reserved caption geometry, and changed catalog tags after Refresh. Existing viewport/fetch/bookmark/gallery tests and packaging PASS with DOM/API doubles. Chrome styling/accessibility/runtime QA NOT_RUN. No data migration, permissions or helper changes.


### 0.1.46 — Shelf Add Tag / Note authoring
Owner identifies the missing creation workflow after 0.1.45 tag display. Bookmark preview now places an Add section immediately after Choose image / Remove chosen image and before Associated Items. Tag opens a labeled tag-name editor; Note opens a multiline editor, becoming Edit Note after one is saved. Current tags and the bookmark's saved note appear within this section. Separate related note resources remain in Associated Items; this slice edits the bookmark's own note rather than creating multiple child notes.

Uses existing authenticated `/v1/catalog` actions and optimistic revision checks. On save, require a paired companion and reread Chrome's exact bookmark ID+URL; then read the native catalog, reuse an exact bookmark web locator or register it with add_resource. Tag uses tag; existing note uses update_resource; a newly registered note can be saved in the same add_resource mutation. Existing note content is compared with the editor's starting value before overwrite. Revision conflicts, offline state and unknown outcomes leave the editor/input intact; no silent Chrome-only fallback or success assertion. Registration plus tag uses two existing native transactions, so an empty registered bookmark may remain if tagging fails; retry reuses it. No automatic destructive rollback or blind retry. Native companion database supplies persistence outside Chrome; no new executable or permission needed.

Tests PASS for Add placement, existing-resource tag save, note editing/prefill, offline retention, revision-error retention, and exact-URL native registration/tagging for previously unregistered bookmarks. Existing pinboard/fetch/gallery tests and packaging PASS with DOM/API doubles. Actual Chrome/Windows native end-to-end and aesthetic QA NOT_RUN. Pinboard Refresh rereads saved tags/notes through the existing optional catalog snapshot. Tags have an 80-character UI limit; note editor allows 100,000 characters. Tag removal, multiple child-note creation and live cross-tab synchronization are not added by this slice.


### 0.1.47 — Offline recovery controls and locked Windows native-image repair
Owner supplies Windows WinError 5 access-denied dialog for installed atlas-native.exe plus a diagnostic report from extension 0.1.45: HTTP transport failures followed by very fast native-call failure and NEEDS_INSTALL. Evidence establishes the helper/host is unavailable, not that Chrome's MV3 worker crashed (the worker produced the report). Installer source previously unlinked/replaced atlas-native.exe on every repair, including identical bytes and potentially the image hosting management/service processes. Running-image contention is consistent with the screenshot; actual Windows root-cause reproduction remains NOT_RUN.

Windows installer now creates atlas-native-<20 hex content digest>.exe and points the native manifest at that immutable version. Upgrade never unlinks the prior native image; a same-version repair skips every identical document instead of unlinking/recreating it. Legacy and versioned native names dispatch the same fixed Chrome-origin invocation, reject additional arbitrary arguments, retain exact-ID authorization, and use the same native config/state. Prior native images may remain as inert old files alongside retained old runtimes; no mass process termination or filesystem cleanup is introduced. Actual frozen smoke now resolves the executable from the native manifest. Existing ownership checks, explicit upgrade consent, attested quiesce, rollback and state preservation stay intact.

Activity & recovery exposes Reconnect companion and Open Debug Helper before trying to fetch receipts/grants, so unavailable history cannot hide the recovery actions. The latter uses the existing authenticated native manage action; updated Windows helpers explicitly open advanced desktop controls (the debug.exe interface), independently of loopback service health. It reports launch requested rather than claiming a window was observed. Failed native registration/image launch expands manual debug.exe instructions and the exact extension ID. Chrome cannot invoke an arbitrary Windows EXE if Native Messaging is absent: the updated downloaded debug.exe remains the honest fallback. Refresh activity reads history; Reconnect explicitly invokes native recovery. Native missing-host errors now distinguish repair of an existing installation from initial install. Activity no longer exits bookmarks-mode; native Chrome bookmarks remain browsable without a companion. Companion-backed gallery deletion still requires the service and now points to these recovery actions on failure; no false local-only deletion.

Verification: 20 worker contract tests; Activity offline/debug-failure/reconnect DOM tests; bookmark/pinboard/fetch/gallery checks PASS. Portable Windows installer decision tests verify identical locked native images are untouched and an upgrade chooses a new image path; 12 installer tests: 8 PASS, 4 real-Windows cases SKIPPED here. Native argument dispatch tests 3 PASS. Native bootstrap tests: 6 PASS, 1 ERROR in the previously known actual-process demand-wake path (Companion did not start); do not describe the whole native suite as passing. Windows kernel locks, frozen helper, Chrome launch and native GUI smoke NOT_RUN locally; changed native source triggers the existing Windows build/real-Windows test workflow on main. A git pull / extension reload does not replace the installed EXE: this repair requires the new Windows companion build to be downloaded and run once. No tokens, user paths or full uploaded diagnostics committed.


#### 0.1.47 Windows CI artifact — verified after publication
GitHub Actions run https://github.com/thanks-cohn/Atlas/actions/runs/39051938544 completed SUCCESS for commit 40acb27a5f02bf915193fd6ed4782a42fc9f57f8. The real Windows installation/filesystem suite, standalone build, native management-widget smoke and frozen native frames/HTTP smoke all passed. Download artifact `atlas-companion-windows-x86_64`: https://github.com/thanks-cohn/Atlas/actions/runs/39051938544/artifacts/12107972816. This provides the updated debug.exe and companion executable plus packaged extension. Actual user Chrome callbacks and Windows 10/11 sleep/hibernate/reboot remain NOT_RUN; this CI success does not claim the user's installed machine is repaired until they run the updated helper.


### 0.1.48 — Batch tag entry, existing-tag chooser and stay-open editor
Owner requests comma-separated tags, a dropdown of existing tags in the pictured shelf editor, and continued entry after saving with a small top-right close X. Add Tags now accepts a trimmed/deduplicated comma list (up to 100 nonempty tags per submission, 80 characters each, 8,000-character input). A labeled native select loads unique existing catalog tags in alphabetical order; selecting appends the tag to the pending input without saving unexpectedly. Successfully attached tags are shown as pills in the editor. Save clears the pending input, confirms success and retains the modal/focus for another batch; X, Cancel and native Escape close it. Notes retain their existing save-and-close behavior.

Uses existing native tag mutations sequentially with the latest expected revision after each result. Already attached exact tags are skipped; a partially failed batch leaves the input and identifies the confirmed count. No transactional-all-or-nothing claim or automatic mutation replay. Explicit resubmission rereads state and skips already persisted tags. Dropdown snapshots carry a revision guard against a late initial read overwriting newer saved results. Scope remains the exact bookmark URL; suggestions come from existing Atlas catalog tags, never invented bookmark labels.

Bookmark regression PASS for comma trimming/deduplication, choosing an existing tag alongside new ones, repeated saves without closing, attached-tag pills, partial failure retention and explicit safe resubmission, top-right X, offline/conflict retention and existing note behavior. Existing pinboard, queue, activity, broker and gallery checks plus packaging PASS (DOM/API doubles; actual Chrome visual/keyboard QA NOT_RUN). No companion executable update, storage migration or permission change.


### 0.1.49 — Remove shelf metadata success banner
Owner highlights BOOKMARK_METADATA_SAVED beneath the bookmarks navigation and requests its removal as debug information in the normal interface. Successful tag/note saves now clear that shelf status line instead of inserting the technical success code and refresh instruction. The open tag editor retains its plain-language save confirmation and attached pills; failures remain visible. No persistence or helper changes. Existing bookmark checks and packaging PASS; Chrome visual QA NOT_RUN.


### 0.1.50 — Entire bookmark status strip hidden
Owner clarifies that the whole region beneath bookmark breadcrumbs must be free of technical status, including BOOKMARKS_READY, not merely the metadata-save message. The status element is now hidden for all messages and does not create visible/live-region clutter. Unique consecutive bookmark status codes go to the existing bounded diagnostic JSON event journal under BOOKMARK_UI; raw message text, URLs, paths and contents are not exported. Dialog-specific actionable save errors remain in their relevant editors. Worker and bookmark checks plus packaging PASS; real Chrome visual QA NOT_RUN. No helper change.

Owner additionally highlights the empty-state paragraph beneath the focused bookmark. Removed that entire explanatory paragraph; Associated Items and Add Item remain available without helper-connection instructions in the empty list.

### 0.1.51 — 2010s pinboard: blank authoring and preview
Explicit owner direction: Create Blank precedes All Bookmarks in the collection chooser and shelf creation flow; pinboards use 2010s, never Story/Horizons. Gallery template choices remain gallery-only. New pinboard records identify template 2010s; old records remain compatible.

Blank boards use a dedicated, dependency-free `pinboard-blank.js` surface. A square grey image starter with centered plus, optional public image URL, Title, Text, comma-separated Tags and Add Card saves a real card and leaves a fresh starter beside it. Plain text uses textContent; tags are trimmed/deduplicated. Preview hides the composer without destroying its draft; Escape returns to editing. Public image URL validation and existing raster preview conversion are reused. Failed saves retain inputs. Navigator lock rereads the latest collection before adding, avoiding parallel-tab lost additions.

Storage: `atlas.pinboard.cards.v1`, keyed by saved pinboard ID, or a default standalone board. Chrome-profile storage, NOT companion SQLite, R2, hosted publication or a durable external-media export. Uploaded images are bounded raster previews, not preserved original files. Collection switching never copies/modifies Chrome bookmarks. Existing virtualized bookmark renderer and fetching remain separate. This first authored-board slice caps 100 cards; authored cards are lazy-image loaded but not virtualized, unlike the 1,000-bookmark tests. Deletion, reordering and existing-card editing are future work, not implemented claims. Publishing preview is local presentation only.

Proof: bookmark, pinboard, blank-board, cover queue and page tests PASS using DOM/API/storage doubles; packaging and diff check PASS. Actual Chrome visual, file chooser and keyboard QA NOT_RUN. No helper update, permissions or R2 changes. Next: Chrome QA for create/save/reload/preview on both narrow and wide viewports, then authored-card editing and portable export as separately scoped capabilities.

### 0.1.52 — Pinboard tag selection and scoped search
Owner requests a tags-only switch beside images-only, multi-card tag selection followed by Enter, ALL-tag intersection, and title/URL search restricted to that intersection. Owner clarifies highlighted selected tags toggle off with immediate results, and selected tags occupy the collapsed two-row palette before unselected ones. Expanded palette is six rows (three times collapsed height), scrollable for all remaining tags, with hover and keyboard-focus expansion. Apply Tags provides an explicit touch/keyboard alternative to Enter.

Implementation: real buttons on card tags and preview tags; pending selection does not narrow until Enter/Apply, applied-tag removal immediately broadens results. Active filter chips appear above cards and can be removed. `tagQuery` extracts comma-separated `tags:design,travel` clauses at either end or within ordinary title/URL text; multiple clauses union their required tags and all must match. Tag labels match exact saved spelling/case, consistent with existing metadata; whitespace-bearing tag names remain selectable through palette/cards rather than this unquoted token syntax. Query clauses and selected tags combine, never OR. Tags-only and images-only intersect; tags-only persists in existing board settings. Tag palette lists current collection tags; bookmark metadata still comes from the paired companion, not inference or title guessing.

Cover fetching now uses this same scoped tag/text set and includes tag filters in checkpoint identity. Image-only remains presentation-only for fetch-all, preserving prior behavior. Existing virtualized bookmark geometry/budget is unchanged. Blank-board authoring is unchanged; this filter surface is for bookmark collections. No R2 or hosted publishing changes.

Proof: pinboard tests PASS including ALL intersection, staging and immediate removal, tags before/after text, repeated clauses, scoped search, tags-only storage, and fetch scope; bookmark, blank-authoring, cover queue and page tests PASS; packaging and diff check PASS. Tests use DOM/API doubles; actual Chrome visual, hover/focus and Enter QA NOT_RUN. Next: check long tag collections, narrow screens and keyboard focus against real Chrome before claiming premium visual acceptance.

### 0.1.53 — Increase bookmark cover storage
Owner reports pinboard image storage full despite Windows reporting free disk space and a page reporting roughly 70 MB (the latter measurement's source is UNKNOWN; do not assert it is saved-cover storage). Confirmed source restriction was MAX_COVERS_LENGTH=4,000,000 JSON characters. Cover budget now 64 MiB of UTF-8 serialized map bytes, measured by coverStorageBytes; per-image preview bounds, URL validation, exact bookmark identity and viewport image mounting remain unchanged. Existing data is read in place, without deletion/migration.

Manifest adds unlimitedStorage because Chrome storage.local otherwise defaults to a 10 MB quota (Chrome official storage API reference, checked 2026-10-17). This allows local extension storage beyond that browser default; it does not promise infinite disk or native durability. Reload/update extension for manifest change; no OS restart or companion update needed. Storage failures still retain prior data. Existing cover map uses one JSON value and rewrites it per save; larger limits increase serialization/allocation cost even though image mounting remains bounded. A future per-cover IndexedDB/native store is the prerequisite for very large collections; do not claim arbitrarily large storage or 4 GB hardware proof.

Bookmark tests PASS including accepting a cover map above the old ceiling, enforcing the new bound, UTF-8 byte measurement and manifest permission. Pinboard and cover queue checks, packaging and diff check PASS. DOM/API doubles; actual Chrome quota-grant/reload and large-collection performance QA NOT_RUN.

### 0.1.54 — Configurable cover storage budget
Owner requests an editable setting with a healthy default rather than another fixed limit. Board settings now contains Saved image storage (MiB), whole-number input 8–512, Save, and cover-map usage/limit. Default remains 64 MiB; range is an implementation guardrail for the current whole-map JSON store, not a promise of hardware performance. It is global to bookmark covers (shelf and every pinboard), distinct from visible-card budget and authored blank-board storage. Invalid values are rejected in the editor and missing/corrupt persisted settings fall back to 64. Existing images are never evicted by lowering the limit; explicit deletion is allowed even while over budget.

All three write paths (shelf upload/removal, pinboard upload/URL, automated fetching) reread the same persisted budget inside the existing write lock. Changing the limit is also locked; queued subsequent writes use the latest saved limit. Fetch storage-full text points at Board settings. Usage is serialized cover-map UTF-8 bytes, not Chrome RAM or total disk use. Readout updates on opening the page, saving a budget, and this page's image additions/fetches; external-tab changes appear on reopen. Existing map storage, data identity, preview-size and image-mount limits are preserved.

Proof: bookmark tests cover defaults, invalid settings, custom-limit acceptance/rejection, and deletion above a lowered limit; pinboard tests cover setting Save, rejection and usage limit. Existing fetching checks and packaging PASS. DOM/API doubles; Chrome visual and cross-tab runtime QA NOT_RUN. No helper update. Whole-map serialization remains a scaling constraint; per-cover storage is the next architectural dependency for much larger budgets.

### 0.1.55 — All Bookmarks entry, new pinboards and bookmark starter
Owner clarifies sidebar Pinboard must open the complete bookmark view, not blank authoring. HTML explicitly selects All Bookmarks while preserving Create Blank first in the chooser. Top-right Create New Pinboard opens a titled creation dialog, saves a distinct 2010s blank-board record and navigates to its ID; saved boards appear in the collection dropdown for reopening. This uses existing profile-local pinboard registry with existing 100-board limit, not companion or hosted publishing.

Blank composer adds Existing Bookmark dropdown from safe HTTP(S) Chrome bookmarks. Selecting a bookmark prefills its title, current saved/direct cover, own/associated notes and exact metadata tags; fields remain editable before Add Card. Card persists a source URL with a separate Visit source link. This is a snapshot, not live synchronization and does not edit the Chrome bookmark. Companion metadata is present only when successfully loaded/paired; no tag fabrication. Manual image/URL and freeform-card paths remain. Tests cover bookmark selection, copied fields, saved link, new-board registry/navigation and all-bookmark default, plus prior blank-card and virtualized filtering behavior. Bookmark/cover-fetch checks and packaging PASS; actual Chrome visual QA NOT_RUN. Dropdown currently builds bookmark options eagerly; for very large libraries a searchable bounded picker is a future refinement.


### 0.1.56 — Brand A is Home
Owner highlights redundant grid directly beneath the A in the shelf. Converted brand mark to a keyboard-accessible button with existing home ID and Home — All locations accessible label; removed the separate home grid. Existing home navigation and bookmark leave handlers attach unchanged. Pinboard grid remains. Hover/focus and active-home ring preserve visible affordance at compact and full widths. Bookmark regression and packaging PASS; screenshot inspected, but actual Chrome click/keyboard/visual QA NOT_RUN. No storage, helper or permission change.

### 0.1.57 — Add highlighted bookmark to another folder; deduplicate All Bookmarks
Owner screenshot identifies + Bookmark as the action for copying a highlighted bookmark into an existing or new Chrome folder. New dialog offers writable native folder paths and optional new folder inside the chosen location. Original placement is preserved; exact URL already directly in destination is a no-op. Submit rereads source identity/URL and current destination writability; executable saved URLs cannot be copied through this control. Newly created folder is retained if subsequent bookmark creation fails, and dialog switches to it so retry does not create another new folder. Chrome folder creation plus bookmark creation is not an atomic transaction. With no bookmark selected, existing new-URL creation remains. Search clears stale selection so an invisible prior highlight is not copied. No extra permissions or companion requirement.

All Bookmarks pinboard now uses a Set during traversal to return at most one card per exact raw URL (linear pass, no network). Different query strings/fragments remain distinct; folder views retain their native placements, and Chrome data is never deleted. First matching placement wins, including title/URL search matching before dedup; original roots retain all Chrome IDs and folder memberships. Atlas native tags/notes already index by exact URL. Profile-local uploaded covers still key by Chrome ID, so the representative placement's cover is used; merging per-placement covers and live cross-view metadata are future refinements, not claimed here.

Proof: bookmark checks cover existing destination copy, unchanged original, duplicate prevention and new-folder copy; pinboard tests cover exact URL dedup, query/fragment distinction, folder membership and matching alternate titles. Existing cover fetch tests, packaging and diff check PASS. DOM/API doubles; actual Chrome folder writes/Sync and visual QA NOT_RUN. No helper or R2 change.

### 0.1.58 — Tag loading recovery, singular tag: and empty-palette cleanup
Owner screenshot shows tags:tag-1 applied, no cards and an empty Explore tags box with an apparently idle Apply button. Source inspection confirms refreshAssociations returned early when state.paired was false; that state only reflects a temporary session token, while the API read can connectNative for an enrolled install. Pinboard now always attempts the existing broker catalog read, allowing that recovery. This is a code-proven failure path, not proof that the user's exact Windows incident had no other cause. Enter refreshes catalog before applying selection; failed reads retain already loaded metadata, and tag filtering without available metadata explains the need to connect/Refresh rather than silently suggesting no tags exist.

Search now documents tag:design,travel; tags: remains an alias for compatibility. Tag matching is case-insensitive without rewriting saved names. Title/URL search and ALL-tag intersection remain. Empty palette is hidden; Show Matches appears only for pending unapplied chip selection, avoiding a permanently idle Apply control. The two-row/six-row populated palette remains per owner design. Tests prove catalog is requested with no state-token preflight, singular syntax/case matching, restored cards/palette with catalog, and unavailable-metadata fallback. Bookmark and cover-fetch tests, packaging and diff check PASS; DOM/API doubles, actual Chrome recovery/visual QA NOT_RUN. No helper/permission/storage migration.

### 0.1.59 — Image-hover tag editor and inspectable tag field
Owner requests a small bottom-right image tag icon, revealed on hover/movement, fading while cursor idles, opening a popup for existing tag assignment/removal. Pinboard bookmark image cards now have a separate sibling button (never nested inside preview button), matching image-bottom geometry above caption. Pointer enter/movement reveals for 1.6 seconds; leaving hides; keyboard focus keeps it visible and touch devices show it persistently. CSS tag glyph, no assets/dependency. Enter filtering no longer intercepts ordinary image-control buttons.

Dedicated `pinboard-tag-editor.js` reads the existing companion catalog, offers existing global tags not already attached, and explicit remove buttons for attached tags. Each mutation rereads Chrome bookmark ID/URL and catalog revision under existing lock. Add registers a missing exact-URL resource when necessary; removal applies to every resource for that same URL so a duplicate resource cannot silently retain the removed tag. No auto-retry of uncertain writes; errors remain visible with Retry reload. Popup stays open after confirmed saves and refreshes pinboard metadata/results; no whole-page navigation. Registration and tag mutation are separate transactions; partial state can exist and Retry reloads it. Actual tag persistence still requires companion.

Owner's intervening clarification: confront failures and inspect feature purpose; do not conceal functional controls as a substitute for diagnosis. Restored always-visible bookmark tag palette and Apply control (disabled with no pending additions), with explicit loading/unavailable/empty content. Blank authoring hides bookmark-only controls as a distinct mode, not failure concealment. This corrects 0.1.58 empty-palette hiding, retaining its token-preflight recovery fix. Future docs must distinguish observed source, simulated proof, actual runtime proof and proposals.

Proof: new tag-editor DOM/API tests PASS for existing-tag choice, expected-revision add/remove, dialog retention and visible failure/retry. Existing pinboard, bookmark and fetching checks plus packaging/diff check PASS. Actual Chrome hover timing, focus/touch, native tag persistence and visual QA NOT_RUN. No permission/helper changes. New overlay/editor is for bookmark image cards; blank authored cards remain separate.

### 0.1.60 — Continuous tag editing, image-free cards and in-place updates
Owner requests hover/select then Enter for existing tags without leaving picker position, tag access on image-free cards, no page flash after saves, and new-tag creation in the popup. Existing-tag select is now an expanded native six-row picker inside the dialog. Hovered option becomes selected; Enter applies, retaining picker value, scroll and focus. Arrow keys plus Enter remain standard. All known options stay in order after assignment, marked with a check instead of being removed/reflowed. Add Tag remains mouse/touch fallback. Session-known tag names remain available for reattachment after removal. Actual native option pointer-event behavior requires Chrome QA; tests simulate those events rather than proving OS-native list rendering.

Create new tags field accepts comma-separated names (trim/dedupe, max100, max80 chars/name); Enter or Create & Add persists them through existing tag mutations. Successful batches clear input; failures retain draft and confirmed earlier writes remain, with explicit reload/retry. No background retries or invented separate tag registry. Popup stays open.

Image-free URL cards now have a persistent small tag glyph aligned right of the Fetch area, above existing tag strips, distinct from image-add plus. Image-card idle fade remains. Save callback updates tag metadata, palette and affected caption/tag-strip in place; existing image DOM and neighboring cards are retained, avoiding cache/image loading flashes from resetting blocks. Current filters/search remain; viewport renderer reconciles only changes required by tag-filter membership/height. No navigation/reload.

Proof: tag-editor tests PASS for hover+Enter, selection/scroll retention, repeated add/remove, new comma tags, dedup, draft retention and visible failures. Pinboard tests verify image node and neighboring card identity remain after metadata save, plus tag control on URL-only cards. Existing bookmarks and fetching tests, packaging/diff check PASS. DOM/API doubles; actual Chrome option hover, pointer idle, visual/persistence/performance QA NOT_RUN. No helper/permissions changes.

### 0.1.61 — Deliberate tag-control alignment
Owner screenshot shows URL-only card tag glyph crowded near bottom/right edge, visually detached from other controls; requests deliberate premium placement and inspectable design rationale for future agents. Fixed aspects: tag action remains separately accessible on image and URL-only cards, plus remains image selection, Fetch remains independent. Fluid aspects: glyph and spacing. URL-only cards now reserve a 44px footer below the unchanged 64px URL/image-add row (108px base geometry instead of96). Fetch is vertically centered with a16px left inset; 28px tag button has17px right inset, aligning its center with the30px image-plus button inside16px row padding above. Footer top/bottom clearances are8px. Existing60px tag strip remains below; virtualized geometry updated accordingly so controls do not overlap subsequent cards.

Image overlay receives16px image-edge insets. Replaced filled polygon with repository-native outlined SVG tag glyph (`extension/icons/tag.svg`, monochrome CSS mask), keeping size restrained and controls' rose palette consistent. No added library or hiding logic. The intended quality is owner direction, not proof of a world-class aesthetic. Source screenshot inspected; actual rendered Chrome comparison NOT_RUN. Existing pinboard geometry/tag-editor regressions and packaging/diff check PASS; no behavior/persistence/permissions change.


### 0.1.62 — Tag editor label capitalization
Owner requests proper capitalization: Create New Tags and Add an Existing Tag. Updated those visible labels only; behavior unchanged. Existing tag-editor check and packaging PASS; actual Chrome visual QA NOT_RUN.


### 0.1.63 — Double-click / Enter tag toggle
Owner requests single-click highlight without mutation, double-click or Enter toggles attached/unattached state. Picker now chooses tag/untag from its current confirmed snapshot; shared revision-checked mutation path and busy guard remain. Existing Add Tag fallback still explicitly adds. Picker selection/scroll and session-known options remain after removal so the same row can immediately be reattached. Accessible instruction updated. Tag-editor tests PASS for no mutation on selection, double-click remove/add, Enter remove and retained scroll; packaging/diff check PASS. DOM/API doubles; real Chrome native-option double-click/keyboard QA NOT_RUN.


### 0.1.64 — Image preview top alignment and persistent title
Owner requests top-aligned preview image with breathing room, always-visible title, downscaling large images and no enlargement of small originals. Bookmark image popup now has a fixed title/close heading outside its single scrolling content region. Media has24px top/side padding (20px compact), top alignment, natural auto width/height capped by available width and60svh. This preserves whole-image aspect ratio and does not force thumbnail-sized images to fill the popup. Notes/tags/source remain below image; scroll is confined to content while heading remains visible. No changes to gallery Story readers. Existing pinboard/tag-editor tests and packaging/diff check PASS (DOM/API doubles); actual Chrome portrait/landscape/tiny-image and mobile visual QA NOT_RUN.


### 0.1.65 — Compact whole-content bookmark preview
Owner reports bottom controls still below initial view with modest content. Reduced image ceiling from60svh to46svh, also reserving300px from90svh popup budget for title/details/controls on shorter screens (80px image floor). Reduced media/copy spacing modestly while retaining breathing room, natural small-image sizing, persistent heading and one content scrollbar for unusually long notes/many tags. This targets typical compact content; arbitrary-length metadata cannot be guaranteed scrollbar-free. Existing pinboard check and packaging/diff check PASS; actual Chrome visual QA NOT_RUN.


### Optional JoyTag experiment after base-1.3 (extension remains 0.1.65)
Explicit owner direction: tag current working base1.3 first; experiment with a removable, replaceable model and tune load only after real evidence. Local annotated tag created at10f4532b0b34323a90d0a80f25ac1f8efd790a48; agent push failed because shell lacks Git credentials. Owner then supplied terminal proof of successful `git push origin base-1.3` from that exact commit. Do not move the tag.

Added standalone experiments/joytag with separate runner/GUI and JoyTag provider adapter. Base extension/companion import nothing from it; no new startup dependency, endpoint, permission or hidden background job. Default path remains base1.3 behavior. Optional Windows launcher requires installed64-bit Python3.12+/Tk/py; installs its own venv, downloads pinned official366,116,154-byte FP32 ONNX +5813 tag names, SHA256-verifies both, then offers one-file trial and copy suggestions. No EXE bundling or Windows launcher proof claimed. GUI runs a child process per image, one at a time per window, CPU1thread,120s timeout/close kill; duplicate manually opened windows are not globally serialized.30MiB compressed file/20MP decoded guard,448 input,30suggestions,.4threshold. No hard RAM budget, no automatic bulk, no image network upload, no scan. Model download is explicit; inference uses only local input/model. Output is atlas.tag-suggestions.v1 with provenance/scores/timings; manual review/copy into existing tag editor is the initial integration boundary. Recommendations/feed and direct in-popup inference are NOT_IMPLEMENTED.

Provider replacement: joytag_provider.py alone owns download identity/checksums/preprocessing/ONNX vocabulary; joytag.py owns neutral runner/GUI. A successor implements predict/download/cache_dir and returns tag/score suggestions; accepted tags remain normal Atlas metadata. No model-specific metadata migration. Experiments are proposals, not saved facts.

Actual Linux CPU inference on the owner's uploaded pinboard screenshot PASS: official ONNX input float32[batch,3,448,448], output logits[batch,5813], sigmoid applied; first run .679s load/1.618s inference/742.3MiB process peak; verified-adapter rerun .671s load/1.635s inference/684.9MiB process peak. Different process initialization can change peaks. Snapshot in experiments/joytag/SMOKE_RESULT.json. These are container observations, NOT4GB Windows proof. Tags include false positives (e.g. blood on this screenshot); no quality/production claim. Do not auto-accept predictions. Dependency install and model download executed in isolated scratch env/cache, not base project environment. Four optional adapter tests PASS (preprocessing shape/normalization, bounds, invalid options/missing model/checksum failure); existing pinboard/tag-editor regressions and diff check PASS. Tk/Windows UI, full dataset accuracy, FP16/INT8 variants, low-memory performance and integrated recommender NOT_RUN/NOT_IMPLEMENTED. Next gate: owner's one-photo GUI trial, capture actual laptop RAM/time and inspect errors before enabling any background module.


### Proposal — tag provenance, snapshots and attributed curation
Owner requests proposal only for explicit tagging jobs, model/user separation, immutable initial run snapshots, current human-curated state, multi-model layers, deltas and future training potential. Added PROPOSAL_TAG_PROVENANCE_RUNS_AND_CURATED_STATE.md and README entry. Includes run/model/recipe manifests, per-image identities/results, human decisions, rejection scopes, deterministic projections/checkpoints, SQLite working-store proposal with JSON/JSONL exports, browser-independent handoff gates, resource bounds, legacy_unknown migration rules and actual versus owner-reported evidence. No source, schema, stored data, extension version, helper or behavior changed. Documentation links and diff checked; runtime tests not applicable to this docs-only change. Implementation remains separately scoped.
