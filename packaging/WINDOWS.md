# Windows standalone companion (unsigned development build)

The Windows artifact embeds Python and the native management UI. Download and
extract the archive, verify its executable SHA-256 against a trusted receipt,
and run `atlas-companion.exe`. Unsigned builds may trigger SmartScreen; a checksum
is not publisher authentication. No separate Python, administrator access or
Windows service is required.

In Chrome connection, enter your own ATLAS extension's exact ID and approve
installation. In Authorized locations, explicitly choose folders and access rights.
Installation itself grants no folders. Then use Connect installed companion in
the extension. The per-user installation under `%LOCALAPPDATA%\Programs\Atlas`
is private to your Windows account and SYSTEM. Chrome registration is under HKCU;
Chromium is a separate explicit choice. State under `%LOCALAPPDATA%\Atlas` retains
catalogs, grants and pairing across normal restarts. A changed extension ID,
revocation or unavailable OS permission requires user attention.

Command-line installation is also available:

```powershell
.\atlas-companion.exe install --extension-id YOUR_EXACT_EXTENSION_ID --consent
```

Run the installed executable to manage permissions. Explicit `--upgrade` verifies
installer-owned SHA-256 receipts before replacement and retains old runtimes.
Uninstall removes unchanged owned host/config files and registry registration,
revokes pairing, and retains state, runtime and all user content. Modified files
are retained for review. There is no silent updater.

Optional per-user login recovery is separately enabled and launched immediately with `supervise
--extension-id ID --consent enable`; `disable` removes the Run entry and asks an
existing supervisor to stop. It never grants access, changes power policy or
kills arbitrary processes. Native demand wake works independently. No helper runs
while the computer is suspended, hibernated or powered off.

Build using Python 3.12 on Windows with `python -m pip install -r
packaging/requirements-build.txt`, then `python scripts/build_windows_companion.py`.
The Windows workflow tests the actual frozen artifact on its reported Windows
runner. This is not evidence of actual Chrome, Windows 10/11 clean machines,
sleep/hibernate/reboot, signing, accessibility or Store approval; those remain
NOT_RUN until separately reproduced.

## Manual pairing debug fallback

If automatic connection fails, open **Manual pairing (debug)** in the helper.
Enter the exact extension ID from Chrome, choose **Generate token**, approve,
and choose **Copy token**. Paste into the extension's **Companion token** field
and click **Connect securely**. The local service must already be running;
generating a token does not start it or grant folders. Authorized locations
remain a separate choice. This works through the same pairing/authentication
contract as the CLI and requires no command prompt.

Generation replaces the previous token for that ID. Automatic native reconnect
may rotate it again. Tokens are masked by default, revealed only on request,
and kept only in this window's memory (the database stores their digest).
Copying places the secret on the OS clipboard; do not share it in support logs.
**Clear displayed token** clears the field, not the clipboard or authorization.
A newly built EXE is required; an older downloaded helper cannot gain this UI.

## Chrome worker Origin compatibility (extension 0.1.1)

Update both helper and extension for Chrome workers which omit Origin on GET.
The Windows Actions download also contains `atlas-extension-0.1.1.zip`. Extract
that ZIP into your existing unpacked extension folder, then Reload in
chrome://extensions to retain its identity. Start the updated service, generate a
fresh manual token if needed, and Connect securely. The helper checks explicit
extension identity and its bound bearer; the compatibility header never grants
folders. A previously running older service must be stopped before the new one
can bind port 17892. If auto-recovery is active, disable it before replacement,
then repair the installed companion and reenable it after updating.

## Existing-preview navigation (extension 0.1.2)

Left/Right and preview arrow buttons cycle eligible files in current displayed
folder order and wrap. Preview settings persist; images, audio and video start
enabled, text/PDF disabled. Update extension files in the same unpacked folder
and Reload to preserve its ID. No new native API is required for this increment.
The helper retains its 2 MiB preview cap; full-size music/video streaming remains
a later change. Actual Chrome codec and PDF-viewer support require field checks.
The Working v1 baseline is separately pinned in docs/releases/WORKING_V1.md.

## Configurable preview size (extension 0.1.3 and matching helper)

Replaces the earlier fixed 2 MiB cap. Preview settings now save a general 30 MiB
maximum and optional per-extension values from 0.01 to 128 MiB. An extension value
overrides the general value. Oversize files show a type badge and Settings link.
Update both helper and extension: an older helper cannot honor the new limits.
Changes apply on next file open; no file permissions are broadened.

## Simple setup and diagnostics (extension 0.1.4 + matching helper)

Run the helper, enter your extension ID and choose Set up & start. Confirm
automatic startup, choose home-folder access yes/no and optionally other folders.
Read-only is default; enable file changes explicitly if desired. Setup closes
after verified readiness. Connect installed companion once in Chrome. Advanced /
diagnostics contains the former management controls and Debug events. Later
ordinary Windows launches start already authorized recovery quietly; --desktop
always opens the window. Failures return to management.

The shelf Diagnostics button copies a bounded report of connection stages/codes.
Helper Debug events provides the native journal even when the browser cannot
connect. Tokens/paths/headers/content are omitted. See the documented debug API
in docs/forever-works/DIAGNOSTICS_AND_SIMPLE_SETUP.md. Update both components.

### Separate debug executable

The Windows download includes two separately named executable files using the
same verified runtime: **atlas-companion.exe** for simple setup/automatic use and
**debug.exe** for direct access to the original detailed setup, repair, token and
diagnostic tabs. Double-clicking debug.exe selects advanced management immediately,
without changing saved permissions or enrollment. Both use the same private state.
Explicit CLI arguments preserve their existing meaning for either executable.
Do not rename debug.exe if relying on this name-based entry selection.

## Lightweight runtime layout (0.1.68)

For local AI, extract the ENTIRE normal artifact: atlas-companion.exe, debug.exe,
tagging-engine/, and tagging-models/ stay together for installation. Run
`atlas-companion.exe --desktop --advanced`, then approve same-ID repair/upgrade.
The installer saves verified reusable copies; subsequent installed launches do
not require the download folder. Core helper contains neither AI libraries nor
weights. Every requested model runs in a separate process that exits afterward.
The core-only artifact supports normal Atlas without local AI. A bare executable
without the engine/model bundle can still install basic functionality, but cannot
supply tagging unless valid cached engine/models already exist. No Python setup
is needed. This supersedes the earlier all-in-one AI helper packaging.
