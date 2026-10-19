# Generated-tag index churn while browsing previews

Status: concrete source causes corrected with regressions; owner/browser performance
acceptance remains OPEN. This does not close016/018 or prove all long-use lag fixed.

## Owner evidence

Capture `docs/evidence/performance-2026-10-19/OWNER_PROLONGED_USE_CAPTURE.json`:
193.296 seconds, renderer_revision4,301 collection items. Exact git SHA is not
embedded in the capture. Mounted cards peak24 and finish15. Full DOM starts623,
peaks1099 and finishes1004; tag buttons stay215. Input queue reaches2293.8ms and
heartbeat drift4018.5ms. Thus the one-row card bound does not establish responsiveness.
Board render aggregates:387 runs, mean6.58ms, max46.9ms. Generated-tag index:26
runs, total51038.9ms elapsed, mean1963.03ms, max5652ms. Async spans can overlap and
include time waiting for storage/crypto/other work: these are NOT51038.9ms of CPU
or proof of that much continuous main-thread blocking.

JS heap starts21173047 bytes, peaks160816657 and ends105720803, with substantial
intermediate decreases (including about52.6MB near the end). This establishes
allocation variability, not a retained-memory leak. Native/GPU memory is not measured.

## Concrete source mechanisms

1. Legacy gallery ensure wrote an entry in global model-results/removal maps even
   when the imported maps were empty. This emitted changes for index consumers.
2. Indexing treated an empty object as present results and hashed that image anyway.
   Opening more previously unvisited cards could grow this unnecessary hash set.
3. Every index rebuild re-encoded/rehashed unchanged saved image references.
4. Storage/gallery events could start overlapping rebuilds and copy full tag state
   again. Preview tag presentation independently read full model state/hash too.
5. Every preview built the Add Existing Bookmark options for the whole library,
   even with its chooser closed; gallery hydration could do it again.

The capture identifies the index as a costly repeated path. The above mechanisms
are reproduced source behavior; the amount of owner lag attributable to each and
any remaining compositor/GC/native factors require a new capture.

## Correction and preserved obligations

Empty imports keep their empty maps inside their own gallery entry but do not write
empty global model/removal records. Existing empty records remain stored and are
skipped during indexing. Nonempty original predictions/removals migrate unchanged.

Index refresh is single-flight with one trailing queued request; requests needing
fresh storage supersede reuse requests. Gallery-only refresh uses the current
model-state snapshot. Global model/removal/activation storage events update that
snapshot; stale reads cannot overwrite newer events. Explicit refresh still reads
fresh state. Unchanged image sources reuse the previously derived SHA reference;
changed sources require hashing again. No tag/provenance data is deleted or merged
by this optimization. Preview presentation shares state/reference where available
and does not hash an image with no stored model results.

Bookmark chooser candidates/options materialize when Add Existing Bookmark opens,
not during each preview refresh. Notes, linked bookmarks, drafts and explicit
attachment behavior remain the same. Actual chooser appearance/styling unchanged.

Diagnostics revision5 adds tag-index pending/running state, storage.tag-index-read,
index.image-reference and storage.gallery-transaction spans. They report elapsed
async time, not isolated CPU. Existing scroll/mount/queue data remain available.

## Verification

Node pinboard suite passes:50 refresh requests have peak concurrency1 and one
trailing load;80 empty records plus one actual result cause one hash; unchanged
refreshes cause no additional hash/storage read; changed image rehashes; stale
storage read cannot replace newer activation. Gallery tests preserve nonempty
provenance and verify empty imports emit no global tag/removal writes. Preview
section tests open50 previews with5000 candidate bookmarks and perform zero chooser
reads/builds until the explicit add control is clicked. Generation, connection,
profiler and preview section regressions pass. Required Python check retains known
native/supervisor READY failures. Chromium execution is still unavailable here;
no post-fix speedup is claimed. Next: owner repeat the same usage/capture and compare
index/storage/hash counts, queue/drift trends, DOM and heap behavior.
