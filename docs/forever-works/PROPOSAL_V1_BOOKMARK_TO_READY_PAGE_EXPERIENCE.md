# Proposed Atlas Direction — V1: Bookmarks Become a Ready-to-Edit Webpage

**Status:** Owner-directed proposed product direction (2026-10-20). Not a statement of implemented functionality or an immediate instruction to interrupt ongoing work.

**Vision:** *It all starts with a link.* Atlas must show its value through a near-finished webpage assembled from the user's existing bookmarks—not make users build a blank website. The first experience should feel nearly magical, but be grounded in deterministic templates and existing source material, **without requiring AI**.

## The V1 promise

**Choose one of our beautiful templates → select a handful of visual bookmarks → immediately get an attractive, responsive webpage ready inside the editor → edit your text, tags and positions → save, preview and eventually publish.**

The user should think: **“I already had all this material; Atlas made a page from it.”**

Do not make V1 contingent on implementing the entire future transposable object system, a generic drag-anything editor, AI or full cloud infrastructure. Build the smallest complete vertical slice that visibly demonstrates the concept.

## Exact V1 user experience

1. **Choose template first.** Offer a small, curated set (initially approximately three) of distinctive, polished, responsive Atlas page templates. Each has a meaningful preview, layout behavior and sensible default text placements. A selected template opens a ready-to-go page in the editor, not a blank canvas.
2. **Open bookmark-picker pop-out.** From the editor, click an obvious **Add Bookmarks** action. Present a familiar pop-out/modal showing the user's existing Chrome bookmarks, with folder navigation, search and quick visual selection. This is not a separate complex product.
3. **Visual bookmark gallery.** Display bookmarks as attractive cards in a **scrollable two-column grid** so the user can scroll down and see what they have. Populate each with a title and URL plus a suitable preview/cover image where the site supplies one or an authorized saved cover is available. Use existing favicon/site metadata fallbacks when no usable image can be obtained. Use lazy loading/caching and clear loading/error states; never invent an image, assume full-site screenshot rights, bypass CORS/security, or present unreliable fetching as guaranteed.
4. **Select a handful.** The user simply clicks perhaps **five or six** bookmark cards. Show clear multi-selection, selected count, deselection and one obvious **Add to Page** confirmation. Allow other counts within template capacity where appropriate.
5. **Instant composition.** Atlas inserts the chosen bookmarks into the selected template as **beautifully laid-out cards, slices, image-and-caption sections and/or grouped components**, using templates' placement constraints. Preserve title-as-caption by default, associated URL/link, images and existing relevant tags. Automatically distribute the bookmarks into a visually coherent page. The page should already feel *finished* on first display; no mandatory manual layout labor.
6. **Minimal finishing touches.** Users need mainly to **edit/add text**, **add/remove/edit visible tags**, and **move/reposition elements** if they wish. Optional captions, heading, introduction and text blocks should be obvious and inviting. The user should be able to publish without having to learn advanced web design.

## Repositioning is a major selling point—not an afterthought

The editor should make familiar, reliable spatial editing central:
- Drag/reorder **entire bookmark cards** (including image, title-as-caption, tags and URL relationship) as a coherent unit.
- Move **text blocks** independently of cards where allowed, including introductions, headings, commentary and captions; allow intentional positioning of text *between* or alongside cards.
- Rearrange **slices, sections and groups** within the template's responsive rules. Support straightforward add/remove, duplicate, undo/redo and keyboard-accessible movement.
- Show clear drop targets and meaningful previews before releasing. Prevent accidental selection/scroll interference, unexpected movement and lost content.
- Preserve responsive polish on desktop/mobile when moving blocks; use constrained slots or an art-directed layout engine rather than unconstrained pixel placement that breaks at other viewport sizes. An optional advanced liquid canvas may come later.
- Allow a whole card to move with its associated title/tags, while edits to text and tags are still individually accessible. Do not detach asset provenance or source links accidentally.
- The editor is a **result refinement tool**, not a prerequisite to producing a good first result.

## Technical architecture preserving Atlas's distinctive vision

Atlas is not a generic website builder:
- The **source bookmark remains unchanged**, with stable identity and attribution.
- A **composition** records which bookmark resources were selected and how they were grouped/ordered.
- A **presentation** records which template's Card/Slice/expansion/page forms render those resources.
- Saving the authored webpage creates a **Project** that can be reopened; reusable saved Cards, Slices, pop-outs, expansions, Pages, Pinboards and Projects may have Atlas Object identities as that architecture matures.
- Initial V1 can implement one practical page composition representation and a limited set of reusable presentation templates, while preserving an explicit extension path for the future Objects Library, nested Collections, relationships, recursive components and Transposable Internet.
- Provide a plain, intuitive UI: **Templates → Add Bookmarks → Select → Page Ready → Edit/Arrange → Save/Preview/Publish**.
- Consistent visual polish and responsiveness across screens are acceptance requirements, not optional styling.
- Do not replace existing Shelf/pinboard/bookmark explorer workflows. Use local, portable project saving and established existing infrastructure; do not silently require R2 or a paid account.

## Image capture and safe fallbacks

Image previews are essential to the *demonstration*: do the utmost permitted to use existing saved cover/thumbnail, page metadata (e.g. og:image where fetchable and permitted), or legitimate cached images. Different websites may block metadata/image access. Show an aesthetically designed fallback with title/favicons and allow **Replace Cover**; avoid broken empty media panels. Do not claim every bookmark can supply an image, and don't automatically republish copyrighted images without considering permissions and appropriate source linking.

## Suggested first release acceptance scenario

1. New user with an existing browser bookmark library opens Atlas.
2. Picks one of three attractive templates; ready page loads.
3. Opens Add Bookmarks pop-out, browses a **two-column scrolling gallery** with images/fallbacks and folder navigation.
4. Selects six bookmarks and confirms.
5. Sees an **immediately attractive, coherent, responsive page** containing six composed visual elements with usable title captions, links, and tags where available.
6. Edits the page title/introduction, changes some tags, reorders two entire cards and moves a text block.
7. Saves project, reloads, sees the same composition and edits; previews desktop/mobile and can publish through supported existing flow.
8. Verifies source bookmarks have not been altered; inaccessible images have tasteful fallbacks; keyboard and low-memory performance are acceptable.

## Project boundary and implementation recommendation

Prioritize this **one complete, delightful demonstration** rather than implementing many isolated editors. A page built from bookmarks is the strongest proof of Atlas's object/composition/presentation philosophy. Build underlying contracts in service of the end-to-end experience, document their semantic purposes and reconstruction obligations under Forever Works, and defer unrelated advanced infrastructure until the first journey is reliably excellent.

**Core doctrine:** *Conventional builders give you an empty webpage. Atlas gives you a beautiful webpage made from things you've already saved. You mostly add your own words.*

**Important:** The objective is to enable a convincing V1 experience, not to overpromise universal source conversion, arbitrary website comprehension, or image fetching that current security restrictions do not permit.
