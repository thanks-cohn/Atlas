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

The existing **2 MiB read limit** remains. Most full songs/videos and some images
or PDFs exceed it and will report the existing size error. This addition does not
claim streaming or unrestricted media preview. Future document scrolling and
larger authenticated bounded media access are separate increments, not silently
solved by increasing memory limits. Current text may scroll within its existing
preview; broader document navigation remains a roadmap request.

Canonical requirement: `capability.preview-navigation`; rationale:
`decision.preview-continuity`. Keep future proof linked to these IDs and record
PASS, FAIL, UNKNOWN or NOT_RUN rather than treating the owner's desired
experience as evidence that every file type already works.
