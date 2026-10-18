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


## Owner design principle — intuitive, aesthetic, standardized by default (2026-10-17)

**Owner-directed standing requirement for all future Atlas interfaces, proposals, and reconstitutions.** Atlas must be **intuitive, aesthetically intentional, and grounded in established conventions and standards** to minimize confusion. Unique interactions invented for Atlas are welcome only when they provide a meaningful improvement, without gratuitously replacing familiar patterns.

- **Intuitive:** Common actions should be discoverable without documentation or a learning curve. Use recognizable labels, consistent placement, predictable navigation, clear feedback, sensible defaults, and progressive disclosure rather than clutter.
- **Aesthetic:** Layout, typography, spacing, alignment, imagery, and transitions should look carefully art-directed across shelf, full page, desktop, and small screens; beauty must not come at the cost of legibility, speed or accessibility.
- **Standardized:** Prefer platform conventions and well-understood interaction patterns for tree navigation, folders, menus, forms, hover/keyboard/touch actions, dialog dismissal, selection, undo, save, import/export and error states. Follow relevant accessibility and security standards. Use existing components and semantics when practical rather than reinventing basic controls.
- **Deliberate exceptions:** Distinct Atlas features—such as image-led bookmark navigation, visual graph hover previews, or expanding note/article presentations—may depart from convention where the purpose and usability gain are clear. Make exceptional interactions understandable through affordances, familiar fallback controls and consistent behavior.
- **Cross-size and cross-template continuity:** Responsiveness should be intentional recomposition, not merely shrinking. Preserve content, associations, state, keyboard access and meaning while the visual presentation varies beautifully.
- **Cold-inheritance rule:** A successor agent should first identify and reuse applicable standards/conventions and then document why any Atlas-specific exception exists. Treat implementation as replaceable, not user comprehension.
- **Acceptance:** First-time users can identify key actions, complete basic tasks without instruction, recover from errors, and understand any novel interaction. Test keyboard/touch accessibility, constrained screens, clear feedback and visual consistency; do not claim usability has been proven merely by writing this principle.

**Short form:** Familiar where possible. Distinctive where valuable. Beautiful and understandable everywhere.
