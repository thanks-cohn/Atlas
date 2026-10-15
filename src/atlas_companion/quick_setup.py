"""Small UI-independent setup sequence; all authority comes from explicit local choices."""
import re
import time
from .desktop import Management, diagnose
from .diagnostics import record
from .security import APIError


def complete(state, extension_id, locations, install, start, *, consent=False, timeout=45):
    if consent is not True:
        raise APIError('CONSENT_REQUIRED', 'Approve companion setup locally.')
    if not re.fullmatch('[a-p]{32}', extension_id):
        raise APIError('INVALID_EXTENSION', 'Enter the exact extension ID.')
    record(state, 'QUICK_SETUP', 'INSTALL_STARTED')
    install(extension_id)
    record(state, 'QUICK_SETUP', 'INSTALL_OK')
    model = Management(state)
    for path, writable in locations:
        model.authorize(path, writable=writable, allow_broad=True, consent=True)
    record(state, 'QUICK_SETUP', 'SELECTED_GRANTS_SAVED')
    start(extension_id)
    record(state, 'QUICK_SETUP', 'AUTOMATIC_RECOVERY_STARTED')
    deadline = time.monotonic() + timeout
    while True:
        result = diagnose(state)
        if result['state'] == 'READY':
            record(state, 'QUICK_SETUP', 'SETUP_READY')
            return result
        if time.monotonic() >= deadline:
            raise APIError('SETUP_START_TIMEOUT', 'Setup saved, but startup is not ready. Open Advanced / diagnostics for the exact stages.')
        time.sleep(0.25)
