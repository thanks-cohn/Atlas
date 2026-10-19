# 010 — Keep programmatic current tags fresh after manual changes

**Status:** Backlog — source inspection; unresolved limitation.

current_tags in atlas-image-tagging-checkpoints-v1 is the complete deduplicated
presentation at the last generation checkpoint. It is currently written by the
generation save path; later manual add/remove, source visibility change or legacy
image-entry migration can make it stale relative to live card presentation.
Do not describe it as an always-live authoritative view. Preserve immutable dated
checkpoints and update a separate current projection through shared tag resolution
on every relevant mutation, or expose an explicit live resolver. Include human
labels, suppression, Anime gating and image identity; avoid inference on reads.
Test manual add, X removal, visibility toggles, image replacement/recovery and
migration, including no duplicate checkpoint on unchanged state. This is separate
from persisting in-flight inference jobs (007).
