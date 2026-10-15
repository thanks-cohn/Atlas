# Resource graph and universal catalogs

## Identity is not location

Maintain stable logical resource identifiers separate from provider paths, R2 object keys, bookmarked URLs or Android document URIs. A resource may have multiple **locators** (mirrors, copies, versions, local and remote representations), each with a provider, capabilities, retrieval status, proof of equivalence and access scope. Never presume identical content just because names match. Use content digests when available and explicit user relationships when not.

Conceptual entities: **Resource**, **Locator**, **Catalog**, **Tag**, **Cluster**, **Relationship**, **Provider**, **Grant**, **Operation**, **Provenance**, **Revision**, **Availability**. IDs must be stable, exportable and not tied to Windows drive letters or R2 bucket names.

## User-led meaning

- **Tags**: user words and namespaces; many-to-many, bulk assign/remove, search and filter.
- **Text**: descriptions, titles, notes, searchable content (with deliberate indexing consent).
- **Catalogs**: explicit, user-chosen organizational membership; nested catalogs may be supported, but cycles and duplicate identities must have defined behavior.
- **Cluster pairing**: logical grouping of related resources, e.g. bookmark + several local images + one R2 PDF. Group membership is not file duplication.
- **Typed relationships**: `reference-for`, `derived-from`, `same-project`, `attached-to`, `alternate-of`, with extensible namespaced relationship types. Preserve direction, timestamps and provenance where relevant.
- **Views**: folder-like hierarchy, list/table, search, graph and visual board render the **same** model.

## Operations and state

Define provider-neutral requested effects such as list, read, search, preview, copy, move, rename, delete, open and index. A provider advertises capabilities and restrictions; do not pretend bookmarks support filesystem rename or R2 has identical semantics to NTFS.

Relations, catalog metadata and indexing may remain available even when content is inaccessible. Status must distinguish offline, permission denied, expired credential, unsupported type, missing object, pending and operational error. Multi-resource operations need partial-failure receipts and recovery instructions.

A future storage schema should use explicit migrations, reproducible import/export, stable references, optional encryption and provenance. No database choice is immutable.

## Initial acceptance illustration

User adds `https://example.org/aircraft`, associates `D:/research/wing.png` and `r2://bucket/diagrams/wing.pdf`, tags them `aircraft` and places them in `Aircraft Research`. Search by text/tag/catalog returns the cluster, shows source-specific retrieval status and opens accessible resources only within current grants. The catalog remains intact when R2 is offline. This is a **test scenario**, not implemented functionality.
