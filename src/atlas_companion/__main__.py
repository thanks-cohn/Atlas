"""Explicit user-consented configuration. Nothing is granted through HTTP."""
import argparse
import json
import os
import sys
from pathlib import Path

from .security import APIError, require_platform
from .state import State


def main():
    parser = argparse.ArgumentParser(description='ATLAS Linux local companion (explicit grants, manual pairing)')
    parser.add_argument('--state-dir', default=str(Path.home() / '.local/share/atlas'), help='Private persistent configuration directory')
    sub = parser.add_subparsers(dest='command', required=True)
    serve = sub.add_parser('serve', help='Run authenticated loopback service')
    serve.add_argument('--port', type=int, default=17892)
    grant = sub.add_parser('grant', help='Explicitly authorize a folder; read-only unless --write')
    grant.add_argument('root')
    grant.add_argument('--label')
    grant.add_argument('--write', action='store_true', help='Consent to copy, move, rename, mkdir and recoverable trash in this root')
    pair = sub.add_parser('pair', help='Authorize an exact extension ID and display a new one-time pairing token')
    pair.add_argument('--extension-id', required=True)
    revoke = sub.add_parser('revoke', help='Revoke a folder grant or paired extension')
    group = revoke.add_mutually_exclusive_group(required=True)
    group.add_argument('--grant')
    group.add_argument('--extension-id')
    sub.add_parser('grants', help='List configured folder grants')
    args = parser.parse_args()
    try:
        require_platform()
        os.umask(0o077)
        state = State(args.state_dir)
        if args.command == 'serve':
            from .server import Server
            server = Server(state, args.port)
            print(f'ATLAS atlas.local.v1 listening on 127.0.0.1:{server.server_port}; Ctrl+C to stop.', flush=True)
            try:
                server.serve_forever(poll_interval=0.2)
            except KeyboardInterrupt:
                pass
            finally:
                server.server_close()
        elif args.command == 'grant':
            print(json.dumps({'grant': state.grant(args.root, args.label, args.write), 'writable': args.write}))
        elif args.command == 'pair':
            token = state.pair(args.extension_id)
            print('Paste this token into the ATLAS extension Connect dialog. It is shown only now; pairing again rotates it.')
            print(token)
        elif args.command == 'revoke':
            if args.grant:
                state.revoke_grant(args.grant)
            else:
                state.revoke_client(args.extension_id)
            print('Revoked.')
        elif args.command == 'grants':
            print(json.dumps({'grants': state.grants()}, indent=2))
    except (APIError, OSError) as exc:
        print(f'ATLAS: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
