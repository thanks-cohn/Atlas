"""Bounded preview read policy shared by Linux and Windows providers."""
from .security import APIError
DEFAULT_PREVIEW_BYTES = 30 * 1024 * 1024
MAX_PREVIEW_BYTES = 128 * 1024 * 1024

def preview_limit(request):
    value = request.get('max_bytes', DEFAULT_PREVIEW_BYTES)
    if type(value) is not int or not 1 <= value <= MAX_PREVIEW_BYTES:
        raise APIError('INVALID_PREVIEW_LIMIT', 'Preview limit must be 1 byte–128 MiB.')
    return value
