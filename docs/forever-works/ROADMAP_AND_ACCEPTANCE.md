# Roadmap, verification and inherited proof

## P001 — enduring foundation

Establish project intent, interfaces and capability/version boundary, tagged-resource graph model, threat model, Forever Works inheritance approach, adapter contracts, provenance and failure vocabulary. P001 documentation is NOT evidence of running software.

## P002 — first working vertical slice

Implement **Windows** MV3 extension + Python/PyInstaller companion + authenticated local API. After a one-time explicit installer/pairing and scoped folder authorization, list files, search, preview images/text, add a bookmark, assign a tag, link bookmark↔local image and reopen the catalog without repeated Chrome folder prompts. Verify offline states and revocation. Preserve actual file bytes.

## P003 — universal providers and catalogs

Add R2 read-only indexing/search and permission-specific operations; persistent relations, tags and clusters; multiple catalog memberships; virtual ZIP/CBZ browsing and guarded archives; content digest handling; incremental indexing; export/import/migration and robust permission-error explanations. No credential sharing with browser content scripts.

## P004 — portability and ecosystem

Linux companion packaging/host registration, distinct Windows/Linux runtime proof, Android app with scoped Storage Access Framework behavior, opt-in Chute/Redown/Substrate bridges, and target-specific tests. Android must not claim desktop-equivalent filesystem permissions.

## P005 — commercial readiness

Chrome Web Store policy audit and submission, Windows installer signing/reputation strategy, transparent privacy notices, distribution and updates, user analytics only with consent, recoverability, accessibility, support, opt-in pro-tier trials and willingness-to-pay testing.

## Acceptance matrix — earned by actual execution

1. Install helper once (explicit user action); extension pairs and reconnects after kill/restart.
2. Extension accesses two separately granted directories without repeated browser file-picker grants; ungranted paths deny.
3. Malicious website, hostile extension origin, arbitrary loopback client, forged/missing token and CSRF attempts cannot read/delete data.
4. Bookmark↔local image↔R2 object relation persists after restart, independent of resource location.
5. R2 offline: resource metadata/tags survive; remote bytes accurately report unavailable.
6. Move/copy/rename/delete respect per-provider capabilities, grant scopes and safety confirmations.
7. Search/preview virtual archive entries without archive traversal or decompression-bomb exposure.
8. Windows, Linux and Android independently meet their explicitly scoped contract; no inference of parity from shared source or a successful build.
9. Corpus captures purpose, invariants, variations, evidence and denied/unknown behaviors so a cold agent can replace one component in another language and run held-out conformance tests.
10. Web Store submission and approval are recorded as actual third-party outcomes, not assumed.

## Agent implementation practice

Build meaningful end-to-end increments, never decorative scaffolding. Preserve existing tests and add negative fixtures; do not infer success from schema validation alone. Favor small core interfaces, recoverable storage, deterministic receipts and open portable data. Codex-specific work instructions belong in `codex/`, not in these enduring architectural documents.
