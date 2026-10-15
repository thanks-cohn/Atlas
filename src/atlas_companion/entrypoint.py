"""One entry contract for source and standalone Linux companion distributions."""
import os
from pathlib import Path
import sys


def command(*arguments):
    """Fixed-runtime subprocess argv; frozen executables cannot use Python -m."""
    if getattr(sys, 'frozen', False):
        return [sys.executable, *map(str, arguments)]
    return [sys.executable, '-m', 'atlas_companion.entrypoint', *map(str, arguments)]


def main():
    arguments = sys.argv[1:]
    if os.name == 'nt':
        from .windows_entrypoint import main as windows_main
        return windows_main(arguments)
    if arguments and arguments[0] == '--native':
        from atlas_native.__main__ import main as native_main
        sys.argv = [sys.argv[0], *arguments[1:]]
        return native_main()
    command_index = 2 if len(arguments) >= 3 and arguments[0] == '--state-dir' else 0
    if len(arguments) > command_index and arguments[command_index] == 'supervise':
        from .supervisor import main as supervisor_main
        supervisor_arguments = list(arguments)
        del supervisor_arguments[command_index]
        sys.argv = [sys.argv[0], *supervisor_arguments]
        return supervisor_main()
    if len(arguments) > command_index and arguments[command_index] == 'install':
        from .install import main as install_main
        return install_main(arguments[:command_index] + arguments[command_index + 1:])
    if not arguments or '--desktop' in arguments:
        import argparse
        parser = argparse.ArgumentParser(description='ATLAS companion management')
        parser.add_argument('--desktop', action='store_true')
        parser.add_argument('--state-dir', default=str(Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local/share'))) / 'atlas'))
        options = parser.parse_args(arguments)
        from .desktop import main as desktop_main
        return desktop_main(options.state_dir)
    from .__main__ import main as cli_main
    return cli_main()


if __name__ == '__main__':
    raise SystemExit(main())
