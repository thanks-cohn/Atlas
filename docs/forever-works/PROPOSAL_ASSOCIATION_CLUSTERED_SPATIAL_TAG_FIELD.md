# Proposal — Association-Clustered Spatial Tag Field

**Status:** Owner-directed UX and architecture proposal; **not implemented or verified**.
**Recorded:** 2026-10-16 (America/Chicago).
**Project:** Atlas — right shelf, bookmark annotation surfaces, and shared tag exploration.
**Related:** [Currently Working On — Card Workspace](CURRENTLY_WORKING_ON_CARD_WORKSPACE.md), [Shelf-First Bookmarks proposal](PROPOSAL_SHELF_FIRST_BOOKMARKS_COMPOSITIONS_AND_PORTABLE_PUBLISHING.md), [Joyful Curation proposal](PROPOSAL_JOYFUL_CURATION_SEMANTIC_ATLAS_AND_PUBLISHABLE_COLLECTIONS.md).

## 1. Why this exists

The owner wants the Atlas tag surface to feel spacious, beautiful, playful, and effectively boundless rather than like a cramped list in a browser shelf. The perceived "organized disorder" has a **meaningful basis**: tags often assigned together to the same objects should occupy nearby spatial neighborhoods. Physical separation can communicate weaker association. The purpose is not an ornamental word cloud; spatial organization should make it faster to discover and select tag combinations that retrieve relevant content.

**Illustrative user story:** Forty bookmarks repeatedly bear three tags — `Architecture`, `Classical`, `Photography`. Those tags co-occur often and form a nearby cluster. Someone navigating the field selects these three tags and explicitly searches: Atlas returns objects bearing **all three**. The cluster helps reconstruct an existing, personally meaningful query. The example's 40 bookmarks are hypothetical, not measured product data.

The positioning system is **derived from the owner's actual tagging behavior**, not from inferred dictionary definitions or mandatory AI semantic embeddings. A person may associate conceptually different words; Atlas must not silently replace those associations with a model's interpretation.

## 2. Placement in the Atlas interaction model

The normal Chrome-style native bookmark hierarchy remains familiar. A bookmark's expanded representation exposes a compact image gallery (left/right between images), then a vertical notes section (up/down between note rows), then a tags section. A consistently placed upper-right **Next** control changes *section*, whereas directional controls change *item/focus within the section*. The tags section's upper-right action becomes **Search** once one or more tags are selected.

- A bookmark's image section may contain multiple images, not just a single cover.
- Notes are readable rows, not necessarily pills. Activating a row expands the full note in the shelf; Esc returns to the rows; activating the expanded note again opens the dedicated Atlas extension page for that bookmark, focused on the note.
- Every bookmark has a dedicated, deep-linkable Atlas extension page with its associated information and selected notes; the shelf is the compact companion, not a replacement for that page.
- Below the bookmark's presentation, separately expandable *connected-category* branches expose heterogeneous related objects (galleries, projects, pinboards, bookmarks, pages, files, notes, etc.). Retracting one branch must not retract the bookmark or sibling branches. These are typed links, not necessarily native bookmark folders or ownership.
- The tag-field proposal is **reusable** beyond bookmarks for other individually tagged Atlas resources.

These refinements clarify and supersede the earlier simple image → text → tags click sequence where they conflict; preserve the rest of the prior specification and its rationale. The image/gallery and section transition triggers must remain distinct to avoid an accidental navigation.

## 3. Spatial layout — two-dimensional, not a vertical list

Each tag is a variable-sized, individually selectable pill placed in a larger **two-dimensional plane** extending beyond the compact shelf's visible viewport. Tags can extend to the **right and downward**, not merely in rows beneath one another. Moving focus to a tag beyond the visible region moves the viewport horizontally, vertically, or diagonally as required. The resulting navigation should imply a larger world continuing beyond the immediate opening; it must never feel artificially boxed in.

**Owner's growth intuition:** for roughly every 40 additional tags, available territory expands across both horizontal and vertical directions. Treat **40 as a tunable capacity/growth increment**, not a hard row size, discrete on-screen page, strict quadrant, or storage limit. New tags should not shuffle the entire field. Layout may develop multiple cluster neighborhoods, including bridging tags between clusters.

**Organized disorder** means varied pill widths/heights and controlled positional irregularity, with compositional balance. It **does not** mean overlaps, inaccessible tags, vast empty stretches, random reshuffling, illegible text, or arbitrarily distant neighbors.

### Proposed testable geometric constraints (initial values, not finalized)

| Property | Proposed rule |
| --- | --- |
| Collision | Zero overlap of pill hitboxes, visible labels, and focus decoration. |
| Minimum edge gap | Initially 8–12 CSS px between pill boundaries, plus sufficient focus-ring clearance. |
| Preferred local gaps | Typically 12–24 CSS px, subject to text size, zoom, and cluster separation. |
| Pill dimensions | Content-sized with accessible target dimensions; varied dimensions allowed. |
| Cluster separation | Larger than local gaps when affinity warrants it, but bounded so navigation remains practical. |
| Growth | Bidirectional (+X and +Y) in expandable territory; retain reachable origin and existing positions where possible. |
| Placement | Deterministic with persisted layout version/seed; incremental inserts avoid global reflow unless explicitly requested. |
| Zoom/resizing | Adapt rendering and viewport to shelf size without corrupting stored positions or breaking focus. |
| Scale | Virtualize/render bounded nearby items; support thousands without an all-node DOM/bitmap requirement. |

The particular pixel ranges should be validated visually and with keyboard and zoom tests; they are design hypotheses, not promises. For cluster density, distinguish the local **collision gap** from intentional longer **semantic distances**. An enforced universal maximum distance would erase the very clustering signal the owner wants.

## 4. Association is the spatial signal

Construct an index from **explicitly attached tags on Atlas objects**. Distinguish direct tags from inherited, inferred or public tags; do not invent inheritance or hidden AI relationships. A pair of tags has stronger affinity when it repeatedly co-occurs on the same qualifying objects.

Candidate starting measures:

- Co-occurrence: `c(A,B) = |objects(A) ∩ objects(B)|`.
- Normalized Jaccard: `J(A,B) = |objects(A) ∩ objects(B)| / |objects(A) ∪ objects(B)|` when the union is nonempty.
- Consider alternatives for popular generic tags, rare accidental co-occurrences, and heavily multi-tagged objects (e.g. support thresholds, confidence/smoothing, or down-weighting generic tags).

Use normalized association to avoid ubiquitous tags pulling every cluster together. Preserve raw support counts for inspectability: an apparently perfect association on one object should not automatically dominate a robust association observed across forty. **Clustering/display is not the query logic**: distance is a visual expression of measured association, and must not silently add filter conditions or assert an explicit user-defined relationship between objects.

Proposed pipeline: compute sparse co-occurrence graph → identify neighborhoods/clusters → assign target distances/positions → deterministic collision-aware relaxation/packing → create directional neighbor index → cache and incrementally update. Force-directed layout, multidimensional scaling, or another algorithm may implement this; **no single method is mandated**. Minimize displacement of established tags to preserve spatial memory. Provide a clear, optional explicit "reorganize" action if substantial global regrouping is required.

A tag can bridge multiple clusters; do not force every tag into one exclusive, disconnected bucket. If associations are absent, use a sensible deterministic spacious arrangement without pretending the distances have semantic significance.

## 5. Input, navigation and search contracts

**Default presentation:** viewport-controlled directional exploration with no distracting conventional scrollbars. This is an aesthetic default, not a restriction on input methods.

- **Arrow Left/Right/Up/Down:** move focus to a spatially appropriate next tag in that direction, relative to actual rendered pill locations, not an assumed three-column grid. The viewport smoothly follows focus on **both axes** and keeps the target fully visible. Avoid stuck or unreachable nodes, ambiguous jumps, or moving unexpectedly to a very distant node when a better neighbor exists.
- **Mouse:** click any visible pill to toggle selection, not to launch a search; clicking should also update focus. Pointer, keyboard and touch should access the same selections.
- **Enter:** toggle the focused tag (select or deselect). **Enter must not execute search**; otherwise people cannot deliberately choose multiple tags with a keyboard. Space may provide the same toggle, with standard accessibility semantics.
- **Selection:** multiple tags may remain selected while focus moves; focused and selected states are visually distinguishable. Selections survive panning/viewport movement and section visits where appropriate.
- **Search:** explicit top-right **Search** action when tags are selected. Results match **ALL selected tags (AND)** per the existing Atlas search contract; search can scope by resource type without losing the tag conditions. With zero selected, the action remains the normal section transition **Next**, not an accidental empty search.
- **Settings option:** enable conventional **two-axis scrolling/panning** to explore and see all tags, while retaining mouse selection and the same data model. A free-pan/overview or jump-to-tag option is advisable for larger fields. Do not claim that a single viewport literally displays all tags simultaneously.
- **Accessibility:** visible focus, keyboard handling restricted to the focused tag region (not while typing), alternative list/search navigation, reduced-motion treatment, assistive-label/count feedback and reliable Esc/back focus restoration.

Directional selection cannot rely solely on nearest Euclidean distance: choose among candidates in the intended half-plane, penalize perpendicular deviation, and handle missing neighbors intentionally. Define how focus moves across cluster gaps and whether explicit long-distance jumps require a visible affordance. Keyboard navigation must be complete across the field even with disconnected affinity clusters.

## 6. Data separation and privacy

Tag identities, object–tag associations, co-occurrence statistics, display coordinates, viewport position, focus, temporary selection and search execution are separate concerns. Store stable IDs and versioned layout data; do not embed positions or association counts as the tags' intrinsic meanings. Tag assignment is durable; selecting tags for a search **does not edit** assignments. Layout and clustering are derived, reconstructible caches with a deterministic fallback; version and export any user-meaningful manual placements separately.

Calculate locally/offline by default, consistent with Atlas's privacy and portability guarantees. Do not transmit a user's tag graph, personal associations, note text or private bookmarks to a model or service without explicit authorization. An optional later personalized/AI layout mode requires its own consent, provenance and controls.

The special meaning of **explicit typed relationships** in Atlas remains unchanged: correlation in tagging is not proof of an explicitly declared "related to" edge. Preserve original association provenance across import/export.

## 7. Implementation slices and acceptance

1. **Field prototype:** 2D pill plane with different sizes, collision avoidance, bounded gaps, two-axis viewport following, mouse and keyboard toggles; 40/80/120/1000-tag fixtures.
2. **Association index:** deterministic co-occurrence and normalized similarity from test resources, including 40 bookmarks with 3 recurring tags, generic high-frequency tags, sparse tags and bridge tags; inspect pair support.
3. **Stable clustering:** grouped recurring tags with no overlap, justified cluster separation, no massive layout jump on insertion of tag 41/81 or on reopening.
4. **Atlas integration:** bookmark gallery → notes → tags Next/Search progression, independent connected-category expansion, retained selected tags, AND tag-search results and dedicated bookmark page behavior.
5. **Settings and QA:** optional scrolling/panning, reduced motion, mobile/pointer alternative, input-focus safety, 200–400% zoom, narrow shelf and full-page views, reload and export/import stability, modest-resource performance.

**Negative tests:** Enter never directly searches; pill click never navigates prematurely; no overlaps at variable font size; no tag unreachable by directional controls; pan works rightward as well as downward; no global random reshuffle on adding a tag; two unrelated clusters cannot merge because a generic tag is common; private associations do not leak; a layout update does not mutate real tag assignments.

## 8. Open design decisions

- Which objects participate in association counts: all private Atlas items versus current bookmark, collection, or user-selected scope; whether to allow scope switching.
- Weight direct tagging, differing resource types, manual affinity, and support thresholds; exact normalized metric and clustering engine.
- Whether the owner can drag/pin tags and clusters, how overrides coexist with computed layout, and whether cluster labels or soft boundaries appear.
- How much cluster separation is aesthetically useful before navigation becomes cumbersome.
- Geometry under narrow shelf resizes, zoom and varying word length, including logical neighbor selection across cluster edges.
- When to recompute layout automatically versus explicitly, and how to expose changes without unsettling spatial memory.
- Whether a Search action with one tag is allowed (proposed: yes), and how to present the active AND query on the results page.

## Summary invariant

**People attach tags to meaningful objects → repeated co-occurrence produces spatial neighborhoods → the user navigates those neighborhoods in two dimensions and selects any combination of tags → an explicit Search retrieves all objects matching the chosen tags.** The interface feels expansive and artfully irregular, but the underlying behavior is predictable, collision-free, accessible, local-first and reversible.

This document preserves a product proposal. It does not assert that the existing Chrome extension implements any of these behaviors.
