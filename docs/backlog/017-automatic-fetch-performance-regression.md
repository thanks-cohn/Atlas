# 017 — Reported stutter after automatic cover fetching

**Status:** Automatic/retry rework reverted; root-cause latency diagnosis unresolved.
**Reported:** 2026-10-19 America/Chicago.

Owner reports lag/stalls/stutter since fetch rework and asks to revert it and add
an agent performance surface. No owner trace establishes causation. Reverted manual
fetch module/test to2cb4694 and restored manual UI; preserved preview/startup fixes
and existing user data. Historical automatic specification is retained as reverted.

Added opt-in bounded page-local atlasDebug.performance API for long tasks, event
queue/handler timing, frame gaps, timer drift, layout shifts, coarse resource timing,
source spans and mounted/loading DOM counts. Real Escape diagnosis remains016,
now explicitly unresolved after a continued report at about90MB memory usage.
Memory figure alone cannot identify timing cause. Default profiler is inactive;
all captures have deadline/cleanup and omit content/URLs. See PERFORMANCE_DEBUG_API.

Close only after real Chrome before/after/reproduction traces, no unsolicited
fetching, and acceptable measured scrolling/preview/Escape/startup behavior. API
unit tests and mock no-await close assertions are not measured latency evidence.
