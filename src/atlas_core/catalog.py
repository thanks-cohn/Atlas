"""Small implementation-independent behavioral reference for ATLAS catalogs.

Not a privileged filesystem helper and not a provider adapter. Data is purely
user-supplied metadata; no file paths are opened and no network calls occur.
Format v1 is experimental. Never store secrets in catalog exports.
"""
from __future__ import annotations
import json
import os
import tempfile
import uuid
from pathlib import Path

class CatalogError(ValueError):
    pass

def _id():
    return uuid.uuid4().hex

class Catalog:
    FORMAT = "atlas.catalog.v1"
    def __init__(self, state=None):
        self.data = state if state is not None else {
            "format": self.FORMAT, "resources": {}, "catalogs": {},
            "memberships": [], "relations": [], "tags": {}
        }
        self._check()

    def _check(self):
        d = self.data
        if not isinstance(d, dict) or d.get("format") != self.FORMAT:
            raise CatalogError("UNSUPPORTED_FORMAT")
        for k in ("resources", "catalogs", "tags"):
            if not isinstance(d.get(k), dict):
                raise CatalogError("INVALID_" + k.upper())
        for k in ("memberships", "relations"):
            if not isinstance(d.get(k), list):
                raise CatalogError("INVALID_" + k.upper())
        for rid, item in d["resources"].items():
            if not isinstance(item, dict) or item.get("id") != rid or not isinstance(item.get("kind"), str):
                raise CatalogError("INVALID_RESOURCE")
        for cid, item in d["catalogs"].items():
            if not isinstance(item, dict) or item.get("id") != cid:
                raise CatalogError("INVALID_CATALOG")
        for m in d["memberships"]:
            if not isinstance(m, dict) or m.get("resource") not in d["resources"] or m.get("catalog") not in d["catalogs"]:
                raise CatalogError("BROKEN_MEMBERSHIP")
        for rel in d["relations"]:
            if not isinstance(rel, dict) or rel.get("from") not in d["resources"] or rel.get("to") not in d["resources"] or not isinstance(rel.get("type"), str):
                raise CatalogError("BROKEN_RELATION")
        for resource_id, taglist in d["tags"].items():
            if resource_id not in d["resources"] or not isinstance(taglist, list) or any(not isinstance(t, str) for t in taglist):
                raise CatalogError("INVALID_TAGS")

    def add_resource(self, kind, title, locators=None, note=""):
        if not isinstance(kind, str) or not kind.strip() or not isinstance(title, str):
            raise CatalogError("INVALID_RESOURCE")
        if not isinstance(note, str) or not isinstance(locators if locators is not None else [], list):
            raise CatalogError("INVALID_RESOURCE")
        locators = locators if locators is not None else []
        if any(not isinstance(x, dict) or not isinstance(x.get("provider"), str) or not isinstance(x.get("reference"), str) for x in locators):
            raise CatalogError("INVALID_LOCATOR")
        rid = _id()
        self.data["resources"][rid] = {"id": rid, "kind": kind, "title": title, "note": note, "locators": locators}
        return rid

    def add_catalog(self, title):
        if not isinstance(title, str) or not title.strip():
            raise CatalogError("INVALID_CATALOG")
        cid = _id()
        self.data["catalogs"][cid] = {"id": cid, "title": title}
        return cid

    def assign(self, resource, catalog):
        if resource not in self.data["resources"] or catalog not in self.data["catalogs"]:
            raise CatalogError("UNKNOWN_RESOURCE_OR_CATALOG")
        entry = {"resource": resource, "catalog": catalog}
        if entry not in self.data["memberships"]:
            self.data["memberships"].append(entry)

    def tag(self, resource, tag):
        if resource not in self.data["resources"] or not isinstance(tag, str) or not tag.strip():
            raise CatalogError("INVALID_TAG")
        tags = self.data["tags"].setdefault(resource, [])
        if tag not in tags:
            tags.append(tag)

    def link(self, source, target, relation_type):
        if source not in self.data["resources"] or target not in self.data["resources"]:
            raise CatalogError("UNKNOWN_RESOURCE")
        if not isinstance(relation_type, str) or not relation_type.strip():
            raise CatalogError("INVALID_RELATION")
        relation = {"from": source, "to": target, "type": relation_type}
        if relation not in self.data["relations"]:
            self.data["relations"].append(relation)

    def members(self, catalog):
        if catalog not in self.data["catalogs"]:
            raise CatalogError("UNKNOWN_CATALOG")
        ids = [m["resource"] for m in self.data["memberships"] if m["catalog"] == catalog]
        return [self.data["resources"][rid] for rid in ids]

    def export(self):
        self._check()
        return json.dumps(self.data, sort_keys=True, ensure_ascii=False, indent=2) + "\n"

    @classmethod
    def load(cls, path):
        return cls(json.loads(Path(path).read_text(encoding="utf-8")))

    def save(self, path):
        """Atomic replace in target directory. No concurrent-writer or fsync guarantee."""
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        data = self.export()
        name = None
        try:
            with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=target.parent,
                                             prefix=".atlas-", suffix=".tmp", delete=False) as f:
                name = f.name
                f.write(data)
                f.flush()
                os.fsync(f.fileno())
            os.replace(name, target)
        finally:
            if name and os.path.exists(name):
                os.unlink(name)
