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
