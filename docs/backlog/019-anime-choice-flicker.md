# Anime generation choice appears/disappears and flickers

Owner report: optional Anime checkbox in the card pop-out sometimes appears,
disappears and flickers; owner suspects overlapping elements or CSS.
Status: direct JavaScript hide/show cause corrected; actual Chrome acceptance open.

Observed source cause: loadTaggingChoices unconditionally hid the Anime wrapper
and cleared selections on every openDetailContent, then asynchronously reread the
JoyTag setting and showed it again. Gallery initialization and saved-content
refreshes call openDetailContent again, repeating this cycle. No screenshot or
browser trace proves a separate CSS overlap, so do not assert one.

Correction: model availability has one live settings state; per-card preference
loads no longer read/write global JoyTag visibility. Same-card refresh preserves
selections while reading preferences. Initial settings reads are revision guarded;
user settings edits invalidate older initial reads. A user choice invalidates
unfinished per-card reads so a late response cannot undo the new selection.
JoyTag still defaults hidden/off until activated in Settings. No inference or
model download is triggered by preference restoration; saved tag data unchanged.

Regression blocks preference reads: enabled Anime stays visible; disabling globally
while a card read is pending stays disabled after completion; a pending read cannot
undo a user checkbox change. Full Node pinboard suite PASS. Browser visual proof
NOT_RUN; owner confirmation of stable visibility remains required.
