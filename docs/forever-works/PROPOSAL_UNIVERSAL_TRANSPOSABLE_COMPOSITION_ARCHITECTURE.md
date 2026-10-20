# Atlas — Universal Transposable Composition Architecture

**Status:** Owner-directed vision and architectural proposal, not an assertion of implemented features  
**Date:** 2026-10-19  
**Related:** Atlas resource graph, adaptive publishing, modular templates, Any-Shape, Forever Works

## 1. Purpose and thesis

Atlas must grow beyond portable cards and slices. **Every addressable part of a website created in Atlas—when organized using Atlas's shared format—should be programmatically accessible, exportable, composable, and transposable into future projects.**

This includes ungrouped atomic data, arbitrary user-defined groupings, nested objects, components, cards, slices, rows, headers, sidebars, sections, menus, galleries, page regions, complete pages, and entire sites. Their content, relationships, useful behavior, and composition intent should be preserved independently of any one rendered document.

**Core promise: Structure once; compose automatically; refine artistically; transpose repeatedly.** In principle, the same well-structured objects and compositions could be reused across millions of compatible projects without manually positioning and rebuilding them every time. This is an architectural ambition and scaling property, not a guarantee that every arbitrary external target, format, or feature can be translated without loss.

Atlas is not merely a template catalogue, page builder, or collection of reusable cards. It is intended to become a **universal composition framework** in which every part participates in the same portable, machine-readable composition system.

## 2. Vocabulary

- **Universal Transposable Composition Architecture (UTCA):** The overarching architectural approach: arbitrary composition nodes and their relationships can be carried between compatible projects and adapted to the destination.
- **Theory of Modular Templates:** The design philosophy: a relatively small set of geometric, typographic, relational and responsive principles can generate countless aesthetically coherent presentations from structured content.
- **Portable Composition Contract (PCC):** The versioned, machine-readable interchange contract by which source and destination identify and interpret nodes, relationships, constraints, behaviors, assets, and presentation intent.
- **Composition node:** Any addressable element in a nested composition tree or graph; not limited to predefined cards or slices.
- **Template ideal:** A reusable aesthetic and spatial system that interprets structure and intent rather than prescribing fixed coordinates.
- **Artistic Refinement:** The post-generation phase of human-directed changes that brings a plausible automatic composition into alignment with the creator's desired visual expression.
- **Transposition:** Transfer and contextual reinterpretation of portable content and composition across a receiving project, layout, viewport, or application.

Terms above are proposed Atlas terminology, not claims of established industry standards.

## 3. The fundamental distinction

**Content is not its representation.** Every Atlas resource has a durable identity and portable semantic data independent of how it is displayed. Presentation is an interpretation: a template uses content, relationships, viewport, host design context, and optional user adjustments to produce a composition.

**Compositions themselves are portable data.** Unlike a system that merely exports a card's title and thumbnail, Atlas must preserve the ability to carry arbitrary layout structures and substructures. A row of linked objects, a title-and-gallery cluster, a sidebar with interaction rules, or a whole page can become the input for a new project. No special privilege is given to the card as the largest portable unit.

**Grouped and ungrouped data are equally transposable.** An individual object can be placed directly into a destination; a group can be carried with its members, ordering, relationship metadata, and group-specific intention. Membership is not ownership: one resource may belong to many groups or appear in many compositions without duplicating its canonical source.

## 4. Data, composition, and presentation layers

A practical design separates at least six concerns:

1. **Resources:** Image, file, bookmark, article, text, video, document, remote object, record, or arbitrary structured data. Stable IDs, provenance, ownership/permissions, links, metadata and versions belong here.
2. **Relationships:** Explicit typed edges connecting resources and compositions, including notes describing why items are paired, provenance, direction and ordering as relevant.
3. **Groups and collections:** Portable clusters or query-derived sets, with group-level annotations, ordering, identity, privacy settings, and a declared membership policy.
4. **Composition graph:** Arbitrarily nested, addressable nodes describing intent and topology: container, section, row, card, slice, region, header, article, feature, etc. Nodes refer to resources/groups or other nodes, rather than enclosing uncontrolled duplicate copies.
5. **Template ideal / presentation interpretation:** Layout geometry, hierarchy, spacing, breakpoints, typography, palettes, image treatments, behavioral patterns and graceful fallbacks. It takes in the destination viewport and host design context.
6. **Refinement overlay:** User-authored placements, relative prominence, style overrides, alignment nudges, crop adjustments and exceptions, stored separately from source data and template defaults.

CSS and JavaScript can implement this system, but a raw DOM fragment or CSS declaration is not itself the whole interchange format. Atlas should model meaning and constraints first; it can generate CSS, HTML and interactive behavior from that portable model.

## 5. A universal composition node

Every meaningful created part should be programmatically discoverable and addressable. A composition node should support, as applicable:

- Stable identity, type, schema version and provenance.
- References to underlying resources and grouped or ungrouped content.
- Parent/child placement, sibling order, named slots and typed relationships.
- Meaning and role (navigation, hero, caption, media, article, grouping, etc.).
- Layout intent: flow, ordering, hierarchy, emphasis, alignment, proportions, minimum/maximum bounds, aspect ratio, responsive policies and intrinsic constraints.
- Theme inputs: typography roles, palette tokens, header variants, density, spacing and surface treatments.
- Behavior/interactions and accessibility information, when needed.
- Optional refinement overrides and whether each is transferable, template-specific or host-specific.
- External dependencies, asset requirements, permissions and capability fallbacks.

No requirement that every node carry all fields. Small objects must remain lightweight. The standard should be compositional and progressive, so the smallest node can be an ordinary text or image reference and larger compositions can recursively nest many nodes.

## 6. Template ideals: few rules, many outcomes

The initial authoring experience should be almost effortless. The user supplies a page's approximate regions, connected objects, associations, hierarchy, and desired atmosphere. A template ideal generates a sensible arrangement from those inputs.

A template is a **composition function**, not a frozen page. It interprets the same input differently for a compact window, mobile portrait viewport, desktop canvas, or another project's design system.

Theme variations need not reconstruct the composition: switching font families, typographic scale, heading styles, palette, header type, spacing, framing, or image treatment can yield dramatically different compositions while retaining their underlying structure and connections.

Geometric and mathematical ideals may guide grids, proportional spacing, visual rhythm, balance, optical alignment, content density and responsive restructuring. They are tools for aesthetic judgment, not inflexible rules that prevent creative variation.

**Destination context matters:** the receiving container supplies available dimensions, inherited typography, design tokens, structural expectations, CSS capabilities and relevant interaction conventions. Portable nodes provide semantic roles and intent; destination templates decide how to realize them. Do not require literal CSS compatibility between source and destination.

## 7. Artistic Refinement: the final creative stage

A generated page should start from a high-quality approximation, not a blank canvas. Then the user enters **Artistic Refinement**: editing layout and visual detail until the production matches their vision.

The editing model should allow picking up **any addressable composition node**, including a row, section, graphic cluster, navigation region or whole page, and moving, resizing, grouping, separating or reordering it. The spirit is familiar drag-and-drop builders such as GrapesJS, but edits should ideally express **relative intent** where possible: 'place to the left of this article', 'increase prominence', 'tighten this region', instead of always hard-coding coordinates.

Preserve template spirit and geometry by default, yet permit intentional violations. Distinguish user intent, refinements, and pixel-level exceptions. Store edits in a portable refinement overlay so alternative templates and viewports can carry forward what makes semantic sense, reconsider what no longer fits, and expose unresolved conflicts for user review.

Proposed user journey: **Connect → Compose → Refine → Publish / Transpose**.

## 8. Transposition scenarios

**Ungrouped data:** An image with tags, caption and provenance can be inserted into any compatible page without requiring its original card wrapper.

**Grouped data:** A gallery containing images, notes, ordering, associations and layout intent transfers as one object but retains independently accessible members. The receiving template can choose masonry, rows, a carousel, or an editorial gallery.

**Arbitrary structural fragment:** Select a header, a section, three neighboring rows, a sidebar, or a custom nested cluster. Export the selected nodes and their required dependencies. Reinterpret them as a coherent unit in another Atlas project.

**Complete page:** A whole page exports as a composition graph referencing portable resources, relationships, template selection and refinement overlay. A destination can rebuild the page in its own visual style without losing source identity or semantic relationships.

**Cross-project remixing:** A new site draws an article region from one project and a media cluster from another. Users may link to canonical objects, fork local copies or create intentional snapshots. The choice is explicit.

**Future platform:** A compatible mobile/desktop renderer or third-party application imports the same schema and translates supported meaning and behavior into native layouts or alternate presentation formats.

## 9. Interchange model — illustrative only

```json
{
  "format": "atlas-composition",
  "version": "0.1-proposal",
  "id": "composition:feature-page",
  "resources": [
    {"id": "resource:title", "type": "text", "value": "Collected Worlds"},
    {"id": "resource:photo-1", "type": "image", "uri": "asset://photo-1"}
  ],
  "groups": [
    {"id": "group:features", "members": ["resource:photo-1"], "ordering": "explicit"}
  ],
  "nodes": [
    {"id": "node:page", "type": "page", "children": ["node:header", "node:feature"]},
    {"id": "node:header", "type": "header", "resource": "resource:title"},
    {"id": "node:feature", "type": "section", "group": "group:features",
     "intent": {"emphasis": "high", "layout": "adaptive-grid"}}
  ],
  "template": {"ideal": "editorial", "palette": "warm", "typography": "serif"},
  "refinements": [{"target": "node:feature", "intent": {"relativeProminence": 1.2}}]
}
```

The schema is illustrative, not a finalized API; asset packaging, resource resolution, security, and complete behavior representation require separate detailed contracts.

## 10. Practical portability requirements

- **Open, documented, versioned interchange:** JSON manifest plus a portable asset package or resolvable references; validate, migrate and round-trip.
- **Stable IDs and explicit dependencies:** Never silently lose children, attachments, relationships, metadata or object lineage.
- **Recursive selection:** Export any selected node with enough structure and resources to remain meaningful, without unnecessarily bundling an entire project.
- **Two modes of reuse:** Linked references for synchronized content and snapshots/forks for independent derivatives.
- **Destination adaptation:** Style tokens and semantic roles translated into new template families instead of brittle CSS copying.
- **Responsive tests:** Check desktop, tablet, phone and constrained arbitrary widths for overflow, overlap, legibility, navigation and image treatment.
- **Capability negotiation:** Unsupported interactive widgets or external APIs use declared fallbacks; never promise functionally equivalent output if it is impossible.
- **Privacy and safety:** Asset consent, access control, private/public filtering, safe HTML sanitization and untrusted code isolation; export permissions must be respected.
- **Traceability and reversibility:** Users can identify source objects and template choices, revert refinements, migrate schema versions and re-import exported projects.
- **Portability quality reporting:** State precisely what was preserved, adapted, approximated, omitted or needs human refinement.

## 11. What 'millions of projects' really means

The architectural objective is that reuse cost depends primarily on the receiving template's support for the **shared format**, not on the number of pages or projects the data has previously inhabited.

In a compatible ecosystem, the same object or composition can be transferred one time or a million times *without individual manual layout reconstruction*, because the destination interprets it programmatically. This is a scalability principle, **not** a claim that every target is compatible, every translation is lossless, or no human will ever desire artistic refinement. A new type of renderer may need a one-time adapter; exceptionally specific designs or custom behaviors may require adjustments.

Rather than promising perfect appearance across all devices, Atlas should promise an **aesthetically competent default** backed by constraints, quality tests, explicit fallbacks and optional artistic refinement.

## 12. Product boundaries and sequencing

**Phase A — Contract and proof:** Specify portable resource/group/composition schemas and export/import identity rules. Demonstrate individual and grouped data, an arbitrary section, and a complete page transferring between two template ideals; verify relationships and responsive results.

**Phase B — Automatic composition:** Implement a small set of exceptionally polished template ideals with typography, header, palette and layout variation. Add inspectable composition graph and theme tokens.

**Phase C — Artistic Refinement:** Enable arbitrary node selection, structural grouping/ungrouping, drag/reorder/resize and intent-preserving edits. Define precedence and conflict reporting between source intent, destination template and user overrides.

**Phase D — Multi-project transplantation:** Build import/export, links versus snapshots, dependency packaging, asset resolution, compatible-template matching and non-destructive round trips.

**Phase E — Cross-renderer ecosystem:** Publish stable compatibility requirements and adapters for future Atlas projects, external sites, native apps and other platforms. Preserve the same portable composition philosophy without tying it to a single frontend framework.

Each phase is a proposal until independently implemented and tested. Do not displace the existing Explorer roadmap or misrepresent this as shipped functionality.

## 13. Acceptance demonstrations

1. Copy a single image and its metadata into two different templates: preserve identity and data while obtaining appropriate destination presentations.
2. Carry a grouped gallery with ordering, annotations, links and member identities intact.
3. Extract an arbitrary nested section and transplant it into another page without hand-recreating its internal structure.
4. Transfer a full page between two projects; retain content and topology while switching font, palette and header type.
5. Move a block relative to another, refine it, then change viewport size; preserve intent where possible and report conflicts where not.
6. Round-trip export → import → export with stable data and relationship semantics, aside from documented normalization.
7. Disable an interactive capability in the destination and observe an explicit safe fallback and portability report.
8. Verify private data is not inadvertently included in a public export.

## 14. Governing principles

1. **Everything organized in the Atlas composition format should be addressable and potentially transposable.**
2. **Portability applies recursively** to atomic data, ad hoc groupings and every level of webpage structure.
3. **Data and relationships outlive layouts.**
4. **Templates interpret rather than own content.**
5. **Approximate structure should be enough to produce a credible design.**
6. **Variation should be cheap:** fonts, palettes, headers, spacing and geometric rules are adaptable parameters.
7. **The human finishes the art:** automatic composition precedes optional Artistic Refinement.
8. **Intent should survive better than pixels** when moving across viewports, templates or platforms.
9. **No silent loss:** unsupported behavior and conflicts must be visible.
10. **Reuse should scale with compatibility, not repeated manual reconstruction.**

## 15. One-sentence charter

> **Atlas is a universal transposable composition system: any structured piece of content or webpage, from an individual datum to a complete nested site, can be addressed, grouped or ungrouped, exported and reinterpreted through compatible templates—automatically producing responsive compositions that people may artistically refine rather than rebuild.**


---

## Addendum A — Objects, Groupings, and Semantic Presentation (2026-10-19)

**Status:** Owner-directed clarification and extension of this proposal; not an implemented capability.

### A.1. The decisive distinction

Atlas's template system depends on the meanings of **objects** and **groupings**, not just visual boxes or HTML fragments. A renderer can only make output human-legible, comprehensible, aesthetically appropriate, and useful when it has enough information about *what* is being presented and *why* its pieces are associated.

- **Object:** An independently addressable entity with stable identity, metadata and, when appropriate, an internal composition. It can be referenced, exported, reused or transformed.
- **Grouping:** A declared relationship or organized collection of one or more objects, with optional ordering, purpose, annotations, membership rules and presentation intent. A grouping may itself be an object with identity and reusable structure.
- **Card:** A compact, self-contained presentation of an object or grouping; not a canonical data type.
- **Pop-out:** An expanded contextual presentation of an object, potentially exposing its groupings, attachments and interactions. A pop-out can be a **kind of expanded card**, not a slice.
- **Slice:** An intentionally selected, portable presentation of content or a composition fragment for insertion into another page, site or context. A slice is not interchangeable with an ordinary card or pop-out simply because all may render some of the same data.
- **Site/page:** A complete composition containing any arrangement of addressable nodes; it can itself be exported or reinterpreted.

An object's ontology, grouping membership and projection type are **orthogonal**: one grouping can be a reusable object, rendered as a card or pop-out, and optionally represented by a separate editorial slice if the author asks for one. **Do not automatically classify all grouped objects as slices, or assume all presentations must be generated.**

### A.2. Canonical example: the Atlas Pinboard Pop-out

The existing Pinboard Pop-out card is simultaneously:

1. A durable **object** capable of independent referencing and export.
2. A **grouping** that organizes photos, notes, bookmarks, and other associated data.
3. A **card-family presentation**, expanded to expose details and relationships.
4. **Not automatically a slice**: its purpose is contextual inspection and interaction, rather than transplanting an editorial region into a separate webpage.

This example should be used as a canonical modeling test for all future template and import/export work.

### A.3. Semantic Presentation Resolver

An existing visual editor or ordinary template renderer is insufficient on its own. Atlas needs a **Semantic Presentation Resolver** between the object/group model and the aesthetic template renderer. It determines:

- Which objects and groupings are being presented, their roles, relationships and intended hierarchy.
- Which projection is requested or contextually appropriate (Card, Pop-out, Slice, Page/Site), respecting explicit user choice.
- Which content to prioritize and reveal given audience, viewport, available space and user intent.
- Which layout constraints, accessibility semantics and interactions the output requires.
- Which template ideal and graceful fallback are compatible with the object and the destination.

The resolver should initially use **explicit metadata and deterministic rules**; AI inference can be optional rather than necessary for basic composition. Where semantic roles or group purposes are unknown, use transparent defaults or ask for targeted input rather than inventing associations.

Illustrative pipeline:

```text
Ungrouped resources + reusable object/group graph
                |
                v
        Semantic Presentation Resolver
          role / projection / priority
                |
                v
    Template ideal: Pristine Publishing | Wiki
          + host style / viewport / tokens
                |
                v
       Card | Pop-out | Slice | Page/Site
                |
                v
      Optional Artistic Refinement
```

**Pristine Publishing** is a presentation-first family emphasizing refined visual rhythm, editorial hierarchy, typography, whitespace and media. **Wiki** is an information-first family emphasizing navigation, metadata, cross-references, histories and readable structure. These are *presentation families over the same object schema*, not competing data models.

### A.4. Reuse rather than reinventing a complete website editor

Investigate existing editors such as **GrapesJS**, **Puck** and compatible rich-text/block editors as possible editing surfaces or adapters. Existing content and template ecosystems including **Storyblok** and **WordPress** demonstrate nested blocks, reusable structures and template-driven presentation, but do not thereby prove complete Atlas cross-project transposability.

Atlas should **own its versioned JSON composition contract**, stable resource/group identities, resolver and template rules—not the implementation details or native project format of any particular editor. The editing surface must round-trip Atlas-compatible object and composition semantics; exporting arbitrary DOM/HTML/CSS or an editor-specific JSON blob alone does not satisfy the contract.

A conforming editor should create, select, move, nest, group, ungroup and rearrange addressable pieces, update structured Atlas data bidirectionally, and preserve user intentions in a separate refinement layer. Website-to-Atlas importing must distinguish clean structured JSON imports from lossy attempts to infer semantics from arbitrary HTML.

### A.5. Concrete verification cases

1. Serialize a Pinboard Pop-out as an independently addressable grouping/object with card-family presentation; confirm it is **not misclassified as a slice**.
2. Insert a single ungrouped resource into another project without importing the original parent composition.
3. Transfer a mixed grouping of images, bookmarks and notes, preserving membership, notes, identity and link relationships.
4. Render the **same canonical grouping** under Pristine Publishing and Wiki without changing its underlying object data.
5. Explicitly request a slice from selected group members; verify it is a distinct projection with purpose and host-context adaptation, not an automatic synonym for the original pop-out.
6. Move and rearrange nested regions in a compatible editor; serialize, reopen, and transpose them without losing relationships or responsive constraints.
7. Record what could not be rendered faithfully instead of silently dropping information or behavior.

### A.6. Addendum charter

> **Atlas's primitive is the addressable object and its relationships; groupings can themselves be objects. Cards, pop-outs, slices and complete sites are contextual presentations of those structures. A Semantic Presentation Resolver makes the structure intelligible to a template engine, allowing compatible projects to reuse it without manually reconstructing their visual arrangements.**
