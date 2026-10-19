# Visit source behavior — split view or separate tab

**Status:** Proposal — owner-approved direction, not implemented.
**Date:** 2026-10-19 (America/Chicago).

## Owner intent

Settings should let the user choose how Visit source opens a card's original URL:

- **Split view:** show the original website on the left and retain Atlas on the
  right, so the user can read the source alongside the card and its annotations.
- **Open source:** keep the existing separate-tab behavior.

Use one saved preference and a shared source-opening action across card source
links. Preserve current separate-tab behavior until the user selects split view.
The preference changes navigation only; it must not change source URLs, card
identity, tags, notes, image selection or running jobs.

## Capability and fallback

Investigate the supported Chrome split-view capability and extension API at
implementation time. A browser UI feature does not establish that an extension
can invoke it or guarantee left/right placement. Detect actual capability, and
fall back to opening a separate tab if split view is unavailable or rejected.
Do not simulate arbitrary websites with an iframe: site framing restrictions,
authentication and navigation make that an unreliable substitute. Do not change
browser security settings to enable the feature.

Keep Settings labels about user-visible outcomes. If fallback occurs, provide a
brief accessible explanation without interrupting navigation. Preserve safe URL
validation, explicit click initiation and existing external-link isolation.

## Acceptance

Verify actual supported Chrome builds: website left/Atlas right, original card
state retained, source navigation works, repeated clicks have predictable reuse,
and preference persists after reload/restart. Verify unsupported/error paths open
one separate source tab without losing Atlas. Test named/default boards, image
entries, valid sources, absent/invalid URLs, keyboard activation and narrow screens.
Document actual browser/API versions, permission changes if any, platform limits
and placement guarantees before claiming support.
