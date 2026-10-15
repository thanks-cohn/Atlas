# ATLAS — Universal Resource & Relationship Explorer

ATLAS is a **browser-first, native-capable, local-first explorer** that unifies user-authorized local files, Cloudflare R2, bookmarks, saved webpages, archives and connected application resources. Users organize them with text, tags, user-defined catalogs and cluster pairings, independent of physical storage locations.

**Delivery direction:** Chrome Manifest V3 extension + authenticated loopback API + separately installed Python native companion bundled with **PyInstaller**, using Chrome Native Messaging for waking/reconnecting as appropriate. Windows/Linux applications and Android may implement the same contracts through platform-appropriate mechanisms.

**Important:** PyInstaller eliminates the user's need to install Python; it does **not** authorize a Chrome Web Store extension to silently install or execute a downloaded program. ATLAS should emulate Chute's convenient **one-time user-consented installation and subsequent wake/reconnect**, not claim otherwise. Chrome Web Store eligibility is a design requirement, not an approval guarantee.

Start with [docs/forever-works/README.md](docs/forever-works/README.md).

**Stage:** P001 architecture and foundations; executable implementation and behavioral proof are future work.

References: [Chute](https://github.com/thanks-cohn/chute), [FileChute](https://github.com/thanks-cohn/filechute), [Redown](https://github.com/thanks-cohn/remote-download-2-cloudfare), [Forever Works](https://github.com/thanks-cohn/forever-works), [Any-Shape](https://github.com/thanks-cohn/any-shape).

## Engineering and verification

The architecture is specified as **Forever Works-style, agent-neutral inheritance**, not an instruction set for one coding agent. Read the [construction program](docs/forever-works/BUILD_PROGRAM.md), [verification contracts](docs/forever-works/CONTRACTS_AND_VERIFICATION.md), and [cold reconstitution protocol](docs/forever-works/RECONSTITUTION_PROTOCOL.md). An initial Python resource catalog experiment is in `src/atlas_core/`, with tests under `tests/`. Run `PYTHONPATH=src python -m unittest discover -s tests -v`. Privileged native/browser integration has **not yet** been built.

## Cold-agent onboarding

Begin with [AGENTS.md](AGENTS.md) (tool/provider-neutral instructions), the [current status ledger](docs/forever-works/STATUS_AND_CONTINUATION.md), and the [construction program](docs/forever-works/BUILD_PROGRAM.md). The first canonical [Forever Works 0.1 model](forever/manifest.json) records enduring requirements. Run `python scripts/check_project.py` for local linkage and Python prototype tests; this **does not** claim normative upstream conformance or native runtime proof. CI runs the same command on commits and pull requests.
