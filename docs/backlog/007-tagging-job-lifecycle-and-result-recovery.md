# 007 — Tagging stalls and results disappear after leaving a card

**Status:** Backlog — confirmed owner report; unresolved.
**Reported:** 2026-10-19 America/Chicago.

Generate tags, leave/close the card while inference is active, return later: labels
may be absent and a retry reports TAG_BUSY. Existing saved-tag reopening tests pass
in DOM/API doubles, but do not prove in-flight page-exit recovery in real Chrome.

Owner metrics show RAM++ success in 62.9–77.0 seconds (9 labels), People timeouts
at 109.1/109.2 seconds, and successful People runs in 72.1–97.2 seconds (6 labels).
TAG_BUSY at 07:05:06/13 UTC precedes People success at 07:05:57 UTC: a live original
job explains those busy responses; permanently stuck lock is not established.

Source: card generateModels awaits a background HTTP response before browser save;
helper tagging.run records private evidence independently. Browser HTTP timeout is
120 seconds; worker timeout 105 seconds plus cleanup. Page/worker interruption can
separate helper completion from browser attachment. Exact owner failure path is
not yet reproduced. Model loading/resource pressure are hypotheses for slow runs.

Implement durable, authorized item/image-bound job identity, bounded status/result
retrieval, idempotent attachment and restart/interruption outcomes. Persist pending
intent before dispatch, recover without rerunning when returning, distinguish live,
failed and timed-out states, preserve partial model success and explicit removals.
Do not silently rerun or merely increase timeouts. Retain consent/origin boundaries,
JoyTag gating and original evidence; never kill arbitrary named processes.

Close only after real Chrome tests: leave during each model; close page/browser;
reopen; recover exact result once; helper restart; timeout; duplicate retry; image
replacement/removal; partial batch failure; slow owner hardware. Record CPU/RAM and
phase timing separately. No fix shipped for recoverable jobs as of this entry.

Starting points: extension/pinboard-generation.js, pinboard.js, background.js;
src/atlas_companion/tagging.py, tag_process.py, tag_provenance.py, server.py.
