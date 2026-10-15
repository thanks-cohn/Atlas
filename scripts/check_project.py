#!/usr/bin/env python3
"""Dependency-free ATLAS smoke verification, NOT upstream Forever Works conformance."""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "forever"
KINDS = {"intent": "intent", "capabilities": "capability", "invariants": "invariant",
         "constraints": "constraint", "dependencies": "dependency", "decisions": "decision",
         "compatibility": "compatibility", "migrations": "migration",
         "implementations": "implementation", "evidence": "evidence"}
REF_FIELDS = {"relatedCapabilities", "relatedConstraints", "relatedInvariants",
              "relatedImplementations", "relatedEntities", "scope", "mustSurvive", "mayChange",
              "revisitConditions", "alternativesConsidered", "assumptions"}
def main():
    manifest = json.loads((MODEL / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("foreverVersion") != "0.1" or manifest.get("projectId") != "atlas":
        raise ValueError("invalid model identity")
    records = {}
    for group, paths in manifest["records"].items():
        if group not in KINDS or not isinstance(paths, list):
            raise ValueError("invalid record group")
        for path in paths:
            rel = Path(path)
            if rel.is_absolute() or ".." in rel.parts or rel.suffix != ".json":
                raise ValueError("unsafe model path")
            item = json.loads((MODEL / rel).read_text(encoding="utf-8"))
            if item.get("kind") != KINDS[group] or item.get("foreverVersion") != "0.1":
                raise ValueError(f"wrong kind/version: {path}")
            ident = item.get("id")
            if not ident or ident in records:
                raise ValueError(f"duplicate/missing record ID: {ident}")
            records[ident] = item
    for ident, item in records.items():
        for field in REF_FIELDS:
            for ref in item.get(field, []):
                if ref not in records:
                    raise ValueError(f"broken reference: {ident}.{field} -> {ref}")
    print(f"ATLAS local model linkage: {len(records)} records valid (not normative schema proof)")
    env = dict(os.environ)
    env["PYTHONPATH"] = str(ROOT / "src")
    completed = subprocess.run(
        [sys.executable, "-m", "unittest", "discover", "-s", str(ROOT / "tests"), "-v"],
        cwd=ROOT, env=env, check=False)
    if completed.returncode:
        raise SystemExit(completed.returncode)
    print("ATLAS prototype tests: command succeeded; real native/browser acceptance not executed")

if __name__ == "__main__":
    main()
