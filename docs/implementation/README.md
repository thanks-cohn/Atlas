# Implemented behavior and verification

This directory records what exists in source, why it exists, its observable
behavior, and the evidence actually obtained. It is not a blanket claim that every
feature has passed real-browser, owner-hardware or production acceptance.
Research/proposals in this directory must keep their own status explicit.

| Implemented area | Behavior record | Evidence boundary |
| --- | --- | --- |
| Automatic bookmark cover fetching and sticky retries | [Automatic viewport covers](AUTOMATIC_VIEWPORT_COVERS.md) | Implemented; focused API/DOM-double suites pass; actual Chrome network acceptance pending |
| Immediate pin preview and independent media | [Immediate preview](INSTANT_PIN_PREVIEW.md) | Delayed-setup/media-state tests pass; owner Chrome visual/latency acceptance pending |
| One file explorer sidebar entry | [Single entry point](EXPLORER_SINGLE_ENTRY_POINT.md) | Implemented; focused tests pass; Chrome visual acceptance pending |
| Reduced Windows tagging candidate | [Windows trial](RICH_TAGGING_WINDOWS_TRIAL.md) | Hosted frozen/installed Windows checks passed; owner hardware acceptance is separate |

For historical execution results, read
[Status and continuation](../forever-works/STATUS_AND_CONTINUATION.md). For unfinished
work, use [the backlog](../backlog/README.md). Keep implementation, tests, owner
observations and future intent separate when adding entries here.
