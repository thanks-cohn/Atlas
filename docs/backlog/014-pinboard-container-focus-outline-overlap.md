# 014 — Board container outline touches/crosses card edges

**Status:** Source styling adjusted; owner Chrome screenshot verification pending.
**Reported:** 2026-10-19 America/Chicago.

Owner screenshot image(20261019-112427).png shows a light rectangular perimeter
nearly flush with the first/last masonry cards. Owner wants container borders
outside child edges, with a small visible separation.

Source: virtual-window eviction can focus the tabindex-enabled #pins container.
It had no explicit outline offset. Inference: the visible perimeter is its browser
focus outline; no computed-style browser trace was obtained. Don't assert a
measured masonry-width defect or clip image/content to conceal it.

Added explicit #pins focus/focus-visible outlines with 6px outward offset and a
small radius. Preserves keyboard focus indication, card coordinates, windowing
and child content. Actual Chrome focus/scroll/light/dark verification is needed
to confirm this resolves the exact pictured perimeter and no other boundary is
involved. Leave acceptance pending until that evidence exists.
