# 015 — Blank pinboard until slow metadata finishes

**Status:** Implemented; owner Chrome timing/visual acceptance pending.
**Reported:** 2026-10-19 America/Chicago.

Owner reports blank blue canvas for roughly10 seconds, then cards appear together.
Source confirms refresh awaited saved covers, authored/gallery storage, companion
catalog and generated-tag indexing before render. Owner delay was not profiled;
this confirms a serial rendering barrier, not every possible latency source.

Changed refresh to render correctly scoped bookmark structure first, with clickable
Atlas placeholders for unresolved saved covers. Load saved covers/galleries next,
then companion associations and generated labels. Automatic network cover work
is gated while saved local cover ownership is unknown; opening a provisional card
shows cached connections immediately but gallery migration waits for saved assets,
avoiding an empty migration masking an existing cover. Existing With images/With
tags filters remain authoritative and may legitimately wait for their metadata.
Saved board collection resolves before first paint; do not flash unrelated folders.

Regression stalls cover storage and companion API separately, asserting mounted
cards exist at both stages. Existing pinboard and title tests pass. Actual Chrome
paint timing/slow disk/large profile/companion-offline acceptance remains pending.
