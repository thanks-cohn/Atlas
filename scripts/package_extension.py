#!/usr/bin/env python3
"""Create a reproducible, unsigned Chrome extension ZIP; does not install/publish."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'extension'
ALLOWED = {'.json', '.html', '.css', '.js', '.svg', '.png', '.webp', '.woff2'}


def main():
    manifest = json.loads((SOURCE / 'manifest.json').read_text())
    if manifest.get('manifest_version') != 3:
        raise SystemExit('Expected a Chrome Manifest V3 extension')
    version = manifest['version']
    if not all(c in '0123456789.' for c in version):
        raise SystemExit('Unexpected extension version')
    files = []
    for path in sorted(SOURCE.rglob('*')):
        if path.is_symlink():
            raise SystemExit('Refusing to package symlinks')
        if path.is_file():
            if path.suffix not in ALLOWED:
                raise SystemExit(f'Unexpected asset type: {path.name}')
            files.append(path)
    destination = ROOT / 'dist' / f'atlas-extension-{version}.zip'
    destination.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            info = zipfile.ZipInfo(path.relative_to(SOURCE).as_posix(), (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            info.create_system = 3
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    print(json.dumps({'file': str(destination.relative_to(ROOT)), 'files': len(files),
                      'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
                      'status': 'unsigned development ZIP; browser runtime and Store approval are separate'}, indent=2))


if __name__ == '__main__':
    main()
