# Existing-preview continuity: intent, decisions and proof

## Owner direction and baseline

Before enhancements, preserve **Working v1**, the owner-confirmed working
helper/extension connection and explorer. The separate milestone marker is
[WORKING_V1](../releases/WORKING_V1.md), source
`6d974083daf7379d55d10a0da92a4cf01bf9da1c`. Its field confirmation does not
retroactively verify later preview improvements.

The owner explicitly requests working with the existing preview: Left and Right,
without inventing a wholly new viewer. Once an image/file is open, repeatedly
closing it, locating the next item and reopening it creates avoidable work.
Maintaining the preview lets attention remain on the content. The owner values
comfort, pleasure, elegance and clear, readily understood behavior as functional
quality, not decoration. Preserve this reasoning so later agents need not ask
again why continuity, defaults and small improvements matter.

## Observable contract

- Left moves to the previous eligible file; Right to the next. Buttons provide
  the same action. Follow the current folder's displayed sort and search filter.
- Wrap in both directions. A single eligible file remains itself; no eligible
  files produces an explanation rather than an exception or unrelated file.
- Default sequence includes music/audio, images and videos; excludes directories,
  text, PDFs and unknown types. Text and PDFs can be opted in through persisted
  preview settings. Exclusion from cycling does not hide files from the explorer
  or prevent a deliberate click on them.
- Preserve the existing preview/details layout and folder context. No automatic
  folder recursion, automatic media playback or file mutations are introduced.
- Typing, open dialogs and focused media controls retain their own keyboard
  behavior. Stale asynchronous previews must not replace the newly chosen file.
- All bytes still pass through authenticated, explicitly authorized read access.
  Do not infer that a friendly UI grants more access.

## What may change and what must survive

Fixed: pleasant low-friction browsing, predictable sequence, elegant media
selection by default, explicit inclusion preferences, wraparound and authority.
Constrained: keyboard focus rules, accessible alternative controls, memory bounds,
codec/plugin availability and preview concurrency. Fluid: helper functions,
file extensions used for classification, renderer details and storage mechanism,
provided replacement verification preserves the accepted behavior.

Implementation uses `extension/preview-navigation.js` for selection and
`extension/explorer.js` for existing-preview integration; native read APIs are
unchanged. Text uses textContent; images exclude SVG; audio/video use browser
controls; PDF uses a local Blob iframe, with `frame-src blob:` while retaining
`object-src 'none'`. Navigation eligibility is not proof of browser codec support.

## Evidence and honest limits

`scripts/test_preview_navigation.mjs` checks both wrap directions, sorting input
order, excluded files/directories, text/PDF opt-in, empty/single-file lists,
case-insensitive names and non-mutation of input. Syntax/package checks verify
that the new module is included. These are not rendered Chrome keyboard or media
playback proof. Actual installed Chrome integration, preferences after reload,
PDF plugin behavior and codecs require field verification.

The size policy is now user-configurable: general maximum **30 MiB** by default,
with extension-specific overrides chosen from a dropdown and saved explicitly.
Overrides take precedence over the general maximum, including a larger override.
The current bounded whole-file implementation accepts 0.01–128 MiB in the UI;
128 MiB is an implementation ceiling, not a Chrome limitation. Native providers
validate integer byte limits independently. Settings persist in local extension
storage and apply on the next open. Resetting an extension uses the general value.
The dropdown includes common preview types plus extensions in the current folder.

If file size exceeds the effective limit, show a file-type badge, explain the
limit, and offer "Go to Settings to increase the maximum preview size". Focus the
extension override if present, otherwise the general value. Do not silently load
an oversized file or hide it from Left/Right cycling. The helper independently
bounds reads even if metadata is missing or stale.

Rationale: owners should choose the balance between useful previews and memory
use rather than encounter an unexplained small fixed cap. The size placeholder
turns an apparent failure into an understandable, actionable preference. Preserve
that explanation, precedence and explicit Save interaction across implementations.
Base64, worker messaging and Blob conversion create transient copies; this remains
whole-file preview, not streaming. Large-media streaming and fuller document
scrolling remain future increments. Never describe the 128 MiB ceiling or old
2 MiB cap as a browser-imposed limitation.

Canonical requirement: `capability.preview-navigation`; rationale:
`decision.preview-continuity`. Keep future proof linked to these IDs and record
PASS, FAIL, UNKNOWN or NOT_RUN rather than treating the owner's desired
experience as evidence that every file type already works.
