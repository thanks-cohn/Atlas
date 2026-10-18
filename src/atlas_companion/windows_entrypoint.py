"""Windows-only installed companion entry: native framing, GUI, HTTP and consented startup."""
import argparse
import json
import os
from pathlib import Path
import re
import sys


def _hide_owned_console():
    """Hide a GUI-owned console, including its same-image onefile bootloader.

    Never hide the user's CMD/PowerShell console or another application's console.
    """
    try:
        import ctypes
        from ctypes import wintypes as w
        from .windows_state import windows_api, token_sid
        kernel,_=windows_api()
        kernel.GetConsoleWindow.restype=w.HWND
        processes=(w.DWORD*8)()
        count=kernel.GetConsoleProcessList(processes,8)
        if not 0<count<=8:return
        kernel.OpenProcess.argtypes=[w.DWORD,w.BOOL,w.DWORD];kernel.OpenProcess.restype=w.HANDLE
        kernel.QueryFullProcessImageNameW.argtypes=[w.HANDLE,w.DWORD,w.LPWSTR,ctypes.POINTER(w.DWORD)]
        own_sid=token_sid();own_image=os.path.normcase(str(Path(sys.executable).absolute()))
        for pid in list(processes)[:count]:
            process=kernel.OpenProcess(0x1000,False,pid)
            if not process:return
            try:
                size=w.DWORD(32768);image=ctypes.create_unicode_buffer(size.value)
                if token_sid(process)!=own_sid or not kernel.QueryFullProcessImageNameW(process,0,image,ctypes.byref(size)):
                    return
                if os.path.normcase(image.value)!=own_image:return
            finally:kernel.CloseHandle(process)
        window=kernel.GetConsoleWindow()
        if window:
            user=ctypes.WinDLL('user32',use_last_error=True)
            user.ShowWindow.argtypes=[w.HWND,ctypes.c_int];user.ShowWindow(window,0)
    except OSError:
        pass


def launch_arguments(arguments, executable):
    arguments = list(arguments)
    if Path(executable).name.lower() == 'debug.exe' and not arguments:
        return ['--desktop', '--advanced']
    return arguments


def native_arguments(arguments, executable):
    """Only the exact native image names accept Chrome's fixed origin invocation."""
    if re.fullmatch(r'atlas-native(?:-[a-f0-9]{20})?\.exe', Path(executable).name.lower()) and arguments and arguments[0].startswith('chrome-extension://'):
        origin = arguments[0]
        if len(arguments) > 2 or (len(arguments) == 2 and not re.fullmatch(r'--parent-window=\d+', arguments[1])):
            raise ValueError('Invalid native browser invocation.')
        return ['--native', str(Path(executable).with_name('native.json')), origin]
    return arguments


def _main(arguments=None):
    if os.name != 'nt':
        raise OSError('This entry requires an actual Windows host.')
    arguments = launch_arguments(sys.argv[1:] if arguments is None else arguments, sys.executable)
    if arguments == ['--recover']:
        # Keep the per-user Run command short enough for Windows' 260-character
        # limit. Configuration comes only from this verified installed runtime.
        if not getattr(sys, 'frozen', False):
            raise ValueError('Login recovery requires an installed standalone runtime.')
        from .windows_install import _digest
        from .windows_state import secure_directory
        runtime = Path(sys.executable).absolute()
        secure_directory(runtime.parent)
        receipt_path = runtime.with_name('installation.json')
        if receipt_path.is_symlink():
            raise ValueError('Invalid login recovery receipt.')
        receipt = json.loads(receipt_path.read_text(encoding='utf-8'))
        if (receipt.get('schema') != 1 or receipt.get('mode') != 'standalone-windows'
                or os.path.normcase(os.path.abspath(receipt.get('runtime', ''))) != os.path.normcase(str(runtime))
                or receipt.get('runtime_sha256') != _digest(runtime)
                or not re.fullmatch('[a-p]{32}', receipt.get('extension_id', ''))):
            raise ValueError('Login recovery runtime identity differs from its installation.')
        from .windows_supervisor import main as supervisor_main
        return supervisor_main(['--state-dir', receipt['state_dir'], '--extension-id', receipt['extension_id'],
                                '--port', '17892', 'run'])
    arguments = native_arguments(arguments, sys.executable)
    if arguments and arguments[0] == '--native':
        from atlas_native.__main__ import main as native_main
        sys.argv = [sys.argv[0], *arguments[1:]]
        return native_main()
    command_index = 2 if len(arguments) >= 3 and arguments[0] == '--state-dir' else 0
    if len(arguments) > command_index and arguments[command_index] == 'install':
        from .windows_install import main as install_main
        return install_main(arguments[:command_index] + arguments[command_index+1:])
    if len(arguments) > command_index and arguments[command_index] == 'supervise':
        from .windows_supervisor import main as supervisor_main
        return supervisor_main(arguments[:command_index] + arguments[command_index+1:])
    from .windows_state import WindowsState
    default = str(Path(os.environ.get('LOCALAPPDATA', str(Path.home() / 'AppData/Local'))) / 'Atlas')
    installed_identity = None
    if getattr(sys, 'frozen', False):
        receipt = Path(sys.executable).with_name('installation.json')
        if receipt.is_file():
            installation = json.loads(receipt.read_text(encoding='utf-8'))
            default = installation['state_dir']
            installed_identity = installation.get('extension_id')
    launch_failed = False
    if not arguments:
        # A previously consented automatic setup starts quietly on normal launches.
        # Explicit --desktop always opens management/diagnostics.
        from .windows_supervisor import startup
        state = WindowsState(default)
        try:
            with state.connect() as db:
                enrolled = [row['origin'].removeprefix('chrome-extension://') for row in db.execute('SELECT origin FROM clients')]
            if installed_identity in enrolled:
                enrolled = [installed_identity]
            if len(enrolled) == 1 and startup(state, enrolled[0], 17892, 'status')['status'] == 'ENABLED':
                startup(state, enrolled[0], 17892, 'enable', consent=True)
                from .desktop import diagnose
                import time
                deadline = time.monotonic() + 45
                while time.monotonic() < deadline:
                    if diagnose(state)['state'] == 'READY':
                        _hide_owned_console()
                        return 0
                    time.sleep(0.25)
                launch_failed = True
        except Exception:
            launch_failed = True  # A failed launch falls through to the repair/setup window.
        finally:
            state.close()
    if not arguments or '--desktop' in arguments:
        parser = argparse.ArgumentParser(description='ATLAS Windows Companion management')
        parser.add_argument('--desktop', action='store_true')
        parser.add_argument('--advanced', action='store_true')
        parser.add_argument('--state-dir', default=default)
        options = parser.parse_args(arguments)
        from .desktop import main as desktop_main
        return desktop_main(options.state_dir, advanced=options.advanced or launch_failed)
    parser = argparse.ArgumentParser(description='ATLAS Windows Companion — explicit native grants and authenticated recovery')
    parser.add_argument('--state-dir', default=default)
    commands = parser.add_subparsers(dest='command', required=True)
    serve = commands.add_parser('serve'); serve.add_argument('--port', type=int, default=17892)
    grant = commands.add_parser('grant'); grant.add_argument('root'); grant.add_argument('--label')
    grant.add_argument('--write', action='store_true'); grant.add_argument('--allow-broad', action='store_true')
    pair = commands.add_parser('pair'); pair.add_argument('--extension-id', required=True)
    revoke = commands.add_parser('revoke'); choice = revoke.add_mutually_exclusive_group(required=True)
    choice.add_argument('--grant'); choice.add_argument('--extension-id')
    commands.add_parser('grants'); commands.add_parser('doctor')
    args = parser.parse_args(arguments)
    from .security import APIError
    try:
        state = WindowsState(args.state_dir)
        if args.command == 'serve':
            from .server import Server
            from .windows_filesystem import Provider
            from .windows_runtime import RuntimeLock, write_service_identity
            with RuntimeLock(state, 'service'):
                server = Server(state, args.port, provider_factory=Provider)
                write_service_identity(state, server.server_port)
                print(f'ATLAS Windows companion ready on 127.0.0.1:{server.server_port}', flush=True)
                try:
                    server.serve_forever(poll_interval=0.2)
                except KeyboardInterrupt:
                    pass
                finally:
                    server.server_close()
        elif args.command == 'grant':
            print(json.dumps({'grant': state.grant(args.root, args.label, args.write, allow_broad=args.allow_broad)}))
        elif args.command == 'grants':
            print(json.dumps({'grants': state.grants()}))
        elif args.command == 'pair':
            print(state.pair(args.extension_id))
        elif args.command == 'revoke':
            state.revoke_grant(args.grant) if args.grant else state.revoke_client(args.extension_id)
        elif args.command == 'doctor':
            from .desktop import diagnose
            result = diagnose(state);print(json.dumps(result));return 0 if result['state']=='READY' else 1
    except (APIError, OSError, ValueError) as exc:
        print('ATLAS Windows: ' + str(exc), file=sys.stderr)
        return 1
    return 0


def main(arguments=None):
    if os.name != 'nt':
        raise OSError('This entry requires an actual Windows host.')
    arguments = launch_arguments(sys.argv[1:] if arguments is None else arguments, sys.executable)
    if arguments and '--desktop' not in arguments:
        return _main(arguments)
    _hide_owned_console()
    # Acquire before quiet-start readiness polling, not only after Tk opens.
    from .windows_state import WindowsState
    from .windows_runtime import RuntimeLock
    from .security import APIError
    default = Path(os.environ.get('LOCALAPPDATA', str(Path.home() / 'AppData/Local'))) / 'Atlas'
    receipt = Path(sys.executable).with_name('installation.json')
    if getattr(sys, 'frozen', False) and receipt.is_file():
        default = Path(json.loads(receipt.read_text(encoding='utf-8'))['state_dir'])
    if '--state-dir' in arguments:
        default = Path(arguments[arguments.index('--state-dir')+1])
    state = WindowsState(default)
    try:
        try:
            with RuntimeLock(state, 'launch'):
                return _main(arguments)
        except APIError as exc:
            if exc.code != 'ALREADY_RUNNING':
                raise
            from .windows_focus import existing_setup
            existing_setup()
            _hide_owned_console()
            return 0
    finally:
        state.close()
