# Contractual fixity, implementation fluidity

The purpose of ATLAS must remain legible even if browser APIs, Windows security features, programming languages and original workarounds disappear.

## Fixed obligations (scoped to accepted product contracts)

- Users can organize resources across supported providers in unified catalogs independent of physical placement.
- Resource and relationship identity are preserved through ordinary listing, indexing, migration and offline periods.
- User-chosen catalog membership, tags, free text and typed relations survive UI and provider changes.
- Native file effects occur only under explicit valid grants, with confirmation where required.
- Ordinary supported resource interactions do not require a fresh Chrome file-picker approval for every operation **after the user has authorized a native helper scope**.
- Provider availability and operation failure are represented truthfully; metadata can remain navigable offline.
- File bytes and metadata remain intact unless an explicitly authorized operation changes them; recovery and failure receipts cover destructive actions.
- No source application or extension silently inherits unrelated source permissions or privileges.
- A client can inspect API capability/version contracts and gracefully handle unsupported operations.
- Export/migration preserves intelligible catalog data and provenance rather than locking meaning into a UI.

## Constrained variations

Performance, search freshness, indexing cadence, thumbnail quality, storage consistency, offline cache and responsiveness can vary **only within independently declared and tested bounds**. Security guarantees must not silently weaken for portability or convenience. Some user interactions necessarily vary by platform; acceptance is by outcomes, not identical pixels.

## Fluid mechanisms

Python vs Rust/C++, PyInstaller vs future binary builders, Windows registry vs Linux host manifests, MV3 side panel vs full-tab/desktop window, loopback HTTP vs another locally authenticated transport, worker topology, provider SDK, database, parser/indexer, caching and networking workaround. These are historical choices, not eternal product identity.

## Historical Chute motive

Browser file pickers/restricted filesystem APIs made continuous file workflows cumbersome. Chute used local networking and a companion to preserve useful user-controlled handoff. If a future Chrome or Windows API changes, ATLAS successors may bypass or replace the bridge **only if the required authorized user experience and security proofs still hold**.

## Evidence discipline

For each capability record: stable requirement ID; purpose; accepted scope; precise invariant; source of claim (owner, observation, inferred, agent-proposed); dependencies and boundaries; environments; success/failure oracles; implementation version/artifact digest; actual test outcome; unknowns; migration decisions. **Documentation and compiling do not imply functional PASS.** A cold agent should reconstruct from accepted meaning plus independent tests, not product-specific handwritten translations.
