# Portable resource graph and storage v1

Implemented by `src/atlas_core/catalog.py` and `store.py`. This is an ATLAS
implementation contract, independent of normative Forever Works records.

Portable UTF-8 JSON retains the existing `format: "atlas.catalog.v1"`. Required
root fields are `format`, `resources`, `catalogs`, `memberships`, `relations`,
`tags`; unknown fields and duplicate JSON keys are rejected. Resource map values
contain exactly `id`, `kind`, `title`, `note`, `locators`; locator values contain
only `provider` and `reference` strings. Catalog map values contain `id`, `title`.
Memberships contain `resource`, `catalog`; directed relations contain `from`,
`to`, `type`. Tags map resource IDs to unique nonempty labels. Every reference
must resolve inside the graph. Map keys must equal entity IDs. UUID-generated
resource IDs never derive from names or provider references. Export/import
supports at most 8 MiB and individual text values at most 1,000,000 characters.

References are opaque metadata, never permission grants. Local references use
portable slash-separated paths within a grant identifier when supplied by the
companion. Editing/importing a reference does not authorize reading it. Do not
store credentials in notes or reference URLs; exports contain all user metadata.
Strict fields reject accidental credential fields, but cannot infer secrets
inside user-authored free text.

`GraphStore(path)` uses Python standard-library SQLite, schema `user_version=1`,
a single canonical graph row and durable integer revision. Existing v1 JSON
imports require no format translation. Future SQLite versions fail closed;
there are no speculative migrations. SQLite FULL synchronization and immediate
write transactions serialize edits across processes. Each mutation accepts an
optional expected revision; a stale writer receives `CatalogError("CONFLICT")`.
Exceptions and invalid imports roll back the entire edit. Snapshot reads return
detached data. SQLite transaction boundaries do not encompass content filesystem
operations, which require separate operation receipts and reconciliation.

API: `snapshot() -> {revision, data}`, `read() -> Catalog`,
`mutate(action, args, expected_revision=None) -> {result, revision, data}`.
Actions: add/update/delete resource or catalog, assign/unassign membership,
tag/untag, link/unlink, update_locator, import. Argument names match Catalog
methods. Import requires `{data: object-or-JSON-string}` and explicitly replaces
the entire graph: it never silently merges colliding identities. Deleting a
resource removes referencing memberships/tags/relations, but never deletes
provider content. Deleting a catalog preserves its resources.

After a successful provider move, `update_locator(provider, old_reference,
new_reference)` preserves stable IDs, memberships, notes and relations for the
exact reference and descendants. Copying content does not automatically merge
or reassign logical identities. A missing/offline locator remains metadata.

Proof: `tests/test_catalog.py` and `tests/test_graph_store.py` exercise persistence,
portable exports, concurrent independent SQLite connections, rollback, stale
revision conflict, corrupt imports, unsupported schema versions and identity
continuity. Cross-machine synchronization, content digests, structured provenance,
tombstones, automatic merge resolution, clusters as separate entities and large
graph indexing remain future work.
