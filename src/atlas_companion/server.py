"""Authenticated loopback transport. No ambient-cookie or CORS authorization."""
import json
import hashlib
import hmac
import re
import threading
import logging
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

from atlas_core import CatalogError, GraphStore
from . import PROTOCOL
from .filesystem import Provider, error
from .security import APIError
from .diagnostics import record, snapshot

MAX_BODY = 2 * 1024 * 1024


class Server(ThreadingHTTPServer):
    daemon_threads = True
    block_on_close = True

    def __init__(self, state, port=17892, provider_factory=None):
        self.state = state
        self._slots = threading.BoundedSemaphore(32)
        state.bootstrap_key()
        self.graph = GraphStore(state.directory / 'catalog.sqlite3')
        self.provider = (provider_factory or Provider)(state, self.graph)
        super().__init__(('127.0.0.1', port), Handler)

    def server_bind(self):
        if getattr(self.state, 'platform', 'linux') == 'windows':
            # Windows SO_REUSEADDR permits a second listener on an occupied
            # port. Exclusive ownership avoids ambiguous loopback routing.
            self.allow_reuse_address = False
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()

    def process_request(self, request, client_address):
        if not self._slots.acquire(blocking=False):
            self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except BaseException:
            self._slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            super().process_request_thread(request, client_address)
        finally:
            self._slots.release()

    def get_request(self):
        sock, addr = super().get_request()
        sock.settimeout(10)
        return sock, addr


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server_version = 'Atlas/1'
    sys_version = ''

    def log_message(self, format, *args):
        # No headers, credentials or request bodies in logs.
        logging.info('%s %s', self.command, self.path.split('?')[0][:120])

    def _origin(self):
        return self.headers.get('Origin', self.headers.get('X-Atlas-Extension-Origin', ''))

    def _gate(self, authenticate=True):
        if len(self.headers.get_all('Host', [])) != 1 or self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}':
            raise APIError('INVALID_HOST', 'Only the configured numeric loopback host is accepted.', 403)
        origins = self.headers.get_all('Origin', [])
        explicit = self.headers.get_all('X-Atlas-Extension-Origin', [])
        # Chrome extension workers can omit Origin on permission-authorized GETs.
        # The explicit identity is only a selector: bearer validation remains mandatory.
        fallback = (not origins and authenticate and len(explicit) == 1
                    and self.headers.get('Sec-Fetch-Site') == 'none')
        if (len(origins) > 1 or len(explicit) > 1
                or (not origins and not fallback)
                or (origins and explicit and origins[0] != explicit[0])
                or not re.fullmatch(r'chrome-extension://[a-p]{32}', self._origin())
                or not self.server.state.known_origin(self._origin())):
            raise APIError('INVALID_ORIGIN', 'Missing or unauthorized extension identity. Update the extension and authorize its exact ID in the companion.', 403)
        if self.headers.get('Sec-Fetch-Site') in ('same-origin', 'same-site'):
            # The accepted origin must be a Chrome extension, never a local web app.
            raise APIError('INVALID_CLIENT', 'Local website requests are not supported.', 403)
        if authenticate:
            auth = self.headers.get('Authorization', '')
            if len(self.headers.get_all('Authorization', [])) != 1 or not auth.startswith('Bearer ') or not self.server.state.authenticate(self._origin(), auth[7:]):
                raise APIError('UNPAIRED', 'Invalid or revoked pairing token.', 401)

    def _send(self, status, data):
        body = json.dumps(data, ensure_ascii=True, allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
        self.send_header('Vary', 'Origin')
        if self.server.state.known_origin(self._origin()):
            self.send_header('Access-Control-Allow-Origin', self._origin())
        self.end_headers()
        self.wfile.write(body)

    def _fail(self, exc):
        record(self.server.state, 'HTTP_GATE_OR_ROUTE', exc.code if isinstance(exc, APIError) else 'HTTP_INTERNAL_ERROR')
        self.close_connection = True
        if isinstance(exc, APIError):
            self._send(exc.status, {'ok': False, 'error': error(exc)})
        elif isinstance(exc, CatalogError):
            self._send(400, {'ok': False, 'error': {'code': str(exc), 'message': str(exc)}})
        elif isinstance(exc, (ValueError, TypeError, KeyError, UnicodeError, RecursionError)):
            self._send(400, {'ok': False, 'error': {'code': 'INVALID_REQUEST', 'message': 'Malformed request or invalid arguments.'}})
        elif isinstance(exc, OSError):
            self._send(400, {'ok': False, 'error': error(exc)})
        else:
            logging.exception('Companion request failed')
            self._send(500, {'ok': False, 'error': {'code': 'INTERNAL', 'message': 'Unexpected companion error; inspect local logs.'}})

    def do_OPTIONS(self):
        try:
            self._gate(False)
            if self.headers.get('Access-Control-Request-Method') not in ('GET', 'POST'):
                raise APIError('METHOD_DENIED', 'Only GET and POST are supported.', 405)
            requested = {h.strip().lower() for h in self.headers.get('Access-Control-Request-Headers', '').split(',') if h.strip()}
            if requested - {'authorization', 'content-type', 'x-atlas-extension-origin'}:
                raise APIError('HEADERS_DENIED', 'Unsupported preflight headers.', 403)
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', self._origin())
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST')
            self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Atlas-Extension-Origin')
            self.send_header('Access-Control-Max-Age', '300')
            self.end_headers()
        except Exception as exc:
            self._fail(exc)

    def do_GET(self):
        self._dispatch(False)

    def do_POST(self):
        self._dispatch(True)

    def _dispatch(self, post):
        try:
            proof_request = post and self.path == '/v1/bootstrap-proof'
            self._gate(not proof_request)
            if '?' in self.path or '#' in self.path or not self.path.startswith('/v1/'):
                raise APIError('NOT_FOUND', 'Unknown API route.', 404)
            body = {}
            if post:
                if self.headers.get('Transfer-Encoding') or len(self.headers.get_all('Content-Length', [])) != 1:
                    raise APIError('INVALID_LENGTH', 'Use a bounded Content-Length.', 411)
                if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
                    raise APIError('CONTENT_TYPE', 'Expected application/json.', 415)
                length = int(self.headers['Content-Length'])
                if length < 1 or length > MAX_BODY:
                    raise APIError('BODY_TOO_LARGE', 'Request body must be 1 byte–2 MiB.', 413)
                def pairs(items):
                    d = {}
                    for key, value in items:
                        if key in d:
                            raise ValueError('duplicate key')
                        d[key] = value
                    return d
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise APIError('INVALID_LENGTH', 'Request body was truncated.')
                body = json.loads(raw, object_pairs_hook=pairs, parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite')))
                if not isinstance(body, dict):
                    raise APIError('INVALID_REQUEST', 'Expected a JSON object.')
            if proof_request:
                nonce = body.get('nonce')
                if not isinstance(nonce, str) or not re.fullmatch('[a-f0-9]{64}', nonce):
                    raise APIError('INVALID_NONCE', 'Expected a 32-byte hexadecimal nonce.')
                proof = hmac.new(self.server.state.bootstrap_key(), b'atlas.native.v1:' + nonce.encode() + b':' + str(self.server.server_port).encode(), hashlib.sha256).hexdigest()
                result = {'proof': proof}
            elif self.path == '/v1/health' and not post:
                result = {'protocol': PROTOCOL, 'status': 'ready', 'platform': getattr(self.server.state, 'platform', 'linux'),
                          'limits': {'preview_bytes': 31457280, 'preview_max_bytes': 134217728, 'copy_bytes': 268435456, 'batch_entries': 100}}
            elif self.path == '/v1/diagnostics' and not post:
                result = snapshot(self.server.state)
            elif self.path == '/v1/grants' and not post:
                result = {'grants': [{'id': g['id'], 'label': g['label'], 'root': g['root'],
                                      'operations': ['read', 'write'] if g['writable'] else ['read']} for g in self.server.state.grants()]}
            elif self.path == '/v1/receipts' and not post:
                result = {'receipts': self.server.state.receipts(), 'limit': 100}
            elif self.path == '/v1/list' and post:
                result = self.server.provider.list(body)
            elif self.path == '/v1/read' and post:
                result = self.server.provider.read(body)
            elif self.path == '/v1/hash' and post:
                result = self.server.provider.hash(body)
            elif self.path == '/v1/operate' and post:
                result = self.server.provider.operate(body)
            elif self.path == '/v1/catalog':
                if post:
                    with self.server.provider.lock:
                        result = self.server.graph.mutate(body.get('action'), body.get('args', {}), body.get('expected_revision'))
                else:
                    result = self.server.graph.snapshot()
            else:
                raise APIError('NOT_FOUND', 'Unknown API route or method.', 404)
            if self.path != '/v1/diagnostics':
                record(self.server.state, 'HTTP_' + self.path.rsplit('/',1)[-1].replace('-','_').upper(), 'HTTP_OK')
            self._send(200, {'ok': True, **result})
        except Exception as exc:
            self._fail(exc)
