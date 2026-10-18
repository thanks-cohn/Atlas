# Proposal — Atlas Minimal Publishing, Card/Slice Architecture, and Aesthetic Adaptation Corpus

**Status:** Owner-directed proposal, not shipped functionality. **Date:** 2026-10-18.  
**Applies to:** Atlas shelf, cards, galleries, articles, site generation, R2/local storage, Any-Shape, Forever Works.  
**Primary rule:** **Use the smallest implementation that fully preserves the experience.**

## 1. Purpose and non-negotiable product principles

Atlas makes familiar web and file operations **intuitive, beautiful, aesthetic, and fun**. We do not rebuild the browser, the internet, or the wheel. Adopt proven modern conventions (context menus, multi-selection, Ctrl/Shift selection, drag/drop, breadcrumbs, back/forward, copy/cut/paste, familiar file operations, search, keyboard navigation) and deviate **only where the owner's design vision demonstrably requires**. Complexity belongs in the software, not in the user's workflow.

**First-time user acceptance question:**  
> Can someone who has never used Atlas create a three-entry story website, attach their portfolio and résumé, customize its appearance, and publish it through Cloudflare without asking how anything works?

**A template starts finished.** A user can select a ready-to-publish design, replace a few images or sentences, change font/color/placement, and publish. The same template must permit much deeper gradual customization without forcing novices into code. **Start finished; change anything; publish effortlessly.** Do not equate a good template with an immutable screenshot.

**Preserve both simplicity and engineering rigor.** Simplicity is measured at the interface and output boundary; reliable security, accessibility, recovery, resilience, and design obligations still require substantive code and testing.

## 2. Minimal implementation; maximally understandable modularity

Prefer standards-based semantic HTML, CSS (Grid, Flexbox, container queries, custom properties, responsive images, media/reduced-motion queries) and small ES modules. Avoid shipping React, Astro, Puck, large runtime dependencies, server infrastructure, hydration, or mandatory Node/build tooling into ordinary *published outputs* merely to reproduce features native browsers already provide.

**Take cues from Astro's modular composition and content separation, not its mandatory adoption.** Every module should have:
- One comprehensible responsibility, documented inputs/outputs and dependencies.
- Named, substitutable interfaces for source data, card/slice selection, template resolving, responsive layout rules, asset emission, interactions and publishing transports.
- A human-readable explanation of **where it lives, what it does, how it works, why it exists, and which user purpose it protects**.
- Stable JSON schemas with explicit versions/migrations; deterministic templates; clear separation of canonical data, presentation, behavior and deployment.
- Portable generated artifacts and independent test fixtures. Mechanisms may be reconstituted or replaced under Forever Works' purpose-preservation contracts.

**Proposed conceptual module boundaries** (not a claim these files already exist):
1. `card-core`: stable IDs, typed content/relationships, references, privacy and versions.
2. `presentation-ir`: normalized intermediate representation of content selection, semantic hierarchy, slots, design tokens and behavior.
3. `slice-engine`: source→card→slice projections, live/snapshot policy, crop/excerpt rules, provenance.
4. `template-engine`: page families, section slots, defaults, bounded overrides and compositional constraints.
5. `any-shape`: container/viewport adaptation, legibility, animation equivalence and proofs.
6. `static-export`: HTML/CSS/minimal JS/assets and portable JSON/manifest output; avoid unnecessary client data fetches.
7. `publisher`: optional Cloudflare authorization, destination creation, deployment and domain setup; never make deployment tooling part of content identity.
8. `storage-adapters`: browser, local companion and R2, with verified transfer semantics and portable manifests.
9. `diagnostics`: traceable transforms, build reasons, performance, memory and transfer metrics.

A simple output may be `index.html`, `style.css`, `content.json`, optional `site.js` and `assets/`; content may instead be pre-rendered into HTML to work directly as a local file. No mandatory framework runtime on visitor devices. Static-only pages should emit zero JavaScript where practicable; dynamic functionality must justify itself.

## 3. Card-centric first: canonical object, not merely its pixels

In initial Atlas stages the **card is the primary content object**, even when its miniature visual form only shows an image and title. It may *contain or reference* arbitrarily extensive writing, images, documents, URLs, tags, notes, bookmarks, associations, versions and other cards. Large binary content should live in referenced assets, not one huge synchronized JSON record.

**Three distinct but related concepts:**
- **Whole:** the complete underlying page, website, article, gallery, collection or experience, including data, styling, logic and purpose.
- **Card:** stable, portable identity/manifest holding or referencing content, semantics, metadata, relationships, rights, presentation choices and behavior.
- **Slice:** selected, context-sensitive projection of a whole/card within another card/page. Not necessarily a screenshot, scaled iframe or duplicated resource. It may adapt its crop, text selection, arrangement, interaction and CSS.

**Flow:** canonical content/reference graph → presentation intermediate representation (IR) → chosen template + Any-Shape constraints → a responsive card, expanded object, article, gallery, embedded slice, or standalone site.

Aesthetic reduction should preserve essential **identity, meaning, purpose, recognizable character and useful interaction**, while allowing different compositions for host context. Log what is selected, omitted, transformed and why. A slice retains its source ID and may be live-linked or fixed to a snapshot; host-specific overrides never overwrite source presentation. Disallow recursive embed cycles. Reusing content must not silently inherit unrelated annotations, tags, recommendation context or publishing permissions.

## 4. Universal object portability and user-directed storage

Anything created—cards, grouped cards, notes, galleries, articles, sections, sites—should be movable/copyable as a coherent Atlas object between browser, local computer and authorized Cloudflare R2 storage. Preserve stable identities, hierarchy, metadata, original content, attachments/asset hashes, relationships, presentation, versions and provenance as relevant. Maintain clear **move / copy / linked reference / export** semantics; ensure successful manifest + asset verification and restore before any optional local deletion.

Offer clear **Save locally / Save to R2 / Save to both** choices when supported, without making storage location change the editor's behavior. Data should not upload to the cloud merely because a user previews a template. Respect local permissions, signed URL/access boundaries and private/public inheritance. Never bundle unapproved private data into published HTML, JS, metadata or assets. R2 credentials and private tokens must never land in static output.

The right-click shelf should resemble a polished, predictable explorer: choose folder → right-click → **Send to R2 → Bucket / Location**, with progress, ETA based on measured throughput, retries, resumable queue and verification. Bulk operations are a proposed paid capability; free individual operations remain useful. Transfers must not claim they can bypass browser native-filesystem restrictions: use user-consented, authenticated native helper for unrestricted OS operations. Debug options may expose honest helper process memory, throughput, retries, active jobs, errors and redacted log export, without invented metrics.

## 5. Publishing format selector: familiar needs first

The initial selector must foreground common outcomes rather than obscure template terminology. Ten proposed families:
1. Portfolio & résumé
2. Blog & articles
3. Gallery & pinboard
4. Personal homepage
5. Product landing page
6. Business & services
7. Event & invitation
8. School & research project
9. Link hub
10. Story & literary publication

These are **format families**, not ten incompatible editors. For each, aim at three excellent, responsive starting presets (30 reference starts) reusing a small design system. Pinboard/Gallery remain meaningful established Atlas formats. Presets provide production-ready working navigation, sensible sections, semantic accessibility, typography, spacing, fallbacks and functioning mobile views.

**Customization hierarchy:** format (purpose) → content/schema → layout/sections/placement → style/tokens/fonts/colors → per-instance overrides → publication. Familiar controls: **Content / Layout / Style / Pages / Preview / Publish**. Progressive complexity: simple replacement first, customizable arrangements next, advanced compositional overrides last. Tiny choices must lead to significant coherent differences, without producing broken combinations.

### First end-to-end exemplar

Choose **Story Gallery — 3 entries** → upload three images → paste three articles or select existing rich-text notes → attach a linked portfolio/about page and résumé → choose style, colors, font, positioning → preview at multiple sizes → authorize Cloudflare → choose site/domain → publish. Entry count is an editable preset, not a hard limit. Keep the editing experience available from the Atlas extension afterward. Publishing should not require GitHub, command-line steps, or understanding DNS where an authorized API can perform the operation; some registrars/nameserver changes still require user action.

## 6. Rich notes, content presets, transformations and lineage

A rich-text note already supports formatting (Word-like headings, spacing, emphasis, lists, etc.); **preserve it**. The article composer must also turn weakly structured long notes into a beautifully typeset story or article through standard layout rules and optionally *suggested* structural interpretations. Do not silently rewrite author text, invent section headings or change purposeful line breaks. A structured note can become an article with alternate editorial presentation without losing its source.

Allow new cards to reuse **previous titles and previously written notes independently**, editable without mutating original content. Support text search for reused materials and permission-safe visibility.

**Save Revision** updates a card while keeping recoverable history; **Save as Version/Variation** creates a linked independently editable card preserving lineage; **Save as New Card** creates an independent object. Any variation can be transformed again; deleting one source must not orphan binary content or destroy independent versions. Publishing an object is another presentation/transformation, not forced duplication of canonical writing.

## 7. Any-Shape: aesthetic equivalence, not just breakpoints

**Central question for every template, card, slice, transition and effect:** *Will this look and feel just as intentional and excellent on a phone, tablet, laptop, desktop and unusual container size?*

Responsive fit does **not** equal aesthetic quality. Mobile may need a different image crop, visual hierarchy, spacing, typography line breaks, focus sequence, gallery interaction, navigation or animation path from desktop. Preserve purpose, legibility, interaction, identity and perceived quality, **not pixel identity**. Honor reduced-motion settings, keyboard/touch interaction, performance budgets and accessibility. Define supported size/container envelopes and graceful out-of-range behavior; never claim literally every possible size is verified.

Record explicit transformation decisions and visual-test outcomes across viewport/container sizes. Treat Any-Shape as the adaptive design contract and implementation reference; do not introduce a runtime dependency merely to cite it.

## 8. An inspectable aesthetic reasoning corpus

Our eventual opportunity is to teach agents **why** an excellent whole becomes an excellent card or slice—and **why** each responsive arrangement works. Atlas, Any-Shape and Forever Works form complementary layers:
- Atlas: concrete templates, card/slice relationships, generated outputs and visual evaluations.
- Any-Shape: shape/viewport transformations and quality preservation.
- Forever Works: enduring intent, reasons, constraints, replacement obligations and reconstructable evidence.

Build **20–40 exceptionally documented examples first**, scaling toward ~500 distinct high-quality sites only if the pilot demonstrates measurable generalization. Each example should keep:
- Licensed/owned source HTML, CSS, JS, canonical JSON, original assets and manifest.
- A full-page view, card(s), slices and derived views with exact source/reference relationships.
- Deliberate desktop/tablet/phone/unusual-size rendered cases, crop/position/typography/animation transformations.
- Design rationale explaining hierarchy, composition, omissions, interaction, visual identity and constraints.
- Good **and bad** adaptations with human assessments, corrections, accessibility and performance checks.
- Reproducible rendering tests, metadata, versioned schema, rights/consent provenance and source ↔ output linkage.

Potential uses: in-context examples, retrieval for design agents, held-out benchmarking, small specialist fine-tuning or a **licensed** training/evaluation corpus. Do **not** claim 20–40 examples train aesthetic intelligence from scratch; do not claim 500 sites automatically outperform larger web-generation models. Test agents on held-out, unseen designs against strong baselines, and assess human preference, functional correctness and responsive quality. Never harvest private user projects for commercial model training without affirmative appropriate permission.

## 9. Product and business hypothesis (not verified revenue)

Atlas bookmark exploration is the **return-and-rediscovery engine**: Tumblr/Pinterest-like visual browsing, notes, tags, contextual recommendations, search and resurfacing forgotten bookmarks. These create a reason to revisit *one's own* collected history. Publishing is the **creation/distribution engine**: transform existing collections into beautiful sites with almost no work. Local/browser/R2 operations form the **freedom and utility engine**.

Investigate a **$5 one-time license** and optional affordable significant upgrades (user discussed ~$10–20/year total spending), rather than assuming an ongoing subscription. Preserve continued functionality of purchased features; define a reasonable security/compatibility maintenance policy. A user's authorized Cloudflare account bears its own service usage and billing; Atlas should not promise zero hosting/storage costs. Pricing and demand remain unvalidated hypotheses. Avoid mandatory Atlas-hosted per-user storage or expensive inference that undermines low-overhead economics.

The aspiration is to empower people with familiar polished workflows, not to market unfinished demos as shipped capabilities.

## 10. Verification gates and implementation order

1. **Baseline:** prove current bookmark-card workflows, existing image/notes/tag independence, shelf usability and regressions before wholesale architecture changes.
2. **First template:** demonstrate Story Gallery 3 with résumé/portfolio, editable sections, paste-rich-text fidelity and portable JSON.
3. **Minimal renderer:** produce secure, semantic, independently usable static HTML/CSS and only necessary JS. Measure output bytes and runtime dependencies against conventional framework alternatives.
4. **Viewport quality:** capture at least narrow phone, wide phone, tablet, laptop, desktop and constrained embedded cards; validate legibility, aesthetics, accessibility, performance, keyboard/touch and reduced-motion behavior; record human review.
5. **Card/slice proofs:** source updates, snapshots, divergent host styles, provenance, independent versions, cycles, broken references and no data loss.
6. **Portability:** export/import/restore graph, assets and style settings; verify moves/local-R2 writes and privacy isolation.
7. **Cloudflare path:** consented authorization, deployment result/error, domain management where API permits, no credentials in output, site works with Atlas uninstalled.
8. **Cold-agent reconstruction:** an unfamiliar agent can trace each module, rationale, contract and example via Forever Works docs and reproduce transformations with independent evidence.
9. **Corpus experiment:** use 20–40 examples to compare unseen pages with a no-corpus baseline; only grow corpus or train a specialized model after evaluation.

**Implementation priority:** do not stall the current card workspace or ongoing bug work for unproven future engines. New technology is proposed, not implemented, until source code, tests and browser/deployment evidence establish otherwise.

## Related existing docs

- [Adaptive Publishing and Presentation](PROPOSAL_ADAPTIVE_PUBLISHING_AND_PRESENTATION_SYSTEM.md) — existing page/template/slice cascade and privacy contract.
- [Shelf-first bookmarks and portable publishing](PROPOSAL_SHELF_FIRST_BOOKMARKS_COMPOSITIONS_AND_PORTABLE_PUBLISHING.md)
- [Current card workspace](CURRENTLY_WORKING_ON_CARD_WORKSPACE.md)
- [Shared Pinboard Surface](SHARED_PINBOARD_SURFACE.md)
- [Mission and Scope](MISSION_AND_SCOPE.md)
- [Premium Explorer Product Contract](PREMIUM_EXPLORER_PRODUCT_CONTRACT.md)
- [Forever Works](https://github.com/thanks-cohn/forever-works)
- [Any-Shape](https://github.com/thanks-cohn/any-shape)

**Enduring maxim:** **Use the smallest implementation that fully preserves the experience—and organize it so every part's purpose, behavior, aesthetic decisions and replacement obligations remain visible and changeable.**
