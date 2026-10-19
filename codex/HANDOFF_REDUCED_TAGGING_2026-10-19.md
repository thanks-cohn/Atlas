# ATLAS cold-agent handoff — 2026-10-19 08:20 UTC

## Start here

Repository thanks-cohn/Atlas; branch implement/rich-photo-tagging. Runtime source
commit c4dfe16417a20161620423a7b511a2b4bfdb8374. Draft PR #3 remains unmerged:
https://github.com/thanks-cohn/Atlas/pull/3 . Main/default legacy is separate.
Read AGENTS.md, this handoff, REDUCED_TAGGING_HANDOFF_STATE.json, backlog index,
and latest STATUS_AND_CONTINUATION entries. Historical rich handoff/evidence are
still useful, but their People pipeline and download are superseded by owner intent.

## Immediate owner request and work just completed

Owner rejected slow People as bloat. Retain general RAM++ and optional JoyTag,
remove People/Faces UI and People runtime/weights. Row now says Generate tags?
with initially unchecked general checkbox; Anime appears beside it only after
JoyTag Settings activation. Existing explicit saved selection may restore.

c4dfe16 implements:
- rich manifest only rampp, rampp_labels, rampp_thresholds;
- rich runtime rejects people/face rather than calling MiVOLO;
- reduced Windows manifest adds unchanged anime/anime_labels only, omitting
  MiVOLO, YOLO Face/Person and legacy object/face/detector weights;
- build excludes atlas_companion.people_tags; historical pure functions and old
  evidence remain in source for compatibility, not active reduced runtime;
- export environment now ONNX/numpy/ORT only; removed People export/downloads,
  torch/timm/ultralytics build requirements;
- builder prunes unused generated distribution model files, NOT user caches;
- frozen/installed six-photo tests now objects+anime; JoyTag parity unchanged.

Model files total 1,239,072,821 bytes versus prior 1,642,827,985: saves 403,755,164
bytes (~385 MiB), not a tiny total. RAM++ ~873 MB, JoyTag ~366 MB remain. Engine
adds ~216 MB; actual reduced ZIP size still requires artifact metadata. No new
recommendation model bundled. Recommendation research is in
 docs/implementation/CARD_TAG_RECOMMENDATION_RESEARCH.md (association baseline,
optional MiniLM ONNX); research only, no recommendation UI/engine shipped.

## Windows qualification — NEXT ACTION

Run https://github.com/thanks-cohn/Atlas/actions/runs/39221439574
Job117957421229. At handoff, steps1–10 SUCCESS: reproduced assets, Windows tests,
build, actual frozen models/core isolation, installed native+authenticated HTTP
photo benchmark/recovery/upgrade/GUI. Main archive upload step11 IN_PROGRESS;
workflow not yet confirmed complete. Do not invent overall success or ZIP hash.
Tiny reports artifact already available:12172066602,6928 bytes,
SHA256 c9ca1d4c25606778d92ae08d3666087fd384a098adc0cd17301c5d6f86940999.

FIRST: fetch run jobs and artifacts; verify completion; download/inspect tiny
reports and build receipt; record executable hash, archive hash/size, engine/model
size and full download URL. Update trial guide: current top note correctly warns
that its old link is HISTORICAL. Do NOT offer artifact12162317075 as the reduced
build: that is the earlier People-inclusive 1.28GB candidate. Both artifacts expire
2026-11-02 UTC; check exact metadata. Do not force main promotion or working-AI tag.

Other hosted checks for c4dfe16 succeeded: ATLAS development runs39221439639 and
39221446591; Windows boundary39221446705. Local rich tests10 pass, tagging tests15
pass, pinboard/generation/source-navigation tests pass, package/compile/whitespace
pass. Local Windows suite48 includes33 platform skips. Local check_project ran170
and failed3/errors3/skips33 in existing native bootstrap/supervisor startup (known
container limitation, prior /proc/6/exe permission issue); NOT a local full pass.
Hosted checks are separate actual evidence. No local Chrome executable installed.

## Owner Windows installation / low disk space

PC repo C:\Users\jg202\Desktop\Atlas\Atlas-main. Current installed helper is the
OLD three-model candidate atlas-c662f7c2c5338d3b6135.exe under
%LOCALAPPDATA%\Programs\Atlas (native copy same hash). receipt installation.json
contains exact extension_id/runtime/state_dir. State is %LOCALAPPDATA%\Atlas:
NEVER broadly delete it (notes, grants, evidence, models). Actual observed Chrome
extension ID djobfdimlodjbbgkdagiamknlepglebm; read receipt/current Chrome to confirm.
Chrome155.0.8059.82. Disk once0.8GiB; reclaimed old EXEs/ZIPs/unused Atlas _MEI plus
1.47GiB Chrome caches ->4.17GiB; full candidate install reduced to0.89GiB. Owner has
been told to delete Downloads\Atlas-rich-tested after installed tagging succeeded;
execution/result not yet confirmed. Original old ZIP deleted after hash/extract.
Commands should be CMD-compatible one-line PowerShell, incremental directories,
not whole-drive scans. No direct access to their PC. Never pretend commands ran.

For reduced install: provide NEW verified download/hash, extract whole bundle,
verify, delete ZIP only after extraction, install --extension-id EXACT --consent
--upgrade (read ID from receipt), reload existing extension directory, test tags.
Source git pull alone cannot replace native helper or reclaim cached People weights.
AFTER verified reduced installation, inspect current receipt/engine spec and exact
obsolete model names/hashes before reclaiming MiVOLO/person-face/old engine copies.
Do not delete JoyTag, RAM++, state, browser profiles, evidence or arbitrary _MEI.
No automatic user-cache pruning implemented in this change.

## Other changes completed during owner trial

- 9c81ce9/fde227e: latest-render guard fixes overlapping async duplicate chips;
  equivalent browser outputs compact; distinct checkpoints stored via initial tags
  and added/removed deltas, run/batch IDs+timestamps; current_tags direct list at
  last generation checkpoint. Historical inference evidence preserved in helper.
- Faces UI removed; People subsequently removed in c4dfe16. Anime unchanged.
- a5255ee: saved board name loads before heading reveal/cards; owner wants full
  single-source title audit, logged009, not falsely declared complete.
-39cbaa7: Notes compact72px title+2lines, click full editor; no persisted expansion;
  original text whitespace preserved. Reading expansion currently uses editor.
-4bc2fae: reproduced stale gallery read overwriting committed add; read epochs and
  commit invalidation fix; file input inside active chooser; chooser stays until
  success and errors visible. File onchange tests cover counts/arrows/default.
-7371532: owner detailed PNG3,910,879 bytes1024x1536 RGBA failed old60K preview cap
  and480px floor. Card/composer now175K cap +384/320/256/192 fallback. Tests pass;
  owner Chrome retry confirmation still needed.
-8b85546: Visit source preference in Board settings. source-navigation.js uses
  Chrome155 tabs.create(splitWithTabId,index=pinboard.index) for sourceLEFT,
  pinboardRIGHT; shelf stays global side panel outside split. Separate-tab default
  and safe fallback; same-session owned partner reuse; preserves unrelated splits.
  Official docs https://developer.chrome.com/blog/split-view-api-extensions?hl=en .
  Owner screenshot image(20261019-075551).png ACTUALLY SHOWS source-left, pinboard
  middle, shelf-right. Thus owner visual proof of basic split success exists,
  superseding earlier NOT_RUN note for that scenario; not all edge cases proven.
  Narrow layout is cramped: owner Any-Shape vision requires graceful recomposition,
  not merely fitting. No responsive redesign done. No new permissions/iframe.

## Open bugs and owner standing requirements

Owner: any discovered/unfixed issue MUST enter docs/backlog and index. Entries007–011
are committed. 007 highest unresolved: leaving during inference can lose browser
attachment despite helper evidence. Default must KEEP WORKING after leaving/card
switch/browser close, recover status/results and attach once to ORIGINAL image.
Settings opt-out requests job-specific cancellation on exit; no unrelated process
kills. Persistent job IDs/status/result reconciliation NOT IMPLEMENTED. Do not say
saved-tag reopen regression tests fix in-flight loss. Owner metrics show RAM++
63–77s success, People109s timeouts and72–97s success. Removing People reduces work
but does NOT solve007 for RAM++/JoyTag. No silent reruns, preserve X/human tags.
008 suspicious3-person aggregate for screenshot with2 foreground people: cause
unknown, no hardcoded counts; now retired pipeline, preserve evidence.
009 board-title single-source audit outstanding.
010 current_tags freshness after manual edit/X/Anime visibility: stored snapshot
updates on generation only, NOT always-live authoritative projection. Fix shared
resolver/mutation synchronization; keep immutable historical checkpoints.
011 Add Image fixes above tested in doubles; owner real Chrome confirmation pending.
003 note deletion etc existing backlog remains. Do not silently mark Done.

## Tools / publication

Authenticated GitHub tools create_tree/create_commit/update_ref work; raw git push
has no credentials. update_ref expected_sha lease, no force. Get current branch
head before publishing. create_tree accepts base commit SHA. Large status ledger
read via8000-character chunks through exec_command; compose tool content internally,
do not print giant files. Repo-backed files need no Library duplicate. Attachments
are already in /workspace/scratch/dd943318b794/upload; read scratch, not Library.
Local checkout clean at c4dfe16 at handoff before docs publication. Handoff commit
will be docs-only and should not restart model qualification. Next user likely
needs new artifact/install/space commands after qualification completes.
