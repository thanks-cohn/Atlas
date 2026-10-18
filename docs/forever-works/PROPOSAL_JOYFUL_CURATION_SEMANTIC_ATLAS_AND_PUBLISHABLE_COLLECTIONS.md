# ATLAS — The Joy of Curation and the Permanence of Meaning

**Status:** Owner-requested product and architectural proposal, 2026-10-15. Future target; not evidence of implementation.
**Location in project:** Forever Works product vision; complements `PREMIUM_EXPLORER_PRODUCT_CONTRACT.md`, not a replacement for functional file-explorer commitments.
**Audience:** Humans, designers, developers, and successor agents inheriting this repository cold.

## 1. Executive proposition

ATLAS should solve the long-standing problem of saved links and resources that people never revisit. Instead of a graveyard of bookmarks, it offers a joyful, exceptionally polished, Pinterest/Instagram-fluent experience for collecting, arranging, describing, associating, rediscovering, and eventually *publishing* pieces of a person's curated world.

**Human value first:** saving and organizing should be intrinsically fun. Users can click Save, attach an image, write a thought, add a few tags, and continue. Technical concepts such as graph nodes, database tables, JSON schemas, and AI embeddings must not be prerequisites for enjoyment.

**Enduring value underneath:** users' voluntarily invested attention creates portable, navigable, semantic, structured data. ATLAS must preserve *what* was saved, *why* it mattered, *why* two things were related, *when* meanings changed, and *which audiences* may access each part. Future authorized agents can retrieve, explore and reason over this record; external programs can rebuild it; users may opt into preparing selected data for AI training. No promise that an agent can perfectly understand a person, infer inner states from bookmarks, or receive private data by default.

**Publishing opportunity:** the exact collections a person enjoyed creating can become charts, graphs, galleries, interactive web exhibits, curated portfolios, research indexes, and complete attractive static websites. Time spent organizing is not throwaway labor: it can become deliberate publishable work without manually rebuilding all the content in a site editor.

### Governing principles

1. **Delight before data entry.** Fast capture, beautiful presentation, low-friction annotation; no mandatory tagging.
2. **Every object can have meaning.** All resource types and relationships can have title, text/notes, tags, and visibility.
3. **Why matters as much as what.** Descriptions of a connection are first-class data.
4. **A collection is a presentation, not merely a directory.** Logical placement is independent of physical storage.
5. **Private by choice and secure by enforcement.** Public/agent-visible is explicit; export and training require separate decisions.
6. **Portable by design.** A fully documented, versioned, reconstructable JSON export belongs to users, not a proprietary UI.
7. **Publish, don't re-enter.** Curated data can produce beautiful shareable experiences by a user-controlled publishing workflow.
8. **Capable on modest hardware.** Preserve ATLAS's responsive UI, 1366x768 / narrow side-panel and 4-GB-class design goals.
9. **Accessible and trustworthy.** Keyboard navigation, motion preferences, screen readers, reliable links, understandable errors.
10. **No feature theater.** Cards, counters, galleries, graphs and export actions must operate on persisted data.

## 2. Primary UX: catalogs as places worth revisiting

In the Catalogs & Relationships area, create or edit an Atlas catalog. A user may pin that catalog as a rearrangeable icon in a vertically scrollable left sidebar. Clicking the icon opens a polished, responsive presentation of chosen directories, bookmarks, tags, photographs, galleries, files, videos, notes and interconnections. Support custom catalog title, icon, cover art, description, accent/theme, ordering and layout.

View modes should share the **same** underlying data: image-led masonry/boards, editorial cards, accessible grid, compact list, directory/folder hierarchy, relationship network, chronological journey, and later dashboard. Switching layouts must not change the canonical associations or privacy permissions. Layouts adapt to full-tab and side-panel contexts via Any-Shape-style structural responsiveness; avoid truncated controls or inaccessible hidden actions.

**Simple capture path:** bookmark or page > Save to Atlas > optionally choose catalog > optionally add or select a local/remote image > add a natural-language caption such as "This reminds me of..." > optionally say "I paired this image with this bookmark because..." > add tags > Save. Prefer optional progressive disclosure over a long required form. After save, users can continue exploring, drag to arrange, and reopen annotations in place.

**Import browser bookmarks:** preserve URL, original title, folder hierarchy, available dates/source metadata and source identity; offer deduplication, failure reporting and user-controlled transformations. Imports should not assign invented personal meanings or publish anything. Later importers may support other formats and providers through explicit adapters.

## 3. Universal annotation and typed relationship model

ATLAS objects include at least: catalog, folder/directory reference, bookmark/webpage, image, gallery, video, audio (future-ready), document, generic file, note, tag, and saved presentation. Every object may independently have:

- stable globally unique ID, type, human title, source/provider locator(s), creator/provenance;
- short caption, longer free-form description and appendable dated notes (multiple notes allowed);
- zero or more tags, optional aliases, catalog memberships, cover/thumbnail references;
- attachable resource references and typed connections to other objects;
- explicit per-object/per-note/relationship visibility and access-policy metadata;
- timestamps, revisions, import/export version and availability status where relevant.

Relationships are **first-class** records with their own ID, source ID, target ID, relation type, label, optional explanatory text ("why these were paired"), tags, created/updated timestamps, provenance, ordering and visibility. Supported labels can include `reminds_me_of`, `inspired_by`, `illustrates`, `related_to`, `contrasts_with`, `supports`, `source_for`, `contained_in`, plus extensible user-defined relation types. Preserve whether a connection is directional and whether it is user-authored, imported, or agent-suggested. Suggestions are not facts until accepted.

**Example:** An image's note says it evokes childhood nostalgia. The relationship note says a linked architectural article creates the same atmosphere. The article's own note describes a technique useful in an author's fiction. All three are different records with different semantics, not a single flattened caption.

Tags may themselves have titles, descriptions, aliases, hierarchies or relations and privacy rules. Inferences or correlations derived from shared tags should be labeled as suggestions, not mistaken for user-asserted causality. Preserve changed meanings over time where practical.

## 4. Multimedia and file associations

An item may attach/reference:
- one image or several images;
- an image gallery (itself containing independently annotated/tagged images);
- video(s), documents, general files, bookmarks, directories or external resources;
- other Atlas items, collections or curated assemblies.

Support **local file references**, **remote URLs**, and **Atlas-managed uploads** as distinct strategies. Link rather than duplicate media by default; optional packaging may include safely consented bytes. Original availability can vary by machine or credentials. Never claim an external or local asset is present in export merely because its locator was exported.

Each card can show **clickable, derived, correctly pluralized counters**, for example: `1 Gallery · 3 Documents · 2 Connections · 1 Video · 5 Files`. A counter opens the precise filtered group; do not silently double-count linked aliases or same file instances. Each attachment gets independent title/description/tags, and any attachment can itself have attachments or relationships, with cycle-safe graph navigation.

Support images as meaningful navigational objects: selecting a photo may reveal the bookmark beneath it and the human-written reason for pairing. The photo itself may link to other locations, resources and collections. Keep the display aesthetically quiet, reveal details on demand.

## 5. Privacy, protected collections, and agent access

Design **private / protected / explicitly agent-shared / explicitly public** semantics, with narrowly scoped field-level overrides where necessary. Default new personal data to private unless the user makes a deliberate visible choice. Do not conflate a public catalog with automatic disclosure of every linked child, private note, relationship, URL, or media file.

- Ordinary UI and local user-authorized programmatic access follow appropriate session/device permissions.
- Protected collections may require reauthentication; confidential at-rest data should use real encryption and secure key handling, not password-dialog theater.
- Agents only access expressly public/agent-shared fields by default, using a documented API with scoped credentials, expiry, revocation, auditability and least privilege. No unscoped master token as the convenience path.
- A user can delegate an agent access to *selected* private items temporarily without converting them to public.
- Treat graph edges, search indexes, counters, previews, thumbnails, filenames, and even the **existence** of private objects as possible disclosure surfaces. Filter before traversal, aggregation, ranking and export.
- Public visibility, AI retrieval, third-party API access, and permission to train models are four **separate** decisions.
- Export annotations indicating permissions do not protect plaintext once exported. Enforce access *before* assembling or transmitting exports.

An explicitly public GitHub repository is not a private vault. Never put users' private catalogs, account credentials, personal exports, or secret tokens in the source repository.

## 6. Atlas Knowledge Format (AKF): portable, agent-readable export

Specify **AKF**, a versioned public JSON interchange contract (name provisional until approved). It should be readable by ordinary scripts and advanced agents, with JSON Schema, published examples, machine-validation, a reference parser, and migration rules. Favor round-trip fidelity, referential integrity, deterministic stable IDs and documented extension namespaces over an opaque agent-specific prompt dump.

**Suggested export manifest:**
- `schema_version`, `export_id`, `generated_at`, `origin_app`, `scope`, `content_policy` and capabilities;
- `objects[]`: typed catalog/media/bookmark/document/note/tag/etc. objects with IDs, titles, text, dates, origin and annotation references;
- `relationships[]`: typed, explainable links and independent notes/tags/visibility;
- `catalog_memberships[]`, `layouts[]`, `collections[]`, optional graph/dashboard configuration;
- `assets[]`: logical asset IDs, MIME types, hashes when available, source locators, whether bytes are bundled, relative safe paths, licenses and accessibility alt text;
- `privacy_and_consent`: visibility, allowed export audience and affirmative consent receipts for relevant operations, with no implication that metadata is a security barrier;
- `warnings[]`: unavailable assets, missing references, unsupported features, intentionally redacted edges/nodes, unresolved imports.

Example, deliberately abbreviated (illustrative rather than validated implementation):

```json
{
  "schema_version": "akf/0.1-proposal",
  "export_scope": "owner_selected_public",
  "objects": [
    {
      "id": "image:01",
      "type": "image",
      "title": "The Forgotten City",
      "notes": [{"id":"note:01","text":"This reminds me of childhood.","created_at":"2026-10-15T00:00:00Z"}],
      "tags": ["nostalgia", "architecture"],
      "visibility": "public"
    },
    {
      "id": "bookmark:02",
      "type": "bookmark",
      "title": "An Essay on Environmental Storytelling",
      "url": "https://example.org/essay",
      "visibility": "public"
    }
  ],
  "relationships": [
    {
      "id": "edge:03",
      "source_id": "image:01",
      "target_id": "bookmark:02",
      "type": "reminds_me_of",
      "note": "I paired these because they share a sense of discovery.",
      "tags": ["creative-influence"],
      "visibility": "public"
    }
  ]
}
```

This export is meant for normal software ingestion, search, graph traversal, curated-site generation and user-consented preparation of training corpora. A machine-readable export does **not** itself grant authority to train a model, bypass private fields, or read missing attachments. Provide owner-facing previews of exactly what will leave the device and a redaction summary.

Offer two distinct export paths: (A) portable owner backup with chosen personal data and optional encrypted media bundles, and (B) explicitly selected public publishing package stripped of unapproved private objects/edges, secrets and machine-local paths. Test export→import→export round trips and ensure relationships survive across schema revisions.

## 7. Visual knowledge, analytics and beautiful web publishing

**Long-term destination:** one curated Atlas collection can be converted into a visually compelling, functional website from its structured JSON and a reusable presentation template. This should feel like choosing a theme, reviewing a live preview, selecting which objects are public, then exporting/deploying—not recreating hours of careful organization by hand.

Potential publication modes:
1. Magazine/editorial exhibition with polished typography, captions, sections, images and linked sources.
2. Pinterest-like gallery or mood board with tag filters and media lightboxes.
3. Academic/research bibliography or resource directory with notes, citations and connected documents.
4. Interactive relationship map showing publicly shareable nodes and edge explanations.
5. Chronological collection, project history, personal discovery timeline or scrapbook.
6. Lightweight dashboard of user-approved tag frequencies, medium distributions, catalog growth and activity; charts should clearly state metric definitions and avoid implying psychological diagnoses.
7. Curated portfolio, archive, thematic microsite, collection gallery or public knowledge garden.

Build via a **template renderer** that consumes AKF and a presentation manifest. Support theme tokens, layouts, responsive breakpoints, accessibility and screen-reader labels, keyboard paths, image alt text, reduced motion, lazy-loading, large collections, link validity, safe Markdown/text rendering and sanitization. Allow user to edit presentation overrides **without mutating original collection meaning**.

**Outputs:** initial static site bundle (HTML/CSS/JS plus approved media) usable on GitHub Pages, Cloudflare Pages, or a user's host; later optional deployment adapters. Portable output must work without any Atlas account, private backend, or proprietary runtime for basic viewing. A public site's agent-readable subset should be available as AKF/JSON; optionally include search index and feeds. No public asset should reference localhost, private file paths, internal bearer credentials, R2 secret URLs, or private companion services.

**Publishing workflow / security:** select catalogs → inspect preview → choose public objects and fields → review derived exposure including tags, relationships, media EXIF and outbound links → publish/export. Support reversible draft preview, versioning, validation, graceful handling of unlicensed media, and private-content redaction. Updating a public site is a new deliberate publish action; do not silently mirror a newly private source. Static copies cannot be remotely revoked after third parties duplicate them; communicate this truth clearly.

## 8. Monetization without punitive restrictions

Free: bookmark import, ordinary catalogs, text/notes, tags, basic media linking, essential privacy, basic search, open documented export and basic usable views.
Premium candidates: premium presentation themes and publishing templates, richer visual layouts, advanced galleries/media workflow, saved visualizations/dashboards, sophisticated relationship exploration, optional local semantic discovery, quality-of-life bulk organization, intelligent rediscovery, advanced publishing workflows.

Make premium feel genuinely *desirable*, never ransom core ownership, privacy, accessibility, ordinary functionality or basic portability. Record pricing/tier decisions independently of this proposed capability map.

## 9. Incremental delivery and acceptance criteria

**Stage 1 — Canonical semantic model.** Review existing `src/atlas_core/` and persistent resource graph before extending it. Specify AKF fields, independent annotation records, relationship notes/tags, typed attachments, visibility, migrations and validation. Demonstrate saved/restored relationships under tests.

**Stage 2 — Lovely capture and catalogs.** Bookmark import, Save-to-Atlas UX, optional notes/tags/cover image, sidebar catalog pins/reorder, polished gallery/cards/list, responsive keyboard-accessible editing. Prove users can complete the basic save flow with minimal steps and no enforced metadata chores.

**Stage 3 — Rich associations.** Galleries/images/videos/files and document relationships; per-object annotation; edge annotation; clickable exact counters; links to local/R2/remote assets; broken-reference handling; large-set performance; protections against unapproved read/preview.

**Stage 4 — Controlled agent interoperability.** Versioned AKF export/import, public vs private filtered serialization, scopes and token revocation, adversarial graph-leak tests, reconstruction in a separate program without Atlas running.

**Stage 5 — Rediscovery and visual analysis.** Search by meaning, explicit relationships, tag/temporal views, opt-in locally evaluated suggestions where feasible, graphs/charts whose aggregates respect visibility and data freshness.

**Stage 6 — Publishable collections.** Visual template editor, filtered site export, static hosting recipe for GitHub Pages/Cloudflare Pages, safe preview, one-click regeneration from an approved snapshot where feasible, exhaustive public/private boundary tests.

**Verification examples:**
- Import a folder of ordinary bookmarks, annotate one in under a few interactions, pin a catalog and revisit it after restart.
- Add an image/gallery, document, video and arbitrary file to one bookmark; assign different notes/tags to each; attach a tagged *reason* to one connection; inspect and navigate accurate counts.
- Build two catalogs that reference the same file without duplicating bytes; preserve relationships and make unavailable references visible but non-destructive.
- Export an allowed subset; run independent JSON Schema validation and round-trip reload; traverse the exact relationship explanations in a standalone script.
- Keep a private image/note/relationship beneath a public parent; verify no disclosure through API results, thumbnails, search, counts, layout JSON or published website.
- Convert an approved catalog into an attractive offline-capable static gallery/microsite with functioning navigation, charts/graphs if selected, and accessible keyboard controls.
- Test at 1366x768 and narrow side panel and on low-end machines; define measured targets before claiming speed/performance.
- Never claim implemented, Web Store approved, deployed or private-by-cryptography unless relevant test evidence exists.

## 10. Forever Works inheritance contract

**WHY:** Saved digital resources usually lose contextual meaning and are rarely revisited. Human delight motivates curation; structured semantic ownership preserves its value, and publishing multiplies it.

**WHAT:** A friendly visual catalog/relationship experience backed by a portable, privacy-aware typed graph and future site-generation pipeline.

**WHO:** Everyday bookmark savers, readers, artists, researchers, curators, creators, and user-authorized AI agents; ordinary users never need to understand the graph.

**WHEN:** Save now, annotate at leisure, revisit across years, export at any time, publish only when explicitly chosen.

**WHERE:** Browser-first Chrome extension and authorized native companion; local and remote provider resources; optional static public web artifacts. Do not presume the same permissions across platforms.

**HOW:** Stable IDs, annotated graph edges, per-resource annotations/tags, explicit visibility and consent, versioned AKF JSON, composable presentation templates, independent validators/tests.

**Fixed invariants:** voluntary fun-first UX; meaning and connection explanations survive export/reimport; item types share a consistent annotation contract; private data is never incidentally included in agent/public exports; portability does not depend on retaining the original app; visual layouts do not corrupt source data.

**Fluid implementation:** UI framework, card rendering system, graph store, indexing engine, template technology, offline site bundler, local embedding model and deployment platform may change as long as accepted external behavior is preserved.

**Agent guidance:** Treat this as owner-approved direction, **not** proof of completion and **not** authority to expose user data. Inspect existing project contracts and actual tests. Extend current graph with migrations rather than silently replacing persisted schemas. Before declaring any feature done, attach reproducible verification receipts. If rebuilding Atlas cold, reconstruct these promises independently of any historical library or fashionable frontend implementation.

---

**Concept tagline:** *Beautiful for humans. Comprehensible to machines. Sovereign to its owner.*

**Product promise:** *Atlas doesn't merely save what you discovered. It preserves why you cared, gives you reasons to return, and lets your curated world become something worth sharing.*


---

## Addendum A — Curation Becomes Authorship: Galleries, Articles, and Editorial Reuse (2026-10-15)

**Status:** Additional owner-directed product requirement and long-term design proposal. This addendum extends rather than supersedes the original curation, access-control, portability, and publishing principles.

### A.1 Why this matters

A person who carefully saves images, tags sources, names galleries, links documents, and writes notes has already performed meaningful editorial work. ATLAS must not require that person to repeat those hours in a separate authoring platform. A curated collection can become an article, essay, photo story, research bibliography, themed microsite, or gallery with minimal re-entry.

**Core proposition:** *Curation is reusable creative labor. Organizing your world is already the beginning of creating something.*

### A.2 Universal, explicit title field

Every Atlas resource, catalog, relationship where meaningful, gallery, image, video, bookmark, document, file, and publication must support an independent, optional, user-editable **Title** field separate from its provider filename, source-page title, ID, notes, tags, and original URL. Imported titles may serve as initial suggestions, but user overrides must be preserved. Changing a title must never rename a physical source file without a separate explicit file operation. Fallback display titles remain useful when an object has no user-specified title.

Gallery and publication titles may be entered manually or sourced from an existing item's title and subsequently edited independently.

### A.3 Compose from what already exists

Introduce an Atlas **Publication** as a first-class, portable item type that references selected existing objects, with an ordered arrangement of sections and optional new editorial writing.

A user-facing workflow should be:

1. Open a catalog or gallery and choose **Create article**, **Create gallery site**, or **Compose from selection**.
2. Select the images, captions, existing notes, text fields, tags, files, and bookmarks to include; explicitly **keep some and omit others**.
3. Reuse an existing title or write a new publication title. Arrange images, galleries, paragraphs, quotations written by the user, section headings, embeds, and supporting resources in a readable order.
4. Choose whether a source annotation is rendered as caption, body paragraph, pull quote, contextual note, source credit, or hidden metadata; tags may render as visible topics, filters, or metadata only.
5. Choose how included bookmarks appear: inline hyperlink, a compact group **after the related text/image**, footnote/endnote, bibliography, curated further-reading list, or not displayed.
6. Inspect a polished live preview; edit transitions and copy; select an accessible layout/theme; publish/export only the approved material.

The simple default should require little more than **choose collection → title → curate inclusions → preview → export**. No requirement to understand markup or web development. A powerful editor can be progressively disclosed without sacrificing a frictionless basic workflow.

### A.4 Editing and provenance invariants

A publication is **not a destructive transformation** of the user's source catalog. It contains its own editable publication title, introduction, section ordering, headings, transitions, publication-only annotations and selected references. It must be possible to publish multiple different articles and galleries from the same underlying resources without duplicating all media or overwriting the original user's notes.

Support both:
- **Linked content:** the publication references a canonical note/image/bookmark and can explicitly refresh an approved draft from later source revisions;
- **Snapshot content:** the publication pins a specific authorized version, to prevent future source edits from silently changing a published piece.

Never silently propagate a publication edit into a source item or silently propagate newly private/unapproved source material into a public export. Identify derived blocks with stable source IDs and revisions. Allow explicit unlink/fork when a user wants truly independent editorial copy.

### A.5 Publication model and portable export

Extend the proposed Atlas Knowledge Format (AKF) with a versioned `publication` object and ordered `publication_blocks`. Each block should have an ID, type (heading, text, image, image gallery, video, document reference, bookmark list, citation, relation visualization, custom supported media), selected source reference(s), render role, optional editorial override, visibility, ordering, and revision/snapshot provenance. Include theme/layout choices as portable **presentation metadata**, not as corruption of the original graph. Define deterministic semantics for missing media and references.

**Publication outputs:** static HTML/CSS/JS site, gallery, photo essay, reading page, collection website and future richer destinations; optionally export manuscript-friendly formats under separate validated renderers. Each output must respect asset rights, source attribution, safe markup, accessibility and user-approved public/private scopes. A website need not run ATLAS to display its approved exported content.

### A.6 Acceptance tests

- Name an imported bookmark and linked image independently without changing original source filenames/titles.
- Turn a gallery with several pre-existing captions and tags into a titled article, retaining edited body text and a curated list of bookmark links after relevant content.
- Select ten candidate bookmarks but publish only four; verify omitted bookmarks and their private metadata are absent from page files, search index, counters, embeds and public AKF.
- Make two differently themed articles from the same collection; edit one without altering original source notes or the other article.
- Verify linked vs pinned-snapshot behavior, reloading publication drafts, asset availability failures, export/import round-trips, and safe static-site rendering.
- Complete a basic publication from already-annotated material without recopying original notes manually.
- Preserve keyboard navigation, screen reader structure, responsive presentation and safe handling of untrusted text.

### A.7 Future-agent reconstruction instruction

Agents rebuilding Atlas cold must preserve the distinction between **source objects** (what the user saved and meant), **editorial selection** (what the user decided belongs in one story), and **rendering/publishing** (how the approved selection is presented externally). Reuse typed references and immutable history or revisions to avoid data loss. The value proposition is not an AI pretending to author someone's story: it is honoring the creative work they have already done and making it publishable.


---

## Addendum B — The Living Atlas: Navigable Graphs, Attention-Weighted Nodes, and Cross-Provider Previews (2026-10-15)

**Status:** Owner-directed future product proposal; a Graphmarks-like browser graph is visual inspiration, not a claim of adopted code or implemented support. Extends the original specification and Addendum A.

### B.1 Purpose and experience

Offer an aesthetically polished, responsive, **interactive graph of the user's chosen knowledge and resources**. Like bookmark visualizers that cluster visited domains, Atlas can reveal where someone spends time online, but its graph must go beyond site URLs: connect catalogs, folders, tags, notes, bookmarks, photographs, galleries, documents, videos, arbitrary local files and Cloudflare R2 objects in one navigable semantic space.

The graph is a *view of the canonical Atlas resource graph*, not an isolated visualization database. Everything visible must be meaningfully clickable and useful. Favor fluid motion, clear focus, zoom/pan, label decluttering, stable layouts and accessible alternatives over decorative hairballs.

**Key interaction:** click a circle to navigate directly to the item or open its details/preview in the right-side panel. Offer a user-visible action to open a web bookmark in a normal tab, while an image, note, gallery or file can open in the preview pane where supported. Context actions include inspect relationships, reveal connected items, open origin, add a note/tag/link, and jump to its catalog.

### B.2 Node and edge semantics

Each node carries a stable Atlas item ID, type, display title, icon/thumbnail, provider indicator, and permission-filtered references. Display color, shape and icon can encode semantic category (website, catalog, tag, local image, R2 video, document, etc.) independently of its size. Edges represent typed connections with user-authored explanatory annotations; optionally draw inferred/behavioral relationships in a visually distinguishable layer.

Offer graph modes:
- **Bookmark attention map:** website/domain/page clusters; site visits and active dwell time can guide node prominence.
- **Knowledge graph:** manually curated typed Atlas relationships and tag/catalog connections.
- **Resource graph:** local files, R2 objects, saved webpages and their shared annotations.
- **Hybrid:** optional layered combination, with controls to avoid clutter and distinguish observed browsing from personally asserted meaning.

Clusters may group by domain, tag, catalog, content type, storage provider, time period, or user-saved grouping. Multiple filters and label/search highlighting should apply before layout. Avoid reducing different pages to a single domain without a way to drill down.

### B.3 Attention-weighted node size

**Owner idea:** circle size reflects a combination of (a) **visit frequency** and (b) **time spent at a site/location**. Provide an understandable selector to switch among Frequency, Active Time, Combined, and Uniform sizing. The combined weight should be user-configurable and normalized so one exceptional website does not dwarf the entire graph.

Illustrative, *not binding*, formula:
- `visits_score = log1p(visits) / log1p(max_visits)`
- `time_score = log1p(active_seconds) / log1p(max_active_seconds)`
- `weight = alpha * visits_score + (1-alpha) * time_score` where `alpha` is adjustable and defaults to 0.5
- `radius = min_radius + sqrt(weight) * radius_range`, subject to min/max radius bounds and zoom-specific legibility.

Avoid interpreting Chrome tab-open duration as actual attention. Where measurable and consented, count **foreground, visible, active-tab dwell segments**, discard or cap idle intervals, and record `measurement_quality` with gaps and caveats. Browser history and visits are sensitive: collection is optional, disclosed, user-controllable, retention-bounded and initially private. Chrome APIs and platform limitations may prevent exact time accounting; surface `unknown` rather than fabricating measurements. A graph can function fully without any behavior tracking, using curated connection counts or uniform nodes instead.

Allow timeframe filters (day/week/month/year/custom), and explain whether sizes represent filtered or lifetime measurements. Visit frequency, time and graph degree are separate statistics; never conflate them.

### B.4 Preview panels and comparative split-view

The graph remains visible on the main extension page, with a resizable **right preview inspector**. Clicking a node should show a useful preview in-place wherever authorized:
- notes: titled text, tags and related links;
- image: actual preview, caption, source and connections;
- gallery: thumbnails/lightbox;
- web bookmark: metadata plus safe link action (embedded webpage rendering only where allowed);
- PDF/video/audio/document: supported safe preview or truthful unavailable state;
- local file: native companion preview strictly within previously granted filesystem scope;
- R2 object: preview via authorized provider requests, compatible with available range/download semantics and safe MIME handling.

**Critical parity target:** opening an R2 object's preview should feel as straightforward as previewing an authorized local object. Differences in authentication, bandwidth, CORS, signed URL expiry and offline state are handled by adapters with accurate states, not hidden behind misleading 'local' semantics. Never embed long-lived R2 credentials in the frontend or publish them in exported sites.

Support optional **split preview**, e.g. selected local file in the **upper half** of the right inspector and selected R2 object in the **lower half**, both visible while the graph/connecting lines and clusters remain on the left. A second node selection can populate the comparison slot rather than replace the first; make a pin/compare action obvious. Support swap top/bottom, resize divider, maximize one pane, remove one pane, compare metadata and return to single preview. The entire arrangement belongs inside the extension's full-page interface; on narrow side panels use a stacked or navigable accessible adaptation rather than unusably tiny panes.

Preview failures (access revoked, offline R2, expired token, unsupported codec, file changed, missing object) must show a readable reason and recovery action without destroying the active graph selection.

### B.5 Performance, accessibility and UX acceptance

- Graph pan/zoom/search, highlight neighbors, expand/collapse cluster, drag nodes, and keyboard-accessible node list/inspection all operate on stable identities.
- Graph drawing uses virtualization/LOD, progressive layout or clustering for large datasets; avoid fetching actual file/video bytes for every visible node.
- Persistent selection and pinned comparisons survive layout/view changes where safe.
- Hover previews are optional and bounded; no inadvertent huge downloads or autoplay.
- Provide controls for line visibility, labels, node-size metric, date ranges and filter types without drowning the user in configuration.
- Provide reduced-motion rendering, high-contrast selection, tooltips, keyboard focus order, semantic list alternative and responsive inspector.
- Treat cross-provider identities, notes, attachments and all relationship labels as typed data, not strings parsed out of filenames.

### B.6 Portable graph and visualization schema

AKF export should include graph-relevant **source facts** (items, typed edges, captions, tags, permitted provenance) and optionally a separate presentation manifest (`graph_views`, node positioning, theme, clustering/filter settings, sizing metric). These display choices must be replaceable without changing canonical resource truth.

Optional behavioral metrics have explicit units, timeframe, quality, consent and audience; exporting or publishing them requires separate affirmative selection. No browsing-attention log belongs automatically in public AKF or user-consented model-training datasets. Public graph viewers must omit unauthorized nodes **and** relationship edges, counts, inferred correlations, labels and preview endpoints.

Independent programs should be able to reproduce a useful interactive graph or chart from a permitted AKF export without importing Atlas's application runtime.

### B.7 Verification scenarios

1. Import bookmarks; show a Graphmarks-inspired site cluster graph; change node sizing across frequency/time/combined/uniform and verify expected ranking against synthetic fixtures.
2. Click a website node and open its original URL; click a linked note node and open it in the right inspector; click an image and preview/caption/tag it in the same UI.
3. Link a local authorized image and an R2 document; use graph selections to pin local preview on **top** and R2 preview on **bottom** of the right panel, with readable resizable split and stable graph on the left.
4. Revoke local grant / R2 authorization and verify clear denial, no secret leakage, and no unauthorized previews or retries.
5. Simulate a background open tab and idle browser; no false claim of active reading time. Show the unknown/partial measurement state.
6. Render hundreds and then thousands of generated nodes with responsive controls and measured memory/latency budgets on target low-end hardware.
7. Publish a graph based on a permitted selection; verify private nodes, edges, inferred associations and attention metrics never leak via page assets, index, tooltip or JSON.
8. Export/import the graph facts and optional presentation metadata; verify semantic connections and explanations reconstruct without the original UI implementation.

### B.8 Forever Works acceptance rationale

**Why:** A graph should turn dormant bookmarks and scattered resources into a compelling, explorable visual map. Cross-provider previews should make the user's data feel unified while faithfully preserving authorization.

**Fixed:** accurate identities and connection meanings, honest attention statistics, privacy, provider permission enforcement, useful click-to-inspect/open behavior, local-and-R2 comparison, portable graph data and polished accessibility.

**Fluid:** drawing/layout engine, graph clustering algorithms, storage backend, timing heuristics, colors and animation system, inspection panel UI implementation.

**Non-goals:** covert surveillance, universal browsing-time accuracy, bypassing local filesystem access grants, extracting private R2 URLs into public exports, running untrusted files in the preview, or interpreting observed attention as conclusive evidence of a person's feelings.


## Addendum — Compact bookmark tree with visual hover previews (2026-10-17)

**Status:** Owner-directed future UX proposal, not an implemented feature. **Motivation:** Retain the useful density and familiar hierarchy of a Graphmarks-inspired tree while giving Atlas faster, image-based recognition and a more refined interaction than text-only nodes. This augments the current large-image visual explorer; it does **not** replace it.

- **Compact primary presentation:** Show connected bookmark nodes in a navigable tree/graph, with existing notes, tags, associated bookmarks and paths visibly branching where appropriate. Keep node sizes compact; do not expand every cover into a large image by default.
- **Cover-image hover:** Hovering a bookmark node reveals a small polished popover containing that bookmark's **user-selected default cover**, not an arbitrary newly discovered image. Position near the node without reflowing, covering important graph controls, or obscuring the context; hide on exit with a modest adjustable delay.
- **Preview fallback:** Where no cover exists, show favicon, title and domain; never break traversal. Reuse existing Atlas cover identity and thumbnail pipeline, rather than creating a duplicate asset or modifying the underlying bookmark.
- **Interaction:** Hover/focus previews are non-destructive; clicking a node selects/opens the full Atlas detail or navigates to the underlying bookmark according to the view's explicit action. Keyboard focus and touch activation offer equivalent preview access; dismissal supports Escape.
- **Optional affordance:** Allow turning hover previews on/off and adjusting thumbnail size and hover delay. Responsive positioning must work in both the shelf and full page, with viewport-edge collision handling, accessible text alternatives, and reduced-motion support.
- **Lazy loading and storage:** Fetch thumbnails only when relevant and authorized (local storage, remote sources or private R2); respect the library's visibility/access rules. Previews must not inadvertently load private material while locked or leak private image URLs into public graph exports.
- **Graph correctness:** Preserve the existing tree/subpath hierarchy and stable underlying resource/relationship IDs. A bookmark cannot be its own immediate parent; avoid illegal self-cycles. Reused notes/tags/bookmarks may be represented by visible references/edges instead of destructive duplication. Site-path child constraints apply only to the designated URL-path hierarchy, not arbitrary semantic associations.
- **Extension beyond bookmarks (optional):** Note nodes may preview an excerpt; tags may preview an explicitly selected representative image. These previews do not alter the original note/tag or imply an additional relationship.

**Acceptance checks:** (1) cover-selected node yields the same cover in a compact hover popover; (2) hover does not resize/rearrange graph nodes; (3) fallback works without a cover; (4) keyboard/touch operate without hover; (5) locked R2 sources make no unauthorized network requests; (6) dense graphs remain responsive through lazy retrieval; (7) switching graph/large-image layouts preserves source data and selections; (8) public export omits private previews/locators.

**Enduring distinction:** Graphmarks-inspired navigability plus Atlas's curated visual recognition; a compact tree for finding things, and the existing image-led views for exploring them.
