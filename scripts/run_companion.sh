#!/bin/sh
# Explicit foreground development launcher. Does not install, grant, pair, or elevate.
set -eu
atlas_repo=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if [ -n "${ATLAS_PYTHON:-}" ]; then
    atlas_python=$ATLAS_PYTHON
elif [ -x "$atlas_repo/.venv/bin/python" ]; then
    atlas_python=$atlas_repo/.venv/bin/python
else
    atlas_python=python3
fi
export PYTHONPATH="$atlas_repo/src${PYTHONPATH:+:$PYTHONPATH}"
exec "$atlas_python" -m atlas_companion "$@"
