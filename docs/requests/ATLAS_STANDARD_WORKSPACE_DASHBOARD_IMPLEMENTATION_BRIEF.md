# Atlas — Standardized Workspace and Adaptive Dashboard
**Status:** Owner-directed future implementation request; not proof of implementation.  
**Repository:** thanks-cohn/Atlas  
**Date:** 2026-10-20

## Mission

Build the Atlas Dashboard as the unified access point to Projects, Atlas Objects, nested Collections, Local Files, Cloudflare R2, and existing organizer features. **Everything must feel standardized, intuitive, predictable, and aesthetically polished.** Adopt familiar desktop file-explorer and modern productivity-dashboard conventions, then integrate Atlas's unique object/reference capabilities naturally. Do not invent a new mental model for ordinary actions.

The desired first reaction is **“I've seen this a million times; I know how to use it.”** Our advantage is what users can accomplish, not novel navigation.

This document is a request that the other Codex/Work conversation can use for implementation. It is *not* a request to redesign Atlas from scratch or to build speculative services that do not exist.

### Prerequisite investigation
Inspect current source, active development branch, actual Shelf/top-right diagonal-arrow destination, existing dashboard, bookmarks, local helper, Cloudflare R2 authentication, object/data models, any ongoing Puck editor work, and established tests. Preserve working flows. Follow AGENTS.md and Forever Works guidance. Do not overwrite concurrent work.

## 1. Shared design and interaction conventions

Adopt ordinary conventions across every dashboard section:
- Clear left navigation with familiar icons and labels.
- Common top toolbar: back, forward, up, breadcrumbs, search, new, view, sort/filter.
- Standard list and grid views, sortable columns, multi-selection (Ctrl/Shift), keyboard operation, drag/drop where appropriate, right-click context menus, properties/details.
- Alphabetical name ascending by default; users can sort by modified date, type, size, etc. where meaningful.
- Familiar empty/loading/error/offline/permission states; no misleading enabled controls.
- Consistent typography, spacing, icon sizes, colors, focus/hover states, dialogs, selection behavior, and feedback.
- Thoughtful visual hierarchy, attractive layouts and restrained motion; responsive and legible on modest laptop screens, especially 1366×768.
- Avoid ornamental novelty that impedes predictability. Use mature existing components and conventions where suitable.
- Support keyboard access, screen-reader labeling, contrast and reduced motion.
- Polish does not excuse confusing behavior; consistency does not excuse visual neglect.

**Acceptance standard:** A first-time user should understand how to open, sort, select, inspect, arrange and move items without reading Atlas-specific documentation.

## 2. Main dashboard navigation

Preserve the Shelf's existing top-right diagonal-arrow launcher as entry to the full Workspace/Dashboard (reconcile with actual code). Keep the future Puck visual editor as its own specialized destination accessed through the Shelf Editor icon; do not install Puck in this task if it is being handled separately.

Dashboard sections, adjusted only to avoid redundant current navigation:
- **Home:** recent work, pinned locations, quick actions and activity.
- **Projects:** saved webpages/articles/sites and editor projects.
- **Objects:** all Atlas Objects, sortable and searchable.
- **Collections:** nested reusable groupings, optionally represented as a subsection of Objects rather than a redundant top-level destination.
- **Local Files:** authorized local filesystem explorer.
- **Cloudflare R2:** authorized buckets and objects, following the same explorer UI.
- **Transfers / Activity:** real tasks, progress, retries and results where supported.
- **Settings:** integrations, display and workspace preferences.

Navigation destinations may be backed by different providers but should behave consistently. Preserve existing functionalities, including the existing Story Gallery/default destination behavior until any change is carefully reconciled.

## 3. Canonical terminology

- **Atlas Object:** addressable entity with identity, metadata and possible notes, images, URLs, relationships and child objects.
- **Atlas Collection:** familiar folder-like grouping of Atlas Objects, including other Collections. A Collection is itself an Atlas Object.
- **Composite Object:** technical term for an object incorporating or referencing other objects.
- **Project:** editable work such as webpage, article or portfolio.
- **Composition:** selected entities and their arrangement.
- **Presentation:** how an entity/composition is displayed (card, slice, section, pop-out, page).

Keep exact technical distinction in APIs while using familiar labels in interface controls. Do not imply an Atlas Object must store physical bytes.

## 4. Objects and collection hierarchy

Selecting **Objects** opens the Objects explorer, initially sorted alphabetically. Users can create New Collection, rename it, nest Collections recursively, and manage memberships with intuitive drag/drop or contextual actions.

Provide expanding/collapsing trees, breadcrumbs and ordinary folder-style navigation. An Object can appear in more than one Collection without duplicating its source file or bookmark. Reject circular collection nesting. Distinguish Move, Copy, Add to Collection, Remove from Collection and Delete Source.

Object detail/content displays may reveal nested bookmarks, notes, associated URLs, images and other resources; always preserve originating references and avoid accidental source mutation.

## 5. Universal single/dual-pane explorer

Implement a familiar **Single Pane / Dual Pane** toggle. Dual pane should allow independently browsing any two supported locations—Local ↔ R2, Objects ↔ R2, Objects ↔ Local, Collections ↔ Projects, R2 ↔ R2.

Each pane is an instance of the **same generic explorer shell**, not a separate duplicate UI. Both have independent location, breadcrumbs, navigation history, sorting, selection, filters and scroll state. Use provider adapters to expose actual capabilities and centralize cross-pane operations.

Allow resizing the vertical divider and retaining layout preferences. Never make changing one pane unexpectedly change the other.

## 6. 2×2 default: hierarchy above, content below

In **each** pane:
- **Top:** resource/collection hierarchy, map/tree/list and navigator.
- **Bottom:** selected item's content, including image preview, note, associated bookmarks, nested content or details.

With two panes visible, default to a **2×2 grid** with the hierarchies on top and the viewers on the bottom. This allows comparing an image or note in Objects with another in R2 or Local without losing hierarchy context.

Conventional interactions: single click selects and previews; double click opens/navigates; viewer sub-tabs can be Preview, Contents, Notes and Details. Support **Pin Preview** to preserve a comparison when browsing elsewhere. Lazy-load previews, respect media limits and avoid full remote downloads when unnecessary.

## 7. Adaptive expansions and tasteful transitions

Both hierarchy and content regions can expand fluidly and intuitively:
- **Expand bottom across both panes** into a unified large viewer, including side-by-side comparative previews or one focused enlarged preview.
- **Expand top across both panes** for organization and navigation.
- Expand the entire left or right pane independently.
- Resize the horizontal and vertical separators; provide visible maximize/restore controls.
- Restore the previous 2×2 configuration, including independent selections, pinned views, navigation history, scroll and split ratios.
- Use restrained aesthetic animation and honor reduced-motion settings.

These are **view-state transitions**, not edits to the original object or source. Never drop context or data because of a layout change.

## 8. Cross-pane operations, distinct from references

Provider-aware semantics must be explicit:
- Local → R2: upload (when supported and authorized).
- R2 → Local: download.
- R2 → R2: provider-supported copy or move.
- Local/R2 → Objects: **register lightweight reference**, not forced download.
- Objects → Collections: attach membership.
- Collections/Objects → Projects: use existing inclusion API or document future boundary if not yet implemented.
- Objects → physical storage: explicit export/materialize, not assumed.
- Clear menus for Copy, Move, Add Reference, Remove Reference and Delete Source, each with appropriate confirmation.

Do not fabricate backend operations. For unsupported or unfinished paths, show honest capability limitations and preserve architectural seams.

Use transfer queues, progress, cancel, retry and error handling where corresponding operations exist. Ensure safe permissions and no unintended public R2 bucket changes.

## 9. Reuse, future integrations and boundaries

Keep dashboard reusable and provider-neutral. Do not merge underlying bookmark records, remote storage metadata and project representations into one ad hoc format. Preserve stable object IDs and source references, and isolate preview delivery from resource identity.

Future integrations include Puck through an Atlas object/library adapter; Redown as R2 resource feeder; template generation; agent-accessible APIs; and compute jobs. **Do not build these future systems just to complete the dashboard.** The dashboard should be ready to host them through documented extension points.

Keep the system usable without R2, a native companion, AI, network access or premium subscription wherever existing local functionality permits.

## 10. Implementation approach and verification

Investigate first, then implement in safe cohesive increments:
1. Establish/document reusable dashboard shell and navigation contract.
2. Introduce shared explorer and real provider adapters without regressing existing explorers.
3. Add Objects and nested Collections UI and underlying persistence only where required.
4. Add dual-pane mode with independent navigation.
5. Add top-hierarchy/bottom-viewer and pinned preview state.
6. Add adaptive layout expansions, polished interactions and persistent preferences.
7. Wire only genuinely supported operations; test recovery, permissions and non-regression.
8. Update docs and status with implemented vs deferred items.

If this is too much to implement safely in one session, create incremental commits and accurately document what's still pending. Prefer a smaller fully working vertical slice over broad mock functionality.

### Minimum verification
- Existing Shelf and launcher still work.
- Existing bookmarks, R2 and local browsing regressions tested.
- Objects default alphabetically; sort changes behave consistently.
- Nested Collections operate and cycles are blocked; moving/removing references does not delete originals.
- Dual-pane navigation, sorting, history and selection independent.
- Hierarchy top / viewer bottom works for available supported types.
- Expand/restore preserves pane state.
- Keyboard, reduced-motion and narrow layouts remain usable.
- Unauthorized or disconnected R2 paths fail safely.
- File transfer and reference operations are not conflated.
- Automated tests and manual smoke steps documented, along with exact status of what remains unimplemented.

## Guiding statement

**Familiar on the surface. Consistent throughout. Powerful underneath. Beautiful by design.**

Atlas wins adoption when a powerful unified workspace feels like software the user already knows.
