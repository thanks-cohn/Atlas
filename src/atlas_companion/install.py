"""Explicit per-user installation; owned immutable runtimes, no folder grants."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import sys
import tempfile
import uuid

from .security import APIError, open_absolute_directory
from .state import State


HOST = 'org.atlas.companion'


def private_directory(path):
    path = Path(path).absolute()
    if path.is_symlink():
        raise ValueError('Install directories cannot be symlinks')
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = open_absolute_directory(str(path))
    try:
        info = os.fstat(fd)
        if info.st_uid != os.getuid() or info.st_mode & 0o022:
            raise ValueError('Installation directories must be owned by this user and not writable by others')
    finally:
        os.close(fd)
    return path


def write_new(path, value, mode=0o600):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, mode)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(value.encode() if isinstance(value, str) else value)
        stream.flush()
        os.fsync(stream.fileno())


def _digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _desktop_quote(value):
    return '"' + str(value).replace('%', '%%').replace('\\', '\\\\').replace('"', '\\"').replace('`', '\\`').replace('$', '\\$') + '"'


def install(extension_id, install_dir, manifest_dir, state_dir, *, binary=None, desktop_dir=None, upgrade=False):
    """Legacy four-argument API; returns config, native launcher, host manifest.

    Source mode snapshots all own Python sources into the installation. Frozen
    mode copies the current executable. Neither mode depends on checkout paths.
    Existing files are refused unless explicit upgrade verifies their ownership.
    """
    if not isinstance(extension_id, str) or not re.fullmatch('[a-p]{32}', extension_id):
        raise ValueError('Expected the exact Chrome extension ID (32 letters a-p)')
    if sys.platform != 'linux':
        raise ValueError('This installer supports Linux only')
    install_dir = private_directory(install_dir)
    manifest_dir = private_directory(manifest_dir)
    state_dir = Path(state_dir).absolute()
    desktop_dir = private_directory(desktop_dir) if desktop_dir is not None else None
    config, native, manifest = install_dir / 'native.json', install_dir / 'atlas-native', manifest_dir / (HOST + '.json')
    application = install_dir / 'atlas'
    desktop = (desktop_dir / 'org.atlas.Companion.desktop') if desktop_dir else None
    receipt_path = install_dir / 'installation.json'
    outputs = [config, native, manifest, application] + ([desktop] if desktop else [])
    previous = None
    if receipt_path.exists() or receipt_path.is_symlink():
        if not upgrade or receipt_path.is_symlink():
            raise ValueError('Installation already exists; use explicit --upgrade after review')
        previous = json.loads(receipt_path.read_text())
        if previous.get('extension_id') != extension_id:
            raise ValueError('Upgrade cannot silently change extension identity; uninstall first')
        if set(previous.get('owned', {})) != {str(path) for path in outputs}:
            raise ValueError('Changing registered browser or desktop paths requires explicit uninstall first')
        startup = Path(os.environ.get('XDG_CONFIG_HOME', str(Path.home() / '.config'))) / 'systemd/user/atlas-supervisor.service'
        if startup.exists() or startup.is_symlink():
            raise ValueError('Remove optional login startup using the previous installed companion before upgrading; then explicitly enable it again after upgrade')
    for path in outputs:
        if path.exists() or path.is_symlink():
            expected = (previous or {}).get('owned', {}).get(str(path))
            if path.is_symlink() or not expected or _digest(path) != expected:
                raise ValueError('Existing or modified user file would be overwritten: ' + str(path))
    # Prepare immutable content-addressed payload before binding any authority.
    source_binary = Path(binary or sys.executable) if binary or getattr(sys, 'frozen', False) else None
    if source_binary is not None:
        if source_binary.is_symlink() or not source_binary.is_file() or source_binary.read_bytes()[:4] != b'\x7fELF':
            raise ValueError('Standalone runtime must be an ELF binary, not a symlink')
        digest = _digest(source_binary)
        release = install_dir / ('runtime-' + digest[:20])
        if release.exists():
            if release.is_symlink() or _digest(release) != digest:
                raise ValueError('Installed runtime differs from its expected digest')
        else:
            write_new(release, source_binary.read_bytes(), 0o700)
        runtime = [str(release)]
        mode = 'standalone-linux'
    else:
        source = Path(__file__).resolve().parents[1]
        files = sorted(p for package in ('atlas_companion', 'atlas_native', 'atlas_core')
                       for p in (source / package).rglob('*.py'))
        h = hashlib.sha256()
        for path in files:
            if path.is_symlink():
                raise ValueError('Source payload cannot contain symlinks')
            h.update(str(path.relative_to(source)).encode() + b'\0' + path.read_bytes())
        digest = h.hexdigest()
        release = install_dir / ('source-' + digest[:20])
        if not release.exists():
            stage = Path(tempfile.mkdtemp(prefix='.staging-', dir=install_dir))
            try:
                for path in files:
                    destination = stage / path.relative_to(source)
                    destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                    write_new(destination, path.read_bytes())
                os.rename(stage, release)
            finally:
                if stage.exists():
                    shutil.rmtree(stage)
        else:
            if release.is_symlink():
                raise ValueError('Source payload cannot be a symlink')
            for path in files:
                dest = release / path.relative_to(source)
                if dest.is_symlink() or not dest.is_file() or dest.read_bytes() != path.read_bytes():
                    raise ValueError('Existing source payload modified')
        runtime = ['env', 'PYTHONPATH=' + str(release), sys.executable, '-m', 'atlas_companion.entrypoint']
        mode = 'source-snapshot-requires-python'
    argv = ' '.join(shlex.quote(x) for x in runtime)
    documents = {
        config: json.dumps({'extension_id': extension_id, 'state_dir': str(state_dir)}),
        native: '#!/bin/sh\nexec ' + argv + ' --native ' + shlex.quote(str(config)) + ' "$@"\n',
        application: '#!/bin/sh\nif [ "$#" -eq 0 ]; then set -- --desktop; fi\nexec ' + argv + ' --state-dir ' + shlex.quote(str(state_dir)) + ' "$@"\n',
        manifest: json.dumps({'name': HOST, 'description': 'ATLAS explicitly authorized local companion',
                              'path': str(native), 'type': 'stdio',
                              'allowed_origins': ['chrome-extension://' + extension_id + '/']}, indent=2),
    }
    if desktop:
        documents[desktop] = '[Desktop Entry]\nType=Application\nName=ATLAS Companion\nComment=Manage authorized folders and local explorer access\nExec=' + _desktop_quote(application) + '\nTerminal=false\nCategories=Utility;FileManager;\n'
    backups = {}
    created = []
    try:
        for path, value in documents.items():
            if path.exists():
                backups[path] = (path.read_bytes(), path.stat().st_mode & 0o777)
                path.unlink()
            write_new(path, value, 0o700 if path in (native, application) else 0o600)
            created.append(path)
        state = State(state_dir)
        state.protect_path(install_dir)
        state.protect_path(manifest)
        if desktop:
            state.protect_path(desktop)
        state.pair(extension_id)  # Consent binds caller; never grants roots.
        receipt = {'schema': 1, 'extension_id': extension_id, 'state_dir': str(state_dir),
                   'mode': mode, 'runtime': str(release), 'runtime_sha256': digest,
                   'owned': {str(p): _digest(p) for p in outputs},
                   'previous_runtime': (previous or {}).get('runtime')}
        pending_receipt = install_dir / ('.installation-' + uuid.uuid4().hex + '.json')
        try:
            write_new(pending_receipt, json.dumps(receipt, indent=2) + '\n')
            os.replace(pending_receipt, receipt_path)
        finally:
            pending_receipt.unlink(missing_ok=True)
    except Exception:
        for path in reversed(created):
            path.unlink(missing_ok=True)
        for path, (data, permission) in backups.items():
            write_new(path, data, permission)
        raise
    return [config, native, manifest]


def installation_directory():
    """Locate this exact installed runtime's receipt, else XDG application home."""
    if getattr(sys, 'frozen', False):
        runtime = Path(sys.executable).absolute()
        candidate = runtime.parent
    else:
        runtime = Path(__file__).resolve().parents[1]
        candidate = runtime.parent if runtime.name.startswith('source-') else None
    if candidate is not None:
        receipt = candidate / 'installation.json'
        if receipt.is_file() and not receipt.is_symlink():
            try:
                if json.loads(receipt.read_text()).get('runtime') == str(runtime):
                    return candidate
            except (OSError, ValueError):
                pass
    return Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local/share'))) / 'atlas-companion'


def install_runtime(extension_id, browser='chrome', state_dir=None, install_dir=None, *, binary=None, upgrade=False):
    data = Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local/share')))
    config = Path(os.environ.get('XDG_CONFIG_HOME', str(Path.home() / '.config')))
    if browser not in ('chrome', 'chromium'):
        raise ValueError('Browser must be chrome or chromium')
    state_dir = Path(state_dir) if state_dir else data / 'atlas'
    install_dir = Path(install_dir) if install_dir else installation_directory()
    paths = install(extension_id, install_dir, config / ('google-chrome' if browser == 'chrome' else 'chromium') / 'NativeMessagingHosts',
                    state_dir, binary=binary, desktop_dir=data / 'applications', upgrade=upgrade)
    return {'paths': [str(p) for p in paths], 'launcher': str(install_dir.absolute() / 'atlas'),
            'receipt': str(install_dir.absolute() / 'installation.json')}


def uninstall(install_dir, *, revoke=True):
    """Remove only unchanged registered owned files; preserve all user data/runtime."""
    install_dir = private_directory(install_dir)
    receipt_path = install_dir / 'installation.json'
    if receipt_path.is_symlink():
        raise ValueError('Invalid installation receipt')
    receipt = json.loads(receipt_path.read_text())
    # Disable only the exact known owned startup unit before removing its launcher.
    # A mismatched/modified unit or unavailable manager blocks uninstall safely.
    from .supervisor import startup
    startup(State(receipt['state_dir']), receipt['extension_id'], 17892, 'uninstall')
    removed, retained = [], []
    for name, digest in receipt['owned'].items():
        path = Path(name)
        if path.is_symlink() or (path.exists() and _digest(path) != digest):
            retained.append(name)
        elif path.exists():
            path.unlink()
            removed.append(name)
    if revoke:
        State(receipt['state_dir']).revoke_client(receipt['extension_id'])
    receipt_path.unlink()
    return {'removed': removed, 'retained_modified': retained, 'state_preserved': True,
            'runtime_preserved': receipt['runtime']}


def main(argv=None):
    parser = argparse.ArgumentParser(description='Explicit per-user ATLAS Linux companion installation')
    parser.add_argument('--extension-id', required=True)
    parser.add_argument('--consent', action='store_true')
    parser.add_argument('--browser', choices=['chrome', 'chromium'], default='chrome')
    parser.add_argument('--state-dir', type=Path)
    parser.add_argument('--install-dir', type=Path)
    parser.add_argument('--binary', type=Path, help='Standalone atlas-companion ELF to copy')
    parser.add_argument('--upgrade', action='store_true', help='Replace only verified installer-owned files; retain old runtime')
    args = parser.parse_args(argv)
    if not args.consent:
        parser.error('Explicit installation requires --consent; no folders are granted')
    try:
        result = install_runtime(args.extension_id, args.browser, args.state_dir, args.install_dir,
                                 binary=args.binary, upgrade=args.upgrade)
    except (APIError, OSError, ValueError, RuntimeError) as exc:
        parser.exit(1, f'ATLAS installation failed: {exc}\n')
    print(json.dumps(result, indent=2))
    print('Installed without folder grants. Use the ATLAS Companion desktop application to grant selected folders.')
    return 0
