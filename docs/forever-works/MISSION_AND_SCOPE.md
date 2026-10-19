# Why ATLAS exists

## Mission

Make all user-authorized resources accessible through one **advanced, relationship-based file explorer**, even when their actual storage spans local disks, remote R2 buckets, browser bookmarks, webpage archives, virtual archive members and other products. Users should not have to remember a storage provider or physical path before finding something.

## Guiding experience principles

- **Intuitive:** Everyday interactions should be easy to discover and understand, with clear navigation, predictable behavior, and minimal unnecessary complexity.
- **Aesthetic:** Atlas should feel thoughtfully designed and visually cohesive across its views, templates, and screen sizes, without sacrificing usability or accessibility.

## Publishing and adaptive-design doctrine (proposed)

- **Intuitive, beautiful, aesthetic, and fun:** use established browser/file-explorer conventions by default; make returning to bookmarks enjoyable, not a chore.
- **Use the smallest implementation that fully preserves the experience.** Prefer modular, inspectable HTML, CSS, JavaScript and JSON for published outputs, borrowing composition and separation principles from frameworks such as Astro without importing needless runtime dependencies.
- **Start finished, then customize incrementally:** production-ready familiar templates; the user should reach a publishable result through minimal edits and progressively gain deeper controls.
- **First-time-user acceptance question:** *Can someone who has never used Atlas create a three-entry story website, attach their portfolio and résumé, customize its appearance, and publish it through Cloudflare without asking how anything works?*
- **Card-centric portability:** canonical card objects may reference extensive content; intermediary presentations derive cards, slices, full articles and sites. Preserve identity and data across browser, authorized local and R2 locations.
- **Aesthetic equivalence across shapes:** mobile, desktop, embedded card and unusual viewports must each be intentional and compelling, not simply fit the screen. Use Any-Shape principles and record layout/design rationale through Forever Works.

The [full minimal publishing, card/slice and design-corpus proposal](PROPOSAL_MINIMAL_PUBLISHING_CARD_SLICE_ANY_SHAPE_CORPUS.md) documents the proposed modules, ten format families, storage/publishing UX, verification plan and research horizon. **These aspirations are not statements of shipped functionality.**

**Minimal Need to Rebuild:** Finished single-page projects remain independently publishable and can later be merged, extracted, restyled under a shared template and reused as cards/slices without rebuilding their content. Preserve source data, identities, styles, and version history. See [the detailed composition contract](PROPOSAL_MINIMAL_PUBLISHING_CARD_SLICE_ANY_SHAPE_CORPUS.md).

**Liquid Sections and Liquid Pages:** Freeform, responsive composition is as important as structured templates. Treat freely arranged page regions and complete freeform pages as portable, mergeable and extractable first-class objects; maintain source data and recoverable design intent across templates and screens. See [the composition proposal](PROPOSAL_MINIMAL_PUBLISHING_CARD_SLICE_ANY_SHAPE_CORPUS.md).

## Essential user experience

A bookmark can be associated with images on R2 and a local PDF; all become members of a user-selected research catalog, with tags, names, typed links, cluster pairing and searches. The underlying files need not move or be duplicated. A resource may appear in several catalogs. Offline/unavailable entries retain their metadata and relationships rather than vanishing.

Support previews, search, create/rename/move/copy/delete where authorized, archive browsing, metadata/provenance, batch actions, recoverable failures and helpful status explanations. Functionality will grow by proven increments.

## Wider ecosystem

Substrate: create/arrange. Chute: capture/handoff across browser and desktop. Redown: R2 access, downloads and remote exploration. ATLAS: unified discovery, catalogs, linking and operations. An optional future automation product can act on supported capability contracts. Each product is independently useful; integration never implies access rights.

## Business

A credible standalone local-first free tier and optional paid differentiation (advanced indexing, semantic search, rich previews, cloud connectors, multi-device sync, teams and organization features). Prices, willingness-to-pay, acquisition and revenue are **unknown** until validated. Export of catalogs, identifiers and relationships must remain feasible even without paid features.

## Deliberate non-goals

No stealth access to every filesystem, no remote-shell endpoint, no mandatory uploads of local content, no bypass of OS permission boundaries, no silent executable installation from Chrome Web Store, and no false promise that content is accessible when offline or unauthorized.

This document describes **owner-directed product purpose**; it is not a claim of operational completion.

## Portable Atlas expressions — enduring owner vision

The owner dreams of a future filled with beautiful, aesthetic **Atlas cards and Atlas slices across the internet, enduring indefinitely**. The guiding principle is to reduce rich wholes into their best representative, useful and elegant parts, portable across Atlas templates and independent websites. Preserve identity, meaning, source connections and aesthetic quality across sizes. Exports must remain independently useful without Atlas installed; widespread adoption and permanence are ambitions, not proven outcomes. Projects organize; Pages compose; Sections present; specialized collections keep their native containment rules. See [Object Grammar and Portable Expressions](PROPOSAL_OBJECT_GRAMMAR_AND_PORTABLE_EXPRESSIONS.md) for the proposed relationship rules, Add Item behavior and portable-expression proof.

**Extractable from inception:** Every Card, expanded/popup Card and Slice is designed for extraction and reuse from its first implementation. Keep its portable content/presentation/interaction core separate from explicit, replaceable host capabilities. Independent viewing must remain useful; privileged operations still require authorized adapters. This is a forward design obligation, not a claim that all current components already satisfy it.

**Every size, every host:** Cards, popup/expanded Cards and Slices must preserve useful behavior, meaning and intentional aesthetic quality across phone, tablet, desktop and their actual embedding containers. Recompose instead of merely shrinking. Build this into the proposed Atlas format from inception, with Any-Shape adaptation rules, accessible interactions and explicit supported-size/edge-case evidence; do not claim literally every possible size has been verified.

**Card-centered programmatic surface:** A Card is an independently addressable, understandable and transferable content unit; a Pinboard provides membership and presentation context. APIs should expose Card content, references, dependencies and permitted operations independently of board rendering. Individual export/import/copy/move/reference must preserve appropriate assets, identity/lineage and provenance; verify destination integrity before removing source membership. These are architecture requirements, not a claim of current API completion. See the portable-expression proposal for capability and proof boundaries.
