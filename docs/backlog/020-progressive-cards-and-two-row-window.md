# Progressive card population with a tight viewport window

Status: owner-directed requirement/proposal; NOT IMPLEMENTED in this update.
Owner explicitly asks to write this down and preserve Pinterest presentation.

Owner reports continued severe lag despite earlier source optimizations. Do not
mark the responsiveness issue resolved based on Node tests or prior commits.

## Owner requirements

- Start with a very small visible batch, so opening a pinboard visibly makes progress
  instead of showing a blank page until the larger population finishes. Owner first
  suggested3–4 cards, then refined the pacing example to one card, then two more,
  then two more. These counts illustrate the desired progressive feel rather than
  mandating an exact fixed sequence. Users see image-loading placeholders inside
  the arriving cards while waiting; images resolve independently as the visible
  composition fills. Preserve the same theme-colored loading glyph throughout.
- Continue populating progressively, aesthetically like Pinterest. Preserve the
  existing masonry composition, card styling, spacing and responsive appearance.
  This is a loading/work-scheduling change, not a replacement layout or plain list.
- Keep active cards/images near the viewport: roughly two rows above and two rows
  below. Cards farther away should not remain mounted or consume ongoing rendering,
  image-loading or repeated update work merely because they exist in the collection.
- The complete collection remains reachable by scrolling. "Load all" means making
  the collection available through progressive/windowed browsing, not eventually
  putting every card/image into the DOM at once.

## Implementation considerations — proposals, not completed behavior

The current nearby-card count can retain more distant neighbors than this requested
row window. Replace that count-driven filling with a strict viewport-relative bound.
For variable-height masonry, define a row-equivalent explicitly (for example up to
two preceding/following cards per column), preserving every actually visible card.
This interpretation needs validation across different card heights and screen sizes.

First show the small batch in the same final masonry positions and yield a paint
opportunity before additional mounting. Avoid global sorts, heavy metadata work or
image decoding before the first small batch appears. Additional work should be
bounded/yielding, coalesced to the latest viewport and stopped for evicted cards.
Do not add arbitrary decorative animation or large transitions as a progress signal.
Retain known geometry to avoid jumps; source/metadata records may remain cached
without retaining offscreen DOM or issuing image requests. A small layout index is
not equivalent to mounting/decoding every card.

Preserve click/preview access, immediate Escape, tag state, held-card semantics,
manual Fetch, existing images/notes/bookmarks and all permission boundaries.
Aesthetic Pinterest population and smooth interaction are acceptance requirements,
not optional polish to discard for a lower DOM count.

## Verification needed before claiming completion

- First paint contains the intended very small batch and occurs before larger work.
- Subsequent small batches visibly fill the masonry composition (e.g.1,+2,+2),
  with in-card image progress while images load; no all-at-once DOM/image burst.
- Later visible cards fill in without a prolonged blank canvas or layout jumps.
- Across tall/short cards and phone/desktop widths, DOM bounds stay at the visible
  area plus at most the agreed two-row allowance on each side.
- Rapid reverse scrolling targets the newest viewport; distant evicted cards do
  not continue scheduling layout/image callbacks or loading every image eagerly.
- Trusted click and Escape input stays responsive after prolonged fast scrolling.
- Agent diagnostics expose initial-batch timing, current viewport/window bounds,
  mounted/evicted/created counts, image activity and main-thread phase durations.
- Obtain real Chrome timing/visual evidence; existing fixture/Node tests alone are
  insufficient proof. Keep018/016 open until their acceptance is demonstrated.

No runtime or stylesheet changes were made for this documentation request.
