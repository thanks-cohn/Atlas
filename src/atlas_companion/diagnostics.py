"""Bounded, secret-free diagnostic journal; never store exception text or file data."""
import re
import time

MAX_EVENTS = 200

def record(state, stage, code, duration_ms=None):
    if not all(isinstance(v, str) and re.fullmatch(r'[A-Z][A-Z0-9_]{0,63}', v) for v in (stage, code)):
        return
    try:
        with state.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS diagnostic_events (id INTEGER PRIMARY KEY AUTOINCREMENT, time_ms INTEGER NOT NULL, stage TEXT NOT NULL, code TEXT NOT NULL, duration_ms INTEGER)')
            db.execute('INSERT INTO diagnostic_events(time_ms,stage,code,duration_ms) VALUES(?,?,?,?)',
                       (int(time.time()*1000), stage, code, duration_ms if type(duration_ms) is int and duration_ms >= 0 else None))
            db.execute('DELETE FROM diagnostic_events WHERE id NOT IN (SELECT id FROM diagnostic_events ORDER BY id DESC LIMIT ?)', (MAX_EVENTS,))
    except Exception:
        pass  # Diagnostics must not change an operation's outcome.

def snapshot(state):
    with state.connect() as db:
        exists = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='diagnostic_events'").fetchone()
        events = [dict(r) for r in db.execute('SELECT * FROM diagnostic_events ORDER BY id DESC LIMIT ?', (MAX_EVENTS,))][::-1] if exists else []
    return {'schema':'atlas.diagnostics.v1', 'component_version':'0.1.4', 'platform':getattr(state,'platform','linux'), 'events':events,
            'coverage':['native_wake','native_proof','token_rotation','http_gate','http_routes'],
            'omitted':['tokens','headers','file_paths','file_contents','exception_messages']}


def error_code(exc):
    winerror = getattr(exc, 'winerror', None)
    if winerror in (32, 33):
        return 'WINDOWS_SHARING_VIOLATION'
    if winerror == 5:
        return 'WINDOWS_ACCESS_DENIED'
    code = getattr(exc, 'code', None)
    if isinstance(code, str) and re.fullmatch(r'[A-Z][A-Z0-9_]{0,63}', code):
        return code
    if isinstance(exc, TimeoutError):
        return 'OPERATION_TIMEOUT'
    if isinstance(exc, ConnectionError):
        return 'CONNECTION_FAILED'
    return 'OPERATION_FAILED'
