# Atlas Proposal — Card Expansion, Note Roulette, Bookmark Preview, and Portable Transitions

**Status:** Partially implemented in 0.1.76: exclusive Notes/Bookmarks disclosure slice. Roulette, nested bookmark-image reveal and recommendations remain proposed; browser visual acceptance is pending.
**Recorded:** 2026-10-18 (America/Chicago).
**Companions:** [Current Card Workspace](CURRENTLY_WORKING_ON_CARD_WORKSPACE.md), [Contextual Image Pages and Dated Notes](PROPOSAL_CONTEXTUAL_IMAGE_TAG_ROTUNDA_AND_DATED_NOTES.md), [Horizons v1](PROPOSAL_HORIZONS_V1.md), and [Shelf-First Bookmarks](PROPOSAL_SHELF_FIRST_BOOKMARKS_COMPOSITIONS_AND_PORTABLE_PUBLISHING.md).

## Scope and non-duplication

The companion proposals already establish independent notes and bookmarks, bookmark columns expanding to reveal notes, note focus and Escape restoration, typed image/bookmark/note relations, keyboard accessibility, and responsive presentation. **Do not replace or duplicate these systems.** This addendum specifies previously unstated behavior for a card's compact expansion area, tactile note browsing, in-place bookmark image reveal, and state/transition portability.

## Card arrangement

Under the existing **Make Tags** control, offer an **expansion area** with independently expandable **Notes** and **Bookmarks** sections. Below these, place **Recommended Photos** sourced from relevant, permitted card tags and associations. Do not change the canonical bookmark-board card model; other boards should reuse those conventions. These are UI regions/views of existing independently identified objects, not new conflicting stores or implicit relationships.

A reasonable layout is:

1. Make Tags (existing functionality and tags preserved).
2. Notes (expandable tactile note collection).
3. Bookmarks (independently expandable rows of associated bookmark links).
4. Recommended Photos (tag-informed visual suggestions, beneath the expansion area).

Treat section display, open/closed state, and photo suggestions as presentation state. Suggestions require explicit acceptance before becoming saved connections and must never imply that tags prove a relationship.

## Notes: glossy, tactile roulette

- Present notes as aesthetic rows or stacked slices, with a **subtle transparent cellophane/laminated sheen** rather than a gaudy glass effect. The surface should feel premium and legible.
- Notes remain in a **fixed-size viewport** during browsing. Moving between notes must not stretch the surrounding card or push Recommended Photos and other controls up and down.
- Hover can lift/enlarge a note slightly with restrained shadow/depth. Hover emphasis is **not** the same as committed note selection.
- Up/down arrow keys, when the notes viewport owns navigation focus and not an editor or another input, spin/cycle between notes in a controlled **casino-roulette-like** vertical rhythm. The next note moves forward and grows slightly, while neighbors recede; notes settle naturally.
- Support pointer and touch analogues and sensible edge handling (explicit wrap vs clamp), plus clear selected/focused states. Define keyboard conflicts with scrolling, text editing and accessibility.
- Animation should handle rapid/reversed input without snapping, overlap or stacked animation queues. Prefer transforms/compositing and virtualize/bound offscreen content.
- Respect reduced-motion preferences with equivalent selection behavior but no forced spinning. Screen readers receive note titles/positions; focus visibility is preserved.
- The full-note focus behavior documented in the Contextual Image proposal remains authoritative: parent bookmark context, scrollable reader and Escape restoration. The roulette is a compact browsing mode, **not a replacement** for that view.

## Bookmarks: in-place reveal and image-to-foreground

- Show attached/associated bookmarks as tasteful, separately navigable **rows with working URL links**.
- Clicking the row's disclosure affordance expands it **in place** to reveal its image/thumbnail and any permitted related details. The **original URL stays visible and usable**; expanding the row must not automatically navigate away.
- Clicking the expanded image opens the **existing Atlas image pop-out/lightbox**, foregrounding the image above surrounding content and visually bringing it to the top; no parallel, incompatible image viewer.
- Distinguish actions: **expand row**, **visit website**, **open image preview**. They must not accidentally fire one another.
- Preserve the exact origin row, selected card, expanded state, focus and scroll position on closing the image, including Escape where appropriate. Do not scroll the underlying content unexpectedly to the top when foregrounding an image.
- Follow existing privacy/permissions, lazy loading, missing-image fallback and explicit association rules. An image inferred from a URL should be labeled as a candidate until saved or confirmed.

## State and transition architecture (cross-device)

Treat Atlas as a **set of meaningful states and defined transitions**, including the transitional intervals, not merely final rendered screens. Describe purpose, trigger, guards, content semantics, motion, invariants, accessibility and rollback/restoration for each interaction. Examples:

- Note: resting → approaching → selected/raised → receding → resting.
- Bookmark: collapsed → expanding → expanded → opening image → image foregrounded → closing → previous expanded context.
- Expansion section: closed → opening → open → closing → closed.
- Photo suggestion: candidate → inspected → accepted/dismissed, with provenance retained.

**Semantic state and transition rules must be independent of hardware-specific input and rendering.** Desktop mouse hover, keyboard arrows, phone touch gestures and other future devices may express the same intention through different controls or layouts. On a narrow device the view may be full-screen rather than a floating shelf, without changing data identity, link meaning, privacy, or reversible navigation. Do not assume Chrome extension APIs are present on mobile; platform adapters must be explicit.

Document intermediate **changes, expansions, movement, reordering, disappearance/reappearance, timing/easing and interruption/cancellation** where they materially define the experience. Do not persist every animation frame as a domain state. Distinguish persisted content, ephemeral interaction state, and rendered transitional frames. Never conflate visual reorder with a destructive change to Chrome bookmark order or canonical tags.

## Acceptance and regression checks (future)

1. Notes cycle vertically via arrows inside a viewport that maintains identical outer dimensions; hover raises a note without silently selecting it.
2. Rapid arrow changes, reverse direction and resize mid-transition settle deterministically, with no dangling transforms.
3. Tab/keyboard/touch access all functions; editors retain arrow-key use; reduced-motion mode works.
4. Bookmark expansion reveals an associated image while its URL remains actionable; visiting URL and previewing image are independent.
5. Clicking image foregrounds existing lightbox and closing returns to the exact bookmark/card position and expansion context.
6. Multiple collapsed/expanded sections never overwrite note or bookmark identities or associations.
7. Recommended Photos draw on relevant tags but make no unapproved relationships and leak no private content.
8. Responsive narrow-screen adapters preserve the same semantics, restoration rules and accessibility.
9. Keep existing image-page tag rotunda, contextual search and focused-note Escape navigation intact; avoid competing key handlers or duplicate viewers.

**Implementation gate:** inspect the existing Bookmark Board and card workspace first; prototype transitions there and prove compatibility before generalizing to newly created boards. This is a proposal, not a claim of shipped features.

## 0.1.76 implementation and owner clarification

The initial shared image-preview implementation places Notes at the left and Bookmarks beside it, beneath Generate Tags. The owner explicitly clarified that opening one closes the other (superseding independent simultaneous expansion for this view). Both may be closed; opening expands downward inside the same preview scroller. The title remains in its existing fixed heading. Recommendation placement is **below the disclosure row and any expanded content**, as a sibling region rather than inside either section; the recommendation engine is not implemented in this slice.

Notes show existing source note text and explicitly linked note resources; authored cards show their existing local text. Explicit outgoing graph-linked bookmarks appear as safe external links. This is read-only projection of existing IDs and stores, not a new association store or model inference. General recommendation candidates must not be mislabeled as saved bookmark links. Empty sections state their absence without fabricated content. Full-note text is readable through the one enclosing scroller; fixed-height roulette, editing/creation and nested image foreground/restoration remain future steps. Existing inline note text moved into Notes rather than being duplicated above it.

Implementation: `extension/pinboard-preview-sections.js`, projection in `pinboard.js`, markup/CSS in `pinboard.html`/`pinboard.css`. Separate presentation state preserves open section during same-card refresh, resets on a different card, uses buttons with aria-expanded/aria-controls, and confines reveal scrolling to the modal scroller. Reduced motion disables its small entrance effect. Targeted DOM/API tests verify exclusive states, projection, links and identity; real Chrome visual acceptance remains pending.
