# Proposal: DanbotNL title-to-Danbooru tag adapter (4-bit preferred)

**Status:** Proposed; not implemented or validated  
**Date:** 2026-10-19  
**Scope:** Atlas semantic object recommendations, optional title-only fallback  
**Model candidate:** https://huggingface.co/dartags/DanbotNL-2408-260M  
**Preferred deployment:** Quantized 4-bit ONNX if feasible; no mandatory model download  
**Target:** Under 200 MB model artifact; overall Atlas RAM budget <= 1 GB

## Intent

The user wants a **pretrained**, very small, low-compute translator that transforms a plain natural-language title into Danbooru-style tags, so the existing **tag-only recommendation engine** can find four related objects even if the source has no human/model tags. Avoid manually reimplementing language understanding with a large bespoke parser. No image pixels may be processed.

Conceptual flow:

`object.title -> optional DanbotNL translator -> derived Danbooru tags -> existing tag semantics/recommendation adapter -> four image/object IDs`

This is a **proposal to research and benchmark**, not authorization to ship or claim that a 4-bit ONNX build already exists.

## Approach

1. Examine the DanbotNL-2408-260M model's license, architecture, tokenizer, generation requirements, conversion path, browser-runtime compatibility, and actual output vocabulary.
2. Attempt or evaluate ONNX export with 4-bit weight quantization, measuring *real* artifact size, peak browser RAM, startup latency, single-title CPU latency, and conversion fidelity; estimated 4-bit raw weights are about 130 MB, but overhead and runtime may exceed this. Do **not** report those estimates as measured performance or assume ONNX Runtime Web supports every required operator.
3. If 4-bit ONNX fails, document why and compare alternate quantization/runtimes or a compact vocabulary/alias-based fallback. Do not silently add a 500+ MB mandatory model.
4. Load the translator **only for titles without useful existing tags**, or when explicitly requested; cache results by title text and translator version. Do not run per gallery render or on published visitor pages. Consider optionally using titles as supplemental evidence only after benchmarking.
5. Keep generated tags as **derived, reversible metadata**, never overwriting human-curated tags or outputs of JoyTag/other taggers. Preserve title, model ID/checksum, settings, version, recognized tags, unknown terms, and timestamps.
6. Validate generated tags against the recommendation vocabulary; never presume every DanbotNL output maps into Dart v2 Vectors. Record unmatched tags and graceful fallback. Test negation, names, poetic titles, and hallucinated concepts.
7. Keep translator and recommendation models as separate, swappable adapters. No retraining required; model internals should not become Atlas's data contract.

## Agent-facing observability and portability

Use the proposed authenticated Atlas recommendation debug surface; expose structured JSON operations equivalent to:

- `recommend.parseTitle(title, options)` — derived tags, rejected/unknown terms, model and quantization versions, timing and memory diagnostics.
- `recommend.inspect(objectId)` — authoritative effective tags vs derived title tags, provenance, cache status.
- `recommend.explain(objectId)` — which metadata contributed to each of the four recommendations, along with scores and exclusions.
- `recommend.models()` / `recommend.health()` — ready/disabled/unavailable states, actual loaded resources.
- `recommend.benchmark()` — measured latency/peak RAM and output stability.

Privileged operations must not be exposed unauthenticated on published pinboards. Standardize errors, schema versions, and model adapter contracts for Forever Works-style cold-agent handoff and portability.

## Publishing

Generate and validate recommendation relationships **before publication**. Published static pinboards store four eligible public target IDs (or fewer when too few candidates exist); they must not download the title translator, Dart vectors, or an ONNX runtime. Do not export private tags or hidden object references. Recompute on the next publish if source titles, effective tags, visibility, or membership change.

## Acceptance gate (before implementing as default)

- Verify licensing and conversion feasibility, **not just parameter-count estimates**.
- Measure under-200-MB packaged weight goal and <=1-GB *overall* Atlas peak RAM; document failures honestly.
- Validate title-to-Danbooru accuracy against representative real titles, including untagged bookmarks, descriptive and abstract titles, and false positive/negative rates.
- Verify existing tagged items are unaffected, private data is not exposed, UI stays responsive, and publishers remain model-free.
- Document setup, benchmark evidence, alternatives, failure modes and adapter replacement obligations.

**Decision status:** Research and optional experimental adapter only. Adopt automatically only after the benchmark and regression gates are satisfied; otherwise retain the existing tag-only recommender without regression.
