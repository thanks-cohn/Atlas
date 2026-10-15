import json
import tempfile
import unittest
from pathlib import Path
from atlas_core import Catalog, CatalogError

class CatalogTests(unittest.TestCase):
    def test_cross_provider_relationship_persists(self):
        c = Catalog()
        b = c.add_resource("bookmark", "Aircraft", [{"provider": "web", "reference": "https://example.org/a"}])
        l = c.add_resource("image", "Wing", [{"provider": "local", "reference": "granted-root:wing.png"}])
        r = c.add_resource("pdf", "Plans", [{"provider": "r2", "reference": "research/plans.pdf"}])
        cat = c.add_catalog("Aircraft Research")
        for item in (b, l, r):
            c.assign(item, cat)
        c.assign(b, cat)
        c.tag(b, "aircraft")
        c.tag(b, "aircraft")
        c.link(b, l, "reference-for")
        c.link(b, r, "reference-for")
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "catalog.json"
            c.save(path)
            restored = Catalog.load(path)
            self.assertEqual({m["id"] for m in restored.members(cat)}, {b,l,r})
            self.assertEqual(len(restored.data["relations"]), 2)
            self.assertEqual(restored.data["tags"][b], ["aircraft"])
            self.assertEqual(restored.export(), c.export())

    def test_unknown_reference_denied(self):
        c = Catalog()
        with self.assertRaises(CatalogError):
            c.link("missing", "missing", "related-to")
        with self.assertRaises(CatalogError):
            c.assign("missing", "missing")

    def test_corrupt_import_denied(self):
        c = Catalog()
        r = c.add_resource("bookmark", "Hello")
        c.data["relations"].append({"from": r, "to": "missing", "type": "reference-for"})
        with self.assertRaisesRegex(CatalogError, "BROKEN_RELATION"):
            c.export()

    def test_id_not_location(self):
        c = Catalog()
        r = c.add_resource("image", "Photo", [
            {"provider": "local", "reference": "root:photo.jpg"},
            {"provider": "r2", "reference": "assets/photo.jpg"}])
        self.assertEqual(len(c.data["resources"]), 1)
        self.assertEqual(c.data["resources"][r]["id"], r)

if __name__ == "__main__":
    unittest.main()
