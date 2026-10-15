# Security and delivery contract

## Installation truth

**PyInstaller produces a standalone Windows executable from Python; it does not provide permission for Chrome to silently install or execute it.** Chute's documented Windows process begins with a user-running `Chute-Setup.exe`, then that per-user application copies itself to `%LOCALAPPDATA%/Programs/Chute`, registers a native host and startup/reconnect logic. ATLAS should provide similarly convenient **one-time user-consented** installation and subsequent seamless wake/reconnect; do not suggest Chrome Web Store silently bundled and launched an EXE.

Design signed, reproducible Windows builds where feasible; installer hashes, recognizable publisher, clear support/uninstall paths, opt-in update mechanism and virus/SmartScreen troubleshooting. PyInstaller itself neither guarantees trust nor avoids SmartScreen. Windows code-signing and distribution reputation influence prompts. Linux packaging has separate paths; Android uses a standard mobile app package and supported permissions.

## Threat model

A malicious webpage may attempt localhost requests; another installed extension may be compromised; a local user process may attempt unauthorized API calls; an attacker may supply paths, symlinks, archives, encoded URL tricks, oversized content or unexpected origins. CORS is **not authentication**. Origin checks alone, permissive `chrome-extension://` prefix acceptance and unauthenticated GET/DELETE endpoints are insufficient for a whole-disk explorer.

## Minimum mandatory defenses

- Bind to loopback only by default; explicitly opt in for remote networking, separate authorization and encrypted transport.
- Pair only the intended extension identity and native helper installation, with cryptographically strong scoped credentials; consider native messaging for credential bootstrap. Use origin validation **plus** authenticated authorization, not either alone.
- Protection against DNS rebinding, CSRF, token disclosure, other local processes, wildcard CORS, malicious websites and unintended browser-to-loopback access.
- Grants are narrow, explicit, revocable and persisted only with user consent. Canonicalize/validate paths and protect against symlink/junction traversal, races, path traversal and archive extraction attacks. Prefer handle-based traversal where available.
- Reconfirm destructive actions, protect against mass deletion, provide undo or recoverable staging where practical, and maintain immutable operation receipts.
- Enforce size/time/resource limits, stream large files, and isolate potentially hostile archive/document preview parsers.
- Do not transfer R2 credentials to content scripts or arbitrary webpages; server-side scoped provider secret handling.
- No generic OS command execution API. Principle of least privilege and documented data retention/export/deletion behavior.
- Review MV3 remotely hosted code restrictions, least-privilege host permissions, disclosure, single-purpose experience and Chrome Web Store policies before shipping; review outcome unknown.

## Companion recovery

Health checks are unprivileged and disclose little. Native wake pathway verifies installed host and its authorized caller. Recovery must not quietly install new binaries or elevate privileges. Clear UI: `Not installed`, `Needs pairing`, `Starting`, `Ready`, `Permission needed`, `Unavailable`, `Update required`. Scope continuity and revocation are user-controlled.

Security must be maintained during future language/transport replacements; no compatibility migration can turn an unknown privilege grant into accepted authority.
