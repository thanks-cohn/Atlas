# Atlas Proposal — Contextual Image Pages, Tag Rotunda, Bookmark Columns and Dated Notes

**Status:** Owner-directed product/interaction proposal; not implemented or verified.
**Recorded:** 2026-10-16 (America/Chicago).
**Companion proposals:** [Current Card Workspace](CURRENTLY_WORKING_ON_CARD_WORKSPACE.md), [Shelf-First Bookmarks](PROPOSAL_SHELF_FIRST_BOOKMARKS_COMPOSITIONS_AND_PORTABLE_PUBLISHING.md), [Association-Clustered Spatial Tag Field](PROPOSAL_ASSOCIATION_CLUSTERED_SPATIAL_TAG_FIELD.md).

## Intent

Preserve a beautiful, progressively disclosed visual page reached by clicking the image shown above a bookmark in Atlas's familiar right-hand bookmark shelf. The page focuses on an image, its brief editorial description, a **single-row horizontal rotunda of tag headers**, and bookmark columns beneath each active tag. Clicking a note focuses the page on that note and its parent bookmark; Escape restores the prior composition.

### Page structure

1. **Hero image**, optionally one item within a navigable gallery. Image arrows switch between images.
2. **Image-specific title and short text description** (normally one or two sentences) directly beneath the image, above the tag rotunda. This is not a full article. A reversible translucent white reading overlay can display that short description **over the image**; ensure readable contrast.
3. **Instant image-context search**, positioned directly beneath the title/short description and above the tag rotunda. Typing immediately brings forward **entire bookmark columns whenever any text associated with those columns matches**, including text within their notes, from across all tag headers for the current image, without a separate Search button or destination page. Search is scoped to relationships and information associated with the currently displayed image by default. Matching bookmarks remain expandable to their notes. Clearing the query restores the ordinary tag-rotunda view and its previously selected tag/expanded-bookmark state.
4. **Tag-header rotunda**: a single horizontal carousel row, preferably with a visually prominent active header and neighboring headers receding gracefully. This entire row is contextual to the current image and changes when the displayed image changes. It is not a global all-tags listing.
5. **Bookmark columns** beneath the active tag header: show bookmarks related to **both the image and this tag**. Each bookmark can pop open independently to reveal multiple notes directly underneath. Several columns can remain open. Their appearance may be responsive (e.g. fewer columns in a narrow shelf), but don't flatten the conceptual hierarchy.
6. **No redundant bottom tag section.** Tags themselves are the rotunda's grouping headers.

An image may belong to multiple galleries, projects, pinboards and other compositions without duplicating its identity or destroying independently stored descriptions, relationships or presentation settings.

### Search-specific display and verification — whole-column retrieval

The field beneath the image title/description is **universal contextual text search across the image's associated content**, not merely a tag finder or bookmark-title search. Its result unit is the **entire qualifying bookmark column**, not an isolated text fragment, pill, tag or detached note.

- Search the text available in the current image's associated structures: tag header names, bookmark titles, URLs/descriptions where indexed, full text of attached notes, note titles, dates when represented as searchable strings, and other textual descriptors or relationship annotations belonging to those columns.
- **If any searchable text anywhere inside a column matches**, immediately bring that **whole column forward** under the search field, retaining its bookmark identity and relationship to the current image. For example, a word mentioned only in the third note still retrieves the column headed by that note's bookmark.
- Make the matching note/field discoverable by highlighting its matching text and optionally auto-expanding the relevant bookmark, while maintaining a clearly reversible return to the unfiltered layout. Do not show only the matching fragment in place of its parent.
- Search is not constrained to the currently selected tag header: it may retrieve qualifying columns from **any** of the current image's tag headers, identifying their originating tag as needed. A bookmark present under multiple tag headers can be consolidated or represented with tag context without creating duplicate underlying records.
- Results update as the user types, with no Enter/search-submit requirement. These columns appear immediately below the search bar. The rotunda may recede or hide while results have focus.
- Clearing the query restores the exact previous tag-header, bookmark expansions, positions and focus. Changing the gallery image changes the search scope and its matched columns; proposed default is to retain query text.
- Local indexing and bounded rendering should keep the interaction responsive with extensive notes and many columns. Preserve input focus while typing, provide an accessible result count, and handle no matches calmly.
- The field is not global Atlas search: the default search boundary is all relevant columns **associated with the currently displayed image**, independent of whichever tag header is currently visible. A separate action may later offer global search.

**Acceptance scenario:** The active tag header is `Architecture`; a bookmark column under `Research` contains a note with the phrase `limestone arch`. Entering `limestone arch` must immediately surface that **Research bookmark column**, reveal or emphasize the note that matched, and preserve every other note in that column. Clearing the query returns to the same original `Architecture` rotunda position.

**Negative tests:** text matching only inside a collapsed note is still found; a matching tag/header also brings its bookmark columns forward; no tag-only filtering; no orphaned notes; no false assumption that the active rotunda header is the only search scope; no mutation of relationships or native bookmark order.

### Entry from a particular bookmark

If a user clicks the image displayed above bookmark B in the regular shelf, open the image's dedicated Atlas extension page with origin context preserved.

- Choose among tag headers under which **B qualifies** the one containing the **greatest number of bookmarks associated with this image**. That is a count within this image's tag-bookmark intersection, not an Atlas-wide tag frequency.
- When counts tie, choose deterministically, such as explicit saved tag order then stable tag ID.
- Bring **B to the top** within the selected tag's bookmark view and **automatically expand B** so its relevant notes show immediately. This is a local display override, not a mutation of native Chrome bookmark order or the underlying tag assignments.
- If no tag intersection is available, present B in an explicit **Untagged/Associated** fallback rather than inventing a tag.
- Changing the gallery image updates its title/description, tag-header carousel and associated bookmark columns together. Preserve per-image selection/expansion state when feasible.

### Focusing and leaving a note

Clicking a note in an expanded bookmark focuses that note **within the extension page**:

1. Bring the note's **parent bookmark to the top** as contextual header.
2. Temporarily remove/hide other bookmark columns, tag headers and unrelated context.
3. Display the note's **full contents in a scrollable reading region** below the parent bookmark.
4. **Esc reverses the presentation** rather than discarding it. Restore the originating image, active tag, bookmark order and expansion, viewport/scroll/focus positions and context. Esc inside an active text editor or modal must honor its local interaction first.
5. Returning again from the image page restores the shelf's prior bookmark/gallery location.

This is reversible progressive disclosure, not destructive navigation. The goal is visually smooth rearrangement, subject to browser-surface animation constraints.

### Dated notes — explicit owner addition

**Notes can carry an official, user-editable date** and be **listed/sorted by date**, including under bookmark columns and in the focused note page.

- Model `note_date` separately from system-created `created_at` and last-edited `updated_at`; an authored date is not automatically overwritten by edits.
- The user can set, revise, or remove the date. Undated notes remain fully supported.
- Date may signify when the note's observation/event occurred, not necessarily when it was typed; label the field plainly as **Date** and do not infer one without telling the user.
- Provide chronological ordering (oldest-first / newest-first); retain a stable manual order option. Show a legible date near the note row and in the focused reader when present.
- Stable tie ordering is required for equal dates. Undated notes should occupy a predictable separately ordered section or end-of-list, with an explicit policy.
- Store unambiguous calendar dates (ISO `YYYY-MM-DD` for date-only meaning); support optional precise timestamps only if later required and with timezone semantics made explicit. A date-only note must not shift days because of timezone conversion.
- Export/import and sync must round-trip this date unchanged. Searching and future chronological views may use it, but a date must not alter the note's owner or tag/image relationship.

### Data and relationship rules

Keep independent stable identities for image, bookmark, tag, note, gallery membership and relationship. A bookmark can appear under multiple tag headers without duplicating records. Distinguish (a) image title/description, (b) bookmark's own notes, (c) notes explicitly tied to an image, and (d) relationship notes. Do not present all generic bookmark notes as specifically describing the image unless their associations support that assertion. Native Chrome bookmark folders, Atlas object relations and temporary views are different things.

### Controls, aesthetics and acceptance

- Separate image-left/right navigation from tag-rotunda-left/right navigation; no ambiguous shared arrows.
- Retain a single-row hero/rotunda presentation rather than a vertical list of tag headers.
- Expansion/collapse of bookmark columns is independent, smooth, and does not collapse neighboring groups.
- Maintain comfortable image proportions, readable text overlay and responsive columns without overlaps or compressed unreadable text.
- Tests: opening image from B chooses largest qualifying header; B rises and expands; ties and no-tag cases work; changing image updates whole rotunda; opening note focuses B plus its scrollable contents; Esc restores exact prior context; two galleries reuse the same image; tags and notes do not duplicate or leak between images.
- **Dated-note tests:** author a date, edit note without altering date, sort oldest/newest, handle equal and missing dates, cross timezone boundaries, save/reload and export/reimport losslessly.

### Open implementation choices

Precise visual rotunda geometry/motion; number and arrangement of bookmark columns at various widths; whether notes shown are image-specific only or clearly labeled general bookmark notes; date display format and undated ordering; scheduling scope of date-sorting controls. These are implementation decisions to validate, not license to change the core behavior.

**Invariant:** image → brief title/description → instant search (live bookmark columns on query) → image-specific single-row tag rotunda → tag-and-image-associated bookmark columns → expandable dated notes → focused scrollable note, with exact restoration on Escape.
