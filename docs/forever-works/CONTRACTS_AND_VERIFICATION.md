# ATLAS contracts, evidence, and compatibility discipline

**Status:** proposed protocol/quality contract, not an already implemented API. Final route names and schemas must be versioned and tested before runtime adoption.

## Stable model obligations

`Resource(id, kind, createdAt, provenance)`; `Locator(id, resourceId, provider, opaqueLocation, revision, availability)`; `Catalog(id, title)`; `CatalogMembership(catalogId, resourceId)`; `Tag(id, label)`; `TagAssignment(tagId, resourceId)`; `Note(id, targetId, text)`; `Relation(id, fromId, toId, type, provenance)`; `Cluster(id, title, members)`; `Grant(id, provider, scope, operations, expiry, revocation)`; `Operation(id, requester, grant, verb, targets, result, receipt)`. This is a **conceptual** model; do not fabricate schema validity from it.

Separate resource from locator; a bookmarked webpage and an R2 image can belong to one catalog without content equivalence. References to offline objects persist; duplicate names never silently merge. Include tombstones/versioned migrations and explicit import collision rules.

## Transport-neutral operations

Discover API capabilities and protocol version; pair/authorize/revoke; catalog query and edit; list/search/provider index; metadata/preview/read via bounded streams; links/tags/clusters; authorized copy/move/delete with idempotency keys; subscribe to bounded event history; health/reconnect. Responses need explicit errors: `UNPAIRED`, `UNAUTHORIZED`, `GRANT_EXPIRED`, `NOT_FOUND`, `OFFLINE`, `UNSUPPORTED`, `CONFLICT`, `PENDING`, `RATE_LIMITED`, `INTERNAL`. Unsupported is not success.

Native bridge trust: browser UI sends to privileged extension worker, which authenticates to local helper; content scripts and third-party webpages never possess helper credentials. Native Messaging can bootstrap a bounded pairing session, but it is not a substitute for validating all actions server-side. Desktop/mobile adapters may use different secure transports behind equivalent semantics.

## Release-gate verification matrices

- Domain/graph: insert/mutate/link/query/delete/export/import and conflict/corruption/large-catalog cases.
- Privilege: unauthorized origin, arbitrary localhost program, crafted headers, DNS rebinding, symlink/junction/path race, archive traversal, R2 credential leakage, revoked grant and partial scope.
- Life cycle: helper kill/restart, native host restart, browser reload, service-worker suspension, OS sleep/hibernate and reboot, uninstall/reinstall extension with proper re-pairing when needed.
- Data: byte-for-byte non-mutating read, consistent move/copy outcomes, duplicate idempotent retry, operation journal recovery and cross-provider partial failure.
- Platform: actual Chrome MV3 runtime; Windows 10/11 and supported Linux; Android SAF only under explicit grants. No cross-platform PASS transfer.
- Human factors: accessible keyboard and screen reader flows, low-vision resizing, adaptive narrow surfaces without loss of navigation, error recovery and confirmation UX.
- Privacy/security: storage secret handling, consented telemetry, export/delete and user-facing explanation of every native capability.

Every oracle records fixture version, action, expected observable effect, negative outcome, applicable OS/browser, optional performance limit, independence from implementation, and observed artifact digest. Defects and unknowns remain in the inheritance record rather than erased.

## Purpose-preserving replacement

Suppose future browsers gain safe native persistent folder access. The separate PyInstaller helper may become optional. A replacement is acceptable only if it preserves required operations over authorized scope, state/relationship continuity, user consent, effective recovery, export, denial of unrelated resource access, and held-out proof. Conversely a future browser may remove Native Messaging; implement another consented transport without changing user-visible contract. Existing mechanism is historic evidence, not eternal law.

## Reference sources and provenance

- Canonical architecture: https://github.com/thanks-cohn/forever-works
- Chute: https://github.com/thanks-cohn/chute ; Windows release tag `chute-windows-v2.6.1-rc1` at commit `deb9bdbaba594e493092f498916cdfd269c6cd3b`; user-reported 50-day multi-OS field experience is not an ATLAS test.
- Any-Shape: https://github.com/thanks-cohn/any-shape ; optional future consumer of ATLAS inheritance and generator of alternative implementations.

Any relationship with Chute, Redown and Substrate is a **user-enabled integration proposal**, not an implied credential or filesystem permission.
