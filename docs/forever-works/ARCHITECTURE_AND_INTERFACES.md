# Architecture and cross-platform interfaces

## User-visible components

1. **Chrome MV3 extension**: browser shelf/side panel or full-tab explorer; bookmarks, capture and UI; minimal permissions and clear disclosures. Chrome Web Store approval is a target, not assured.
2. **Python native companion, bundled using PyInstaller**: provides OS-authorized filesystem operations, indexing, watchers, thumbnail/preview workers, local catalog storage and provider connectors. End users should not need to install Python.
3. **Authenticated loopback network service**: typically HTTPS/HTTP over `127.0.0.1` or `::1` with a strong pairing token and strict controls; default to loopback only. A stable abstract capability API sits behind transport.
4. **Chrome Native Messaging bootstrap**: installed/registered alongside companion; used to discover/restart/repair the local service and negotiate pairing where appropriate. The extension cannot register the native host or install an EXE by itself.
5. **Provider adapters**: local files, removable media, bookmarks, R2, archive virtual files, optional Chute/Redown/Substrate interoperability. Distinguish providers' supported effects and authority.
6. **Windows/Linux native client options**: reuse domain contracts and native helper, with platform-specific packaging, path handling, permissions and OS integration.
7. **Android client**: uses Storage Access Framework/document provider permissions and mobile lifecycle constraints rather than assuming desktop-wide filesystem privileges. Remote catalogs and resource metadata can be shared where authorized.

## Chute research precedent

Chute's actual repository includes Python `src/chute/server.py` (loopback server at `127.0.0.1:17891`), `src/chute/native_host.py` (Native Messaging and Windows per-user registration), `src/chute/windows_app.py` (PyInstaller-frozen companion self-installer/reconnect) and `extension/background-native.js` (MV3 wake/retry). This is **architectural precedent**, not a license to copy its implementation or security defaults. Chute is source-available under a non-commercial license; ATLAS must avoid unlicensed copying of its code.

For ATLAS, use a separate product identifier, service port, origin authorization and data directory. Write an authenticated, authorization-aware API rather than cloning Chute's permissive HTTP endpoints.

## Capability-oriented API

Examples: `grants.list()`, `grants.requestRoot()`, `resources.list(locatorOrCatalog, cursor)`, `resources.preview(id)`, `resources.read(id, range)`, `resources.move(id, destinationGrant)`, `catalogs.assign(id, catalog)`, `relations.link(a, b, type)`, `events.subscribe(scope)`, `status.health()`. These are **illustrative contracts**, not established endpoints.

Avoid exposing `runShell(command)`, arbitrary filesystem path operations without grants, or a generic browser-accessible privilege proxy. Support version negotiation, stable error codes, bounded pagination and streams, idempotent mutation IDs, checksums and audit receipts.

## Replaceability

HTTP, Native Messaging, PyInstaller, Python, OS processes, database engine, watchers, indexing engine, application UI framework and directory structure are **fluid mechanisms**. The invariants are authenticated and authorized effect boundaries, predictable resource identities, honest availability and user-visible outcomes.
