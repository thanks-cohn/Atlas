# Proposal: Extensible Tag Models in the Atlas Native Companion

**Status:** UNDER CONSIDERATION — owner-directed concept, not approved architecture or implemented functionality  
**Recorded:** 2026-10-18  
**Scope:** Atlas browser extension Settings, native companion executable, tagging-provider API, and tag provenance

## Intent

Allow users to add, replace, and configure image tagging / tag recommendation models through Atlas Settings without rebuilding the Windows companion executable for every compatible model. Keep the everyday tagging interface simple, with friendly, user-editable category labels such as **People** and **Anime**. The model implementing a category can change independently of its label; additional categories can be enabled explicitly. Anime/JoyTag remains hidden by default until the user activates it in Settings.

## Candidate user flow

1. Open **Settings → Tag Models**, choose **Add Model**, and supply a supported model package or provider.
2. Companion validates the package/provider, dependencies, authenticity where available, resource needs, input/output compatibility, and permissions.
3. Install into a versioned model directory outside the packaged executable; do not overwrite an active working model.
4. Perform a test inference and show results/errors before allowing activation.
5. Save the provider-to-category mapping and optional renamed display label.
6. Atomically activate the new model, with rollback to the previous working model on failure.
7. The extension refreshes available capabilities without requiring manual companion re-pairing.

## Proposed architecture (not committed)

- **Stable native host:** Keep the companion binary separate from models, adapters, and user settings.
- **Model registry:** Record model ID, version, runtime, capabilities, installation path, enabled state, and category assignments; persist configuration with migrations.
- **Model adapter contract:** Standardize input images, output tags, confidence where supported, error reporting, runtime requirements, and metadata/provenance. Preserve original model output separately from normalized Atlas tags.
- **Runtime support:** Initially allow compatible model formats/runtimes (e.g. ONNX where supported). Arbitrary model architectures are **not** guaranteed to load; new runtime engines or core native integrations may require companion updates.
- **Lifecycle:** Prefer hot-swapping individual idle inference sessions; alternatively, restart only the inference service with automatic reconnect. Do not intentionally disconnect/unpair the entire native companion merely to install a tag model.
- **Isolation:** A failed or incompatible tag model must not break the bookmarks explorer, file access, R2 functionality, or other companion services.
- **Presentation/execution separation:** Model runs and independently stored per-source tags are distinct from category labels and user-selected Tag Display Profiles. Switching the visible model must not silently erase previous model outputs, human edits, notes, or per-card overrides.
- **Optional future providers:** Consider local models, external model APIs, and multiple models contributing to a category, with separate consent and credentials policies. Do not confuse the native companion with a Cloudflare Worker: this proposal specifically concerns the locally installed EXE.

## Questions and constraints to resolve before implementation

- Which native companion/runtime and model formats are actually supported on Windows (and later Linux)?
- How are model packages/adapters verified, sandboxed, and restricted from arbitrary code execution?
- What are acceptable disk, RAM, CPU/GPU requirements, model-size limits, and offline operation?
- How will downloads, interrupted installs, rollback, migrations, and model deletion work?
- Is inference hot-swap possible for each chosen runtime, or is a scoped service restart required?
- How are model-produced tags identified by model/version/date, and how are display profiles merged deterministically?

## Candidate acceptance criteria (future, not tested)

- Adding/switching a *compatible* model does not require rebuilding or reinstalling the companion EXE.
- Existing extension-to-companion pairing remains intact across model changes.
- A failed download, incompatible model, or failed test leaves the previously working model active.
- Only the affected inference service may temporarily pause; file/bookmark capabilities remain available.
- Renaming **People** or opt-in **Anime** changes only the display label, not stored source identity.
- Original source tags, human edits, and chosen display profiles survive model swaps.
- Unsupported architectures receive a clear explanation instead of silently claiming universal compatibility.

**Decision state:** Feasible in principle, but implementation details, runtime compatibility, security, and packaging remain unverified. Do not mark as implemented.
