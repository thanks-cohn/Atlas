# ATLAS — Universal Resource & Relationship Explorer

ATLAS is a **browser-first, native-capable, local-first explorer** that unifies user-authorized local files, Cloudflare R2, bookmarks, saved webpages, archives and connected application resources. Users organize them with text, tags, user-defined catalogs and cluster pairings, independent of physical storage locations.

**Delivery direction:** Chrome Manifest V3 extension + authenticated loopback API + separately installed Python native companion bundled with **PyInstaller**, using Chrome Native Messaging for waking/reconnecting as appropriate. Windows/Linux applications and Android may implement the same contracts through platform-appropriate mechanisms.

**Important:** PyInstaller eliminates the user's need to install Python; it does **not** authorize a Chrome Web Store extension to silently install or execute a downloaded program. ATLAS should emulate Chute's convenient **one-time user-consented installation and subsequent wake/reconnect**, not claim otherwise. Chrome Web Store eligibility is a design requirement, not an approval guarantee.

Start with [docs/forever-works/README.md](docs/forever-works/README.md).

**Stage:** Functional Linux and Windows companion development with a Chrome MV3 explorer and durable portable resource graph. Native filesystem and recovery implementations have separate platform tests; actual Chrome callbacks, desktop sleep/hibernate/reboot, clean-machine compatibility, publisher signing and Store approval remain separate release gates. See the latest handoff for exact executed proof and artifacts.

References: [Chute](https://github.com/thanks-cohn/chute), [FileChute](https://github.com/thanks-cohn/filechute), [Redown](https://github.com/thanks-cohn/remote-download-2-cloudfare), [Forever Works](https://github.com/thanks-cohn/forever-works), [Any-Shape](https://github.com/thanks-cohn/any-shape).

## Engineering and verification

The architecture is specified as **Forever Works-style, agent-neutral inheritance**, not an instruction set for one coding agent. Read the [construction program](docs/forever-works/BUILD_PROGRAM.md), [verification contracts](docs/forever-works/CONTRACTS_AND_VERIFICATION.md), and [cold reconstitution protocol](docs/forever-works/RECONSTITUTION_PROTOCOL.md). The portable graph is in `src/atlas_core/`, the platform-specific companions in `src/atlas_companion/`, the MV3 client in `extension/` and verification fixtures under `tests/`. Run `python scripts/check_project.py`. See [development setup](docs/DEVELOPMENT.md) and [the versioned local API](docs/COMPANION_API.md); implemented code is not a claim of production readiness.

## Cold-agent onboarding

Begin with [AGENTS.md](AGENTS.md) (tool/provider-neutral instructions), the [current status ledger](docs/forever-works/STATUS_AND_CONTINUATION.md), and the [construction program](docs/forever-works/BUILD_PROGRAM.md). The first canonical [Forever Works 0.1 model](forever/manifest.json) records enduring requirements. Run `python scripts/check_project.py` for local linkage and Python runtime tests; independent pinned upstream model validation is documented in [development setup](docs/DEVELOPMENT.md). Browser and platform proofs are recorded separately. CI runs the same command on commits and pull requests.

## Premium explorer destination

ATLAS is intended as a **top-tier Chrome Web Store-compatible file explorer** with an explicitly installed native helper: rich right-click operations, copy/cut/paste, move/copy/send-to, multi-select, keyboard navigation, previews, local and R2 browsing, tags, catalogs and relationships. The enduring requirements are in [the premium explorer contract](docs/forever-works/PREMIUM_EXPLORER_PRODUCT_CONTRACT.md). An ambitious Codex implementation assignment is available at [codex/BUILD_PREMIUM_ATLAS_END_TO_END.md](codex/BUILD_PREMIUM_ATLAS_END_TO_END.md); it is not normative architecture.

## Joyful curation and publishable knowledge collections

[The Joy of Curation and the Permanence of Meaning](docs/forever-works/PROPOSAL_JOYFUL_CURATION_SEMANTIC_ATLAS_AND_PUBLISHABLE_COLLECTIONS.md) records the owner-directed future vision for visual catalog experiences, per-item and per-relationship notes and tags, galleries/media/file associations, privacy-aware agent-readable JSON, graph and chart exploration, and transformation of curated collections into public static websites. This is an architectural/product proposal, not a claim these features have been implemented.

## Shelf-first bookmarks, reusable groupings and portable sites

[The Shelf-First Bookmarks, Composable Groupings, and Portable Publishing proposal](docs/forever-works/PROPOSAL_SHELF_FIRST_BOOKMARKS_COMPOSITIONS_AND_PORTABLE_PUBLISHING.md) records owner direction for a native Chrome bookmarks explorer in the Atlas shelf; group membership as resource access (not automatic association or display); individually annotated bookmarks, images, notes and documents; user-directed composition of grouped resources into pinboards, structured pages and Liquid canvases; Portfolio-inspired seven-visible-image gallery navigation; local-first editing; complete static-site/project export; and optional Cloudflare or GitHub Pages deployment. This is a **future-facing proposal**, not proof that these workflows exist yet.

## Association-clustered spatial tags — proposal

[Association-Clustered Spatial Tag Field](docs/forever-works/PROPOSAL_ASSOCIATION_CLUSTERED_SPATIAL_TAG_FIELD.md) records the owner-directed two-dimensional tag field: varied pill sizes, aesthetically controlled spacing, stable collision-free placement, proximity based on repeated tag co-occurrence across resources, keyboard navigation and viewport movement in both axes, mouse selection, optional scrolling, and explicit multi-tag AND search. It includes safeguards, test scenarios and open algorithmic decisions. This is a **proposal**, not an implemented feature.

## Contextual image pages and dated notes — proposal

[Contextual Image Pages, Tag Rotunda, Bookmark Columns and Dated Notes](docs/forever-works/PROPOSAL_CONTEXTUAL_IMAGE_TAG_ROTUNDA_AND_DATED_NOTES.md) preserves the design for image-led extension pages, contextual tag-header carousel, qualifying bookmark columns, focused notes with Escape restoration, and optional user-authored dates with chronological sorting. Proposed, **not yet implemented**.

## Future portable environment proposal

[Portable Personal Environment and WebVM](docs/forever-works/PROPOSAL_PORTABLE_PERSONAL_ENVIRONMENT_AND_WEBVM.md) explores restoring one's browser-centered workspace, assets, workflows and compatible tools across Windows, Linux, Android and future hosts, without making WebVM a mandatory dependency. This is a non-normative proposal, not implemented runtime or sync functionality.

## Install the Linux companion

A standalone Linux x86_64 companion is now built with Python and the native management UI included. Extract the distribution and open `atlas-companion`; authorize the exact extension ID and choose locations in its native window. No repeated token pasting is needed after installed enrollment. See [installer instructions](packaging/README.md) and [latest handoff](codex/HANDOFF_LATEST.md). The local unsigned build is tested on glibc2.41; a separate Ubuntu22.04/glibc2.35 build also passed. [Download the Linux installer artifact](https://github.com/thanks-cohn/Atlas/actions/runs/38775149275/artifacts/11994080011) (14-day retention; manual build workflow can regenerate it). Windows now has an integrated native provider, private state, installer and recovery supervisor; see the Windows instructions and current verification receipt below.

## Run from source for development

1. Open `chrome://extensions`, enable Developer mode and **Load unpacked** from `extension/`. Copy its actual extension ID.
2. Run `./scripts/run_companion.sh grant /absolute/path/to/a/test-folder --write` to explicitly authorize a narrow disposable folder (omit `--write` for read-only).
3. Run `./scripts/run_companion.sh pair --extension-id YOUR_CHROME_EXTENSION_ID` and keep the printed token private.
4. Run `./scripts/run_companion.sh serve`, open ATLAS from its toolbar icon and paste the token into Connect.

The default native state is private to your OS user under `~/.local/share/atlas`; use `--state-dir /your/private/path` **before** each subcommand to choose another location. Setup never silently installs a native executable. This provider requires Linux and deliberately rejects symlink traversal and ungranted paths. An optional explicit Linux Native Messaging launcher can wake/pair the companion; [setup and limitations](docs/DEVELOPMENT.md) distinguish it from a standalone native distribution. Windows uses its own NT-handle provider and standalone installer; these Linux source commands are not Windows installation instructions.

Read [DEVELOPMENT.md](docs/DEVELOPMENT.md), [COMPANION_API.md](docs/COMPANION_API.md), [the privacy disclosure](docs/PRIVACY.md) and [the latest implementation handoff](codex/HANDOFF_LATEST.md) before using personal data. `python scripts/package_extension.py` produces an unsigned extension-only ZIP under ignored `dist/`; it does not install or publish anything.

## Cross-computer continuity decision

[The same personal environment across computers](docs/forever-works/DECISION_RECORD_CROSS_COMPUTER_ENVIRONMENT_CONTINUITY.md) records our long-term goal: restore a recognizable portable workspace, catalogs, preferences, relationships and compatible execution tools on different operating systems, while reauthorizing machine-specific access. This is a proposal, not yet a working sync/restore product.

## Companion cold-rebuild inheritance

The recovery architecture and exact Chute Windows v2.6.1 RC1 reference are documented in [Companion Cold Reconstruction](docs/forever-works/COMPANION_COLD_RECONSTRUCTION.md), supported by [20 lifecycle and security test cases](docs/forever-works/COMPANION_RECOVERY_VERIFICATION.md) and new canonical [Forever Works 0.1 records](forever/manifest.json). Optional per-user supervisors are implemented separately for Linux and Windows; they cannot execute during machine shutdown or ordinary suspend.


## Windows companion

[Download the verified Windows helper](https://github.com/thanks-cohn/Atlas/actions/runs/38779850667/artifacts/11995571257) (14-day Actions artifact retention), then see [installation and build instructions](packaging/WINDOWS.md). The unsigned x86_64 standalone build embeds Python and native location management. Install the exact Chrome extension identity once, explicitly authorize desired folders once, and connect from ATLAS once. Native demand wake restores the helper when ATLAS returns; optional per-user login recovery starts supervision immediately and registers it for later Windows sign-ins. Saved grants and operation receipts persist. Normal operations do not require token pasting or repeated location authorization. Revocation, changed extension identity and OS-denied access still require attention.

Windows supports real list/preview/hash, mkdir, bounded file copy, rename, file/directory move and recoverable trash/restore. Directory copy and cross-volume move are explicitly unsupported in this increment. Do not treat process-kill/suspension tests as physical sleep, hibernation or reboot proof; current results and next verification steps are in [the latest handoff](codex/HANDOFF_LATEST.md).


## Current card-workspace design

[Currently Working On — Card Workspace and Publishing](docs/forever-works/CURRENTLY_WORKING_ON_CARD_WORKSPACE.md) preserves the owner's card, shelf, tag-search, page composition and publishing decisions, reasoning, open questions and planned verification. This is a WIP specification, not shipped functionality. The pre-change source is pinned in [the baseline record](docs/releases/BASELINE_2026-10-16.md).
