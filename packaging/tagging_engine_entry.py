"""Separate onedir engine, never unpacked or imported by the main helper."""
from atlas_companion.tagging_worker import main
if __name__=='__main__':raise SystemExit(main())
