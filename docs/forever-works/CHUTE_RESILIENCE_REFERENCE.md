# Chute resilience reference: installed companion, recovery, and long-running continuity

**Status:** historical engineering precedent and owner-reported field evidence for ATLAS; not an ATLAS implementation or independent ATLAS acceptance proof.

## Exact reproducible reference

- Source repository: https://github.com/thanks-cohn/chute
- Release: https://github.com/thanks-cohn/chute/releases/tag/chute-windows-v2.6.1-rc1
- Immutable tagged commit: `deb9bdbaba594e493092f498916cdfd269c6cd3b`
- Windows artifact: `Chute-Setup.exe` (release reports 317.1 MB)
- Installer SHA-256 as published on release: `36c7d80d4277e3f3b4167425e81f8da8eaee8a3a0fb3798d70bf2aeb5a5f6d50`
- Packaging: Python bundled into standalone executable, no separate Python runtime; no Windows administrator account or Windows Service required. Release notes say executable unsigned and Windows SmartScreen **may** warn.
- Chrome Web Store extension identifier from Chute source: `hpcpnigfadojjmnbflfhkfkallfafajb`.

Do not copy Chute source under an assumed permissive license; the Chute repository is licensed source-available, non-commercial. ATLAS may study documented architecture and independently implement the requisite behavior within applicable permissions/licensing.

## What the release establishes

The release describes a Windows companion that keeps the fixed Chrome Web Store extension ID authorized and discovers valid IDs for unpacked Chute builds. The companion persists these IDs in its Native Messaging host allow-list and refreshes them while running.

Its reported CI smoke test generates a random unpacked extension ID, verifies registration in the host's authorized origin list, terminates `Chute.exe`, and verifies that the native host revives the loopback bridge at `127.0.0.1:17891`. This is concrete automated **kill-and-recovery** evidence for the tested Windows setup, not proof of arbitrary 50-day continuity.

Reviewed implementation paths on Chute main:
- `src/chute/windows_app.py` — frozen executable self-install to per-user programs directory, native host installation, startup registration, local bridge process and extension origin-refresh loop.
- `src/chute/native_host.py` — native messaging framing, registry registration, extension ID authorization, health and relaunch.
- `extension/background-native.js` — MV3 worker health probing, Native Messaging wake, retries on bridge failure.
- `src/chute/server.py` — Python local HTTP bridge.

## Additional field experience — owner report

The owner reports that the design has remained operational for **at least 50 days**, through sleep, shutdowns/restarts and recovery on **multiple machines**, including **Garuda Linux, Windows 10 and Windows 11**. This is valuable long-running practical experience with Chute's overall cross-platform architecture, but detailed logs, precise version/build inventory for each OS, uninterrupted uptime measurements and independently verified reproductions have not been attached. The named RC1 release is **Windows-specific**; do not infer that its Windows executable ran on Garuda. Document Linux installation and wake mechanisms separately when inspecting the Linux implementation.

In particular, persistent functional service across sleep/shutdown is different from an uninterrupted running process. **ATLAS's acceptance obligation is successful service recovery and continuity of authorized state**, not a process that never exits or a browser extension immune to browser lifecycle suspension.

## Lessons and required invariants for ATLAS

1. **No repeated Chrome folder picker:** once the user explicitly installs and pairs the native companion and grants chosen folders, the browser UI can request subsequent authorized file operations through the helper without new Chromium picker prompts per operation.
2. **Recoverability:** Chrome MV3 workers may suspend, the native companion can exit or crash, Windows/Linux can sleep, devices can restart. The workflow must reconnect without losing granted user state or needing manual technical recovery in routine cases.
3. **Bounded automatic wake:** detect missing bridge, ask registered/authenticated native host to wake or relaunch, reconnect, and present actionable UI if recovery cannot be completed. Do not claim that the extension itself installs executables.
4. **Correct installed/development identity:** support official Web Store ID, and an explicitly verified narrow development allowance for unpacked builds; reject arbitrary extensions.
5. **Per-user low-friction installation:** distribute bundled native helper, user-consented installer, clean uninstall, no mandatory Python or Windows Service and no elevation where technically feasible.
6. **Permission-safe persistence:** pairing credentials, granted roots, catalog relationships, operation receipts and state must survive permitted restarts while remaining revocable and securely stored.
7. **Transport is replaceable:** Windows registry Native Messaging manifests, Linux integration, loopback port numbers, programming language, PyInstaller and process arrangement are mechanisms, not invariants.
8. **Security improvement:** don't replicate uncredentialed Chute HTTP routes or generic extension-origin allowances. ATLAS must implement authenticated, scoped local APIs, robust caller binding, CSRF/DNS rebinding protections and guarded filesystem operations.

## Test requirements before ATLAS claims resilience

- Automated `kill helper → native wake → health → authenticated operation` and `kill service while request in progress → recover/retry safely`.
- Reboot/logon, Chrome restart, MV3 suspend/resume, Windows sleep/hibernate and Linux suspend/resume scenarios.
- Test Windows 10, Windows 11, and supported Linux environments including Garuda; record exact OS, packaging, application and Chrome versions for each.
- Multi-machine soak tests with 7-, 30- and 50-day checkpoints and preserved request/response/exception telemetry where explicitly consented. Do not demand constant process uptime.
- Unauthorized webpage / unrelated extension / unpaired client / revoked-root negative tests during recovery.
- Integrity and no duplicate effect after retry, particularly move, delete and upload actions.
- Signed or clearly disclosed unsigned installer behavior; never presume absence of Windows warnings.

## Forever Works inheritance contract

**Purpose:** Keep an authorized, powerful browser-based resource explorer continuously usable across browser/OS process lifecycles, without repeated routine authorization prompts.

**Fixed:** reliable recovery of the user's authorized capability, least-privilege grant continuity, data integrity, transparent failure, and revocability.

**Constrained:** availability/reconnect latency, offline behavior and cache consistency subject to measurable accepted bounds.

**Fluid:** underlying language, native host registration, protocol, ports, operating system-specific wake technique, service implementation, executable bundler and topology.

**Evidence:** original release, immutable tagged source, published installer digest, CI smoke-test account and separately attributed user-reported 50-day cross-OS experience. None of this proves ATLAS itself currently passes.

Future agents may use an entirely different future implementation if it meets the same tested objectives. This is **purpose-preserving mechanism replacement**, not a mandate to immortalize one historical workaround.
