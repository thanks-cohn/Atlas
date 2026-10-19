# Investigation backlog

Problems and investigations we intend to tackle but have not reached yet. This is the shared queue for future work, including suspected bugs, cleanup, reliability and design questions—not only confirmed defects.

| Number | Item | Status |
| --- | --- | --- |
| 001 | [Audit remnants of the retired tag-selection system](001-retired-tag-system-audit.md) | Backlog — not started |
| 002 | [Note editor has no title field](002-note-title-entry.md) | Backlog — not started |
| 003 | [Saved notes cannot be deleted](003-delete-saved-notes.md) | Backlog — not started |
| 004 | [Linked bookmark preview misses an existing saved image](004-linked-bookmark-preview-missing-cover.md) | Backlog — not started |

| 005 | [Extensible tag model companion proposal](005-extensible-tag-model-companion-proposal.md) | Backlog |
| 006 | [Compact expandable recovery history](006-recovery-history-compact-expandable-rows.md) | Backlog |
| 007 | [Tagging stalls and results disappear after leaving a card](007-tagging-job-lifecycle-and-result-recovery.md) | Backlog — unresolved |
| 008 | [People reports an unexplained extra subject](008-people-extra-subject-and-count-inspection.md) | Backlog — unresolved |
| 009 | [Audit one authoritative pinboard name](009-pinboard-title-single-source-audit.md) | Backlog — unresolved |
| 010 | [Keep programmatic current tags fresh after manual changes](010-current-tag-checkpoint-freshness.md) | Backlog — unresolved |

| 011 | [Add Image does not update count or navigation](011-add-image-count-and-navigation-regression.md) | Backlog — unresolved |

| 012 | [Catalog and relationship management crowds the shelf](012-catalog-relationships-crowd-shelf.md) | Implemented — shelf shortcut removed; Chrome confirmation pending |

| 013 | [Pin preview waits for gallery setup](013-pin-preview-blocked-by-gallery-setup.md) | Implemented — Chrome confirmation pending |
| 014 | [Container outline overlaps card edges](014-pinboard-container-focus-outline-overlap.md) | Styling adjusted — Chrome verification pending |

| 015 | [Pinboard first render waits for metadata](015-pinboard-startup-waits-for-metadata.md) | Implemented — Chrome timing confirmation pending |
| 016 | [Escape delays return from preview](016-escape-preview-return-delay.md) | Unresolved — continued Escape lag; profiling required |

| 017 | [Stutter after automatic Fetch rework](017-automatic-fetch-performance-regression.md) | Reverted — latency root cause unresolved |

## Adding an item

Use the next unused number (`002`, `003`, …) and a descriptive filename. Keep numbers stable when items are reordered or completed. Add the item to this index.

Each item should state the problem or question, why it matters, observed evidence versus suspicions, investigation scope, constraints, and what evidence is required to close it. Use **Backlog**, **In progress**, **Blocked**, or **Done**; preserve completed items and their results for future agents. A backlog entry records unfinished work, not a claim that the work has been investigated or fixed.

## Unfinished issue reporting

Owner direction (2026-10-19): when an issue is observed or discovered but not fixed,
record it here before ending work. Separate evidence from hypotheses, state what
remains unresolved, and give reproduction/closure criteria. Mentioning an issue
in conversation or testing a nearby path is not a fix. Keep this index current.

- [018 — Fast-scroll stalls and missed clicks](018-fast-scroll-missed-clicks.md): indexed window selection and improved agent diagnostics implemented; real-browser acceptance open.

- [019 — Anime choice flicker](019-anime-choice-flicker.md): per-card refresh hide/show removed and stale reads guarded; browser acceptance pending.

- [020 — Progressive Pinterest cards and two-row viewport window](020-progressive-cards-and-two-row-window.md): owner requests tiny batches (e.g.1,+2,+2), aesthetic progressive masonry population, and no ongoing distant-card work; later one-row source bound implemented, tiny startup batches pending.

- [021 — Generated-index churn on preview browsing](021-generated-index-churn-on-preview.md): owner soak evidence, empty-record hashing and repeated state/chooser work corrected; browser acceptance pending.
