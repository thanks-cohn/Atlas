# Implemented behavior and verification

This directory records what exists in source, why it exists, its observable
behavior, and the evidence actually obtained. It is not a blanket claim that every
feature has passed real-browser, owner-hardware or production acceptance.
Research/proposals in this directory must keep their own status explicit.

| Implemented area | Behavior record | Evidence boundary |
| --- | --- | --- |
| Automatic bookmark cover fetching and sticky retries | [Automatic viewport covers](AUTOMATIC_VIEWPORT_COVERS.md) | REVERTED on performance report; preserved as historical behavior |
| Immediate pin preview and independent media | [Immediate preview](INSTANT_PIN_PREVIEW.md) | Delayed-setup/media-state tests pass; owner Chrome visual/latency acceptance pending |
| Performance debug API and manual Fetch restoration | [Performance debug surface](PERFORMANCE_DEBUG_API.md) | Opt-in API contract tested; actual Chrome responsiveness/root cause unresolved |
| One file explorer sidebar entry | [Single entry point](EXPLORER_SINGLE_ENTRY_POINT.md) | Implemented; focused tests pass; Chrome visual acceptance pending |
| Reduced Windows tagging candidate | [Windows trial](RICH_TAGGING_WINDOWS_TRIAL.md) | Hosted frozen/installed Windows checks passed; owner hardware acceptance is separate |

For historical execution results, read
[Status and continuation](../forever-works/STATUS_AND_CONTINUATION.md). For unfinished
work, use [the backlog](../backlog/README.md). Keep implementation, tests, owner
observations and future intent separate when adding entries here.

- [Pinboard scroll performance and autonomous reproduction](PINBOARD_SCROLL_PERFORMANCE.md): indexed viewport selection, numeric work/phase diagnostics, repeatable stress scenario and isolated Chromium runner. Real-browser execution blocked in the current environment; owner acceptance open.
