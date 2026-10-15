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
