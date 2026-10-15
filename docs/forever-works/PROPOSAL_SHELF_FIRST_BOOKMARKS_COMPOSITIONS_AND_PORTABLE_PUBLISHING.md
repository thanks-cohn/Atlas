# ATLAS — Shelf-First Bookmarks, Composable Groupings, and Portable Publishing

**Status:** Owner-directed architectural and UX **proposal**, 2026-10-15. Not an implementation claim or a replacement for verified runtime contracts.
**Companion:** [Joyful Curation and Semantic Atlas](PROPOSAL_JOYFUL_CURATION_SEMANTIC_ATLAS_AND_PUBLISHABLE_COLLECTIONS.md), [Premium Explorer Contract](PREMIUM_EXPLORER_PRODUCT_CONTRACT.md), and the current [status ledger](STATUS_AND_CONTINUATION.md).
**Intent:** Preserve the complete vision, distinctions, interaction invariants, and acceptance tests so a successor agent can implement it cold without conflating proposed behavior with existing code.

## Executive design

ATLAS is local-first and shelf-first. A compact right-click shelf is a *real primary workspace*, not a decorative launcher or a mandatory detour to a full extension page. Native browser bookmarks become explorable in a familiar file-explorer-style **Bookmarks** tab, enriched with independent Atlas metadata. Objects can be made accessible in nested groupings, explicitly related when the user means something by their connection, and selectively presented as page sections. The same content can compose pinboards, structured articles/projects/pages, and open-ended Liquid layouts, forming a cohesive portable website that may be exported for GitHub Pages or deployed, optionally, to Cloudflare Pages.

**Three distinct operations must never collapse into one:**
1. **Membership grants access:** putting a bookmark, image, note, document, file, video or group in a grouping makes it *available* there. This alone does NOT pair, relate, display, sequence, publish, or authorize the resource.
2. **Relationships establish meaning:** an explicit, typed, optionally annotated link or deliberate attachment explains why/how two objects are associated. Mere co-membership is not such a relation.
3. **Presentation determines appearance:** a saved view or section selects available resources and describes layout, ordering, displayed annotations, links, and exclusions. Hiding/removing an item from a view neither deletes the underlying item nor withdraws group membership or unrelated links.

**Privacy is a separate gate:** membership, relationship, selection in an editor, and public publication each have separate consequences. Publishing must be explicit, and only approved fields and assets may reach generated public files.

## 1. Native Bookmarks Explorer: use proven conventions

- Provide a dedicated **Bookmarks** tab inside the existing shelf with a conventional tree/list explorer: Bookmarks Bar, Other Bookmarks, Mobile Bookmarks *where supplied by Chrome*, nested folders, individual URLs, breadcrumbs, expansion, back/forward, search, recognizable icons/favicons, drag/drop, multi-select, keyboard support and contextual actions. Reuse the existing Atlas explorer UX/state components where appropriate; maintain narrow and expanded responsive layouts.
- Use the supported Chrome `chrome.bookmarks` API with declared permission for native reads, create/edit/rename/move/delete and copy semantics (copy may require creating a new bookmark). Subscribe to native bookmark events; reconcile external edits, deletes, ID changes, and restarts. Preserve original Chrome ordering by default. Presentation sorting must not silently mutate the native tree.
- Keep **Edit native bookmark** distinct from **Edit Atlas presentation/metadata**. Atlas-specific display titles, appendable notes/text, tags, custom covers, associations and grouping membership should not inadvertently rename/move the Chrome object.
- Chrome bookmark folders are **not** Atlas groupings. They organize native browser records; Atlas groups contain mixed resource types and can reference the same object from several places.
- No mandatory full extension page for ordinary bookmark work, and no automatic duplication or wholesale migration of all native bookmarks. Browse in place; optional Atlas indexing/references require stable source reconciliation, not assumptions that Chrome IDs remain portable across browsers.
- Every action should have clear state and debuggable errors. Respect browser permission/user-consent boundaries; do not imply full native-machine access from the bookmarks permission.

## 2. First-class objects, annotations and nested resource pools

Treat bookmark, image, image-gallery, note, document, video, file, catalog/category, tag, relationship and group as independently addressable resource types. Each may have a stable Atlas ID, title, free-form appended text and multiple notes, tags, source/provenance, visibility, timestamps, and relevant attachments and relationships. Relationships themselves may have a user-defined explanation, tags, privacy and order.

- A bookmark can have its *own* notes/tags and **access** to images, documents, files, other bookmarks, notes and nested groups. A linked image may independently have other notes, bookmarks and documents.
- Pairing a note with an image, declaring a bookmark the source of a photo, or asserting a comparison are **explicit** association actions; adding all of them to the same group is *not* enough.
- Nested groups may aggregate heterogeneous items and subgroupings, with shared membership, ordering and aliases as appropriate. Reject containment cycles; graph connections may have safe cycles if represented and traversed safely.
- The grouping interface should support **Add existing resource**, **Create resource**, **Add to grouping**, **Create relationship**, **Detach from grouping** and **Remove from presentation** as distinct operations, with safe default behavior.
- All objects remain independently selectable/searchable; don't flatten a note-image-bookmark assembly into one uneditable blob. Preserve the rationale for human-chosen associations.

## 3. Converting resources into compositions and pages

The user may choose **Create project from this bookmark**, **Make page from grouping**, or **Make section from selection**. This does not oblige Atlas to publish anything or to create associations that were never asserted.

A deterministic, customizable composition engine should:
1. Resolve the source group's available resources, nested groups, ordering and explicit relationships.
2. Offer a draft outline with subgroups as candidate sections, without treating membership as proof that items must be shown.
3. Offer sensible aesthetic patterns: image with note **beside / below / above**, image plus accessible bookmark links beneath, document-led research, visual comparisons, resource directory, or multi-image row/carousel; appropriate mobile variants.
4. Allow the user to include/exclude any resources or annotations, select ordering/layout and hide bookmark chips/links on this presentation **without deleting original associations or group membership**.
5. Allow either a live/reference-backed view (reflecting edits in the Atlas draft) or a deliberate independent snapshot. Never silently republish because a referenced group changed.
6. Support one grouping appearing in several sections or sites with separate presentation overrides and publication scopes.
7. For an image row, offer all chosen bookmarks in an aesthetically accessible area by default, or an optional **active/centered image only** mode where displayed notes and links change with the active image. Notes and links remain associated only if explicitly linked; shared group membership alone does not assert per-image association.

This engine should not require AI or a network request for baseline attractive layouts. Later agent assistance is optional and must not invent human-provided meanings.

## 4. Three interoperable page formats, one website

**Pinboard:** Pinterest-inspired masonry/catalog presentation, navigable image expansion with original board still visible dimmed behind the lightbox, keyboard left/right, close/ESC, responsive media and related public notes/bookmarks/tags. Titles, text, links and tags can be edited privately before or after publication.

**Structured editor:** Collections, articles, projects and conventional pages; composed of sections, textual blocks, images, documents, resource cards, references, and embedded group views.

**Liquid:** Open-ended yet portable modular canvas that may contain compatible text/media/components and nested existing views, using documented component contracts, layout fallbacks, accessibility, capability restrictions and safe execution boundaries. Arbitrary unpublished private data or executable code does not automatically cross into an export.

All formats share stable content identities, common assets, navigation, relations, metadata, responsive presentation, and a publication/site manifest. One website may contain all three page types. Page and section links reference canonical IDs; export resolves usable routes and asset URLs. A user's content model is not inseparably tied to a visual template.

## 5. Portfolio-inspired Showcase V1 and gallery navigation

Use the separately existing `portfolio` implementation as a **reference to inspect before coding** (its exact repository/path must be identified and reviewed; do not assert it has been inspected). Showcase V1 is the first *template*, not the only supported future design. Keep the landing page in **three independent horizontally navigable rows**, optional movement/auto-advance **disabled by default**, editable title/text and supplemental tags and bookmark references.

**Gallery window and imprint:**
- Each row can contain an unbounded *logical* number of images within storage/provider realities.
- **Seven image slots visible by default at an appropriate desktop size**: last-viewed/last-closed image centered, **three preceding and three following**. Fewer at narrower widths; user-adjustable counts and override budgets for stronger machines. This is a visual viewport, not a collection cap, DOM cap, or universal network-request count.
- When user exits expanded media with Escape, close button or supported action, persist the *stable image ID* and restore the row window around that anchor. Each row remembers separately. Edge handling (clamp or wrap) must be defined consistently; never conjure nonexistent images.
- Selecting an image opens a lightbox over the original board, preserves its scroll/context, offers left/right controls, keyboard and touch equivalents, and restores focus on exit. Optional active-image-specific link/note panels follow **explicit associations only**.
- Lazy load appropriately scaled thumbnails and preview assets; virtualize offscreen items, prefetch a bounded neighborhood, dispose of heavy media where practicable, respect reduced motion, and keep interaction fast on modest 4GB-class hardware. Local image references are not free: decoded bitmaps and DOM nodes consume memory too. Advanced settings can relax budgets, not security/privacy constraints.

For public sites, last-viewed state is **per visitor**, locally persisted where allowed, and must not change the owner's published default or another viewer's state. Owners can choose published starting anchors.

## 6. Shelf-first organization and future mobile adaptation

The right-click shelf provides a persistent left navigation area (or accessible narrow-mode equivalent), a Bookmarks tab and familiar explorer, and Atlas-owned catalogs, galleries, projects, articles/pages and Liquid workspaces. A **Create** dropdown makes a new gallery/group/project/page; it immediately appears in the relevant navigation section. Users can reference native bookmarks in multiple Atlas groups without moving browser folders. Minimize new panels, duplicate state systems and modal bureaucracy.

The same interfaces and data contracts should be reusable in enlarged desktop and mobile shells, but don't claim desktop Chrome extension APIs exist on every mobile browser. Provide adapters and appropriate permissions per platform.

## 7. Provider-independent authoring, entire-project export, optional publish

**Author locally and offline.** No Cloudflare, GitHub, Worker, API key or hosting account should be needed to collect, annotate, group, compose, edit, navigate, preview or export. Saving a draft never automatically republishes a website.

Provide two deliberate export products:
- **Website ZIP:** complete, deployable public static site (HTML/CSS/JS, routes, accessible behavior, approved media and public structured references) suitable for GitHub Pages including project-path/base-URL handling, Cloudflare Pages and ordinary static hosts; no Atlas runtime or extension requirement.
- **Complete Editable Project ZIP:** website plus private editable project data, schema/relationship records, assets and reconstruction guidance. **Separate private project data from the webroot** so deploying the project folder cannot inadvertently expose private content. Prefer separate private archive or unequivocally non-deployable location; don't package secrets into either archive.

A documented, versioned schema (build on existing proposed **AKF**, not a competing unspecified format) must preserve source objects, grouping memberships, typed relationships, presentation selection/overrides, site/page manifests, asset locators and permitted packaged media, migrations, validator and round-trip reimport. Produce an actual static site, not merely a JSON dump. All exported pages must work without Atlas installed and without transient extension `blob:` URLs or private local filesystem URLs.

**Publishing is optional and deliberate:**
- Export manually for GitHub Pages, Cloudflare Pages or another host.
- Or connect Cloudflare via a supported user-authorized flow (e.g. scoped OAuth if verified as applicable for Atlas's client/app registration); do not assume simply supplying a website URL authorizes writes. Securely store/revoke credentials with least privilege and avoid exposing them in published artifacts. A Worker/deployment broker may be justified for a multiuser service, but **a Worker is not required for a manually uploaded static Pages website**.
- After connecting, bind Atlas site ID to provider account/project ID and support **Publish**, future **Update**, deployment receipts/status, failure recovery and version/rollback where provider features permit.
- A failed/offline deployment leaves locally saved work fully usable. Editing is not gated on deployment authorization.
- GitHub direct publishing can be a later adapter; it is not the required editing substrate. Avoid vendor lock-in.

## 8. Schema sketch — conceptual, not an implemented contract

```json
{
  "schema_version": "akf-draft",
  "resources": [
    {"id": "bookmark-rome", "type": "bookmark", "source": {"provider": "chrome-bookmarks", "native_id": "source-local"}},
    {"id": "image-pantheon", "type": "image"},
    {"id": "note-dome", "type": "note"}
  ],
  "groups": [
    {"id": "rome-pool", "members": ["bookmark-rome", "image-pantheon", "note-dome"]}
  ],
  "relationships": [
    {"id": "rel-note", "from": "note-dome", "to": "image-pantheon", "type": "describes"}
  ],
  "presentations": [
    {
      "id": "rome-section",
      "source_group_id": "rome-pool",
      "selected_resource_ids": ["image-pantheon", "note-dome"],
      "layout": "image-text-below",
      "hidden_resource_ids": ["bookmark-rome"]
    }
  ],
  "site": {
    "id": "my-world",
    "pages": [
      {"id": "home", "type": "liquid", "path": "/"},
      {"id": "references", "type": "pinboard", "path": "/references"},
      {"id": "history", "type": "editorial", "path": "/history"}
    ]
  }
}
```

In this example, `bookmark-rome` is accessible in the resource pool but **not presented in that section**; the explicit `describes` edge expresses the note-image relationship. Real records additionally require schema validation, privacy, provenance, media references and version rules. Do not ship this example as a finalized validator.

## 9. Boundaries, safeguards and acceptance scenarios

**Scope/order:** (1) native bookmark explorer integration and resilient shelf UX; (2) independent resource metadata + grouping; (3) explicit relations and reusable presentation selection; (4) structured editor and Portfolio Showcase V1; (5) Liquid and unified site assembly; (6) static ZIP and provider publishing adapters. Build only genuine integrated increments; do not label proposals implemented. Preserve existing premium file explorer, native helper trust boundaries and tests.

**Verification scenarios:**
- A person opens the shelf Bookmarks tab and explores the *actual* native bookmark hierarchy, including external edits, without requiring the full page.
- Adding a Chrome bookmark to two Atlas groups does not change its native folder and does not duplicate its source object.
- Group contains bookmark, photo, note, document and a nested group. The photo and note have independent annotations; only an explicit action makes the note *describe* the photo.
- Removing a bookmark chip from one article section does not delete its original record, group membership or relationship.
- A group with multiple subgroups can produce an editable multi-section project outline; layouts are attractive and remain customizable.
- Each of three Showcase rows can have e.g. 1000 logical images while rendering a bounded active window, seven desktop slots default. Close image 47 and it returns as center with three before/three after; preserve row-by-row anchors across revisits.
- Articles, Liquid pages and pinboards link across one site; a ZIP deployed to GitHub Pages works at a repository subpath and on Cloudflare Pages without the extension.
- A private group member is NOT leaked by public site output, source maps, thumbnails, metadata, search indexes, link previews or assets.
- Loss of Cloudflare authorization/offline does not block editing or export; failed publish retains local work and gives a concrete error and retry pathway.
- Full editable project can be reimported and reproduces the source graph without changing unrelated Chrome bookmark folders.

**Documentation/engineering:** Follow Forever Works cold-inheritance discipline: motivations, questions answered, invariants, non-goals, interfaces, versioning/migration, precise state ledger and negative tests. Reuse existing `extension/`, `src/atlas_core/`, privacy and recovery abstractions; inspect before implementation. Keep Any-Shape responsiveness in small shelf, 1366x768 desktop and mobile variants. Cross-platform/mobile behavior and publishing authorization must be verified, not assumed.

## 10. Decisions not yet fixed

The exact `portfolio` source repo/ref; supported provider authorization UX; cloud asset hosting strategy; start/end handling for seven-slot rows; defaults for linked vs copied presentations; precise media/DOM budgets and settings; whether static-site build occurs fully locally or via optional trusted builder; and Liquid's allowed custom component sandbox. Record decisions through tests and explicit product choices, not guesswork.

**One-line product promise:** Collect things because you enjoy them; make them accessible together, explicitly connect what matters, and present selected parts beautifully—without rebuilding your work, surrendering your files or relying on a hosting provider.
