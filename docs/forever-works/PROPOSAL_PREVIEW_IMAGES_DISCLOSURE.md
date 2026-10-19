# Proposal — Images disclosure alongside Notes and Bookmarks

Status: owner-directed future advancement, NOT IMPLEMENTED by this proposal.

Owner direction (2026-10-19): add an Images dropdown/disclosure alongside Notes
and Bookmarks in the card pop-out. Expanded content scrolls vertically so the same
interaction works on phones and smaller screens. Preserve the existing Notes and
Bookmarks sections and their connected content.

Owner clarification: the Images section initially presents a large rectangular
add tile with a centered plus sign, similar to the Notes add affordance. The tile
belongs to the vertically scrolling content: scrolling down moves it out of view;
scrolling back up reveals it again. It is not sticky, fixed or a floating overlay.
Keep its rectangle responsive to the available section width.

Owner clarification: clicking the plus opens an image-add/upload prompt with the
exact same visual design and interaction presentation as the existing Add Image
prompt in the pop-out. Different underlying wiring is allowed; it must not create
a second, visually inconsistent chooser. Prefer sharing the existing dialog/view
with a context-specific submit callback; preserve upload and image-URL affordances
and existing validation/feedback. Shared presentation does not imply shared gallery
storage, default-cover changes or automatic attachment semantics. Those remain
implementation decisions after the Images relationship is defined.

Proposed acceptance details (agent interpretation, not additional owner decisions):

- Collapsed Images control uses the existing disclosure language and reports its
  expanded state. Controls can wrap cleanly on narrow screens rather than overflow.
- Expanded Images content has a bounded, vertically scrollable area; no hover-only
  access. Touch, keyboard and screen reader operation should be supported.
- Retain the card's usable title, close action and other section controls; avoid
  allowing the image list to expand the entire pop-out beyond the viewport.
- Reuse lazy/windowed thumbnail loading for large collections. Hidden sections
  must not eagerly load every full-resolution image.
- Define the relationship between this section and the existing per-card image
  gallery/default star before implementation. Do not invent automatic attachment
  discovery, duplicate image storage, sharing or deletion semantics.

Open: whether Images lists this card's gallery entries, explicitly connected image
objects, or both; thumbnail layout, add/link actions and larger-image navigation.
The requested section/vertical scrolling is accepted intent; these details remain
unresolved and should preserve existing data and gallery behavior when implemented.
