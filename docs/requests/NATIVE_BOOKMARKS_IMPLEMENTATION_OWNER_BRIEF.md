# Atlas — Native Bookmarks Explorer & Universal Resource Grouping
## Implementation Request — First-Class Bookmark Integration

### Objective

Extend the existing Atlas browser extension to expose the user's native browser bookmarks through a fully functional, file-explorer-style interface inside the Atlas right-click shelf.

The bookmarks must also become first-class resources within Atlas's standardized content model, capable of participating in collections, nested groupings, annotations, relationships, and eventually website publications.

**The immediate priority is making native bookmarks accessible, navigable, editable, and reusable throughout Atlas.**

Do not build a separate bookmark manager, replace Chrome's bookmark system, or require users to open a separate extension page.

The existing Atlas shelf is our primary workspace.

---

## 1. Fundamental Architectural Principles

The implementation must preserve three distinct concepts:

**A. Membership — Availability**

When an object belongs to an Atlas grouping, that object becomes accessible as a resource within the grouping.

Membership alone does not imply:

- That the object is displayed.
- That it is paired with another object.
- That it has a particular semantic relationship.
- That it must appear in a future website or page.
- That it occupies a specific position in a presentation.

A grouping is fundamentally an organized pool of available resources.

**B. Relationships — Explicit Meaning**

A user may explicitly connect resources, establishing an association between them.

For example:

- A note describes an image.
- A bookmark provides a source for a document.
- An image illustrates an article.
- Two bookmarks are related for a user-defined reason.

Relationships may have their own types, notes, tags, provenance, and privacy metadata.

**C. Presentation — Selective Arrangement**

A presentation chooses which resources from the available grouping should appear and how they should be arranged.

Removing a bookmark, image, note, or document from a presentation must not automatically remove that object from the source grouping or delete its relationships.

These three concepts must remain independent throughout the architecture.

**Core invariant: Membership grants access. Relationships establish meaning. Presentation determines appearance.**

---

## 2. Native Chrome Bookmarks Integration

Use Chrome's supported `chrome.bookmarks` API and appropriate extension permissions.

Implement:

- Reading the full available native bookmark tree.
- Displaying folders, nested folders, and individual bookmarks.
- Preserving native hierarchy and bookmark ordering.
- Creating, renaming, editing, moving, copying, and deleting bookmarks using appropriate browser APIs and operations.
- Folder expansion and collapse.
- Familiar drag-and-drop management.
- Keyboard navigation and selection.
- Context menus.
- Search by bookmark title and URL.
- Favicon display where available.
- Synchronization using native bookmark change events.

Do not silently modify the user's existing bookmark hierarchy.

Atlas annotations must not overwrite the browser's native bookmark metadata unless the user explicitly chooses to edit the native bookmark.

Treat browser bookmarks as externally managed resources rather than blindly duplicating their entire contents.

---

## 3. Dedicated Bookmarks Explorer Tab

Introduce a **Bookmarks** tab within Atlas's existing shelf interface.

It should resemble a conventional file explorer and reuse existing Atlas explorer components and conventions where possible.

Expected hierarchy:

- Bookmarks Bar
- Other Bookmarks
- Mobile Bookmarks, where supported
- User-created folders
- Nested subfolders
- Individual bookmarks

Support breadcrumbs, folder navigation, expandable trees, familiar selection behavior, search, and contextual operations.

Preserve native order by default.

Alternative visual sorting should not unexpectedly reorder native Chrome bookmarks.

The interface must remain usable inside the compact right-click shelf while adapting to wider or future mobile-oriented layouts.

Do not require users to navigate to the extension's full-page interface for ordinary bookmark operations.

---

## 4. Every Bookmark Is an Atlas Resource

Each browser bookmark should be addressable through Atlas's standardized object model.

A bookmark may independently possess:

- A native URL and title.
- An Atlas-specific display title.
- Description and appended text.
- Multiple notes.
- Multiple tags.
- Linked images.
- Linked documents.
- Linked videos and other supported files.
- References to other bookmarks.
- Explicit relationships to other Atlas resources.
- Membership in one or more Atlas groupings.
- Privacy and provenance information.

A bookmark's Atlas annotations must remain independent of its native Chrome bookmark record.

Notes, images, documents, and other linked resources must also be independently addressable objects with their own annotations, tags, relationships, and grouping memberships.

For example, a bookmark may contain an accessible image that itself has notes, tags, links, and associated documents.

Do not flatten such objects into unstructured strings or attachments that cannot be independently referenced.

---

## 5. Universal Resource Groupings

Introduce or extend a reusable grouping abstraction compatible with Atlas's existing schema.

A grouping may contain:

- Bookmarks
- Images
- Notes
- Documents
- Videos
- Arbitrary supported files
- Other Atlas objects
- Nested groupings

Objects may belong to multiple groupings without requiring duplicate underlying resources.

Groups may contain other groups, permitting hierarchies of arbitrary practical depth, subject to cycle prevention and resource limits.

**Critical distinction:** Adding a bookmark, note, document, or image to a grouping only makes it available within that grouping.

It does not automatically pair it with another item or place it on a page.

A user must explicitly create a relationship or choose a presentation arrangement for those meanings to exist.

Preserve the user's ability to arrange groupings intentionally, including naming, ordering, nesting, and annotation.

Groupings must themselves support descriptions, notes, tags, relationships, and privacy metadata.

---

## 6. Attaching and Linking Resources

Within a bookmark's Atlas detail view, provide an approachable means of adding existing or new resources.

For example:

**Bookmark → Add Resource**

The user should be able to select an image, note, document, another bookmark, or an existing Atlas grouping.

Clearly distinguish between these actions:

- **Add to grouping:** Makes the object accessible within that grouping.
- **Create relationship:** Explicitly connects two objects.
- **Attach as a defined association:** Creates an appropriate typed relationship, where supported.

A user should also be able to remove an object from a grouping without deleting the object from Atlas or Chrome.

Where the distinction might be ambiguous, use clear labels and non-destructive defaults.

Do not automatically infer that an image explains a note, or that a bookmark serves as a source, simply because the objects share membership.

---

## 7. Future Page and Project Composition

The grouping model must support future functionality such as:

**Create Project from Bookmark**

**Create Page from Grouping**

**Create Section from Selected Resources**

For example:

A bookmark may contain a grouping consisting of several nested groups.

Later, the user could create a project page from that bookmark, choose particular nested groups as sections, and select which resources appear inside each section.

An image could appear with text beside or beneath it and visually arranged bookmark links underneath.

Multiple images might instead appear as a horizontal gallery, with optional image-specific notes and bookmarks displayed when an image becomes active.

However, these are future presentation capabilities.

**Do not implement the full website builder as part of this task unless the necessary infrastructure already exists and integration is straightforward.**

For this task, establish the stable resource identities, grouping references, relationship types, and interfaces needed for those later capabilities.

Document extension points instead of constructing speculative, disconnected scaffolding.

---

## 8. Shelf Navigation and Creation

The Atlas shelf must provide persistent access to the user's library and organizational structures.

Include navigation for:

- Native browser bookmarks
- Atlas collections and categories
- Galleries
- Projects
- Articles and pages
- Liquid canvases, as supported by the existing project

A creation dropdown should permit users to create new Atlas objects and groupings.

Newly created galleries, projects, or collections must immediately appear in the appropriate navigation area.

Users should be able to assign existing bookmarks to Atlas groupings without moving them from their original Chrome folders.

Avoid duplicate navigation systems and unnecessarily complex interfaces.

Reuse existing Atlas state, navigation, and presentation components.

---

## 9. Standardized Data Model and Exportability

Use stable Atlas-owned object identifiers.

Preserve native Chrome bookmark identifiers as external references, not as universal identifiers of Atlas objects.

Native bookmark IDs may change across browser profiles, exports, or reimports.

The model should support reconciliation and recovery without silently creating duplicates or losing annotations.

Keep separate records for:

1. Resources and their own metadata.
2. Group membership.
3. Explicit relationships.
4. Presentation definitions.
5. Publication eligibility and privacy.

A grouping should reference resources by stable ID rather than embedding duplicate copies of every object.

Ensure the schema can be exported as documented, interoperable JSON and reconstructed without depending on undocumented internal state.

Support future publications combining pinboards, articles, projects, and Liquid pages from shared groupings.

**Never assume that group membership implies permission to publish an object.**

Private notes, bookmarks, local file references, and other private resources must remain excluded unless explicitly approved for publication.

---

## 10. Performance and Reliability

Optimize for modest hardware, including 4 GB systems, while permitting configurable limits for more powerful computers.

Requirements:

- Lazy-render long lists.
- Virtualize large bookmark directories where beneficial.
- Avoid creating DOM elements for the entire bookmark tree unnecessarily.
- Cache navigation state responsibly.
- Handle Chrome extension service-worker restarts.
- Preserve navigation and selection state where practical.
- Detect native bookmark modifications.
- Avoid duplicate synchronization.
- Handle missing favicons and unavailable resources gracefully.
- Provide meaningful diagnostic codes for failures.
- Do not block editing of Atlas resources when external services are unavailable.

Follow established browser-extension practices.

For future image-heavy galleries, preserve the intended default of seven visible images per row, centered on the last-viewed image with three neighbors on either side, and adjustable performance settings. This is a compatibility constraint for future presentation work, not a request to build the gallery renderer now.

---

## 11. Implementation and Documentation

Inspect the current Atlas repository before modifying it.

Determine what already exists for bookmarks, catalogs, tags, notes, file handling, navigation, storage, relationships, and diagnostics.

Reuse those systems wherever possible.

Do not introduce competing object schemas, duplicate storage abstractions, or a second standalone bookmark system.

Implement real, working integration rather than visual scaffolding.

Document:

- Public interfaces and data contracts.
- Browser API permissions.
- Native-to-Atlas identity mapping.
- Resource and grouping schemas.
- Relationship semantics.
- Privacy and export behavior.
- Error codes and recovery behavior.
- Future page-composition integration points.

Follow Forever Works documentation principles so another agent can understand, verify, maintain, and reconstruct this subsystem independently.

Include automated tests covering bookmark discovery, nested navigation, modifications, synchronization, grouping membership, annotation preservation, resource removal, restart recovery, and import/export integrity.

---

## 12. Acceptance Criteria

The feature is complete when a user can:

1. Open Atlas's existing right-click shelf.
2. Select the Bookmarks tab.
3. Browse and manage their actual Chrome bookmarks using familiar file-explorer conventions.
4. Open a bookmark's Atlas detail view.
5. Add notes, tags, descriptions, images, documents, and other accessible resources.
6. Create and manage groupings containing multiple kinds of resources.
7. Place the same resource into multiple groupings without duplicating the underlying object.
8. Establish explicit relationships between resources where desired.
9. Remove resources from groupings without deleting the originals.
10. Create or select Atlas collections and immediately see them in shelf navigation.
11. Export and reimport the standardized Atlas metadata without losing grouping structure or relationships.
12. Continue ordinary work without needing Cloudflare, GitHub, or another publishing provider.

Preserve existing Atlas functionality, styling conventions, and performance.

### Final instruction

Prioritize native bookmark accessibility, stable object identity, reusable resource grouping, and non-destructive annotations.

Do not attempt to complete the entire future publishing system in this run.

However, ensure this implementation gives that system a stable, documented foundation.

**Guiding principles:**

- Native functionality, Atlas presentation.
- Membership grants access.
- Relationships establish meaning.
- Presentation determines appearance.
- Publication is explicit.
- User data and organizational structure remain portable.

The intended result is an Atlas bookmark explorer that works beautifully today and supports progressively richer collections, compositions, and websites tomorrow.