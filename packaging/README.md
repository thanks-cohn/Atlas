# Linux standalone companion

The unsigned development artifact `dist/linux/atlas-companion` embeds Python, the
ATLAS companion/native bridge/management UI, and Tcl/Tk. The end user does not
need Python, this checkout or PyInstaller. A graphical Linux desktop and compatible
system ABI are required. The current build is tested on Linux x86_64 with glibc
2.41; other distributions/older glibc and Windows are **NOT_RUN**.

Verify the artifact against a trusted copy of its checksum (`SHA256SUMS`), make it
executable if your download system removed that bit, then open it to see the native
management application. The application does not grant folders or pair a browser
until the user explicitly chooses those actions. An unsigned checksum is an
integrity check, not a publisher signature; this is not a production signed release.

## Install without a terminal

1. Extract `atlas-companion-linux-x86_64.tar.gz` into a folder you own.
2. Open the extracted `atlas-companion` executable. Your file manager may ask you
   to confirm execution; downloaded executables must be marked executable.
3. In **Chrome connection**, enter the exact ID of the unpacked ATLAS extension
   from `chrome://extensions`, choose Chrome or Chromium, and approve installation.
4. In **Authorized locations**, choose each desired folder and approve its access.
   Write access and broad home/volume access require separate explicit choices.
5. In the extension, select **Connect installed companion**. No token copying is
   needed for the installed native bridge. Later opens use the saved native setup.

The ATLAS Companion application-menu entry opens native management after installing.
No folders are granted by installation itself. The archive is a Linux build, not a
Windows EXE, Chrome Store-approved installer or signed publisher release.

For an explicit command-line install:

```sh
./atlas-companion install --extension-id YOUR_ACTUAL_CHROME_EXTENSION_ID --consent
# Chromium users add --browser chromium.
```

The installer copies the standalone binary into a private, content-addressed user
runtime, installs an application-menu desktop entry and registers only the exact
extension ID in Chrome/Chromium's NativeMessagingHosts directory. XDG_DATA_HOME
and XDG_CONFIG_HOME are respected. No folder is implicitly granted; no admin rights,
systemwide service, silent updater or Python installation are required. Default
state is under `~/.local/share/atlas`, and the app installation is separately under
`~/.local/share/atlas-companion`. The installed runtime and native config are excluded
from broad granted filesystem mutations. Keep state private and never export tokens.

Explicit `--upgrade` replaces only files matching the prior installation's owned
SHA-256 receipts. A different extension identity, symlinks, unknown files or modified
user files cause refusal. Old runtimes are retained for review/rollback. The GUI's
uninstall removes only unchanged owned launchers/manifests/desktop registration,
revokes pairing and preserves catalogs, grants, receipts, runtime files and user
content. It does not kill an arbitrary process. Stopping supervision/startup and the
running helper are separate controls. The optional user-login supervisor requires
separate consent and a functioning user service manager; actual OS login/reboot
behavior needs its own proof.

The source installer `python scripts/install_native_host.py --extension-id ID
--consent` copies stable source into the installation so it survives checkout
movement, but **that fallback still requires Python**. Supply `--binary
/path/to/atlas-companion` or use the standalone executable itself for no-Python
installation. Source and frozen modes are recorded in `installation.json`.

## Build and verify

```sh
python -m venv /tmp/atlas-build
/tmp/atlas-build/bin/python -m pip install -r packaging/requirements-build.txt
/tmp/atlas-build/bin/python scripts/build_companion.py
python scripts/smoke_installed_companion.py dist/linux/atlas-companion
```

Normal TLS and dependency verification remain enabled. Build dependencies are
pinned in `requirements-build.txt`; they are absent from end-user requirements.
`BUILD_RECEIPT.json` records exact output digest, architecture, build environment
and source fingerprint; `SHA256SUMS` verifies the binary. The install smoke uses
real disposable spaced paths, real native process framing, actual HTTP and
byte-exact filesystem effects, with Python absent from PATH and Python/Tcl/library
environment overrides removed. It does not borrow actual Chrome, user-login,
cold-machine ABI compatibility or Windows proof.

For graphical acceptance, run the actual frozen application on a graphical display;
source/UI-model tests alone do not establish packaged GUI behavior. Before shipping,
independently test supported distributions, home-directory layouts, Chrome and
Chromium registration, native wake/recovery, interrupted upgrades, uninstall,
accessibility, signatures and clean-machine installation.
