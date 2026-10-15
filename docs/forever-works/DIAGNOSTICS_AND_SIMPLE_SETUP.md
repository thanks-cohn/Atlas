# Simple helper setup and observable recovery

## Owner intent and observed evidence

The owner wants the helper to feel automatic: run it, enter the extension ID,
answer home-folder yes/no, optionally select other folders, and finish. Repair,
tokens, startup internals and debugging must not dominate normal setup. Keep the
existing authorization system; simplify its presentation rather than weakening it.

Field evidence preceding this change: a blank side shelf; another shelf displaying
"Installed companion did not respond within 15 seconds"; manual reconnect then
restoring operation; repair reporting Windows error 32 on atlas-native.exe.
The code allowed native cold-service startup up to 20 seconds plus wake-lock
waiting, while the browser gave up after 15 seconds. This mismatch is a plausible
contributor, not proof of the sole cause of the reported outage. The browser
now waits up to 45 seconds. A timed-out native host is not forcibly terminated by
this change; a late host can still complete. Physical sleep/reboot behavior and
real Chrome field recovery remain separate checks.

## Normal Windows setup

The native window presents an ID field, optional write permission checkbox and
**Set up & start**. Its explicit confirmation authorizes installation and
per-user login recovery. Then ask home access yes/no (show the actual path and
access mode), and other folders yes/no with a native folder picker. Read-only is
the default; private state exclusions and existing scope validation remain fixed.
No means no grant. Installation precedes saving chosen grants; starting automatic
recovery follows them. Report Done only after verified local readiness.

After success the setup window closes. Chrome still requires **Connect installed
companion** once to remember native enrollment; manual pairing is a debug fallback,
not an automatic-enrollment shortcut. Subsequent ordinary Windows launches reuse
already enabled recovery, check readiness and finish quietly; failure falls back
to management. Explicit --desktop and the extension's location manager open the
window. **Advanced / diagnostics** reveals existing controls and the native debug
event tab. A changed extension ID still needs explicit old-integration removal;
this increment does not silently transfer authority or solve all locked-file repair.
Linux shares the simple GUI but quiet normal-launch behavior is Windows-specific.

## Debug API v1

Extension messages are available only to this extension's own trusted pages:

- `{type:"debug-report"}` returns `{ok:true,report}` without starting or repairing
  anything. The report includes lifecycle, credential-presence boolean, enrollment
  mode, timeout budgets and up to 200 timestamped stage/code events.
- `{type:"debug-probe"}` also reads authenticated helper diagnostics with the
  current session credential. No credential means NO_SESSION_CREDENTIAL. It does
  not auto-connect, rotate tokens or replay file operations.
- `{type:"debug-ui-error",code:"UI_BOOT_TIMEOUT"}` records a fixed UI error;
  every other supplied value becomes UI_SCRIPT_ERROR. It cannot inject free text.
- Authenticated `GET /v1/diagnostics` returns helper schema
  `atlas.diagnostics.v1`, platform, declared coverage and up to 200 persisted
  native/HTTP events. Existing exact-identity, bearer and host checks apply.

Native events use the existing protected state database in an ancillary
`diagnostic_events` table; no file grants or schema authority are altered.
Extension events are bounded in trusted local extension storage. Journals include
stage, stable code, timestamp, and selected duration/HTTP-status numbers. They
omit bearer tokens, headers, arbitrary exception text, filenames, file contents
and paths. Extension ID is deliberately present in the extension report to
identify enrollment mismatches. Copying a debug report requires an explicit click.
Diagnostic recording failures are best-effort and must not change outcomes.

## Stage/code examples and recovery

| Stage/code | Meaning | Next check |
|---|---|---|
| NATIVE_CALL_STARTED | Browser invoked registered native host | Await reply or inspect helper local journal |
| NATIVE_TIMEOUT | No native reply within 45 seconds | Inspect last native stage; do not blindly repeat mutations |
| LOCK_WAIT_STARTED | Waiting for serialized native wake | Inspect other in-progress host/repair |
| PROOF_TRANSPORT_FAILED | Helper did not answer possession proof | Check local startup and attested recovery |
| PROOF_MISMATCH | Listener failed proof | Do not send credentials to it |
| SERVICE_SPAWN_STARTED / SERVICE_START_TIMEOUT | Launch requested / readiness deadline expired | Check native Debug events |
| TOKEN_ROTATED / HEALTH_CHECK_STARTED / CONNECT_READY | Connection proof succeeded, new session prepared, ready | Check browser HTTP/auth events next |
| INVALID_ORIGIN / UNPAIRED | Identity gate / token rejection | Update matching builds and inspect connection mode |
| MANUAL_MODE_AUTO_WAKE_DISABLED | Manual token mode does not remember native enrollment | Choose Connect installed companion for automatic mode |
| WINDOWS_SHARING_VIOLATION | Windows error 32/33 blocked replacement | Close the active connection before repair; no arbitrary process kill |
| UI_SCRIPT_ERROR / UI_BOOT_TIMEOUT | UI script failure / module did not initialize | Independent diagnostic fallback offers copy/report and reload |
| SETUP_START_TIMEOUT | Setup saved but helper not verified ready | Advanced diagnostics; do not present success |

The shelf includes Diagnostics, Refresh local report, Check helper diagnostics,
and Copy report. A separate small boot script exposes a fallback if explorer.js
fails, so the primary module is not required to inspect a startup error. This
cannot recover a disabled extension or a missing boot script itself.

## Verification and limits

Local checks: 20 worker authority/diagnostic tests, 3 journal/HTTP/privacy tests,
4 quick-setup consent/order/timeout tests and 23 companion HTTP/security tests pass.
The real Windows Tk smoke also checks opening Advanced, token controls and copying
the native journal; Windows CI is required before claiming that widget proof.
Actual Chrome empty-shelf reproduction, Windows first-run/sign-in/reboot and
user-interactive quick setup remain NOT_RUN locally. No claim of logging literally
every instruction or unsupported provider: inspect the report's coverage.

Keep the owner's pleasant automatic experience and intelligible recovery fixed;
UI tabs, storage and event transport are replaceable with equivalent proof.
The separate owner-supplied bookmark integration brief is preserved under
`docs/requests/NATIVE_BOOKMARKS_IMPLEMENTATION_OWNER_BRIEF.md`; it is not implemented
by this helper/diagnostic increment.
