# Forever Works — WHY, WHAT, WHO, WHEN, WHERE, HOW
## WHY
Conventional browser folder trees generally treat a bookmark as an entry in a single folder: representing one web resource in different contexts may involve copying bookmark entries, fragmenting notes and manual maintenance. Atlas should present **one logical bookmark simultaneously in many user-chosen folders** without duplicating canonical identity or annotations. Separately, user-created galleries, notes, tag choices and image↔bookmark associations already constitute editorial labor; Atlas Projects should turn that into polished outputs without making users repeat the work.

## WHAT: Multi-folder bookmark memberships
- A **bookmark** has stable logical ID, original URL and source/import provenance, independent optional user title, notes, tags, thumbnails and typed relationships.
- A **folder** (physical browser-imported or Atlas logical catalog folder) has independent identity, title, notes, tags, optional hierarchy and visibility.
- A **membership** is an explicit relationship `bookmarkId ↔ folderId`, with unique (bookmarkId, folderId), createdAt, optional ordering, provenance, visibility policy, and optional contextual label/note. This is many-to-many.
- A bookmark may appear in Research, Inspiration and Project X simultaneously; editing its shared title/URL/notes from any folder updates the same logical object. Context-specific commentary belongs to the *membership*, not duplicated bookmarks.
- Moving should offer **move from this folder**, **add to another folder** and **remove from this folder**, not silently discard other memberships. Deleting an Atlas folder removes its membership edges only after informed confirmation, not the underlying bookmark. Delete everywhere is separate and explicit with undo/recovery.
- Original browser bookmark entries are provider-backed locators. Import should deduplicate by explicit policy; the **same URL does not prove identical meaning**. A user can deliberately keep separate logical bookmarks even with identical URLs. When syncing back to browsers lacking multi-folder references, clearly explain the need for physical copies or an Atlas-only virtual membership; never promise native browser support.
- Browsing and searching a folder must report precise membership vs unique-item counts and respect private relationship access. No private-membership existence leakage via public views.
- Drag/drop and context-menu **Add to folder** allow multi-select and multiple destinations. Ensure keyboard navigation, folder chips, and an obvious “Appears in 3 folders” inspector.

## WHAT: Projects and template-driven publishing
- **Projects** are a top-level creative workspace distinct from **Catalogs**. Catalogs collect and describe; Projects assemble selections into editable drafts; Publishing exports or shares approved projects.
- New Project → select a catalog, selected Atlas items or multiple collections → choose an attractive editorial, gallery, photo-essay or research template → generate a deterministic draft.
- The engine **uses existing recorded relationships for placement**, not vague guessing. Image↔bookmark link means the bookmark appears under that image (unless overridden), with existing text, optional why-linked explanation and tags appropriately displayed. Galleries get arranged with captions; titles are independently user-editable fields. Any unassociated links can go into Further Reading or be omitted by default.
- Publication blocks reference existing notes, images, galleries, bookmarks and documents with optional per-publication editorial overrides. Existing note text can appear as body text, captions, headings or pull quotes; keep original user wording. Tags may render as topics, filters or stay hidden.
- Template controls determine layout, typography, spacing and responsive behavior; layouts should work in full extension page and exported static site without AI. Optional AI suggestions come later and must be labelled and reviewed.
- User selectively includes/excludes objects and bookmarks, rearranges sections, writes additional transitions, chooses inline links / **links below related image or paragraph** / bibliography, and previews every change.
- Publishing does **not mutate source Catalogs**. Linked sources may refresh by user action; snapshot drafts preserve selected revisions. Reuse a single collection for multiple independently edited projects.
- Export attractive standalone HTML/CSS/JS and approved media, usable on GitHub Pages / Cloudflare Pages or other static hosts. A site uses approved public export data only, removes inaccessible local and R2 secret paths, sanitizes text and checks media rights.
- The same open Atlas knowledge JSON should support later visual graphs, charts, archives and completely different programmatic consumers.

## WHO
Ordinary collectors, writers, curators and artists need a frictionless Pinterest-like experience. Developers and agents can programmatically consume approved JSON; private objects and membership edges require explicit access. Publication does not authorize AI training.

## WHEN
Period **2026-10-15** identifies the owner's idea, not implementation. Implement canonical membership and project block contracts first, then beautiful UI, then static generation, then independent export/import and security/a11y/performance verification. Stage and production-value proof must be dated separately. Later changes are additive dated versions referencing this one.

## WHERE
Atlas extension full-page Projects tab and responsive sidebar/folder views, logical provider-independent graph backed by authorized local/cloud resource references, and exported static websites. File operations still obey the native companion's explicit directory grants and R2 scopes.

## HOW: illustrative normalized model
```json
{
  "bookmark": {"id":"bookmark-12","url":"https://example.org","title":"An inspiring essay","notes":[],"tags":["design"]},
  "folders": [{"id":"folder-a"},{"id":"folder-b"}],
  "memberships": [
    {"id":"member-1","bookmarkId":"bookmark-12","folderId":"folder-a","position":1},
    {"id":"member-2","bookmarkId":"bookmark-12","folderId":"folder-b","position":4}
  ],
  "project": {
    "id":"project-1","title":"A Gallery of Ideas","template":"editorial",
    "blocks":[{"id":"block-1","kind":"image","sourceId":"image-7"},
              {"id":"block-2","kind":"linked-bookmarks","relationSourceId":"image-7","placement":"beneath"}]
  }
}
```
The example is conceptual, not a validated implementation schema. Create a formal versioned JSON Schema/validator and migrations before production.

## FIXED / FLUID
**Fixed:** one canonical bookmark can belong to many folders; predictable add/remove semantics; edits visible in every context; optional contextual membership notes; no silent destructive folder operations; relationship-driven draft layout; source annotations preserved; selective preview/publishing; independent JSON; privacy.
**Fluid:** UI framework, database engine, static template system, sync implementation, visual aesthetics and automatic layout heuristics may evolve if these user-visible contracts are proven.

## ACCEPTANCE
See `acceptance.json`. Distinguish unit contract tests, browser interaction, cross-provider integration, staging verification and production-value acceptance. No tests performed by this documentation commit.
