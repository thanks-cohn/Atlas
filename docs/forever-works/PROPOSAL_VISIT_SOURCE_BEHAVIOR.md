# Visit source behavior — split view or separate tab

**Status:** Extension trial implementation — API-double tests passed; real Chrome 155 layout verification pending.
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

## Implementation and requested scenario — 2026-10-19

Primary sources checked:
- https://developer.chrome.com/blog/split-view-api-extensions?hl=en
- https://developer.chrome.com/docs/extensions/reference/api/tabs
- https://developer.chrome.com/docs/extensions/reference/api/sidePanel

Official docs specify Chrome 155+ tabs.create splitWithTabId and current tab index
for source-on-left placement. No new manifest permission is needed. The shelf is
not a third split tab: it remains the global side panel, outside the two-tab main
content split. Source and pinboard divide the remaining width. Chrome controls
shelf alignment and divider sizes; this feature neither moves nor reopens it.
With a left-aligned shelf the order is shelf/source/pinboard; with a right-aligned
shelf it is source/pinboard/shelf. This is the API-derived intended layout, not a
recorded actual Chrome screenshot. No iframe or source-page injection is used.

Board menu → Board settings → Visit source stores one preference across pinboards.
Default is separate tab. Split mode uses the actual pinboard tab (not a guessed
active tab) and creates the source at that tab's index. The original pinboard/card
is not navigated, duplicated or closed. An owned paired source is reused for later
clicks during this page session. Existing unrelated splits are left intact and
fall back to a separate tab; after a page reload an untracked existing split also
falls back rather than taking over a user-managed partner. Modifier clicks retain
normal browser link behavior. API rejection/missing support opens one normal tab
and reports fallback in the card status. Browser failure can still prevent opening;
that is reported and not described as successful navigation.

Implementation: extension/source-navigation.js, pinboard.js and pinboard.html.
Tests: scripts/test_source_navigation.mjs and pinboard suite PASS; extension package
build and whitespace checks PASS. API doubles exercise the three-context scenario,
left index/window/opener, card/shelf preservation, reuse/closed partner, unavailable,
rejected/ignored split, unrelated existing split, invalid URLs and Settings/modifiers.
No local Chrome executable is installed in this workspace: real browser 155 split,
global shelf persistence and responsive/keyboard/visual QA remain NOT_RUN. Owner
trial on the already installed Chrome must confirm those gates. Helper unchanged.
