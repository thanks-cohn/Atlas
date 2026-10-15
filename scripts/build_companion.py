#!/usr/bin/env python3
"""Build an unsigned, self-contained Linux binary with pinned PyInstaller.

Run using an isolated interpreter with packaging/requirements-build.txt installed.
Dependency installation keeps normal TLS/package verification; no downloads here.
"""
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import subprocess
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    if sys.platform != 'linux':
        raise SystemExit('This build target supports Linux only')
    if importlib.metadata.version('pyinstaller') != '6.16.0':
        raise SystemExit('Use pinned PyInstaller==6.16.0')
    # Some embedded Python runtimes do not expose Tcl/Tk via ldconfig. Bundle
    # the authoritative libraries beside that interpreter explicitly.
    extra = []
    for library in sorted((Path(sys.base_prefix) / 'lib').glob('libtcl*.so')):
        extra += ['--add-binary', str(library) + ':.']
    subprocess.run([sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile',
                    '--name', 'atlas-companion', '--paths', str(ROOT / 'src'),
                    '--collect-submodules', 'atlas_companion', '--collect-submodules', 'atlas_native',
                    '--hidden-import', 'tkinter', '--hidden-import', 'tkinter.filedialog', '--hidden-import', 'tkinter.messagebox',
                    '--distpath', str(ROOT / 'dist/linux'), '--workpath', str(ROOT / 'build/companion'),
                    '--specpath', str(ROOT / 'build/companion'), str(ROOT / 'packaging/companion_entry.py'), *extra], check=True)
    binary = ROOT / 'dist/linux/atlas-companion'
    source = hashlib.sha256()
    for path in sorted((ROOT / 'src').rglob('*.py')):
        source.update(path.relative_to(ROOT).as_posix().encode() + b'\0' + path.read_bytes())
    receipt = {'source_sha256': source.hexdigest(), 'artifact': 'atlas-companion', 'sha256': hashlib.sha256(binary.read_bytes()).hexdigest(),
               'bytes': binary.stat().st_size, 'platform': platform.platform(),
               'architecture': platform.machine(), 'python': platform.python_version(),
               'pyinstaller': '6.16.0', 'status': 'unsigned Linux development build; no Windows or distribution-signing claim'}
    (binary.parent / 'BUILD_RECEIPT.json').write_text(json.dumps(receipt, indent=2) + '\n')
    (binary.parent / 'SHA256SUMS').write_text(receipt['sha256'] + '  atlas-companion\n')
    archive = binary.parent / ('atlas-companion-linux-' + platform.machine() + '.tar.gz')
    readme = (ROOT / 'packaging/README.md').read_bytes()
    (binary.parent / 'README.md').write_bytes(readme)
    with tarfile.open(archive, 'w:gz') as package:
        for item in (binary, binary.parent / 'README.md', binary.parent / 'BUILD_RECEIPT.json', binary.parent / 'SHA256SUMS'):
            package.add(item, arcname=item.name, recursive=False)
    archive_hash = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix(archive.suffix + '.sha256').write_text(archive_hash + '  ' + archive.name + '\n')
    print(json.dumps({**receipt, 'archive': archive.name, 'archive_sha256': archive_hash}, indent=2))


if __name__ == '__main__':
    main()
