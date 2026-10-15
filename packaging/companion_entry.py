"""PyInstaller script entry: imports preserve the package's relative imports."""
from atlas_companion.entrypoint import main

if __name__ == '__main__':
    raise SystemExit(main())
