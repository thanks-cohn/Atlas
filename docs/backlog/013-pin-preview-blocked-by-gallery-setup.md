# 013 — Pin preview waits before notes and connected items are accessible

**Status:** Implemented in source; owner Chrome acceptance pending.
**Reported:** 2026-10-19 America/Chicago.

Owner sometimes experiences lag after clicking a pin. Intent is to access notes
and linked items immediately, even if media is slow. Show Atlas branding while
waiting for the image rather than making image readiness a condition for the card.
Source confirms old openDetail awaited ensureImages (storage/migration and possibly
companion associations) before showModal. No measured owner latency trace exists;
this is a verified blocking path, not proof of every possible lag cause.

Change: show modal and cached content synchronously. Existing cached gallery opens
without another initialization wait. Legacy setup proceeds asynchronously with
close/card-request guards. Image loading is independent with Atlas placeholder,
load/error states and stale callback invalidation. During same-card hydration,
keep open connections and move note drafts to the resolved image identity.
Uncached unavailable companion metadata can still be unavailable; don't invent it.

Focused pinboard and preview-sections regressions cover delayed setup before
promise resolution, visible cached connections, close-before-resolution, stale
image callbacks, media errors and draft preservation through hydration. Chrome
perceived latency, image loading and cross-size visual acceptance remain pending.
