# Atlas — Universal Transposable Composition Architecture

**Status:** Owner-directed vision and architectural proposal, not an assertion of implemented features  
**Date:** 2026-10-19  
**Related:** Atlas resource graph, adaptive publishing, modular templates, Any-Shape, Forever Works


## Governing Product Direction — Convention-first Transposition

> **Atlas does not initially promise to understand every website. It proposes a common compositional language through which any conforming website can be automatically translated into aesthetically coherent, semantically faithful Cards, Slices, and their expanded presentations.**

**Initial commitment:** Establish documented Atlas object, grouping, semantic, and composition conventions and a template engine that can reliably generate attractive, intelligible, responsive Cards, Card Pop-outs, Slices, and expanded Slices from **conforming** projects. This is the product direction and proposed acceptance target, not an assertion that it is implemented today. Optional Artistic Refinement should improve the output, not be necessary to make a normal conforming composition intelligible.

**Future research ambition:** Convert arbitrary nonconforming websites into this format, potentially using agents trained or guided by many examples. That is a separate, later capability and must not be described as the initial product promise.

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


---

## Addendum B — Website Conversion, Slice Expansion, and Shared Template Conventions (2026-10-19)

**Status:** Owner's intended direction, including a deliberately limited early-stage interaction model. Proposed only; not shipped.

### B.1. Goal: a common language for website conversion

Atlas should investigate and define its own **Atlas Composition Transformation Protocol (ACTP)**: an interoperable conversion process for whole websites, arbitrary website regions, and structured resource/object graphs. The goal is to preserve the highest practical **semantic and functional fidelity** even when aesthetic presentation, screen size, or container context changes.

The central question is not how to shrink a website's pixels, but which stable conventions make its *identity, meaning, groupings, relative emphasis, layout intent, assets, and behaviors* recoverable and translatable. Given sufficiently conforming structure, compatible projects can repeatedly reinterpret the same website content as cards, slices, expanded views, or entire sites rather than reconstructing each layout manually.

A useful preliminary decomposition is:

- **A — Object identity and content:** Named, independently addressable resources, groups, sections and entire websites.
- **B — Semantic relationships:** Membership, hierarchy, sequence, association, citations, featured objects, links and purposeful adjacency.
- **C — Composition intent:** Importance, content selection, reading order, required affordances, responsive priorities and preservation constraints.
- **D — Presentation interpretation:** Host styling, font roles, design tokens, geometry, CSS realization, theme and interaction presentation.

These are candidate conventions for discovery and testing, not a frozen ontology. Atlas should experiment to find which schemas retain the best meaning, editability, behavior and perceptual quality under transformation.

### B.2. The intended early-stage distinction: Card / Pop-out vs Slice / expansion

**Do not flatten the early Atlas product into one generic 'preview'.** The owner's starting concept has two different interaction families:

**Card → Card Pop-out.** The Atlas Pinboard is the canonical example. The card is a compact representation of an object or grouping. Opening it reveals a richer, interactive, contextual **pop-out card** with its contained objects, metadata, notes and related material. The Pinboard is simultaneously an object and grouping; its pop-out remains part of the *card family*, not a slice.

**Slice → Expanded website section.** A slice is closer to a **representative row or section of a website** inserted into another composition. It is intentionally curated or transformed to retain the original website's aesthetic character and purpose while fitting its host context. Activating it may **drop down / expand in place** into a richer, miniature website section or page-like region, preserving recognizable typography, spatial identity, content relationships and functional intent as far as feasible. This is a *slice expansion*, not the Pinboard's card pop-out, even if both are casually called 'pop-outs'.

| Initial family | Collapsed form | Expansion | Principal goal |
| --- | --- | --- | --- |
| Card | Object/group preview | Contextual card pop-out | Inspect the object and its connected contents |
| Slice | Website-representative row or section | Drop-down expanded miniature site/page section | Experience a faithful, aesthetically coherent part of the source website |

This distinction describes **initial UX conventions**, not immutable ontology. Over time, cards, slices, and their expansion variants may become more specialized or acquire overlapping capabilities as long as their roles and transformation contracts remain clear.

### B.3. One shared style and template language

Despite their different initial purposes and interactions, **Cards, Card Pop-outs, Slices, expanded Slices, and Sites must draw from the same Atlas-compatible composition and styling conventions**.

Shared contracts should cover typography roles, colors/palettes, spacing and proportion systems, responsive transformations, object references, semantic roles, nested structure, interactions, theme inheritance and preservation priorities. Each presentation family can impose its own layout policy and expansion behavior without requiring separate canonical data stores.

For slices especially, **source aesthetic fidelity and destination integration are separate, negotiable goals**. A slice may preserve its originating site's typography, visual hierarchy, palette and distinctive composition within an embedded region while still fitting its receiving site's dimensions and accessibility requirements. Specify source-style preservation vs destination-style adoption explicitly rather than silently flattening one into the other.

### B.4. Transformation stages and trainable examples

Conceptual transformation pipeline:

```text
Source website / region / Atlas object graph / external structured JSON
      -> Extract structure, content, resources, CSS clues, interactions
      -> Normalize into Atlas identities + relationships + composition intent
      -> Select projection and semantic reduction strategy
      -> Apply shared template conventions + family-specific rules
      -> Render Card / Card Pop-out / Slice / Expanded Slice / Site
      -> Validate semantic, functional, aesthetic and responsive fidelity
      -> Optional human Artistic Refinement
```

Treat extraction from arbitrary websites as potentially **lossy and uncertain**. Atlas-native and structured imports should be the initial high-fidelity path; arbitrary HTML/CSS/JavaScript imports may require heuristics, permissions, snapshots or user guidance. No source design, complex script, or behavior is guaranteed to transfer perfectly.

Record optional, permissioned transformation examples for future evaluation and AI generalization: original site or structured input, semantic graph, selected content, projection family, template/viewport, generated output, user refinements, accepted result and measured failure modes. Start with deterministic rules and explicit semantics; later learning systems can attempt to predict useful reductions, layout decisions and refinements. Never imply an AI model or large dataset is already built.

### B.5. Proof scenarios for the first prototype

1. Take the Atlas Pinboard grouping and generate a compact **Card** that opens a contextual **Card Pop-out**, while retaining notes, members, relationships and independent identity.
2. Take an Atlas-compatible publishing page and generate a **Slice** resembling a purposeful website row/section. Expand it **in place, downward**, into a recognizable miniature portion of its original website, retaining its aesthetic identity and purpose.
3. Render both families through shared design tokens and composition contracts while retaining distinct expansion behaviors.
4. Transplant a Slice between receiving websites with different fonts, widths and palettes; record when source-style preservation wins and when destination adaptation is used.
5. Save editor-authored grouped/ungrouped sections into versioned structured Atlas JSON; re-import without losing identities, grouping semantics or presentation intent.
6. Demonstrate different projections from the same normalized data without copying or destructively altering its canonical source.
7. Capture output examples and human refinements to support future testing and model training.

### B.6. Governing clarification

> **Initially, Atlas Cards and Slices are different presentation families. A Pinboard Card opens into a richer Card Pop-out; a website-representative Slice can drop down into a miniature page section that maintains the originating site's aesthetic and purpose. Both share Atlas's composition, style, and transformation conventions so they can later be specialized, adapted, and transposed across compatible projects.**


---

## Addendum C — Presentation-Independent Composition and Artistic Refinement (2026-10-19)

**Status:** Owner-directed long-term product and architectural proposal. A future developer or coding agent may draw upon it, but **this is not a Codex request, implementation order, fixed technical specification, or claim that the capabilities already exist**. Architectural choices are intentionally open for investigation.

### C.1. The central proposition

A website structured in accordance with Atlas's shared conventions should be capable of producing an **aesthetically coherent, meaningful Slice regardless of the source website's original styling**, provided the receiving composition engine can interpret its data, relationships, semantic roles, and presentation intent.

The originating page might be a polished magazine, a bare wiki, or a visually unconventional portfolio. The resulting Atlas Slice should not need to inherit that page's CSS or arrangement to be clear and attractive. It should carry the **information, purpose, organization, and important relationships** into an independently composed presentation. The same principle may apply to Cards, their Pop-outs, expanded Slices, and eventually whole websites.

The proposed name for this principle is **Presentation-Independent Compositional Fidelity (PICF)**:

> Preserve a composition's meaning, relationships, hierarchy, and intended function independently of its original appearance, so compatible templates can reinterpret it appropriately in different contexts.

This is a *design objective*, not an automatic guarantee of beauty or lossless conversion. It depends on the expressiveness of the conventions and the quality of the receiving templates.

### C.2. What Atlas conventions must make intelligible

The system's promise depends upon clear distinctions between:

- **Objects:** Anything independently identifiable and addressable, from an image or note to a grouped Pinboard or an entire page.
- **Groupings:** Explicitly meaningful memberships, collections, sequences, and associations. A grouping can itself be an object and can also contain or reference other groups.
- **Semantic relationships:** Why items belong together; which caption describes which image; what is featured, supplemental, chronological, navigational, or otherwise related.
- **Composition intent:** What the reader should notice first; which relationships should remain visible; how a region is meant to be consumed or interacted with.
- **Presentation rules:** Fonts, palette, header conventions, spacing, geometry, responsive behavior, and other choices that can be supplied or changed by a destination template.

These layers should be separable so that the same structured objects can produce many presentations without creating and maintaining separate copies of their canonical data. Both grouped and ungrouped objects must remain transposable.

### C.3. One framework, distinct initial experiences

Atlas should initially distinguish **two presentation families**:

**Card → Card Pop-out:** The existing Pinboard is the exemplary case. It is simultaneously a grouped object and a Card. The Card gives a concise identity and the Pop-out exposes richer content, attachments, notes, and relationships. Its purpose is object inspection and interaction. **It is not inherently a Slice.**

**Slice → Expanded Slice:** A Slice is closer to a curated, representative *row or section of a website*, intended to appear within another website or composition. It conveys something of the source's purpose and structure in limited space. On interaction, it may **drop down into an expanded, miniature page-like section**, giving a fuller experience of the originating website or selected section. In contexts that call for it, the expanded view can preserve selected elements of the source's aesthetic identity without being forced to replicate its exact CSS.

These distinctions describe the initial conceptual UX, not eternal boundaries. The two families and their expansions should still share a **common Atlas composition, style, and template language**. Later they may be specialized and differentiated further.

### C.4. Template ideals: convention, interpretation, and variation

Atlas's template engine would interpret structured objects and composition intent instead of simply copying source HTML. Two useful initial aesthetic families remain **Pristine Publishing** (editorial, spacious, image- and typography-led) and **Wiki** (structured, navigable, information- and relationship-led). These are different ways of presenting the **same underlying data**, not incompatible object formats.

An appropriate template may choose typography, header treatment, spacing, palette, layout rhythm, image crops, information density, and responsive reflow. Changing a small number of these parameters may yield substantial visual variety without reconstructing the data or original groupings.

Rather than asserting one geometric rule will work in every situation, Atlas should accumulate testable composition conventions and examples showing which transformations succeed, where they fail, and what information needs to remain visible.

### C.5. Artistic Refinement: a human finishing stage

Automatic composition should produce an attractive, structurally sound *starting point*. The creator must then be able to make the small, intentional adjustments that finish the work: moving a block, changing prominence, resizing an image, adjusting spacing or typography, choosing a different header treatment, refining a crop, or changing a palette.

Call this stage **Artistic Refinement**.

Ideally the experience uses an **established, extensible visual website editor or standardized editing model** rather than requiring Atlas to invent every authoring interaction. Such an editor might offer intuitive creation, selection, dragging, grouping/ungrouping, nesting, resizing, and movement of sections, rows, Cards, Slices, or other addressable elements. Existing editor technologies (for example GrapesJS or Puck) are candidates for exploration, not selected dependencies or predetermined solutions.

The important design boundary: **the visual editor is an authoring surface, not the ultimate owner of the data**. Its edits should correspond to portable Atlas structures and, where possible, be represented as a separate user-authored refinement layer rather than destructive mutations of the original resources, groupings, or template ideal. The design should permit re-editing and future translation into another compatible project.

Some artistic decisions are legitimately specific to a format or viewport. Such decisions should be preserved where applicable, transformed when feasible, and otherwise surfaced as explicit incompatibilities—not blindly imposed everywhere.

### C.6. A potential transformation journey

An illustrative conceptual flow, without prescribing software implementation:

1. Someone brings an Atlas-compatible website, a portion of a website, a Pinboard grouping, or structured external JSON.
2. Atlas recognizes meaningful objects, groupings, hierarchy, and source intent through agreed conventions; less-structured external sites may require interpretation or annotation.
3. A presentation process determines what to show and how to express it as a Card, Card Pop-out, Slice, expanded Slice, or site.
4. A suitable template ideal generates a legible and aesthetically coherent arrangement for its container and context.
5. The creator optionally enters Artistic Refinement using a capable visual editing environment.
6. The result and its intent can be saved in portable structured form, published, reopened, or transposed to another compatible project.

In principle, a conforming website or composition could be reused across very many future projects **without manually rebuilding it for each destination**. This depends on shared conventions and receiving-template support; unusual layouts, unsupported interactions, and arbitrary third-party code may need adapters, fallbacks, or human correction.

### C.7. Learning from composition and refinement

The long-term goal is to gather sufficiently rich, appropriately authorized examples of **source structure → generated composition → human Artistic Refinement → accepted result**. Such examples could help Atlas test its conventions, compare design strategies, and eventually train or guide AI systems to generalize the compositional principles.

Importantly, the data corpus should include semantic structures and relationships, template settings, viewport conditions, user changes, and preservation failures—not just screenshots. There is no requirement to introduce a heavy model in the initial product; deterministic, explainable rules and hand-designed examples can establish the foundation.

### C.8. Open questions to guide future exploration

- What minimum amount of semantic and grouping information allows reliable conversion into a human-readable, aesthetically satisfying Slice?
- How can a receiving template preserve source **purpose** while changing virtually all source **styling**?
- Which kinds of page sections are naturally representable as Slices, and when should Atlas instead recommend a Card or another representation?
- What distinguishes a small user refinement from an intentional change in composition meaning?
- Which existing editor can best manipulate Atlas-compatible structures and round-trip them without becoming a lock-in?
- How can Atlas measure semantic, relational, functional, responsive, and aesthetic fidelity separately?
- What conventions encourage third-party adoption without forcing sites to use a single visual identity?

### C.9. Guiding statement

> **The website provides structured meaning; Atlas interprets its composition; the template supplies an appropriate aesthetic; and the artist refines the result.** Through shared conventions, objects, groupings, Cards, Pop-outs, Slices, and ultimately whole websites become portable, reusable expressions of the same underlying information.
