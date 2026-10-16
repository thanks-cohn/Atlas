# Currently Working On — Card Workspace and Publishing

**Status:** work-in-progress product specification; owner-directed design, not implementation evidence.
**Recorded:** 2026-10-16, America/Chicago.
**Baseline source:** [9c4ca96a4c7a1e0372661bf09508a323504e99cd](https://github.com/thanks-cohn/Atlas/commit/9c4ca96a4c7a1e0372661bf09508a323504e99cd).
**Preserved baseline branch:** `baseline/atlas-before-card-workspace-2026-10-16`.
**Scope of this change:** documentation and baseline preservation only. No extension, companion, storage schema or published website behavior is changed by this document.

## Purpose and provenance

Atlas should make collecting, organizing, connecting and presenting personally meaningful material enjoyable. It specializes in reusable cards that hold more information than they initially display, revealing that depth through deliberate, aesthetically composed expansion.

The owner explicitly established the behaviors below through discussion. This document captures those directions and their reasons. Implementation suggestions and unresolved choices are labeled separately. It does not assert that existing code already implements this design or replace accepted permission, export, ownership or Free/Premium contracts.

Use this alongside [the inheritance index](README.md), [the shelf/grouping proposal](PROPOSAL_SHELF_FIRST_BOOKMARKS_COMPOSITIONS_AND_PORTABLE_PUBLISHING.md), [the joyful curation proposal](PROPOSAL_JOYFUL_CURATION_SEMANTIC_ATLAS_AND_PUBLISHABLE_COLLECTIONS.md), and [the economics index](../economics/README.md). For overlap, this document records the newer owner clarification; retain previous rationale and identify real conflicts before implementation.

## 1. Shared vocabulary

| Term | Meaning in this design |
| --- | --- |
| Grouping | The associated collection of content/data represented by a card; it may contain more than the card currently displays. |
| Card | The reusable presentation and interaction object through which a user encounters that grouping. |
| Project | A flexible organizer that can contain other supported things, including projects. |
| Page | A presentation that can contain one or several sections. |
| Gallery / pinboard | Presentations for collections of cards; a pinboard uses the established masonry arrangement. |
| Section | Either an Atlas workspace destination or a content region within a page; implementations must make the context clear. |
| Tags | Per-object descriptive data and a dedicated route for finding associated objects across types. |

Do not collapse the grouping's data into its rendered HTML. A card is not a guarantee that every associated field is visible. Existing individually annotated resources and relationships must retain their identities and notes/tags; this design does not silently merge them into parent-only annotations.

## 2. Section navigation and creation

The left column navigates to sections such as Galleries, Projects, Catalogs, Bookmarks and Tags. Clicking a destination changes the workspace to that section's layout.

**Individual created objects do not each become left-column navigation entries.** They appear immediately inside their corresponding section, with appropriate type icons. Catalogs have a recognizable catalog icon. The creation dropdown offers supported types such as project, catalog and gallery; creating and naming one must produce something immediately visible, selectable and usable.

The owner reported that current creation felt ineffective and the area too blank. This is owner-reported experience, not a reproduced defect in this documentation change.

Place **+ Bookmark in Bookmarks** and **Export JSON in Settings**. The Catalogs and Relationships area concerns creating, organizing and connecting collections rather than presenting unrelated global actions.

**Reason:** clear destinations and immediate visible results make creation understandable and give users a dependable place to return.

## 3. Shelf hierarchy and progressive disclosure

The shelf presents organized hierarchies like a familiar bookmark explorer: downward disclosure arrows expand entries to reveal children.

Selecting a gallery/grouping displays its representative image with its bookmarks underneath. Selecting a bookmark changes the representative image above to that bookmark's own representative image. The bookmark list remains underneath, preserving parent context.

The current object's presentation follows:

1. Representative image.
2. Click the image: show that object's title and text.
3. Click again: show that object's tags.

This applies to a parent gallery/grouping and a selected bookmark. Information must always belong to the object currently represented.

Esc retraces presentation/navigation history: tags → title/text → current image; backing out of a selected bookmark returns to the parent's representative image, then to the prior hierarchy as appropriate. Preserve selection, expansion and location when returning.

A setting allows a text-and-tags-first presentation instead of automatic images. More customizable template states are described below; the image-first sequence is the default shelf interaction, not an instruction to discard information.

**Reason:** keep the initial view approachable while letting users explore depth without losing their place.

The full gallery has a dedicated extension webpage/presentation in addition to the compact shelf. The exact control that opens it must not conflict with the agreed image-click disclosure sequence; its label/gesture is still to be specified.

## 4. Pinboard presentation and image quality

The full pinboard uses a Pinterest-style masonry layout. Cards have large images, text excerpts ending in “…” when truncated, and roughly nine tags underneath in the default preview. Heights vary with image proportions.

Images must not be stretched or unnecessarily enlarged into a pixelated result. Preserve appropriate aspect ratios and balanced spacing. Nine visible tags is a presentation target, not a storage cap or an authorization to remove other tags.

Every state must remain aesthetically composed: compact card, title/text, tags, expanded bookmarks, full-width expansion and return. Responsive behavior must preserve usability and composition.

## 5. Tag exploration and scoped searching

Tags have their own section. Clicking a tag **selects it without navigating**. Users may select multiple tags, then press **Enter** to open results.

Matching is **ALL selected tags**, not ANY. Additional tags deliberately narrow the result set. Show the active selection clearly.

The results view groups all directly associated matching objects by type, ordered initially:

1. Galleries.
2. Projects.
3. Other created types.
4. Bookmarks toward the end.

Do not mix all types into an undifferentiated list.

Selecting a section header, such as Projects, makes it bold, moves it to the top and focuses/expands the workspace to that section alone. Search then applies only within that section, retaining active tag conditions. Esc restores the previous grouped view.

A Tags button at the top switches search mode within the current section: typed queries target tags rather than ordinary title/text content. Multiple applied tags retain ALL matching. Selection and scope are distinct: selecting Projects does not erase the chosen tags.

**Reason:** users choose both what kinds of things they are searching and the combination of meanings those things must share.

Tag-name matching, suggestions, typed-token commitment, selection removal and treatment of inherited versus directly attached tags remain to be defined. Do not invent implicit tag inheritance.

## 6. Flexible hierarchy and page composition

Projects may contain any supported type and may nest under other projects. A project can contain pages, galleries, pinboards and further projects.

A page can be presented as one gallery or pinboard, or combine several regions—for example, a pinboard section and a gallery section.

The hierarchy is flexible, but containment-cycle policy, shared references versus parent ownership and deletion behavior require explicit data contracts before implementation. Existing relationships are not automatically containment.

## 7. Default card and richer underlying content

Each grouping/collection receives a card. Its configurable default presentation is:

**User-selected image → title → text → optional hyperlink button or custom Liquid content → tags at the bottom.**

The user can supply a hyperlink and label through a pre-designed button, or custom Liquid content in the corresponding presentation area. The owner first described content beneath the image and then clarified this final order.

Associated content can exceed what is initially shown. A bookmark icon, for example, reveals bookmarks. Other media and data retain their own fields and interactions.

The card is reusable across gallery, pinboard and page contexts. Switching layouts does not require recreating its content.

“Liquid” records the owner's requested template capability; the engine, supported syntax, rendering stage, asset access, preview behavior and handling of active/untrusted content are not decided here. Do not interpret it as arbitrary code execution inside the extension or promote imported templates to authority.

## 8. Templates, expansion and movement

Begin with a default data/presentation template, then allow controlled configuration of visible elements, style and interaction states.

Examples explicitly discussed:
- Hide tags or text without deleting them.
- Display a minimal image/title/link card.
- On bookmark expansion, retain title/text while shrinking other elements.
- Expand a card into a whole horizontal/full-width region and move surrounding cards up/down to accommodate it.
- Collapse back into its prior compact placement.

Templates control the card's internal arrangement and how the surrounding layout responds. Maintain visual composition at each screen size and transition.

**Future capability:** drag and drop cards to reorder or move between sections. This is a planned extension, not shipped functionality.

**Reason:** users can mix and match presentations while keeping meaningful data intact; expansion makes depth accessible without cluttering every initial view.

## 9. Data portability and D1 suitability

Owner requirement: structure the information for straightforward transfer and database representation, including D1, while enabling independent styling and optional sections.

Implementation direction, not a finalized schema:
- Stable grouping/card/resource identities.
- Content and associations stored independently of visibility.
- Placement/order separated from underlying content.
- Template/display/interaction settings separated from content.
- Versioned export/import that preserves hidden fields and relationships.

D1 is a possible storage representation, not a new mandatory dependency. Retain local-first usefulness and existing documented export/ownership guarantees.

Whether one card can have multiple synchronized placements, which settings belong to each placement, and how shared edits propagate must be settled before storage migrations.

## 10. Publishing and automatic navigation

Before publishing, the user must designate an eligible item as the **landing destination**. This requirement remains even when navigation is hidden.

Generate top navigation automatically from the **published project's hierarchy**. Enabled by default; users may opt out. The menu summarizes the published site in navigable form.

For now its style is plain, professional **black text on white**, with conventional dropdown logic, accessible keyboard/touch interaction and behavior that adapts to available screen space.

The owner identified existing `rolodex.js` as the intended navigation component. Locate and inspect the actual code/API/license before integration; this document does not claim it is present in this repository or verified to meet these requirements.

Reference guidance:
- [W3C disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/).
- [W3C navigation with parent links and separate disclosure controls](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), targeting AA; following an example alone is not compliance proof.

Proposed conventional mechanics include distinct parent links/expand buttons, keyboard activation, Esc closing with restored focus, visible focus/expanded state, and a vertical expandable presentation at narrow widths. Exact implementation remains subject to inspection and verification.

Only published content belongs in public navigation. Existing public/private export contracts remain applicable. Exact routing of non-page objects, asset requirements, Cloudflare orchestration, publication snapshots and update controls need a separate implementation contract. Earlier suggested preview/publish/update steps are proposals, not owner-approved detailed behavior in this discussion.

## 11. Reasons to preserve across implementations

| Stable direction | Owner purpose / reasoning |
| --- | --- |
| Created objects become visible in their section | Creation must have an immediate, useful, understandable result. |
| Section navigation rather than individual sidebar clutter | Keep destinations recognizable as the number of objects grows. |
| Compact hierarchy and reversible expansion | Explore rich information while retaining orientation and context. |
| Select tags, Enter to apply, ALL matching | Enable deliberate combinations that meaningfully narrow results. |
| Explicit section and tag-search modes | Make search scope understandable and controllable. |
| Reusable data with configurable card presentation | Mix styles and layouts without losing or recreating information. |
| Automatically generated navigation | Publish a navigable hierarchy without manually rebuilding menus. |
| Aesthetics in every state | Visual pleasure, clarity and composition are essential product outcomes. |

These reasons should survive replacement of the UI framework, database, layout algorithm or publishing provider. Mechanisms remain replaceable when their observable obligations are preserved.

## 12. Implementation and verification tracking

All new behavior above is **PLANNED / NOT VERIFIED by this documentation change**. The pre-change baseline contains existing companion, previews and native-bookmark work; consult the pinned source and existing evidence rather than equating its existence with complete Chrome/Windows acceptance.

Suggested future vertical slices, not a new implementation authorization:
1. Section navigation and immediately visible creation.
2. Default cards, shelf state/history and representative images.
3. ALL-tag selection and type-scoped search.
4. Reusable placements, templates and responsive expansion.
5. Landing selection and generated published navigation.
6. Advanced configuration, Liquid and drag/drop after their contracts are resolved.

For each slice, document actual code, migration impact, owner rationale and tests. Verify persistence/reload, correct object identity, hidden-data preservation, back/Esc behavior, keyboard/touch and narrow/wide layouts. Visually inspect expanded states, image quality and return placement; screenshots alone do not prove interactions.

Before publishing, separately verify public/private projection, landing validity, reachable routes and hierarchy navigation. Validate import/export compatibility and distinguish local, hosted and actual-browser evidence.

Keep this WIP specification current, retain decision history, and mark implementation evidence separately. Do not rename planned features as shipped when merely adding code or documentation.

## Open decisions

- Exact opening action for a full gallery page versus image disclosure.
- Default Esc behavior when focus is in an input, a dialog or a nested template interaction.
- Precise text-first template behavior, tag suggestions and typed-query commitment.
- Allowed nesting, cycles, shared placements, deletion and inherited annotations.
- Relationship between gallery/pinboard objects, page sections and presentation choices in the durable schema.
- Route/landing rendering for each eligible published type.
- Liquid engine, execution/rendering boundaries and supported content.
- Implementation/version/license and integration contract for the owner's rolodex component.
- Feature entitlements mapped to existing economics decisions before implementation; do not invent new limits here.


## Addendum — interchangeable modular compositions

**Owner clarification, 2026-10-16:** the previously described image-first arrangement is an initial extension preset and a first attempt at interchangeable positioning. It is not Atlas's final structure or a permanent image → bookmarks → notes hierarchy. The durable goal is user-configurable modular composition with sensible, elegant defaults and a premium visual feel.

Users should eventually be able to switch between **image-centric, video-centric, article-centric and gallery-centric** presentations. These are presentation choices over associated content, not separate silos requiring users to recreate their collections.

Examples of supported design direction:
- Start a column with notes, then reveal images connected to each note.
- Start with a gallery and explore its related notes, media or other content.
- Populate a column with objects related to the selected tags.
- Present notes with their own attached tags.
- Rearrange the composition into columns, rows or carousels.

**Immediate starting direction:** begin with a carousel-style preset for the modular arrangement discussed here. Preserve the earlier masonry pinboard as another planned presentation; neither layout defines the underlying content model. Exact carousel controls, sizing and which initial surface uses it remain implementation decisions to resolve before coding.

The initial release may provide a bounded set of polished presets. Its architecture must support later changes by both Atlas maintainers and users: exchange the lead content, related-content regions, arrangement and expansion behavior without losing data or rebuilding the collection. “Endless modularity” expresses extensibility, not a claim that every imaginable layout is implemented or that arbitrary executable plugins are authorized.

**Architectural direction:** keep content identity, typed associations, selection/filter rules, component placement, presentation presets and interaction states separable. A column is a presentation region, not a hardcoded content type. Allow alternate components to render supported content and follow explicit associations without imposing implicit ownership, permission or tag inheritance.

Existing ALL-tag matching remains the default search rule. Changing a visual preset must not silently change query meaning, mutate relationships, remove hidden information or expose private content. “Related to a tag” alone does not authorize traversing arbitrary relationship paths; query/traversal rules need explicit contracts.

**Acceptance direction:** demonstrate the same underlying collection in at least two materially different compositions, including a note-first alternative to an image-first preset. Preserve identities, notes, tags, links and media associations through switching, save/reload and export/import. Show that users can change supported presentation settings without source edits. Visually review compact, expanded, empty and narrow-screen states. These checks are planned, not executed here.

This clarification governs interpretation of the defaults below. The lasting requirement is beautiful, understandable, interchangeable composition; specific positions and the initially leading medium remain configurable mechanisms.

