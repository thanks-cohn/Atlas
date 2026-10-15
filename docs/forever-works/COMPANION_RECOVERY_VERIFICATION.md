# Companion lifecycle verification and fault-injection matrix

**Purpose:** independent oracles enabling a cold agent to prove behavior after reimplementing the companion. **Statuses:** PASS, FAIL, UNKNOWN, NOT_RUN; no passing assertions without actual reproduced artifact/environment.

| Test | Trigger / setup | Expected externally observable result |
| --- | --- | --- |
| V01 | Kill helper while authorized UI is open; request file list | Bounded native wake, verified helper, authorized list restored |
| V02 | Helper process running but bridge unresponsive | Stale state recognized; safely recover without indiscriminate process kill |
| V03 | Terminate MV3 service worker then reopen extension | UI/worker activates, reconnects without repeated directory picker |
| V04 | Restart Chrome with installed helper | Reconnect on next supported trigger; stored user catalog and valid grants preserved |
| V05 | Windows sleep then resume | After resume and session/Chrome trigger, truthful status, recovery and data integrity |
| V06 | Windows hibernate then resume | Same continuity; no claim of work occurring while hibernated |
| V07 | Full shutdown, reboot, user logon | Authorized service available when triggered; OS-consented startup/supervisor acts if configured |
| V08 | User switches accounts / machine identity | No transfer of other account's roots, host keys or privileges |
| V09 | Change Chrome extension ID via unpacked reinstall | Previous ID never grants implicit access to new ID; explicit re-pair/enrollment |
| V10 | Revoke local root before interruption, then wake | Revoked root stays inaccessible |
| V11 | Unpaired webpage or forged Origin/Host/token tries wake/file action | Privileged action denied; no credential disclosure or grant change |
| V12 | Crash between filesystem mutation, graph update, receipt commit | `OUTCOME_UNKNOWN`/reconciliation; no blind second move/delete |
| V13 | Supervisor disabled, browser closed | Normal browser-triggered recovery still functional when reopened |
| V14 | Opt-in supervisor enabled; restart/logon/resume with browser closed | Detect authorized helper failure and recover only within OS/user policy; power use measured |
| V15 | Idle and 4 GB machine workloads | Bounded CPU/RAM/energy impact; no unconditional busy-loop |
| V16 | Uninstall companion, then request operation | `NEEDS_INSTALL`, no silent executable installation; revocation/cleanup behavior verified |
| V17 | Clean install on Windows 10 and Windows 11 | No separate Python, no admin/service where feasible, signed/unsigned status disclosed |
| V18 | Garuda Linux install and suspend/resume | Independently tested Linux-specific process/host registration, not assumed from Windows |
| V19 | User-enabled wake timer with unsupported firmware/policy | Honest failure, sleep remains possible; no forced power-policy changes |
| V20 | Replace Python helper with alternative implementation | Held-out wake/auth/grant/data tests pass with same accepted semantic contract |

### Evidence receipt schema guidance

For each test record: test ID; device/OS/build, browser/version and installed extension ID; helper code commit, installer SHA256 and host manifest digest; exact setup and trigger; permission scopes; expected outcome; actual outcome; timing and retry count; fault-injection method; anonymized logs; source of evidence (manual / automated / field report); status and reviewer. Record any skipped/blocked tests as NOT_RUN and security caveats as UNKNOWN. Never include secret tokens or user file paths in shared logs.

The Chute Windows RC1 release only directly reports the narrow Windows random-unpacked-ID + process-kill + Native Messaging bridge revival CI scenario. Owner-observed cross-OS longevity is separately attributable field evidence. Current ATLAS Linux unit/native bootstrap tests are not proof of Windows lifecycle recovery, real MV3 callbacks or the new optional supervisor.
