import concurrent.futures
import copy
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from atlas_core import Catalog, CatalogError, GraphStore


class GraphStoreTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "graph.sqlite3"
        self.store = GraphStore(self.path)

    def add(self, title="File"):
        return self.store.mutate("add_resource", {"kind": "file", "title": title})["result"]

    def test_restart_portable_export_and_detached_reads(self):
        resource = self.add()
        catalog = self.store.mutate("add_catalog", {"title": "Research"})["result"]
        self.store.mutate("assign", {"resource": resource, "catalog": catalog})
        self.store.mutate("tag", {"resource": resource, "tag": "aircraft"})
        self.store.mutate("update_resource", {"resource": resource, "note": "Notes survive"})
        restarted = GraphStore(self.path)
        self.assertEqual(restarted.revision, 5)
        snapshot = restarted.read()
        self.assertEqual(snapshot.members(catalog)[0]["id"], resource)
        self.assertEqual(snapshot.data["tags"][resource], ["aircraft"])
        self.assertEqual(Catalog.from_json(snapshot.export()).export(), snapshot.export())
        snapshot.delete_resource(resource)
        self.assertIn(resource, restarted.read().data["resources"])

    def test_concurrent_process_equivalent_connections_no_lost_updates(self):
        def write(number):
            GraphStore(self.path).mutate("add_resource", {"kind": "file", "title": str(number)})
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            list(executor.map(write, range(32)))
        self.assertEqual(len(self.store.read().data["resources"]), 32)
        self.assertEqual(self.store.revision, 32)

    def test_revision_conflict_and_transaction_rollback(self):
        initial = self.store.snapshot()
        self.add()
        with self.assertRaisesRegex(CatalogError, "CONFLICT"):
            self.store.mutate("add_catalog", {"title": "Old tab"}, expected_revision=initial["revision"])
        def broken(catalog):
            catalog.add_catalog("Must roll back")
            raise RuntimeError("interrupted")
        with self.assertRaises(RuntimeError):
            self.store.transaction(broken)
        self.assertEqual(self.store.revision, 1)
        self.assertEqual(self.store.read().data["catalogs"], {})

    def test_corrupted_import_rolls_back_without_dropping_good_data(self):
        self.add()
        before = self.store.snapshot()
        malformed = copy.deepcopy(before["data"])
        malformed["relations"].append({"from": [], "to": "bad", "type": "x"})
        with self.assertRaises(CatalogError):
            self.store.mutate("import", {"data": malformed})
        self.assertEqual(self.store.snapshot(), before)
        for value in ('{"format":"atlas.catalog.v1","format":"atlas.catalog.v1"}', '{broken'):
            with self.assertRaises(CatalogError):
                self.store.mutate("import", {"data": value})
        self.assertEqual(self.store.snapshot(), before)

    def test_delete_cascades_metadata_only(self):
        first, second = self.add("First"), self.add("Second")
        catalog = self.store.mutate("add_catalog", {"title": "Catalog"})["result"]
        self.store.mutate("assign", {"resource": first, "catalog": catalog})
        self.store.mutate("tag", {"resource": first, "tag": "tag"})
        self.store.mutate("link", {"source": first, "target": second, "relation_type": "reference-for"})
        self.store.mutate("delete_resource", {"resource": first})
        data = self.store.read().data
        self.assertEqual(data["relations"], [])
        self.assertEqual(data["memberships"], [])
        self.assertEqual(data["tags"], {})
        self.assertIn(second, data["resources"])
        self.assertIn(catalog, data["catalogs"])

    def test_moves_preserve_identity_notes_tags_and_descendants(self):
        first = self.store.mutate("add_resource", {"kind": "file", "title": "Child", "locators": [
            {"provider": "local", "reference": "grant:folder/child.txt"}]})["result"]
        other = self.store.mutate("add_resource", {"kind": "file", "title": "Sibling", "locators": [
            {"provider": "local", "reference": "grant:folder-other/child.txt"}]})["result"]
        self.store.mutate("tag", {"resource": first, "tag": "Keep"})
        self.store.mutate("link", {"source": first, "target": other, "relation_type": "related"})
        result = self.store.update_locator("local", "grant:folder", "grant:moved")
        self.assertEqual(result["result"], [first])
        data = GraphStore(self.path).read().data
        self.assertEqual(data["resources"][first]["locators"][0]["reference"], "grant:moved/child.txt")
        self.assertEqual(data["resources"][other]["locators"][0]["reference"], "grant:folder-other/child.txt")
        self.assertEqual(data["tags"][first], ["Keep"])
        self.assertEqual(data["relations"][0]["from"], first)

    def test_future_store_version_not_silently_overwritten(self):
        with sqlite3.connect(self.path) as connection:
            connection.execute("PRAGMA user_version=99")
        with self.assertRaisesRegex(CatalogError, "UNSUPPORTED_STORE_VERSION"):
            GraphStore(self.path)

    def test_explicit_import_replacement_preserves_ids(self):
        original = Catalog()
        resource = original.add_resource("bookmark", "Bookmark", [{"provider": "web", "reference": "https://example.org"}])
        self.store.mutate("import", {"data": original.export()})
        self.assertIn(resource, self.store.read().data["resources"])
        self.assertEqual(self.store.read().export(), original.export())


class CatalogValidationTests(unittest.TestCase):
    def test_nested_corruption_rejected(self):
        good = Catalog()
        resource = good.add_resource("file", "Safe", [{"provider": "local", "reference": "root:file"}])
        for field, value in (("note", 3), ("title", []), ("kind", ""), ("locators", [{"provider": "local", "reference": "root:file", "token": "secret"}])):
            state = copy.deepcopy(good.data)
            state["resources"][resource][field] = value
            with self.subTest(field=field), self.assertRaises(CatalogError):
                Catalog(state)
        state = copy.deepcopy(good.data)
        state["token"] = "never export"
        with self.assertRaises(CatalogError):
            Catalog(state)

    def test_caller_cannot_mutate_supplied_state_or_locators(self):
        locators = [{"provider": "web", "reference": "https://example.org"}]
        catalog = Catalog()
        resource = catalog.add_resource("bookmark", "Example", locators)
        locators[0]["reference"] = "changed"
        self.assertEqual(catalog.data["resources"][resource]["locators"][0]["reference"], "https://example.org")
        state = catalog.data
        copied = Catalog(state)
        state["resources"].clear()
        self.assertIn(resource, copied.data["resources"])
