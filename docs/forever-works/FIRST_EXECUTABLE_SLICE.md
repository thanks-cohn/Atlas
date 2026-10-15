# First executable slice: portable resource graph

**Status:** experimental Python reference implementation, not a privileged helper, product UI or production database. Files: `src/atlas_core/catalog.py` and `tests/test_catalog.py`.

This slice demonstrates a bounded, user-supplied **resource identity separate from location**, catalog membership, tags, directed typed relations, persistence and JSON export. No filesystem contents are scanned or opened; local/R2 locators are metadata only; no credentials, server, Chrome code or native install. It must not be marketed as a working explorer.

Run on any normal Python 3.10+ environment: `PYTHONPATH=src python -m unittest discover -s tests -v` (Windows PowerShell: `$env:PYTHONPATH='src'; python -m unittest discover -s tests -v`).

### Fixed acceptance target
One bookmark, one local image locator and one R2 PDF locator are distinct resources linked in one catalog. Duplicated membership/tags do not create duplicates; export+reload preserves IDs and links. Unknown references and corrupt relationships are rejected.

### Known gaps
This minimal model is not versioned production schema, not fully hardened against hostile files and has no concurrent writer, content-address identity, migrations, revocation, transaction rollback, size quotas or filesystem granting. `save` atomically replaces a single file but does not make multi-process operations transactional. Future agent must address these before the data layer is production-capable.

### Why Python?
Short transparent reference for the core *behavioral contract*, not the required final language. Implementations may replace Python subject to the same semantic and security proofs.
