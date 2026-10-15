# Development and local installation

ATLAS is an agent-neutral project. Start with `AGENTS.md`, the Forever Works inheritance index and the latest status ledger. Work in the provided checkout; creating a second worktree is unnecessary unless explicitly requested. Python 3.12 is the CI baseline. Core and companion runtime use the Python standard library; Chrome loads the extension directly from source.

## Verification

The runtime and default suite need no packages. Optional browser/schema proof uses pinned `requirements-dev.txt`: create a disposable venv outside the checkout and run `python -m pip install -r requirements-dev.txt` there; Chromium must also be installed. Browser DOM proof runs `python scripts/browser_smoke.py --artifacts artifacts/browser`; it explicitly substitutes a test transport and does **not** establish MV3/Chrome Native Messaging runtime. `node scripts/test_extension_broker.mjs` independently exercises the actual worker source with test doubles.

From the repository root:

```sh
python scripts/check_project.py
PYTHONPATH=src python -m unittest discover -s tests -v
python scripts/smoke_companion.py
```

The smoke command creates disposable roots/state, invokes the real CLI and foreground HTTP companion on an ephemeral loopback port, verifies byte-exact copy/rename/trash/restore and denial scenarios, then removes its fixtures. These checks exercise the actual Python implementation. They do not establish Chrome runtime, Windows installer behavior, Store acceptance or production security. Read `codex/HANDOFF_LATEST.md` for the exact tests executed in the latest implementation session and remaining gates.

## Independent canonical model validation

The canonical `forever/` model was independently checked on 2026-10-15 against upstream Forever Works commit `ebeb65f786ba0d9ba0e730dddd8047937348257a`. Both the upstream Python validator and an independent Draft 2020-12 JSON Schema oracle passed: manifest plus nine records. Exact input digests and scope are retained in [the validation receipt](evidence/forever-validation-2026-10-15.json). This proves structural/linkage validity of these records, not implementation of their requirements.

Reproduce outside the checkout:

```sh
git clone https://github.com/thanks-cohn/forever-works.git /tmp/atlas-forever-works
git -C /tmp/atlas-forever-works checkout ebeb65f786ba0d9ba0e730dddd8047937348257a
python -m venv /tmp/atlas-schema-venv
/tmp/atlas-schema-venv/bin/python -m pip install jsonschema==4.26.0
/tmp/atlas-schema-venv/bin/python scripts/validate_forever_upstream.py /tmp/atlas-forever-works
```

Use another clean temporary path if it already exists; preserve user files. The validation command requires the pinned clean upstream and never mutates either checkout. `jsonschema` is a development-only independent oracle, not a companion dependency. The normal check command stays offline and dependency-free.

## Explicit local setup

Chrome extensions cannot silently install native executables. The current development flow requires a user-run companion, a user-selected grant and explicit pairing. An optional Linux development Native Messaging installer is available below. It is a checkout-dependent launcher, not a standalone signed native distribution. Windows packaging remains unimplemented; actual browser/wake proof is recorded separately in the handoff. CORS does not supply authorization.

The browser extension is loaded through `chrome://extensions` with Developer mode and **Load unpacked**. Select the repository's `extension/` directory and copy the extension ID Chrome assigns. A reinstalled extension with a changed identity needs new pairing. Keep credentials in the extension's own storage and companion state; do not paste them into websites or repository files.

The companion grants only explicitly selected roots. Use a disposable test directory first. Keep companion state outside the checkout, and keep it private to your OS user. Pairing credentials are secrets; local command output must not be copied into issue trackers or checked into Git.

Run these commands from the checkout, replacing the example root and extension ID with your own values:

```sh
# Inspect CLI options; no installation or configuration side effects.
./scripts/run_companion.sh --help
# Optional explicit private state location, passed BEFORE the subcommand:
./scripts/run_companion.sh --state-dir /path/to/private/atlas-state grant /path/to/test-folder --write
./scripts/run_companion.sh --state-dir /path/to/private/atlas-state pair --extension-id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
./scripts/run_companion.sh --state-dir /path/to/private/atlas-state serve
```

The example extension ID must be replaced by the actual ID from Chrome. Paste the token printed by `pair` into the extension's Connect dialog. Omit `--write` for a read-only grant. Use the same state directory for every command. The launcher runs in the foreground, prefers an existing `.venv/bin/python`, accepts `ATLAS_PYTHON` as an interpreter override and otherwise uses `python3`; it never installs dependencies or grants permissions implicitly. The default state directory is `~/.local/share/atlas` when `--state-dir` is omitted.

```sh
./scripts/run_companion.sh --state-dir /path/to/private/atlas-state grants
./scripts/run_companion.sh --state-dir /path/to/private/atlas-state revoke --grant GRANT_ID
./scripts/run_companion.sh --state-dir /path/to/private/atlas-state revoke --extension-id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

Revoking a paired extension or re-pairing invalidates its prior token. Browser session storage clears pairing when the browser session ends; reconnect with a newly generated token when needed. Helper restart retains native state. Manual pairing requires starting the helper yourself; optional installed Native Messaging can wake it as described below.

For actual API behavior and authority boundaries see [COMPANION_API.md](COMPANION_API.md). The latest handoff records the exact runnable setup commands and observed browser/platform limitations.

## Distribution gates

A Linux development server is not a Windows installer proof. PyInstaller can bundle Python but does not provide signing, publisher reputation, user consent, native host registration, uninstall safety or Chrome Web Store approval. Distribution requires separate native-host, lifecycle, browser, Windows and Linux runtime tests, privacy review and security review before making release claims. Cloudflare R2 and Android access require independent provider/platform authorization and proof.

## Extension archive

`python scripts/package_extension.py` produces `dist/atlas-extension-<version>.zip` with reproducible timestamps/order and prints its SHA-256 digest. The archive includes only extension assets and is unsigned; it neither bundles the companion nor installs it. Load the unpacked source for development. Run packaging after final UI edits, then inspect the archive before any submission. See [the development privacy disclosure](PRIVACY.md) for current permission/data handling scope.

## Optional explicit Linux Native Messaging installation

After loading the extension and reading the permission disclosure, authorize its exact ID:

```sh
python scripts/install_native_host.py --extension-id YOUR_CHROME_EXTENSION_ID --consent
# For Chromium instead of Google Chrome:
python scripts/install_native_host.py --extension-id YOUR_CHROME_EXTENSION_ID --consent --browser chromium
```

The installer writes a private per-user launcher/config and `org.atlas.companion` host manifest. It authorizes only that extension identity, grants no folders and refuses to overwrite existing installation files. Use `--state-dir /your/private/path` if your companion uses a nondefault state directory. Keep the checkout and the Python interpreter used for installation in place: this launcher runs their source, and is not a self-contained packaged executable. Reload Chrome if necessary after registering the host, grant your selected roots separately, then use the extension's **Connect installed companion** action.

The bridge validates Chrome's exact caller argument, accepts only a bounded `connect` message, proves the loopback listener possesses the private native bootstrap key, then rotates the bearer token and returns it only over Native Messaging. It can start the fixed companion command when the listener is unavailable. A process occupying the port without the correct state key must be rejected before receiving a bearer credential. Existing manual tokens for that extension are invalidated when native connect rotates credentials.

Uninstall by inspecting/removing the three paths printed by the installer, then revoke the extension identity using the companion CLI. Stop any running companion separately; deleting the host manifest does not terminate a process. Native grants and catalog data are retained until explicitly removed. No silent update, OS startup registration, Windows binary, desktop shortcut or signed production installer is included. Consult the latest handoff for independently executed native framing, wake and real Chrome runtime results.
