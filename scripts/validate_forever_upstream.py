#!/usr/bin/env python3
"""Read-only validation against an independently checked-out, pinned upstream.

Usage: python scripts/validate_forever_upstream.py /path/to/forever-works
Requires jsonschema==4.26.0 for the independent Draft 2020-12 oracle.
No network calls, installation, or changes to either checkout are performed.
"""
import argparse
import hashlib
import importlib.metadata
import platform
import json
from pathlib import Path
import subprocess
import sys

PIN = 'ebeb65f786ba0d9ba0e730dddd8047937348257a'
ROOT = Path(__file__).resolve().parents[1]


def main():
    from jsonschema import Draft202012Validator
    from referencing import Registry, Resource
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('upstream_checkout', type=Path)
    upstream = parser.parse_args().upstream_checkout.resolve()
    actual = subprocess.check_output(['git', '-C', str(upstream), 'rev-parse', 'HEAD'], text=True).strip()
    if actual != PIN:
        raise SystemExit(f'Expected upstream commit {PIN}; got {actual}')
    # Refuse dirty validator/schema sources; the commit alone cannot attest bytes.
    dirty = subprocess.check_output(['git', '-C', str(upstream), 'status', '--porcelain', '--untracked-files=no'], text=True)
    if dirty:
        raise SystemExit('Upstream tracked files modified; use a clean pinned checkout')
    sys.path.insert(0, str(upstream / 'bindings/python'))
    from foreverworks.model import load_model
    model = load_model(ROOT / 'forever')
    errors = model.validate()
    if errors:
        raise SystemExit(json.dumps(errors, indent=2))
    schemas = {}
    registry = Registry()
    for path in sorted((upstream / 'spec/schemas').glob('*.schema.json')):
        schema = json.loads(path.read_text())
        Draft202012Validator.check_schema(schema)
        schemas[path.name] = schema
        registry = registry.with_resource(schema['$id'], Resource.from_contents(schema))
    mapping = {'intent': 'project-intent', 'capability': 'capability', 'invariant': 'invariant',
               'constraint': 'constraint', 'decision': 'decision', 'dependency': 'dependency-intent',
               'compatibility': 'compatibility-contract', 'migration': 'migration',
               'implementation': 'implementation', 'evidence': 'evidence'}
    manifest = json.loads((ROOT / 'forever/manifest.json').read_text())
    files = ['manifest.json'] + [p for group in manifest['records'].values() for p in group]
    digests = {}
    for name in files:
        path = ROOT / 'forever' / name
        raw = path.read_bytes()
        record = json.loads(raw)
        schema_name = 'manifest' if name == 'manifest.json' else mapping[record['kind']]
        Draft202012Validator(schemas[schema_name + '.schema.json'], registry=registry).validate(record)
        digests['forever/' + name] = hashlib.sha256(raw).hexdigest()
    print(json.dumps({'upstream': 'https://github.com/thanks-cohn/forever-works',
                      'upstreamCommit': PIN, 'upstreamValidator': 'PASS',
                      'environment': {'python': platform.python_version(), 'os': platform.system(),
                                      'jsonschema': importlib.metadata.version('jsonschema')},
                      'draft202012Schema': 'PASS', 'recordCount': len(files) - 1,
                      'sha256': digests,
                      'scope': 'Canonical model only; no runtime, product completion, or security claim'}, indent=2))


if __name__ == '__main__':
    main()
