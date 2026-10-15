"""Small implementation-independent behavioral reference for ATLAS catalogs.

Not a privileged filesystem helper and not a provider adapter. Data is purely
user-supplied metadata; no file paths are opened and no network calls occur.
Format v1 is experimental. Never store secrets in catalog exports.
"""
from __future__ import annotations
import copy
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
        self.data = copy.deepcopy(state) if state is not None else {
            "format": self.FORMAT, "resources": {}, "catalogs": {},
            "memberships": [], "relations": [], "tags": {}
        }
        self._check()

    def _check(self):
        """Validate the complete v1 metadata contract, including imported data.

        Unknown fields are rejected to prevent accidentally exporting credentials
        or silently accepting a future format without a migration.
        """
        d = self.data
        if not isinstance(d, dict) or d.get("format") != self.FORMAT:
            raise CatalogError("UNSUPPORTED_FORMAT")
        if set(d) != {"format", "resources", "catalogs", "memberships", "relations", "tags"}:
            raise CatalogError("INVALID_FIELDS")
        for k in ("resources", "catalogs", "tags"):
            if not isinstance(d.get(k), dict):
                raise CatalogError("INVALID_" + k.upper())
        for k in ("memberships", "relations"):
            if not isinstance(d.get(k), list):
                raise CatalogError("INVALID_" + k.upper())
        for rid, item in d["resources"].items():
            if (not _text(rid, nonempty=True) or not isinstance(item, dict)
                    or set(item) != {"id", "kind", "title", "note", "locators"}
                    or item.get("id") != rid or not _text(item.get("kind"), nonempty=True)
                    or not _text(item.get("title")) or not _text(item.get("note"))):
                raise CatalogError("INVALID_RESOURCE")
            _locators(item["locators"])
        for cid, item in d["catalogs"].items():
            if (not _text(cid, nonempty=True) or not isinstance(item, dict)
                    or set(item) != {"id", "title"} or item.get("id") != cid
                    or not _text(item.get("title"), nonempty=True)):
                raise CatalogError("INVALID_CATALOG")
        seen = set()
        for m in d["memberships"]:
            if (not isinstance(m, dict) or set(m) != {"resource", "catalog"}
                    or not isinstance(m.get("resource"), str) or not isinstance(m.get("catalog"), str)
                    or m["resource"] not in d["resources"] or m["catalog"] not in d["catalogs"]):
                raise CatalogError("BROKEN_MEMBERSHIP")
            key = (m["resource"], m["catalog"])
            if key in seen:
                raise CatalogError("DUPLICATE_MEMBERSHIP")
            seen.add(key)
        seen = set()
        for rel in d["relations"]:
            if (not isinstance(rel, dict) or set(rel) != {"from", "to", "type"}
                    or not isinstance(rel.get("from"), str) or not isinstance(rel.get("to"), str)
                    or rel["from"] not in d["resources"] or rel["to"] not in d["resources"]
                    or not _text(rel.get("type"), nonempty=True)):
                raise CatalogError("BROKEN_RELATION")
            key = (rel["from"], rel["to"], rel["type"])
            if key in seen:
                raise CatalogError("DUPLICATE_RELATION")
            seen.add(key)
        for resource_id, taglist in d["tags"].items():
            if (resource_id not in d["resources"] or not isinstance(taglist, list)
                    or any(not _text(t, nonempty=True) for t in taglist)
                    or len(taglist) != len(set(taglist))):
                raise CatalogError("INVALID_TAGS")

    def add_resource(self, kind, title, locators=None, note=""):
        if not isinstance(kind, str) or not kind.strip() or not isinstance(title, str):
            raise CatalogError("INVALID_RESOURCE")
        if not isinstance(note, str) or not isinstance(locators if locators is not None else [], list):
            raise CatalogError("INVALID_RESOURCE")
        locators = locators if locators is not None else []
        if any(not isinstance(x, dict) or not isinstance(x.get("provider"), str) or not isinstance(x.get("reference"), str) for x in locators):
            raise CatalogError("INVALID_LOCATOR")
        _locators(locators)
        rid = _id()
        self.data["resources"][rid] = {"id": rid, "kind": kind, "title": title, "note": note, "locators": copy.deepcopy(locators)}
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
        body = json.dumps(self.data, sort_keys=True, ensure_ascii=False, indent=2) + "\n"
        if len(body.encode("utf-8")) > 8 * 1024 * 1024:
            raise CatalogError("EXPORT_TOO_LARGE")
        return body

    @classmethod
    def load(cls, path):
        return cls.from_json(Path(path).read_text(encoding="utf-8"))

    @classmethod
    def from_json(cls, text):
        if not isinstance(text, str) or len(text.encode("utf-8")) > 8 * 1024 * 1024:
            raise CatalogError("IMPORT_TOO_LARGE")
        def pairs(items):
            result = {}
            for key, value in items:
                if key in result:
                    raise CatalogError("DUPLICATE_JSON_KEY")
                result[key] = value
            return result
        try:
            return cls(json.loads(text, object_pairs_hook=pairs))
        except (json.JSONDecodeError, RecursionError) as exc:
            raise CatalogError("INVALID_JSON") from exc

    def update_resource(self, resource, title=None, note=None, locators=None):
        if resource not in self.data["resources"]:
            raise CatalogError("UNKNOWN_RESOURCE")
        item = self.data["resources"][resource]
        if title is not None:
            if not _text(title):
                raise CatalogError("INVALID_RESOURCE")
            item["title"] = title
        if note is not None:
            if not _text(note):
                raise CatalogError("INVALID_RESOURCE")
            item["note"] = note
        if locators is not None:
            _locators(locators)
            item["locators"] = copy.deepcopy(locators)

    def delete_resource(self, resource):
        if resource not in self.data["resources"]:
            raise CatalogError("UNKNOWN_RESOURCE")
        del self.data["resources"][resource]
        self.data["tags"].pop(resource, None)
        self.data["memberships"] = [m for m in self.data["memberships"] if m["resource"] != resource]
        self.data["relations"] = [r for r in self.data["relations"] if resource not in (r["from"], r["to"])]

    def update_catalog(self, catalog, title):
        if catalog not in self.data["catalogs"] or not _text(title, nonempty=True):
            raise CatalogError("INVALID_CATALOG")
        self.data["catalogs"][catalog]["title"] = title

    def delete_catalog(self, catalog):
        if catalog not in self.data["catalogs"]:
            raise CatalogError("UNKNOWN_CATALOG")
        del self.data["catalogs"][catalog]
        self.data["memberships"] = [m for m in self.data["memberships"] if m["catalog"] != catalog]

    def unassign(self, resource, catalog):
        self.data["memberships"] = [m for m in self.data["memberships"] if m != {"resource": resource, "catalog": catalog}]

    def untag(self, resource, tag):
        if resource not in self.data["resources"]:
            raise CatalogError("UNKNOWN_RESOURCE")
        self.data["tags"][resource] = [t for t in self.data["tags"].get(resource, []) if t != tag]

    def unlink(self, source, target, relation_type):
        self.data["relations"] = [r for r in self.data["relations"] if r != {"from": source, "to": target, "type": relation_type}]

    def update_locator(self, provider, old_reference, new_reference):
        """Reconcile a successful move; authorization remains outside the graph.

        Prefixes use portable slash-separated opaque references, never resolve
        or open local paths. Offline references retain their resource identities.
        """
        if not all(_text(x, nonempty=True) for x in (provider, old_reference, new_reference)):
            raise CatalogError("INVALID_LOCATOR")
        changed = []
        prefix = old_reference.rstrip("/") + "/"
        for resource in self.data["resources"].values():
            for locator in resource["locators"]:
                reference = locator["reference"]
                if locator["provider"] == provider and (reference == old_reference or reference.startswith(prefix)):
                    locator["reference"] = new_reference.rstrip("/") + reference[len(old_reference.rstrip("/")):]
                    changed.append(resource["id"])
        return list(dict.fromkeys(changed))

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


def _text(value, nonempty=False):
    return isinstance(value, str) and len(value) <= 1_000_000 and (not nonempty or bool(value.strip()))


def _locators(value):
    if not isinstance(value, list):
        raise CatalogError("INVALID_LOCATOR")
    for locator in value:
        if (not isinstance(locator, dict) or set(locator) != {"provider", "reference"}
                or not _text(locator.get("provider"), nonempty=True)
                or not _text(locator.get("reference"), nonempty=True)):
            raise CatalogError("INVALID_LOCATOR")
