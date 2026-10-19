# 008 — People reports an unexplained extra subject

**Status:** Backlog — owner screenshot confirms suspicious output; cause unknown.

Screenshot image(20261019-071917).png shows two clearly visible foreground people,
but chips report 3 people, 2 adults, 1 child, 1 adult male, 1 adult female, 1 girl.
These are overlapping aggregate labels, not six people. Production code derives
counts from detections/subject records, not the owner's example counts. False
positive detection, face/body association error, stale result or another image
payload must be distinguished with saved evidence; screenshot alone cannot decide.

Inspect exact payload identity, per-subject boxes, detector scores, associations,
and raw estimates. Provide inspectable per-subject evidence without asserting
estimated age/appearance as verified facts. Never tune counts to the example or
silently fabricate corrected output. Test seated/occluded subjects, bystanders,
face-only/body-only detections and ambiguous association on labelled fixtures.
Require owner-image diagnosis and exact installed-model regression before closure.
Starting points: people_tags.py, tag_provenance.py, generated tag presentation.
