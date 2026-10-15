# ATLAS — Universal Resource & Relationship Explorer

ATLAS is a **browser-first, native-capable, local-first explorer** that unifies user-authorized local files, Cloudflare R2, bookmarks, saved webpages, archives and connected application resources. Users organize them with text, tags, user-defined catalogs and cluster pairings, independent of physical storage locations.

**Delivery direction:** Chrome Manifest V3 extension + authenticated loopback API + separately installed Python native companion bundled with **PyInstaller**, using Chrome Native Messaging for waking/reconnecting as appropriate. Windows/Linux applications and Android may implement the same contracts through platform-appropriate mechanisms.

**Important:** PyInstaller eliminates the user's need to install Python; it does **not** authorize a Chrome Web Store extension to silently install or execute a downloaded program. ATLAS should emulate Chute's convenient **one-time user-consented installation and subsequent wake/reconnect**, not claim otherwise. Chrome Web Store eligibility is a design requirement, not an approval guarantee.

Start with [docs/forever-works/README.md](docs/forever-works/README.md).

**Stage:** Linux development vertical slice: real scoped filesystem companion, Chrome MV3 explorer and durable portable resource graph. Python-process native wake is verified on Linux; actual Chrome extension/native callback runtime, production security, Windows and Chrome Web Store approval remain separate release gates. See the latest handoff for executed proof and current limitations.

References: [Chute](https://github.com/thanks-cohn/chute), [FileChute](https://github.com/thanks-cohn/filechute), [Redown](https://github.com/thanks-cohn/remote-download-2-cloudfare), [Forever Works](https://github.com/thanks-cohn/forever-works), [Any-Shape](https://github.com/thanks-cohn/any-shape).

## Engineering and verification

The architecture is specified as **Forever Works-style, agent-neutral inheritance**, not an instruction set for one coding agent. Read the [construction program](docs/forever-works/BUILD_PROGRAM.md), [verification contracts](docs/forever-works/CONTRACTS_AND_VERIFICATION.md), and [cold reconstitution protocol](docs/forever-works/RECONSTITUTION_PROTOCOL.md). The portable graph is in `src/atlas_core/`, the Linux companion in `src/atlas_companion/`, the MV3 client in `extension/` and verification fixtures under `tests/`. Run `python scripts/check_project.py`. See [development setup](docs/DEVELOPMENT.md) and [the versioned local API](docs/COMPANION_API.md); implemented code is not a claim of production readiness.

## Cold-agent onboarding

Begin with [AGENTS.md](AGENTS.md) (tool/provider-neutral instructions), the [current status ledger](docs/forever-works/STATUS_AND_CONTINUATION.md), and the [construction program](docs/forever-works/BUILD_PROGRAM.md). The first canonical [Forever Works 0.1 model](forever/manifest.json) records enduring requirements. Run `python scripts/check_project.py` for local linkage and Python runtime tests; independent pinned upstream model validation is documented in [development setup](docs/DEVELOPMENT.md). Browser and platform proofs are recorded separately. CI runs the same command on commits and pull requests.

## Premium explorer destination

ATLAS is intended as a **top-tier Chrome Web Store-compatible file explorer** with an explicitly installed native helper: rich right-click operations, copy/cut/paste, move/copy/send-to, multi-select, keyboard navigation, previews, local and R2 browsing, tags, catalogs and relationships. The enduring requirements are in [the premium explorer contract](docs/forever-works/PREMIUM_EXPLORER_PRODUCT_CONTRACT.md). An ambitious Codex implementation assignment is available at [codex/BUILD_PREMIUM_ATLAS_END_TO_END.md](codex/BUILD_PREMIUM_ATLAS_END_TO_END.md); it is not normative architecture.

## Future portable environment proposal

[Portable Personal Environment and WebVM](docs/forever-works/PROPOSAL_PORTABLE_PERSONAL_ENVIRONMENT_AND_WEBVM.md) explores restoring one's browser-centered workspace, assets, workflows and compatible tools across Windows, Linux, Android and future hosts, without making WebVM a mandatory dependency. This is a non-normative proposal, not implemented runtime or sync functionality.

## Run the Linux development explorer

1. Open `chrome://extensions`, enable Developer mode and **Load unpacked** from `extension/`. Copy its actual extension ID.
2. Run `./scripts/run_companion.sh grant /absolute/path/to/a/test-folder --write` to explicitly authorize a narrow disposable folder (omit `--write` for read-only).
3. Run `./scripts/run_companion.sh pair --extension-id YOUR_CHROME_EXTENSION_ID` and keep the printed token private.
4. Run `./scripts/run_companion.sh serve`, open ATLAS from its toolbar icon and paste the token into Connect.

The default native state is private to your OS user under `~/.local/share/atlas`; use `--state-dir /your/private/path` **before** each subcommand to choose another location. Setup never silently installs a native executable. This provider requires Linux and deliberately rejects symlink traversal and ungranted paths. An optional explicit Linux Native Messaging launcher can wake/pair the companion; [setup and limitations](docs/DEVELOPMENT.md) distinguish it from a standalone native distribution. Windows support remains incomplete.

Read [DEVELOPMENT.md](docs/DEVELOPMENT.md), [COMPANION_API.md](docs/COMPANION_API.md), [the privacy disclosure](docs/PRIVACY.md) and [the latest implementation handoff](codex/HANDOFF_LATEST.md) before using personal data. `python scripts/package_extension.py` produces an unsigned extension-only ZIP under ignored `dist/`; it does not install or publish anything.
