#!/usr/bin/env python3
"""Explicit Linux installation; source snapshot or standalone binary, never roots."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from atlas_companion.install import install, install_runtime, main

if __name__ == '__main__':
    raise SystemExit(main())
