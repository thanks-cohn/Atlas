"""Explicit per-user Windows installation. Enrollment never grants directories."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
import uuid

HOST = 'org.atlas.companion'


def _state_api():
    from .windows_state import WindowsState, secure_directory
    return WindowsState, secure_directory


def _registry(browser):
    if browser not in ('chrome', 'chromium'):
        raise ValueError('Browser must be chrome or chromium')
    return 'Software\\' + ('Google\\Chrome' if browser == 'chrome' else 'Chromium') + '\\NativeMessagingHosts\\' + HOST


def _digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _write(path, data):
    with path.open('xb') as stream:
        stream.write(data.encode('utf-8') if isinstance(data, str) else data)
        stream.flush()
        os.fsync(stream.fileno())


def installation_directory():
    if getattr(sys, 'frozen', False):
        candidate = Path(sys.executable).absolute().parent
        if (candidate / 'installation.json').is_file():
            return candidate
    return Path(os.environ['LOCALAPPDATA']) / 'Programs' / 'Atlas'


def _registration(key, value=None, remove=False):
    import winreg
    if remove:
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, key)
        except FileNotFoundError:
            pass
        return
    if value is None:
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key) as handle:
                return winreg.QueryValueEx(handle, '')[0]
        except FileNotFoundError:
            return None
    with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, key, 0, winreg.KEY_SET_VALUE) as handle:
        winreg.SetValueEx(handle, '', 0, winreg.REG_SZ, str(value))


def _unlink(path, missing_ok=False):
    """Allow the frozen bootloader a bounded interval to release its image."""
    deadline = time.monotonic() + 2
    while True:
        try:
            path.unlink(missing_ok=missing_ok)
            return
        except PermissionError:
            if time.monotonic() >= deadline:
                raise
            time.sleep(0.05)


def _quiesce(state, directory, receipt):
    """Stop opt-in recovery and only an authenticated owned helper image."""
    from .windows_supervisor import startup
    from .windows_runtime import RuntimeLock, stop_attested_service
    from .security import APIError
    startup(state, receipt['extension_id'], 17892, 'uninstall', install_dir=directory)
    deadline = time.monotonic() + 2
    while True:
        try:
            with RuntimeLock(state, 'supervisor'):
                break
        except APIError as exc:
            if exc.code != 'ALREADY_RUNNING' or time.monotonic() >= deadline:
                raise
            time.sleep(0.05)
    try:
        signed = json.loads(state._guard.read('service.identity', 4096))
        executable = Path(signed['identity']['exe'])
        owned = receipt['owned'].get(str(executable))
        if executable == Path(receipt['runtime']):
            owned = receipt['runtime_sha256']
        if executable.parent != directory or executable.is_symlink() or not owned or _digest(executable) != owned:
            return
        # This helper verifies the HMAC, SID, fixed port, state identity and live
        # process incarnation using a retained kernel handle before termination.
        stop_attested_service(state, 17892)
    except (APIError, OSError, KeyError, TypeError, ValueError):
        # Missing/dead/invalid attestations never authorize a process kill.
        # An executable still in use makes the subsequent unlink fail closed.
        return


def install_runtime(extension_id, browser='chrome', state_dir=None, install_dir=None, *, binary=None, upgrade=False):
    if sys.platform != 'win32':
        raise ValueError('Windows installer requires Windows')
    if not isinstance(extension_id, str) or not re.fullmatch('[a-p]{32}', extension_id):
        raise ValueError('Expected exact Chrome extension ID (32 letters a-p)')
    State, secure_directory = _state_api()
    directory = Path(install_dir or installation_directory()).absolute()
    secure_directory(directory)
    state_dir = Path(state_dir or Path(os.environ['LOCALAPPDATA']) / 'Atlas').absolute()
    config, manifest = directory / 'native.json', directory / (HOST + '.json')
    native = directory / 'atlas-native.exe'
    receipt_path = directory / 'installation.json'
    source = Path(binary or sys.executable)
    if not (binary or getattr(sys, 'frozen', False)):
        raise ValueError('Windows installation requires the standalone executable; build on Windows first')
    if source.is_symlink() or not source.is_file() or source.read_bytes()[:2] != b'MZ':
        raise ValueError('Runtime must be a Windows PE executable')
    digest = _digest(source)
    runtime = directory / ('atlas-' + digest[:20] + '.exe')
    outputs = [config, manifest, native]
    previous = None
    if receipt_path.exists():
        if not upgrade or receipt_path.is_symlink():
            raise ValueError('Existing installation requires explicit --upgrade')
        previous = json.loads(receipt_path.read_text(encoding='utf-8'))
        if previous.get('extension_id') != extension_id or previous.get('registry_key') != _registry(browser) or previous.get('state_dir') != str(state_dir):
            raise ValueError('Upgrade cannot change extension, browser or state identity')
    old_registration = _registration(_registry(browser))
    if old_registration is not None and (not previous or old_registration != str(manifest)):
        raise ValueError('Existing native host registration belongs to another installation')
    for path in outputs:
        if path.exists() or path.is_symlink():
            expected = (previous or {}).get('owned', {}).get(str(path))
            if path.is_symlink() or not expected or _digest(path) != expected:
                raise ValueError('Refusing to overwrite modified or unowned file: ' + str(path))
    if runtime.exists():
        if runtime.is_symlink() or _digest(runtime) != digest:
            raise ValueError('Installed runtime digest mismatch')
    else:
        _write(runtime, source.read_bytes())
    documents = {config: json.dumps({'extension_id': extension_id, 'state_dir': str(state_dir)}),
                 manifest: json.dumps({'name': HOST, 'description': 'ATLAS authorized local companion', 'type': 'stdio',
                                       'path': str(native), 'allowed_origins': ['chrome-extension://' + extension_id + '/']}, indent=2),
                 native: source.read_bytes()}
    backups = {path: path.read_bytes() for path in outputs if path.exists()}
    if previous:
        previous_state = State(state_dir)
        try:
            _quiesce(previous_state, directory, previous)
        finally:
            previous_state.close()
    created = []
    try:
        for path, data in documents.items():
            if path.exists():
                _unlink(path)
            created.append(path)
            _write(path, data)
        state = State(state_dir)
        try:
            state.protect_path(directory)
            state.pair(extension_id)
        finally:
            state.close()
        _registration(_registry(browser), manifest)
        receipt = {'schema': 1, 'extension_id': extension_id, 'state_dir': str(state_dir), 'mode': 'standalone-windows',
                   'registry_key': _registry(browser), 'manifest': str(manifest), 'runtime': str(runtime), 'runtime_sha256': digest,
                   'owned': {str(path): _digest(path) for path in outputs}, 'previous_runtime': (previous or {}).get('runtime')}
        pending = directory / ('.installation-' + uuid.uuid4().hex + '.json')
        try:
            _write(pending, json.dumps(receipt, indent=2))
            os.replace(pending, receipt_path)
        finally:
            pending.unlink(missing_ok=True)
    except Exception:
        if old_registration is None:
            _registration(_registry(browser), remove=True)
        else:
            _registration(_registry(browser), old_registration)
        for path in created:
            _unlink(path, missing_ok=True)
        for path, data in backups.items():
            if path in created:
                _write(path, data)
        raise
    return {'paths': [str(config), str(native), str(manifest)], 'launcher': str(runtime), 'receipt': str(receipt_path)}


def uninstall(install_dir, *, revoke=True):
    State, secure_directory = _state_api()
    directory = Path(install_dir).absolute()
    secure_directory(directory)
    receipt_path = directory / 'installation.json'
    if receipt_path.is_symlink():
        raise ValueError('Invalid receipt')
    receipt = json.loads(receipt_path.read_text(encoding='utf-8'))
    registered = _registration(receipt['registry_key'])
    if registered is not None and registered != receipt['manifest']:
        raise ValueError('Native registration changed; refusing to remove it')
    removed, retained = [], []
    deletable = []
    for name, digest in receipt['owned'].items():
        path = Path(name)
        if path.parent != directory or path.is_symlink() or (path.exists() and _digest(path) != digest):
            retained.append(name)
        elif path.exists():
            deletable.append(path)
    state = State(receipt['state_dir'])
    try:
        _quiesce(state, directory, receipt)
        for path in deletable:
            _unlink(path)
            removed.append(str(path))
    except BaseException:
        state.close()
        raise
    if registered is not None:
        _registration(receipt['registry_key'], remove=True)
    try:
        if revoke:
            state.revoke_client(receipt['extension_id'])
    finally:
        state.close()
    receipt_path.unlink()
    return {'removed': removed, 'retained_modified': retained, 'state_preserved': True, 'runtime_preserved': receipt['runtime']}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extension-id', required=True)
    parser.add_argument('--browser', choices=['chrome', 'chromium'], default='chrome')
    parser.add_argument('--state-dir', type=Path)
    parser.add_argument('--install-dir', type=Path)
    parser.add_argument('--binary', type=Path)
    parser.add_argument('--upgrade', action='store_true')
    parser.add_argument('--consent', action='store_true')
    args = parser.parse_args(argv)
    if not args.consent:
        parser.error('Explicit --consent is required; installation grants no directories')
    print(json.dumps(install_runtime(args.extension_id, args.browser, args.state_dir, args.install_dir, binary=args.binary, upgrade=args.upgrade), indent=2))
    return 0
