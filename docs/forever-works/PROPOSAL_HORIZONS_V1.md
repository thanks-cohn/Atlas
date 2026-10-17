# Atlas — Horizons v1
## First-party extension-page proposal

**Status:** proposed first functional page; owner-directed product requirements with explicitly labeled implementation recommendations. No implementation or runtime acceptance is claimed by this document.
**Date:** 2026-10-16, America/Chicago.
**Source baseline for this proposal:** `efb482d035196d09dc1af720e29f95a11034c4ca`.
**Related design:** [Currently Working On — Card Workspace and Publishing](CURRENTLY_WORKING_ON_CARD_WORKSPACE.md), including its addenda. Preserve the earlier [baseline](../releases/BASELINE_2026-10-16.md).

## 1. Identity and purpose

**Horizons** is the first composed Atlas extension webpage: a focused visual carousel above searchable, horizontally browsable knowledge columns, with reversible expansion into article reading and distinct article pages.

Its purpose is to make accumulated personal organization useful, pleasurable to explore and ready for later publishing. Old notes, saved sites and relationships remain reusable; a polished presentation does not require repeatedly rebuilding those materials in a separate editor.

Horizons v1 is one initial preset over Atlas's modular data. Any supported object may eventually provide the focal context: images, galleries, projects, pages, notes, videos, tags or future supported types. This proposal gives one concrete gallery/image-led example, not a permanent taxonomy or final Atlas design.

**Core owner quality requirements:** premium visual composition, understandable interaction, modular presentation and small dependable code whose decisions, state and behavior can be traced.

## 2. Implementation ownership: build it ourselves

The owner explicitly requests a from-scratch, first-party implementation to understand the logic and investigate defects.

- Write the page structure, styling, carousel mechanics, state transitions, search, expansion, history and routing in Atlas-owned source using browser standards.
- Do not introduce Swiper, Embla, Motion, React or another UI/carousel/search dependency for this slice.
- Public carousel implementations may be consulted for motion/traversal behavior, easing and interaction ideas. They are references, not imported runtime code. No vendoring or copying their implementation into Atlas as supposedly homegrown code.
- Native browser facilities—DOM, CSS, Pointer Events, requestAnimationFrame, Web Animations, history/location and standard accessibility semantics—are appropriate building blocks.
- Reuse existing Atlas data, permissions, bookmark integration and documented APIs where suitable. “From scratch” concerns this presentation and interaction implementation, not rewriting already working Atlas subsystems.

The previous library recommendation was an assistant suggestion and is superseded here. The owner's rationale is traceability and maintainability; first-party code still needs meaningful tests and review to establish reliability.

## 3. Page composition

### 3.1 Upper hero carousel

The latest selected starting composition has:
- One large focused image in the center.
- One smaller, recessed preview on its left.
- One smaller, recessed preview on its right.

This is **one preview per side for Horizons v1**; it refines the previously discussed two-per-side example. Do not discard the ability to configure visible previews later. The simplest single-image top presentation remains an alternative supported direction, not a reason to implement two different content models.

Left/Right controls change the focused item. Selecting a gallery changes the active traversal scope from galleries to that gallery's images. Associated lower content updates for the active object. Preserve enough state to return to the previous gallery and its selection.

When a horizontal article slice opens, the hero moves upward and shrinks. **The center and both side previews remain visible** wherever the three-image composition is active. Preserve their proportions and focus distinction; do not conceal side previews as a shortcut.

### 3.2 Search between the carousels

Place the search bar between the upper hero and lower column carousel. Its location makes clear that it controls exploration below the current focal context.

Typing updates the three best distinct tag matches. It does not implicitly select a new hero image.

### 3.3 Lower column carousel

The lower region is horizontally browsable. Its wide-screen resting composition shows three column slots.

Each column contains:
1. A tag heading.
2. A visible horizontal divider directly below the heading.
3. Vertically stacked rows such as Note 1, Note 2, Note 3.

The column layout stays consistent as the focused image changes; headings and row contents update to the relevant material. Stable slot geometry does not require that a slot permanently owns one tag. Preserve row/object identity separately from visual slot identity.

The example uses notes under tag headings. The component/placement contract must allow alternate content and associations later, including notes with tags or expandable galleries. Do not hardcode “a column can contain only notes” into storage.

## 4. Search and traversal behavior

### Owner-directed behavior

1. Typing brings the **three closest distinct tag columns** into view; no repeated tag fills multiple slots.
2. The initial implementation switches column contents to those results.
3. The query remains in the field while the user moves Left/Right through other closely matching columns.
4. **Enter restores the initial best-match trio for the current query**, rather than returning to wherever the user has browsed.
5. Later enhancement: matching columns visibly travel from their prior positions. Do not require that animation for v1.

Distinctness concerns stable tag identity; do not silently merge separate tags based on similar spelling.

### Proposed deterministic implementation

Keep the original collection ordering separate from the ranked query ordering. Rank eligible tags using a small inspectable algorithm: exact normalized label, prefix, word-prefix, substring, then a bounded approximate score. Use deterministic tie-breaking and document normalization and scoring with fixtures.

This ranking recipe is a recommendation, not an owner-approved mathematical definition. Confirm reasonable examples and performance before treating it as a contract. Expose the selected query, result ordering and visible window as separate state.

Initially scope eligible tags and their rows to content explicitly associated with the current hero context. Do not silently traverse every relationship or broaden to all private data. Exact association/query scope needs agreement against the existing graph.

If fewer than three distinct tags match, show the actual matches with a purposeful empty state; do not fabricate duplicates. Clear-query behavior should restore the unfiltered context and its prior position, subject to final interaction review.

**Separate two existing concepts:** fuzzy typed search ranks matching tag headings; explicit multi-tag selection filters objects by **ALL** selected tags. Enter in this search field recenters ranked columns. Enter in explicit tag-selection mode commits that selection. Show the active mode and route the key to the focused control; do not overload one invisible state.

## 5. Row focus and note expansion

Default example:
- A column initially shows Note 1, Note 2 and Note 3 vertically.
- Clicking Note 3 moves it directly beneath the divider.
- Other sibling rows disappear from that focused column view.
- Note 3 expands, and its disclosure arrow reflects the open state.
- The tag heading/divider remain visible as context.

Restore sibling ordering and the user's prior column position when collapsing. Hidden siblings are view state, not deleted content. Other columns must not lose their data or state simply because one row was expanded.

Clicking the expanded content opens the horizontal reading/presentation slice. Use explicit event ownership so an expansion click cannot also trigger the next action through bubbling.

**Optional settings mode:** clicking a note swaps its block to a text preview; clicking again restores the prior appearance. Settings may control preview size and whether the block changes size. This mode must not also trigger default expansion/navigation. Provide a clearly accessible way to open the full content.

Keep the initial default simple. The precise preview-size units, truncation, animation and controls remain design details; do not introduce a large template editor to ship this first slice.

## 6. Horizontal article slice and full article page

Opening the selected content creates a full-width horizontal region, with surrounding layout moved up/down to accommodate it. The focused hero remains visible above it. Expansion and collapse should preserve orientation rather than jump to unrelated positions.

The preferred initial gallery-centric template presents **article cards inside the slice**:
- Image-led composition.
- Title and brief text overlaid near the bottom.
- Left/Right iteration among associated articles.
- Readable overlay contrast, constrained excerpt length and graceful fallback when an image is absent.

Clicking an article card opens its full article on a **distinct extension page with stable page identity and hierarchy context**. This is a navigation event, not merely an untracked enlarged DOM node. It need not create a new browser tab. Preserve parent/focal object/selection and an accessible return route.

While reading in the slice, scroll within the article content region and retain the top image/carousel in view. The exact split between article-card preview and expanded inline reading is to be finalized; preserve both the owner's slice behavior and distinct-page requirement without ambiguous click targets.

Routing recommendations: derive locations from stable IDs, validate route parameters, represent parent context independently, and define direct-load/missing/deleted-object states. Do not serialize secrets or private content into the URL.

## 7. Explicit interaction state

Implement an inspectable state model rather than scattered DOM mutations. Recommended state domains:

| Domain | Examples |
| --- | --- |
| Focal context | object ID/type, parent scope, active gallery/image |
| Hero traversal | ordered item IDs, focused ID, preview count |
| Search | text, mode, ranked tag IDs, initial best-match anchor |
| Lower carousel | visible window and browsed position |
| Column focus | selected row, sibling ordering, disclosure state |
| Reading slice | open/closed, current article, internal scroll |
| Navigation | current page ID and parent/return context |
| Presentation | preset, preview toggle mode and bounded sizing |

These are suggested implementation boundaries, not a required file-per-row abstraction. Use small modules only where they clarify ownership. Define pure state transitions where practical, separate query derivation from rendering, and bind views to stable object IDs.

Esc returns one meaningful layer at a time: close inline reading/slice, restore focused row/list, then prior context as applicable. Browser Back returns from a distinct article page with state restored. Confirm exact precedence against existing Atlas dialogs, shelf behavior and text entry. Do not make Esc discard edited content without handling it explicitly.

Left/Right must affect the region the user is interacting with. Arrow presses in a text field remain editing keys. One keypress must never advance hero, lower columns and article carousel simultaneously.

## 8. Responsive and accessible behavior

Three visible lower columns and three hero images describe the wide-screen default. On narrow screens preserve the same content, hierarchy and interaction roles using fitted previews and fewer visible lower columns as needed. The specific breakpoints must follow measured content fit, not device-name assumptions.

Provide visible pointer/touch controls in addition to keyboard actions, meaningful labels, visible focus, expanded state and focus restoration. Touch swiping must not prevent normal vertical reading. Long titles/tags, empty collections and absent images must remain usable.

Handle reduced-motion preferences and interruptions: a new selection should reach a correct final state even if an animation is canceled. Keep layout readable during zoom. Do not use animation completion as the authority for which object is selected.

Aesthetics must be reviewed across compact, expanded, article, search and empty states. Consistent spacing, proportional images, composed type, strong focus hierarchy and smooth purposeful motion are required outcomes. No autoplay is proposed.

## 9. Content and persistence boundaries

Horizons renders Atlas groupings/resources and their explicit associations. Keep:
- Stable content identity and metadata.
- Notes/tags/relationships and privacy.
- Placement/presentation choices.
- Transient selection, search and expansion state.

Do not duplicate content per layout, turn visual containment into data ownership, or mutate associations by browsing. Displayed tags are not inferred grants.

Use existing persistence contracts where applicable; define migration/versioning if presentation preferences require new storage. A reload should recover a coherent view; persist only the state whose lifetime is intentionally chosen. Document ephemeral versus durable state.

The page should use metadata/images already available through authorized Atlas mechanisms. Do not require a helper connection merely to browse locally available metadata or grant new filesystem access for styling.

Keep loaded/rendered content bounded. Do not instantiate every saved image/note to populate a carousel. Derive small visible windows, limit media decoding and cancel obsolete work after a rapid selection. Establish and record an actual measured budget before claiming low-memory performance.

## 10. Implementation sequence

All items are proposed work, not delivered by this document.

1. Inspect current extension modules, data APIs, styles and supported CSP. Define a small route and state contract.
2. Create a first-party page with deterministic synthetic fixtures and the two carousel regions.
3. Implement hero changes, tag columns and row focus/collapse with state restoration.
4. Implement ranked search, lateral approximate-result browsing and Enter recentering.
5. Implement persistent hero plus article slice, then distinct full-article routing.
6. Add optional text-preview settings and persist the agreed preferences.
7. Connect the same rendering/state logic to real authorized Atlas data; verify storage compatibility.
8. Polish responsive composition and motion, verify, package and record exact evidence.

Keep fixtures separate from real user data. A fixture demonstration alone is not proof of actual Atlas integration. Do not replace the working shelf/helper as a side effect.

Future work: spatial traveling-column animation, larger template authoring controls, arbitrary object-centered compositions, drag/drop, richer Liquid content and publishing integration. Preserve extension points without implementing this entire roadmap now.

## 11. Acceptance evidence

| Area | Observable acceptance |
| --- | --- |
| Hero | Focused center plus one recessed preview each side; traversal changes the correct associated content. |
| Column slots | Stable layout with tag/divider/rows; no stale rows from a previously focused image. |
| Row focus | Note 3 becomes first under its divider; siblings hide; collapse restores exact prior order. |
| Search | Three distinct best matches, deterministic order, lateral neighbors and Enter recentering for the retained query. |
| Search separation | ALL-tag filters retain their meaning; text inputs and explicit selection modes receive the correct keys. |
| Slice | Selected content opens horizontally; top carousel shrinks/moves up and all three images remain visible. |
| Article | Own page identity, direct-load behavior and hierarchy/Back restoration work. |
| Preview setting | Optional toggle swaps preview/restores view; does not accidentally navigate or double-expand. |
| Data | Browsing/restyling does not alter content, tags, privacy, stable IDs or relationships. |
| Responsive quality | Actual wide/narrow/zoomed and reduced-motion interactions pass; composition remains readable and intentional. |
| Real integration | Actual available Atlas data loads through existing permissions; offline/empty/error states are explicit. |
| Ownership | No imported carousel/UI runtime; third-party references and any existing Atlas dependencies are disclosed. |

Write tests for meaningful state/query/history invariants and actual browser interactions. Use visual inspection for proportions, overlays and expansion. Record unit/double tests, real-browser results, platform checks and owner acceptance separately. Do not report an unexecuted check as PASS or a screenshot as full interaction proof.

## 12. Forever Works inheritance and rationale

| Direction | Why it matters | Replaceable mechanism |
| --- | --- | --- |
| Build first-party presentation logic | Understand decisions and localize faults | Module boundaries and browser animation primitive |
| Stable regions, changing content | Preserve orientation as focus changes | DOM/rendering strategy |
| Two traversal levels with clear input ownership | Explore context and associated knowledge independently | Carousel algorithm |
| Search recenters without erasing the query | Recover best matches after exploratory browsing | Ranking implementation once its contract is agreed |
| Reversible expansion and visible hero | Reveal depth while retaining visual context | Transition implementation |
| Distinct article pages | Preserve hierarchy, organization and navigable identity | Extension route mechanism |
| Configurable modular templates | Reuse long-lived personal knowledge in new presentations | Initial gallery/image-led preset |
| Premium visual quality with modest code | Make curation and later publishing enjoyable and dependable | CSS details, subject to equivalent visual/user outcomes |

As implementation proceeds, create or update appropriate existing Forever Works kinds for purpose, capability, invariant, decision, implementation and evidence; distinguish accepted owner requirements from inferred/proposed engineering details. Link the actual source/tests and explicitly record coverage gaps. This narrative is not itself schema-validated canonical records.

The eventual goal is cold reconstruction of Atlas's meaning and working experience using future technology. First-party code and traceable records help; compatibility tests and independent reconstruction are still required evidence.

## 13. Open decisions before coding their affected behavior

- Exact gallery-versus-image entry control and full gallery route.
- Precise association scope and deterministic approximate search scoring.
- Hero/column wrap versus bounded ends, empty/single/two-item behavior and preview placement.
- Narrow-screen composition, fitted side previews and visible column count.
- Click targets separating row focus, optional preview, inline reading and article navigation.
- Scope/history precedence for Esc, Back and nested galleries.
- Which preferences and return context persist across page/browser restarts.
- Measured collection-size, media and motion budgets.
- Free/Premium capability mapping under existing economics decisions.

Keep these visible; do not encode an assistant assumption as accepted owner intent. Deliver one coherent verified first page before widening the template system.
