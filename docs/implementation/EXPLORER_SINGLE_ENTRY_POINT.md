# One sidebar file entry point

Owner direction, 2026-10-19: the far-left file explorer has exactly one folder
access point. By default, an authorized parent such as User wins over its
Documents child. Settings can explicitly choose a different entry regardless
of hierarchy. This changes presentation, not permissions or data.

Fixed: grants, writable/read-only restrictions, file identity, main-view browsing,
all-location cards and history. No parent grant is fabricated from a child grant.
Constrained: at most one file navigation button in `#roots`; zero when disconnected
or no grants exist. Other workspace actions are unchanged. Fluid: selection UI,
sorting among unrelated roots and later navigation presentation.

Implementation: `explorer-entry-point.js` selects the shallowest known authorized
root, then normalized path and grant ID for stable ties. Parent paths necessarily
precede their descendants. Windows path separators/case are normalized; POSIX
case is preserved. When roots are unrelated, the shallowest path wins; user can
choose another. Missing root paths rank after known paths.

Explorer Settings (sidebar gear) offers Automatic and each authorized root, plus
Use the currently open folder to choose a subfolder. Saved preference
`atlas.explorer.entry-point.v1` contains only `{grantId,path}`; null is Automatic.
A valid explicit choice beats hierarchy. A revoked/unavailable choice falls back
to Automatic without erasing the preference; reconnection can restore it.
Relative paths reject absolute paths and dot traversal. Actual access remains
validated by the companion. No grant/revoke/move operations occur on preference
changes. Other grants remain accessible through main All locations and Settings.
The settings dialog links to the existing connection/location manager.

Verification: `scripts/test_explorer_entry_point.mjs` exercises parent/child,
Windows case/separators, POSIX roots, unrelated deterministic roots, explicit
root/subfolder overrides, saved selection/reload, reset, revoked fallback, path
rejection and actual sidebar rendering/navigation handlers (one button).
`test_image_recovery.mjs` still passes. Real Chrome visual acceptance NOT_RUN.
