# Card Section flow and Images

Owner-directed refinement of the shared Pinboard Card pop-out, based on main 2d49260. Fixed obligations: retain all existing connection editors, tags, toggles, gallery navigation/default/removal/Recovery and content adapters. This change does not edit Workspace Dashboard source or native authority. It extends the existing Card-local organizational sidecar rather than creating another content model.

## Ordered organization

Notes, Bookmarks and Images share `card-sections.js` and `card-section-controls.js`. The header offers sorting and far-right + Section. Naming/renaming uses the existing modal with searchable A–Z shared names. Centered lightweight divider headings replace boxed Section cards. Each item and divider has native keyboard-focusable up/down buttons; there are no item Section selectors.

An arrow swaps two adjacent tokens in the currently displayed flow. Membership is then derived from the closest preceding divider. Above the first divider means unsectioned. Moving a divider across an item deliberately changes that item's membership; moving it across another divider changes the intervening range. These are explicit human organization actions, never content copies. Removing a divider retains all content and returns its members to unsectioned. First/last arrows disable at list boundaries.

A–Z is the initial default; Z–A reverses labels; Date orders Section creation oldest first; Recent orders Section rename/creation newest first. These sort entire Section groups and never rewrite membership or manual item ordering. Unsectioned items remain first. Arrow use establishes Manual order (shown as an additional current-state option); choosing a named sort resumes grouped sorting. Items inside each Section retain their manual relative order. Equal sort keys use stable array order.

Additive version-1 fields: `sorts[area]`, `orders[JSON.stringify([context,area])]` containing `{section:id}` or `{item:existingReference}` tokens; optional Section `updatedAt`. Missing fields preserve old data. Memberships remain authoritative; old/stale ordering references do not create or delete content. Context migration now preserves ordering too. Legacy first-image materialization maps the Images `legacy` reference to the existing newly materialized image entry ID. No destructive migration or global name rename occurs.

Each Card owns local Section IDs. Shared name IDs are vocabulary only. Existing same-name reuse within one Card/area continues to select that local instance; another Card always gets its own instance. Cross-owner/area IDs are rejected. Mutation/history/registry writes use the existing lock and atomic storage write. Sections store references, not content payloads.

## Images

The third exclusive area uses the existing parent gallery entries, not copied images. It remains a two-column grid with 7px gaps, a bounded 420px vertical scroll region, natural image dimensions constrained by column width and no upscale beyond natural width. Images are ordinary non-clickable `img` elements: no new lightbox, focus link or image-opening action. Divider title lines span both columns. Each figure has a small Notes textarea and explicit Save Notes. This is an entry `caption` field, separate from the image's existing richer `notes` list and Card Notes editor. Captions use the gallery transaction, compare the original value to reject stale edits, and record before/after caption evidence. Unsaved image-caption drafts survive organization redraws.

+ Add Images opens the existing chooser. From Computer accepts multiple images; direct URL uses the existing public-URL validation and origin observation. Dropping files on + Add Images uses the same raster/size/hash/entry-add pipeline. Each file commits independently; earlier successes survive later failure and the error explicitly explains partial progress. Existing original-file size and preview storage budgets remain. Gallery arrows, default cover and Recovery are unchanged. Gallery display order is organizational metadata; changing it never changes the default cover or underlying entry IDs.

## Future composition and Library extension point

**From Atlas Library** is documented only. There is no verified provider-neutral picker in this surface. A future picker adapter should return a stable resource/asset ID, provider locator references, provenance and original owner, then create an independent placement ID with its own caption, local order and Section membership. It should reference underlying bytes rather than duplicate them. Atlas Objects/Collections, Pinboards, Projects, local assets and R2/other authorized providers may supply candidates through explicit capability adapters. Name matches must never authorize transfer, deletion, synchronization or merging.

Future compositions should reference Card/Section/item/asset identities and keep composition-specific selection, layout and exclusions separate from source ownership. Research/report citations can reference the originating bookmark and asset provenance; image-text relationships should be explicit associations rather than inferred ownership from a matching label. Papers, decks, websites/Web X, handouts and SUBSTRATE finishing are future consumers, not implemented here. Removing a placement from a composition must not delete the source.

## Verification and limits

Stage 1 was implemented and committed separately at 8d9b252 before Images: store tests cover local name reuse/rename, independent ownership, manual order, boundary membership, unsectioned items, all four sorts without membership mutation, reopen, invalid owner/area and failed writes; existing preview/editor tests pass. Browser regressions were updated to use arrows. Local actual Chrome execution was attempted but no executable exists; Playwright browser download returned invalid archives. Stage 1 visual acceptance therefore remains NOT_RUN locally.

Stage 2 tests extend those contracts to Images identity migration, area rejection, non-clickable figures, caption save arguments/repeated edits and multi-file drops. Existing image-entry/Recovery tests cover provenance, default cover, atomic failure and independent gallery persistence. The full Pinboard contract exercises existing ingestion. Browser CI additionally checks mixed-aspect two-column geometry and non-clickability at a narrow viewport. Hosted results must be recorded separately; source/test existence is not browser proof.

Installed MV3/native/Windows, real local file dialogs, physical screen reader/touch and large-library performance remain separate acceptance gates. The current environment retains the prior native-bootstrap/supervisor failures; see the status ledger for exact results. No full-suite or normative Forever Works conformance claim is made.
