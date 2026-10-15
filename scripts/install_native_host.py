#!/usr/bin/env python3
"""Explicit per-user Linux Chrome/Chromium bootstrap install; grants remain separate."""
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
from atlas_companion.state import State
from atlas_companion.security import APIError, open_absolute_directory


def install(extension_id, install_dir, manifest_dir, state_dir):
    if not re.fullmatch('[a-p]{32}', extension_id):
        raise ValueError('Expected the exact Chrome extension ID (32 letters a-p)')
    if sys.platform != 'linux':
        raise ValueError('This installer supports Linux only; Windows installation is not implemented')
    for directory in (install_dir, manifest_dir):
        if directory.is_symlink():
            raise ValueError('Install directories cannot be symlinks')
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        descriptor = open_absolute_directory(str(directory))
        try:
            info = os.fstat(descriptor)
            if info.st_uid != os.getuid() or info.st_mode & 0o022:
                raise ValueError('Installation directories must be owned by this user and not writable by others')
        finally:
            os.close(descriptor)
    paths = [install_dir / 'native.json', install_dir / 'atlas-native', manifest_dir / 'org.atlas.companion.json']
    if any(path.exists() or path.is_symlink() for path in paths):
        raise ValueError('Installation files already exist; inspect and remove explicitly before reinstalling')
    state = State(state_dir)
    # Explicit installer consent binds this identity only, and never grants any folder.
    state.pair(extension_id)
    config, launcher, manifest = paths
    documents = {
        config: json.dumps({'extension_id': extension_id, 'state_dir': str(state.directory)}),
        launcher: '#!/bin/sh\nexec env PYTHONPATH=' + shlex.quote(str(ROOT / 'src')) + ' ' + shlex.quote(sys.executable) + ' -m atlas_native ' + shlex.quote(str(config)) + ' "$@"\n',
        manifest: json.dumps({'name': 'org.atlas.companion', 'description': 'ATLAS explicitly authorized local companion',
                              'path': str(launcher), 'type': 'stdio',
                              'allowed_origins': ['chrome-extension://' + extension_id + '/']}, indent=2),
    }
    for path, content in documents.items():
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o700 if path == launcher else 0o600)
        with os.fdopen(fd, 'w') as stream:
            stream.write(content + '\n')
    return paths


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extension-id', required=True)
    parser.add_argument('--consent', action='store_true', help='Explicitly authorize this exact extension to wake and authenticate the companion')
    parser.add_argument('--browser', choices=['chrome', 'chromium'], default='chrome')
    parser.add_argument('--state-dir', type=Path, default=Path.home() / '.local/share/atlas')
    parser.add_argument('--install-dir', type=Path, default=Path.home() / '.local/share/atlas/native')
    args = parser.parse_args()
    if not args.consent:
        parser.error('Read the README security and grant instructions, then pass --consent to install explicitly')
    browser = 'google-chrome' if args.browser == 'chrome' else 'chromium'
    manifest_dir = Path.home() / '.config' / browser / 'NativeMessagingHosts'
    try:
        paths = install(args.extension_id, args.install_dir.absolute(), manifest_dir, args.state_dir.absolute())
    except (APIError, OSError, ValueError) as exc:
        parser.exit(1, f'ATLAS native installation failed: {exc}\n')
    print('Installed exact-origin Linux native host. No folders were granted.')
    print('Grant each desired narrow root separately with python -m atlas_companion grant PATH [--write].')
    print('Keep this checkout and Python interpreter in place. Uninstall by removing these files:')
    for path in paths:
        print(path)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
