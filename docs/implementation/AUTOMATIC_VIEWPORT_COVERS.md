# Implemented: automatic viewport covers and bounded sticky retries

**Recorded:** 2026-10-19, America/Chicago.
**Status:** Implemented and pushed to `implement/rich-photo-tagging`.
**Implementation commits:** `6b9d881ff7200a8510e3d295742247e32c16686d`
(automatic viewport behavior), `9996b5bff38eab0e9caf6d5e4c60ff5c36079622`
(sticky retries and durable ceiling).
**Evidence:** focused Fetch and pinboard API/DOM-double tests pass. Actual Chrome
network and visual acceptance is pending. This is an extension-source change;
no new native helper or image-tagging model is needed.

## Exact before/after commits and rollback

These boundaries were checked against the actual Git parent chain on 2026-10-19.
They identify the source changes; this section does not execute a rollback.

| Boundary | Exact commit | Meaning |
| --- | --- | --- |
| Before either Fetch change | [`2cb4694129c76da6d1590f24e52f0a235d7b31ce`](https://github.com/thanks-cohn/Atlas/commit/2cb4694129c76da6d1590f24e52f0a235d7b31ce) | Manual cover fetching; includes the shelf startup repair. This is the parent of the automatic-fetch change. |
| After automatic fetching, before bounded sticky retries | [`6b9d881ff7200a8510e3d295742247e32c16686d`](https://github.com/thanks-cohn/Atlas/commit/6b9d881ff7200a8510e3d295742247e32c16686d) | Automatic viewport fetching, remembered misses and Settings opt-out; explicit per-card retry has no new two-retry ceiling yet. |
| After both behavior changes | [`9996b5bff38eab0e9caf6d5e4c60ff5c36079622`](https://github.com/thanks-cohn/Atlas/commit/9996b5bff38eab0e9caf6d5e4c60ff5c36079622) | Sticky Visible retries remembered misses; persistent initial-plus-two-retry policy. |
| Detailed behavior documentation | [`bf9046b28ffa409b2f706e8163b5c77d7e04f3dd`](https://github.com/thanks-cohn/Atlas/commit/bf9046b28ffa409b2f706e8163b5c77d7e04f3dd) | Documentation-only index and expanded record; does not change runtime behavior. |

For a comparison of the complete behavior change, compare
[`2cb4694...9996b5b`](https://github.com/thanks-cohn/Atlas/compare/2cb4694129c76da6d1590f24e52f0a235d7b31ce...9996b5bff38eab0e9caf6d5e4c60ff5c36079622).
The implementation changed `extension/fetch-covers.js`, `extension/pinboard.html`,
Fetch tests and their documentation/status entries.

### Revert the behavior while retaining later work

Use a clean working tree and a new rollback branch. Review later changes first:
a revert may conflict if subsequent work edits the same lines. Revert the two
implementation commits in reverse chronological order, not a reset of the whole
branch. From the Atlas repository, an example preparation sequence is:

```bat
git status --short
git switch -c rollback/viewport-cover-fetch
git revert --no-commit 9996b5bff38eab0e9caf6d5e4c60ff5c36079622 6b9d881ff7200a8510e3d295742247e32c16686d
git diff --cached --stat
git diff --check
node scripts/test_fetch_covers.mjs
node scripts/test_pinboard.mjs
```

Only proceed past the status check when the working tree is clean. The command
stages reversal for review; it does not commit or publish it. Resolve conflicts
and inspect the actual resulting behavior before making a rollback commit. To
abandon an in-progress conflicted revert, use `git revert --abort`.
Reload Atlas in Chrome after choosing and committing the desired source state.
No native helper reinstall is required for these JavaScript/HTML changes.

To remove only the sticky two-retry policy while keeping automatic viewport
fetching, revert `9996b5bff38eab0e9caf6d5e4c60ff5c36079622` alone instead.
Disabling automatic fetching in Settings is the simpler supported opt-out when
no source rollback is wanted; it does not remove the sticky retry policy.

### Saved-data effects of reverting source

A Git revert changes source files; it does not delete saved covers, human notes,
tags, gallery entries, browser preferences or attempt history. Keep those records.
The older manual implementation accepts version1 checkpoints, not the new v3
retry document; it can ignore newer attempt records and permit another manual
attempt. Therefore a source rollback is not a promise that the newer persistent
retry ceiling remains enforced. Returning to the new implementation can read its
retained v3 history again, unless an intervening older implementation overwrote
that checkpoint. Back up browser data before an experiment if preserving exact
retry history matters. Do not clear Atlas storage or reset the whole repository
just to reverse this feature. No rollback has been performed as part of this record.

## Purpose and owner direction

A bookmark pinboard should populate naturally as the user browses. Requiring
Fetch before every visible group can look like an empty or unfinished board,
even though useful preview metadata is available from the bookmarked webpages.
Fetching every bookmark in advance would spend bandwidth, storage and time on
cards the user may never look at. Repeating an unsuccessful request whenever a
card re-enters the viewport would create noise and needless network traffic.

The owner therefore requested three distinct behaviors:

1. Automatically try missing covers for cards in view, with a small nearby buffer.
2. Remember a failed/no-result attempt so ordinary scrolling does not repeat it.
3. Keep the sticky Fetch control as an intentional second chance: it retries
   unsuccessful cards currently in view despite the earlier attempt record,
   but at most twice per card identity.

The initial attempt and the two intentional retries are separate. An initial
failure does not consume either sticky retry. This is **one initial attempt plus
at most two retries**, not two attempts total. Sticky and per-card controls share
that retry budget; clicking another control does not provide an extra allowance.

## Before and after

Previously, cover retrieval was a manual page-local operation: choose Visible or
All and press Fetch. It already had a serial queue, permission request, existing
cover checks and a saved outcome map. It did not automatically start on page load.

Now, automatic fetching defaults on and starts when the interface has loaded its
settings/checkpoint and Chrome reports that the requested website access is
already granted. New eligible cards are discovered as the mounted viewport changes.
Misses remain remembered across filtering and reloads. Explicit Visible Fetch
can reserve one of the two retries for each eligible unsuccessful visible card.

Example: card A enters view and its webpage returns no usable cover. A remains
without an image; an unavailable outcome is saved. Scrolling away and back does
not call the site again. Clicking sticky Fetch while A is visible permits retry
one. Clicking it again after a failed retry permits retry two. Later clicks skip
A and report the limit. Card B, which already has a cover, is skipped throughout.
An unseen card C is not pulled into the sticky retry batch.

## Controls and observable behavior

| Trigger | Eligible work | Treatment of earlier misses |
| --- | --- | --- |
| Open pinboard with automatic fetching on and website permission granted | Mounted missing-cover cards intersecting viewport plus 200px above/below | Skip logged outcomes; no automatic retry |
| Scroll, resize or redraw mounted cards | Reconcile automatic nearby queue with current view | Skip logged outcomes |
| Sticky Fetch, Visible mode | Missing-cover cards intersecting the viewport itself | Explicitly retry prior misses if their retry count is below two |
| Per-card Fetch | That specific missing-cover card | Uses the same two-retry budget |
| Sticky Fetch, All mode | Eligible nodes supplied for current collection/search | Skip prior logged misses; does not reset their budgets |
| Cancel | Abort active retrieval and clear waiting work | Pause automatic work for this session; retain saved history |
| Disable automatic fetching in Board settings | Stop current queue | Save opt-out; preserve covers and history |
| Re-enable automatic fetching | Resume nearby discovery after access is available | Does not erase outcomes or retry counts |
| Reload pinboard | Restore saved option, outcomes and counts | Does not reset the two-retry ceiling |

The sticky button currently displays Fetch bookmark covers or Resume fetching,
depending on checkpoint/queue state. Those labels do not mean that it will reset
all outcomes. Its selected Visible/All mode determines the behavior above.
The per-card button remains labelled Fetch; it is also the explicit retry action.

If a cover was previously saved/skipped but is now absent, an explicit eligible
manual action can clear that old success/skip marker and fetch again. A cover
that still exists is not selected for replacement. This is different from retrying
an unavailable result.

## Settings and website permission

Board settings contains **Automatically fetch visible bookmark covers**. The
preference is stored separately from card limits, image-only filters and tagging
choices. Missing preference means enabled; an explicit false persists.

Enabled does not silently grant website access. Startup calls
`chrome.permissions.contains` for `https://*/*` and `http://*/*`. If that requested
access is not already granted, no automatic network requests start and no prompt
appears while scrolling. The fetch status explains that Fetch can enable access.
The explicit Fetch gesture, or explicitly enabling the checkbox, requests access.
The checkbox handler requests immediately in the gesture before awaiting storage,
so permission acquisition is not delegated to a later background action.

If permission is declined or the request fails, existing covers remain unchanged.
The permission check currently expects the broad HTTP/HTTPS origin set; this does
not implement a separate per-domain automatic-permission workflow. External
permission changes may require a new explicit Fetch or page reload to refresh
this page-local permission state.

## Viewport scheduling and resource bounds

`pinboard.js` supplies mounted cards and their bookmark nodes to `fetch-covers.js`.
The fetcher reads each mounted card's bounding rectangle rather than scanning or
mounting the entire collection solely to fetch images.

Automatic mode uses a 200px vertical buffer to begin filling nearby cards before
they fully enter view. Explicit sticky Visible retries use the viewport itself,
without that extra retry buffer. Discovery removes waiting nodes which have left
the current eligible region. An already active request can finish after the card
leaves view; ordinary viewport movement does not repeatedly abort it.

There is one active retrieval at a time in each installed page-local fetcher.
Queued continuation waits 500ms between tasks when work remains queued. This is
queue pacing, not a global cross-tab network rate limit. A card retrieval has a
12-second abort timer. Cancellation/scope changes invalidate the old generation,
abort its active controller, clear timers/queue, and prevent stale retrieved data
from being saved by that generation.

Changing collection/search/tag scope rebuilds nearby work as appropriate while
retaining the attempt map. When automatic fetching is enabled it can resume in
the new view. Cancel sets a separate session pause; toggling the preference or an
explicit Fetch can resume. Switching the manual mode stops that run; automatic
viewport discovery remains governed by the automatic setting.

## What fetching actually retrieves

This feature retrieves representative **cover previews**, not whole websites or
original image backups. It does not invoke RAM++, JoyTag or any image-tagging job.

For an eligible public HTTP(S) bookmark URL:

1. Request the resource with cookies omitted, no referrer and redirects rejected.
2. Read at most 2 MiB for the initial response, checking both advertised size and
   streamed bytes. Non-successful HTTP status becomes an unavailable outcome.
3. If the response is itself an image, rasterize it into the bounded preview.
4. Otherwise require HTML/XHTML and inspect metadata text only. Do not mount the
   HTML, execute scripts or load a webpage in a hidden browser tab.
5. Consider up to three distinct image URLs, ranked by `og:image`, `og:image:url`,
   `twitter:image`, `twitter:image:src`, then `image_src`.
6. Limit each candidate image response to 5 MiB and rasterize using the existing
   40,000-character cover-preview budget. Save only an accepted preview.

URL validation excludes unsupported schemes, embedded credentials, IP-literal
hosts, localhost/local hosts, overly long URLs and recognized signed/token query
parameters. Relative image metadata URLs resolve against the bookmarked URL.
These existing boundaries were preserved rather than introducing unrestricted
page execution or a new privileged fetch route.

## Preserving existing cards and data

Eligibility requires a supported bookmark URL and no current cover. Queueing and
execution check for a cover; save callbacks retain their existing cover/source
checks. Fetching does not intentionally replace a user's chosen image.

The existing pinboard save callback handles bookmark-cover storage, authored
cards and initialized image-entry galleries. Gallery fetches append an independent
entry when needed and synchronize the default cover using existing APIs; they do
not reuse another image entry's notes or tags. Fetched previews carry preview
provenance, including that original image bytes are not retained. Existing human
tags, generated tags, notes, bookmarks and recovery data are not cleared.

The shared saved-image storage budget still applies. A storage/quota error pauses
the fetcher and tells the user to increase the saved-image budget or remove covers.
It does not continue hammering storage or delete older images automatically.
A checkpoint-write failure also pauses work so the same session does not endlessly
repeat requests without a saved history.

## Durable outcomes and retry ceiling

The setting key is `atlas.coverFetch.automatic.v1`.
The checkpoint key is `atlas.coverFetch.v1.<board-id-or-default>`. The key name is
retained for compatibility; the document inside is now **version 3**:

```json
{
  "version": 3,
  "scope": "serialized current board/filter context",
  "mode": "visible",
  "done": {
    "bookmark-id|https://example.com/article": "COVER_NOT_FOUND"
  },
  "retries": {
    "bookmark-id|https://example.com/article": 2
  }
}
```

Identity combines bookmark ID and URL. A different URL is a different fetch
identity. Counts are per board checkpoint, not a global cross-board allowance.
Ordinary filter/scope changes do not discard this map. Outcomes are strings such
as saved, skipped, an error code, or `COVER_RETRY_PENDING`; this record does not
currently include attempt timestamps or a full per-request event history.

On explicit retry, the fetcher checks for an unsuccessful outcome and an unused
retry slot. It increments the counter and writes `COVER_RETRY_PENDING` before
starting the request. The approved retry is allowed through the normal skip rule
for that invocation only. Automatic discovery still skips that pending outcome.
The final success/failure replaces the pending outcome after completion.

This reservation prevents a cancelled/reloaded retry from acquiring unlimited
new allowances. It is conservative: a reserved retry can be consumed if the work
is cancelled or its card leaves the queued viewport before network work starts.
The implementation does not promise two completed responses in those cases.

Existing version 1/2 outcome maps are accepted. They have no recorded retry
counters, so migration begins with zero known retries. Valid v3 counts are bounded
to 0–2 when read. At the ceiling, Fetch reports Retry limit reached and does not
submit the card again. Neither repeated clicks nor page reloads reset that count.
There is no new user-facing clear-history/reset-budget action in this change.

## Verification actually performed

`node scripts/test_fetch_covers.mjs` passes the following exercised behaviors:

- Metadata ranking/deduplication, unsafe URL rejection, response bounds and HTTP
  failures; cookie-free/no-referrer/redirect-rejecting request options.
- Permission denial, collection-scoped manual queue, serial execution, checkpoint
  resume, cancellation and explicit retry after an interrupted initial request.
- Automatic startup with existing site access and no permission prompt.
- No requests for far-offscreen or URL-less mounted cards.
- Failed attempts skipped on repeated discovery, filter changes and page reload.
- Explicit per-card retry after a remembered automatic failure.
- Saved automatic opt-out, and no automatic request or prompt without permission.
- Sticky Visible retry one, reload without an automatic retry, sticky retry two,
  then refusal by both sticky and individual controls at the shared ceiling.

`node scripts/test_pinboard.mjs` passes its existing 1,000-bookmark windowing,
cover preservation, authored-card, tag, additive-image/gallery and saved metadata
regressions. JavaScript syntax and whitespace checks pass.

The required Python project check on the automatic-fetch change ran 170 tests:
3 failures, 3 errors, 33 skipped, with 22 local model links valid. Failures/errors
match the previously observed native bootstrap/supervisor startup limitations in
this container. The complete project suite is **not** reported as passing. The
queue-only retry follow-up ran the focused Fetch/pinboard suites; it did not repeat
that unrelated native suite.

These are API/DOM-double tests. They do not establish real Chrome permission
prompts, actual website compatibility, redirects accepted by sites, visual
smoothness, cross-tab coordination or owner hardware performance. Owner Chrome
acceptance is still required. Do not present this document as production promotion.

## Known boundaries and continuation

- Fetch history is board-scoped. Two open tabs/boards are not a coordinated global
  fetch service; the ceiling documented here is not a cross-tab transactional cap.
- Checkpoints and settings use Chrome local storage, not the native companion's
  inference evidence or an original-asset backup. Clearing that browser storage
  removes this history; ordinary reload does not.
- Automatic retrieval needs the granted origin set and compatible public metadata.
  Authentication-dependent pages, redirects, blocked URLs and missing metadata may
  remain without a preview. The UI must not invent a cover or imply backup success.
- The manual All mode still exists and may use more network/storage than browsing.
- This feature does not repair background image-tagging job recovery (backlog007),
  generate image tags, implement recommendations or publish fetched originals.

A successor may replace the queue/storage implementation, but must preserve the
separation between automatic first attempts and intentional bounded retries, skip
existing covers, maintain truthful outcomes, respect permissions and keep scrolling
from producing an unbounded retry loop. Start reconstruction at `fetch-covers.js`,
its `pinboard.js` callbacks, `pinboard.html`, and `test_fetch_covers.mjs`.
