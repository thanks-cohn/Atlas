# Addendum A — Multipage, Modular Atlas Projects
**Historical date:** 2026-10-15  
**Status:** Owner-directed proposal; NOT IMPLEMENTED  
**Revision:** 1 · **Amends:** `SPECIFICATION.md` in this directory; original historical text remains unchanged.

## WHY
Atlas Projects should allow an entire coherent website, exhibit, portfolio, book-like reading experience or collection of interconnected pages to emerge from the user's previous curatorial work. A Project is not limited to a single gallery or article. The user must be able to reuse any existing Atlas gallery, catalog, collection, supported resource or eligible Project without manual duplication, and combine several sources into a flexible multipage work. Reusing their hours of tagging, writing, and relating should be much easier than recreating content in a conventional website builder.

## WHAT
A **Project** is a reusable, ordered, navigable composition comprising one or more **Pages**. Every Page may use the Project's default template and aesthetic design tokens, or select its own page template. Pages may reference and arrange source blocks from multiple galleries, catalogs, media objects, bookmark collections, and other Projects. A Project can itself be used as a source for a new Project via explicit reusable snapshot/linked references.

The usual enjoyable flow: **Projects → New Project → Select existing sources → Choose overall look → Add/arrange pages → Optionally change each page's template → Preview → Export/Publish.** Starting with a single automatically populated page is fine; adding more pages should be immediate and obvious.

## WHO / WHEN / WHERE
**Who:** Everyday collectors and writers, artists, researchers, publishers, and authorized agents.  
**When:** During interactive composition, and later when converting existing older collections into multipage publications.  
**Where:** Atlas's Projects workspace, responsive full-tab or side-panel editor, and exported portable static websites. The canonical resources live independently of their published representations.

## HOW — canonical model
- **Project:** stable ID, editable title, optional summary, global template identifier, global design tokens (typography, colors, spacing, navigation, header/footer), ordered page IDs, selection scope, draft/publication revisions, privacy, provenance.
- **Page:** stable ID, unique project-local slug/path, editable title, description, template strategy `inherit` or `override`, optional override template ID, sparse per-page design-token overrides, ordered content blocks, visibility, and revision.
- **Blocks:** stable identities pointing to item/gallery/catalog/bookmark/media IDs or to a chosen reusable Project/Page snapshot; editable text, display role and positioning are presentation metadata independent of the original source.
- **Inherited aesthetic:** resolve project-level design tokens first, then page template defaults, then explicitly set page-level overrides; undefined options inherit rather than reset unexpectedly. Inheritance is visible and reversibly configurable in the editor.
- **Source selection:** choose one or many existing galleries, catalogs, collections, bookmarks, notes, files, media or Projects; preserve typed association edges, including bookmarks linked to particular images (render beneath that image by default unless template/user says otherwise).
- **Composition:** page reorder, duplicate page (distinct page identity and blocks), insert blank page, create from existing source, move/copy blocks across pages, update chosen source version, per-page draft preview, undo/redo and change review.
- **Navigation:** automatically produce menu, next/previous navigation, slugs and intra-project links from approved page structure; allow editable labels and page ordering. Verify broken links, duplicate slugs and circular references.
- **Nested reuse:** a Project used by another Project must be referenced through a well-defined embedded view or snapshot, not automatically copy every block. Guard against recursive inclusion and infinite graph traversal; preserve source provenance and revision pinning.
- **Publishing:** export all included pages with relative paths and only approved asset bytes/URLs. Site navigation, internal links, layout and media work without the Atlas app. Selecting public pages does not authorize publication of private sources or hidden edges.
- **Portability:** include `projects[]`, `pages[]`, `orderedBlocks[]`, `sourceRefs[]`, `themeInheritance`, `publicationSnapshots`, and `routeManifest` in future versioned AKF contracts, with independent deterministic validation and round-trip guarantees. This is a proposed contract, not yet a validated JSON Schema.

## Illustrative JSON (not final schema)
```json
{
  "id": "project-001",
  "title": "The Cities We Remember",
  "templateId": "editorial-classic",
  "designTokens": {"fontFamily": "serif", "density": "comfortable"},
  "pageIds": ["page-001", "page-002"],
  "pages": [
    {
      "id": "page-001",
      "slug": "introduction",
      "title": "An Introduction",
      "templateMode": "inherit",
      "blocks": [
        {"id": "block-1", "kind": "source-gallery", "sourceId": "gallery-09"}
      ]
    },
    {
      "id": "page-002",
      "slug": "research",
      "title": "Related Discoveries",
      "templateMode": "override",
      "templateId": "research-notes",
      "designTokens": {"density": "compact"},
      "blocks": [
        {"id": "block-2", "kind": "source-project-page", "sourceId": "other-project/page-004", "mode": "snapshot"}
      ]
    }
  ]
}
```

## FIXED / FLUID
**Fixed user promises:** many pages per project; independent editable page titles and navigation; overall templates with optional per-page overrides; source reuse from any supported collection/gallery/project; automatic relationship-aware placement; source notes remain non-destructively intact; privacy-filtered publishing; transparent export with stable identities.

**Fluid implementation:** template framework, styling tokens, visual page editor architecture, page storage, route generator and renderer. Never collapse the Project into a single HTML page if doing so sacrifices navigability and per-page template choice.

## ACCEPTANCE (NOT RUN)
1. Create a Project with three Pages from two galleries and an existing Project; no manual recopying of annotations or media.
2. Apply an overall template and confirm all Pages inherit its typography and aesthetic.
3. Override only Page 2's template, preserving default inheritance for Pages 1 and 3.
4. Link a bookmark to an image in a source collection and verify it appears beneath the corresponding image in the generated Page.
5. Reorder, rename, and duplicate Pages; verify stable unique IDs, noncolliding routes and consistent navigation.
6. Reference another Project in snapshot mode; block recursive cross-references without losing user work.
7. Edit a Page's text and style without changing the original notes or other projects.
8. Export a functioning multipage site with internal links, responsive layouts, and no unauthorized content; independently parse and reconstruct the JSON.
9. Verify explicit staged implementation evidence and production-value acceptance before any canonical Forever Works manifest promotion.

## Forever Works additive lineage
This dated addendum extends `features/not-implemented/2026-10-15-projects-and-multi-folder-bookmarks-v1/SPECIFICATION.md` and the earlier Atlas knowledge proposal. Preserve prior records as historical evidence. A future change creates its own dated/versioned addendum or proposal with explicit ancestry. This document is *not* proof of implementation and must not be appended to canonical `forever/manifest.json` without independently verifiable staging and production-quality evidence.
