#!/usr/bin/env python3
"""Build the unsigned Windows standalone target on Windows, never cross-claim."""
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    if sys.platform != 'win32':
        raise SystemExit('Build this target on Windows')
    if importlib.metadata.version('pyinstaller') != '6.16.0':
        raise SystemExit('Use pinned PyInstaller==6.16.0')
    output = ROOT / 'dist/windows'
    subprocess.run([sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile',
                    '--name', 'atlas-companion', '--paths', str(ROOT / 'src'),
                    '--collect-submodules', 'atlas_companion', '--collect-submodules', 'atlas_native',
                    '--collect-submodules', 'atlas_core', '--hidden-import', 'tkinter',
                    '--hidden-import', 'tkinter.filedialog', '--hidden-import', 'tkinter.messagebox',
                    '--distpath', str(output), '--workpath', str(ROOT / 'build/windows'),
                    '--specpath', str(ROOT / 'build/windows'), str(ROOT / 'packaging/companion_entry.py')], check=True)
    binary = output / 'atlas-companion.exe'
    source = hashlib.sha256()
    for path in sorted((ROOT / 'src').rglob('*.py')):
        source.update(path.relative_to(ROOT).as_posix().encode() + b'\0' + path.read_bytes())
    receipt = {'source_sha256': source.hexdigest(), 'artifact': binary.name,
               'sha256': hashlib.sha256(binary.read_bytes()).hexdigest(), 'bytes': binary.stat().st_size,
               'platform': platform.platform(), 'architecture': platform.machine(), 'python': platform.python_version(),
               'pyinstaller': '6.16.0', 'status': 'unsigned Windows development build; actual Chrome and Windows 10/11 lifecycle NOT_RUN'}
    (output / 'BUILD_RECEIPT.json').write_text(json.dumps(receipt, indent=2) + '\n')
    (output / 'SHA256SUMS').write_text(receipt['sha256'] + '  ' + binary.name + '\n')
    (output / 'README.md').write_bytes((ROOT / 'packaging/WINDOWS.md').read_bytes())
    archive = output / ('atlas-companion-windows-' + platform.machine() + '.zip')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
        for item in (binary, output / 'README.md', output / 'BUILD_RECEIPT.json', output / 'SHA256SUMS'):
            package.write(item, item.name)
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
