# Card tag recommendations — initial research, 2026-10-19

Owner direction: remove the misleading Faces control; preserve Things, People,
and Settings-activated Anime/JoyTag. Begin investigating tag recommendations for
cards. This document proposes a direction; no recommendation UI is shipped here.

## First candidate: local association ranking without new model weights

Recommend existing vocabulary labels used on similar cards, using deduplicated
current tags and explicit card relationships. Rank tag overlap with inverse
frequency weighting and tag co-occurrence. Exclude the current card, duplicate
image entries, already attached labels, explicitly removed tags, recovery entries,
and inaccessible/private scopes. Count unique cards, never model executions, so
repeated inference does not inflate recommendation support. Explain suggestions
with supporting cards/shared tags. Treat sparse libraries as a cold-start case;
return no suggestion rather than manufacture evidence. Accept/reject is explicit;
recommendations never automatically become human tags or model observations.

This fits the owner's storage constraints and establishes an explainable baseline.
It can suggest existing tags; it cannot infer genuinely new visual concepts.

## Optional semantic candidate

Evaluate sentence-transformers/all-MiniLM-L6-v2 for semantic similarity of card
text (title, notes, existing tags) and tag descriptions. The publisher describes
384-dimensional vectors and 22.7M parameters, with ONNX exports. This is a text
embedding model, not a photo tagger or a calibrated tag relevance probability.
Compare it against the association baseline before adding downloads. Use optional
local inference and cached vectors; no cloud upload requirement.

Primary sources checked:
- https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- https://www.sbert.net/docs/sentence_transformer/usage/efficiency.html
- https://www.sbert.net/docs/sentence_transformer/pretrained_models.html

Before implementation: measure top-k accepted/rejected recommendations on a held-out
owner-labelled card sample; test cold start, negative feedback, duplicate suppression,
source provenance, bounded latency/memory, and data changes after manual edits. Keep
recommended tags distinct from recommendations of other cards based on shared tags;
both may reuse an index, but they are different user actions.
