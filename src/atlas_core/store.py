"""Transactional, portable metadata storage. Never stores grants or tokens.

SQLite schema version 1 stores the unchanged atlas.catalog.v1 export atomically.
Each accepted mutation advances a durable revision; optimistic expected_revision
prevents overwriting edits made by another tab/process. JSON exports need no
SQLite dependency to reconstruct meaning. No filesystem content is opened here.
"""
from __future__ import annotations
from contextlib import contextmanager
import sqlite3
from pathlib import Path
from .catalog import Catalog, CatalogError


class GraphStore:
    SCHEMA_VERSION = 1
    ACTIONS = frozenset({"add_resource", "add_catalog", "update_resource", "delete_resource",
                         "update_catalog", "delete_catalog", "assign", "unassign", "tag",
                         "untag", "link", "unlink", "update_locator"})

    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            version = connection.execute("PRAGMA user_version").fetchone()[0]
            if version not in (0, self.SCHEMA_VERSION):
                raise CatalogError("UNSUPPORTED_STORE_VERSION")
            connection.execute("CREATE TABLE IF NOT EXISTS graph (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, body TEXT NOT NULL)")
            connection.execute("INSERT OR IGNORE INTO graph VALUES (1, 0, ?)", (Catalog().export(),))
            connection.execute("PRAGMA user_version=1")
            Catalog.from_json(connection.execute("SELECT body FROM graph WHERE id=1").fetchone()[0])
        # Metadata may include private notes and locators. Keep newly owned stores
        # private without copying any privileged credentials into graph exports.
        self.path.chmod(0o600)

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(self.path, timeout=15)
        try:
            connection.execute("PRAGMA synchronous=FULL")
            with connection:
                yield connection
        finally:
            connection.close()

    def snapshot(self):
        with self._connect() as connection:
            revision, body = connection.execute("SELECT revision, body FROM graph WHERE id=1").fetchone()
        return {"revision": revision, "data": Catalog.from_json(body).data}

    @property
    def revision(self):
        return self.snapshot()["revision"]

    def read(self):
        return Catalog(self.snapshot()["data"])

    def transaction(self, callback, expected_revision=None):
        """Run trusted domain callback in a write transaction; roll back on error.

        Callbacks must not perform filesystem effects: graph and filesystem
        transactions are distinct boundaries requiring operation reconciliation.
        """
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            revision, body = connection.execute("SELECT revision, body FROM graph WHERE id=1").fetchone()
            if expected_revision is not None and (type(expected_revision) is not int or expected_revision != revision):
                raise CatalogError("CONFLICT")
            catalog = Catalog.from_json(body)
            result = callback(catalog)
            body = catalog.export()
            connection.execute("UPDATE graph SET revision=?, body=? WHERE id=1", (revision + 1, body))
            return {"result": result, "revision": revision + 1, "data": catalog.data}

    def mutate(self, action, args=None, expected_revision=None):
        if not isinstance(action, str) or action not in self.ACTIONS | {"import"}:
            raise CatalogError("UNSUPPORTED_ACTION")
        if args is None:
            args = {}
        if not isinstance(args, dict):
            raise CatalogError("INVALID_ARGUMENTS")
        def apply(catalog):
            if action == "import":
                # Explicit full replacement, never an implicit identity merge.
                if set(args) != {"data"}:
                    raise CatalogError("INVALID_ARGUMENTS")
                imported = Catalog.from_json(args["data"]) if isinstance(args["data"], str) else Catalog(args["data"])
                catalog.data = imported.data
                return None
            try:
                return getattr(catalog, action)(**args)
            except TypeError as exc:
                raise CatalogError("INVALID_ARGUMENTS") from exc
        return self.transaction(apply, expected_revision)

    def update_locator(self, provider, old_reference, new_reference):
        return self.mutate("update_locator", {"provider": provider, "old_reference": old_reference, "new_reference": new_reference})
