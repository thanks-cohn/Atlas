# Proposal — Atlas Adaptive Publishing and Presentation System

**Status:** Proposed; not implemented  
**Scope:** Pages, Galleries, Pinboards, Articles, composable object slices, template families, published experiences  
**Intent:** Make collecting, composing, and publishing feel artistically directed with minimal user effort.  
**Principle:** **One object, many beautiful presentations.**

## 1. Purpose and product promise

Atlas should convert already-curated collections, annotations, relationships, media and writings into beautiful, portable public experiences without making their owners become web designers. The default is aesthetically refined; advanced customization is optional. A user can assemble an entire Page by inserting existing Atlas resources as *slices* rather than duplicating them.

An object's full-page view is **not** the same as its slice representation. A Gallery may be a complete destination, yet on another Page appear as a horizontal image carousel, filmstrip or editorial feature with its own title, description and link back to the original. Each object has its own possible templates, and **the host Page's chosen template can affect how its embedded slices look**.

This proposal supplements, rather than replaces:
- `PROPOSAL_JOYFUL_CURATION_SEMANTIC_ATLAS_AND_PUBLISHABLE_COLLECTIONS.md`
- `PROPOSAL_SHELF_FIRST_BOOKMARKS_COMPOSITIONS_AND_PORTABLE_PUBLISHING.md`
- Other existing Gallery, shelf, bookmarks, metadata, privacy and static-publishing contracts.

## 2. Five separate concepts

1. **Source object:** The canonical Gallery, Pinboard, Article, image, document, bookmark, etc., with a stable ID, content, metadata, per-object notes/tags, relationships, provenance and privacy.
2. **Object page:** Its full, independently templated presentation. A Gallery's full page can be immersive, regardless of its embedded previews elsewhere.
3. **Slice:** A reusable *reference* to an object rendered in the context of a host Page. It owns display-only choices (selection, presentation, overrides), **not** a copy of the source.
4. **Page:** A composition of ordered sections, normal content and object slices. A Page is both a publishing format and the universal container for other formats.
5. **Template:** A coordinated, responsive visual rule set for a page, an object type and optionally each slice variant. A template is presentation, not source data.

Source updates may flow through to slices on every host page, governed by the chosen snapshot/live policy and published visibility. Removing a slice must never delete its original resource.

## 3. Creation experiences

| User-facing experience | Conceptual foundation | Distinctive presentation |
|---|---|---|
| Gallery | Media collection | Immersive viewing, filmstrip, carousel, contact sheet |
| Pinboard | Mixed resource collection | Exploratory masonry/moodboard and personal associations |
| Article | Rich document | Long-form reading, media inserts, elegant typography |
| Page | Ordered compositional canvas | Sections interleaved with slices of other objects |
| Showcase | Specialized Page | Portfolio, product or project case study |
| Exhibition | Sequenced Page | Guided gallery, rooms/chapters, museum-like storytelling |
| Archive | Searchable structured collection | Facets, metadata, artifacts and references |
| Chronicle | Time-ordered collection | Timeline of events, memories or project development |
| Publication | Articles and Pages collection | Journal, magazine, issues and contributor features |
| Constellation | Relationship graph | Discoverable connected objects, meaningful links |
| Atelier | Product collection and Page | Refined creator storefront; future optional payments |

Avoid building eleven unrelated editors. Prefer a small set of extensible content and rendering primitives with distinctive UX conventions for each experience. Gallery, Pinboard, Article, Page and Showcase are the initial candidate experiences; Exhibition and Constellation are high-value differentiators.

## 4. Slice presentation contracts

Initial slice families:

- **Gallery:** compact horizontal carousel (title + text), cinematic widescreen, editorial photo arrangement, filmstrip, featured image, contact sheet.
- **Pinboard:** small masonry board, curated pins, moodboard collage, scrolling cards.
- **Article:** headline/summary, editorial teaser, quote excerpt, image-led feature, reading card.
- **Showcase:** project hero, selected work, case-study teaser.
- **Exhibition:** curated exhibit/chapter preview.
- **Archive:** object selection / catalog summary.
- **Chronicle:** timeline excerpt.
- **Publication:** issue/feature preview.
- **Constellation:** relationship diagram preview, optionally interactive.
- **Atelier:** selected products and creator introduction.

Every slice exposes an understandable way to open its canonical object unless the author intentionally selects an appropriate noninteractive treatment. Selection can be automatic or author-curated; missing source resources must degrade gracefully.

## 5. Adaptive template cascade

Templates are **presentation systems**, not merely CSS skins. They specify compatible page layouts and object-type slice renderings as a coordinated family.

**Resolution order:** site-wide design tokens → host Page template → host template's object-type default slice variant → instance-specific slice overrides. More specific overrides win; unoverridden properties inherit. The source object's full-page template remains independent and **must not be overwritten** by its embedding host.

Example: Gallery G uses a Museum template for its original page; Editorial Page P embeds G, automatically choosing an editorial arrangement; the author overrides this particular instance to a horizontal carousel. Another Page can show G in a cinematic widescreen style. All still reference G.

Candidate coordinated families:
- **Museum:** spacious, restrained; art-carousel Gallery / exhibition-label Article / curated specimens Pinboard.
- **Editorial:** expressive typography; photo-essay Gallery / magazine Article / moodboard Pinboard.
- **Cinema:** immersive widescreen; dramatic story teasers / visual montages.
- **Archive:** contact sheets, descriptive metadata, catalog cards.
- **Atelier:** art and product presentations, creator narratives, collection previews.
- **Minimal:** clean, accessible, quiet layouts.

Different object types on one Page should feel like a single designed composition by default, while each slice can be intentionally styled differently. All families must specify desktop/tablet/mobile behavior, type scales, spacing, legibility, keyboard/focus conventions, and reduced-motion alternatives.

## 6. Page editor conventions

The initial editor should be structured rather than an unrestricted canvas:
- **Add Section** for text, images, custom sections and Atlas object slices.
- **Insert Object**, search/browse existing resources, choose presentation.
- Move sections with established drag/drop, insertion affordances and keyboard alternatives.
- Reorder, resize (full/contained/narrow/split), duplicate, edit, remove, preview and publish.
- Edit page-specific headings, descriptions and crop/selection without silently editing the source object.
- Contextual controls must be aesthetically placed, never awkwardly interrupt headings or galleries.
- Undo/redo; useful responsive preview; sensible behavior on touch and smaller screens.
- Removing any placed section does not delete original content from the library.

Use well-established accessible sortable/drag-drop patterns and platform conventions. A future **Liquid Canvas** provides optional freeform overlap, placement and motion without making everyday users deal with layout engineering.

## 7. Signature premium experiences

Prioritize polished defaults over feature counts:
1. **Living transitions:** expand a slice into a full object with elegant visual continuity, without blocking normal link navigation or reduced motion.
2. **Art-direction presets:** coordinated typography, composition, image treatment, spacing and motion.
3. **Liquid Canvas:** freeform artistic composition with responsive constraints.
4. **Cinematic presentation:** guided fullscreen Gallery/Exhibition with captions, optional media/audio and keyboard navigation.
5. **Connected discovery:** meaningful graph navigation from displayed objects and their explicitly published relationships.
6. **Atelier (future):** curated storefronts and optional payment links.

The free experience should itself be beautiful. Premium unlocks breadth, advanced compositions, sophisticated templates, publishing/integrations and optional commerce—not relief from deliberately poor free design.

## 8. Portable model sketch (illustrative, non-normative)

```json
{
  "id": "page-1",
  "type": "page",
  "template": "editorial",
  "sections": [
    {
      "id": "section-1",
      "kind": "object-slice",
      "source": { "type": "gallery", "id": "gallery-1" },
      "variant": "carousel",
      "selection": { "mode": "automatic" },
      "overrides": {
        "title": "Architecture and Memory",
        "description": "A gallery preview",
        "layout": "full"
      },
      "linkToSource": true
    }
  ]
}
```

The implementation needs a separately versioned schema, reference resolution, deterministic fallback rules, stable IDs, source/slice difference semantics, compatibility migrations and round-trip import/export tests. Never flatten a source object's associations, tags, notes or permissions into a visual-only artifact. Slices of Pages may be supported if a cycle detector rejects recursive embed chains (not just immediate self-reference).

## 9. Privacy, publishing and static-site portability

- Embedding a private object **never automatically authorizes publishing it**.
- Resolve effective visibility of the object, selected children, annotations, attachments and relationships before producing a site.
- Never leak private notes, credentials, local paths or unpublished relationships into HTML, scripts, JSON or asset manifests.
- Published output must work without Atlas installed, with graceful fallbacks if advanced effects are unsupported.
- Users should be able to export portable, documented project data and static output; Cloudflare Pages/GitHub Pages are optional targets, not the data model.
- Missing or revoked resources must produce safe placeholders; versioning/snapshot policy should be explicitly defined rather than implicit.

## 10. Phased implementation proposal

**I — Core composer:** Page resource, structured section editor, Gallery/Pinboard/Article slices, source references, reorder/edit/remove, responsive defaults, privacy-safe static publishing.

**II — Adaptive presentations:** coordinated family rules, inheritance/overrides, per-object template, previews, documented model and import/export.

**III — Differentiating experiences:** Showcase, Exhibition, living transitions, cinematic mode, expanded galleries/articles and Liquid Canvas.

**IV — Expanded formats:** Archive, Chronicle, Publication, Constellation, Atelier and optional commerce.

These are prospective phases, **not implementation claims**.

## 11. Acceptance gates

1. Add existing Gallery G to Page P without duplicating G's source content.
2. G's original Gallery page remains independently designed.
3. Switching P's template re-renders G's slice using the relevant coordinated default.
4. Overriding G's instance in P does not affect G or its instances on other Pages.
5. Slice removal never deletes G.
6. Sections can be moved and edited accessibly; saved order survives reload/export.
7. Responsive desktop and mobile compositions remain legible and intentional.
8. Unpublished material is absent from built public artifacts, not merely hidden in the UI.
9. Round-trip export/import restores references, presentation choices and relationships.
10. Circular Page embeds and broken/missing references fail gracefully.
11. Default output is aesthetically finished without manual work.
12. Document verified behavior separately from these proposed capabilities.

## 12. Enduring intent

**Collect your world. Compose it beautifully. Share it as an experience.**

One resource can possess multiple visual identities across Pages while preserving its content, identity, context, privacy and links. Atlas should feel premium because it converts a user's existing curated world into a cohesive, beautiful publication almost effortlessly.
