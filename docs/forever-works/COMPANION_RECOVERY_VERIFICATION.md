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


### 0.1.47 — Offline recovery controls and locked Windows native-image repair
Owner supplies Windows WinError 5 access-denied dialog for installed atlas-native.exe plus a diagnostic report from extension 0.1.45: HTTP transport failures followed by very fast native-call failure and NEEDS_INSTALL. Evidence establishes the helper/host is unavailable, not that Chrome's MV3 worker crashed (the worker produced the report). Installer source previously unlinked/replaced atlas-native.exe on every repair, including identical bytes and potentially the image hosting management/service processes. Running-image contention is consistent with the screenshot; actual Windows root-cause reproduction remains NOT_RUN.

Windows installer now creates atlas-native-<20 hex content digest>.exe and points the native manifest at that immutable version. Upgrade never unlinks the prior native image; a same-version repair skips every identical document instead of unlinking/recreating it. Legacy and versioned native names dispatch the same fixed Chrome-origin invocation, reject additional arbitrary arguments, retain exact-ID authorization, and use the same native config/state. Prior native images may remain as inert old files alongside retained old runtimes; no mass process termination or filesystem cleanup is introduced. Actual frozen smoke now resolves the executable from the native manifest. Existing ownership checks, explicit upgrade consent, attested quiesce, rollback and state preservation stay intact.

Activity & recovery exposes Reconnect companion and Open Debug Helper before trying to fetch receipts/grants, so unavailable history cannot hide the recovery actions. The latter uses the existing authenticated native manage action; updated Windows helpers explicitly open advanced desktop controls (the debug.exe interface), independently of loopback service health. It reports launch requested rather than claiming a window was observed. Failed native registration/image launch expands manual debug.exe instructions and the exact extension ID. Chrome cannot invoke an arbitrary Windows EXE if Native Messaging is absent: the updated downloaded debug.exe remains the honest fallback. Refresh activity reads history; Reconnect explicitly invokes native recovery. Native missing-host errors now distinguish repair of an existing installation from initial install. Activity no longer exits bookmarks-mode; native Chrome bookmarks remain browsable without a companion. Companion-backed gallery deletion still requires the service and now points to these recovery actions on failure; no false local-only deletion.

Verification: 20 worker contract tests; Activity offline/debug-failure/reconnect DOM tests; bookmark/pinboard/fetch/gallery checks PASS. Portable Windows installer decision tests verify identical locked native images are untouched and an upgrade chooses a new image path; 12 installer tests: 8 PASS, 4 real-Windows cases SKIPPED here. Native argument dispatch tests 3 PASS. Native bootstrap tests: 6 PASS, 1 ERROR in the previously known actual-process demand-wake path (Companion did not start); do not describe the whole native suite as passing. Windows kernel locks, frozen helper, Chrome launch and native GUI smoke NOT_RUN locally; changed native source triggers the existing Windows build/real-Windows test workflow on main. A git pull / extension reload does not replace the installed EXE: this repair requires the new Windows companion build to be downloaded and run once. No tokens, user paths or full uploaded diagnostics committed.


#### 0.1.47 Windows CI artifact — verified after publication
GitHub Actions run https://github.com/thanks-cohn/Atlas/actions/runs/39051938544 completed SUCCESS for commit 40acb27a5f02bf915193fd6ed4782a42fc9f57f8. The real Windows installation/filesystem suite, standalone build, native management-widget smoke and frozen native frames/HTTP smoke all passed. Download artifact `atlas-companion-windows-x86_64`: https://github.com/thanks-cohn/Atlas/actions/runs/39051938544/artifacts/12107972816. This provides the updated debug.exe and companion executable plus packaged extension. Actual user Chrome callbacks and Windows 10/11 sleep/hibernate/reboot remain NOT_RUN; this CI success does not claim the user's installed machine is repaired until they run the updated helper.
