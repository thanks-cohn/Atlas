> Owner revision, 2026-10-19: People has been retired. The reduced candidate
> retains RAM++ plus Settings-activated JoyTag and starts general selection empty.
> The artifact link below is the historical three-model candidate, NOT the new
> reduced package. New Windows qualification/build must complete before providing
> its replacement download. Source/extension changes alone do not shrink an
> already installed helper/model cache. Do not delete private Atlas state.

# Rich photo tagging Windows trial

Use the **atlas-rich-tagging-CANDIDATE-windows-x86_64** artifact from a successful
`Qualify rich tagging Windows candidate` run on `implement/rich-photo-tagging`.
[Download the tested archive](https://github.com/thanks-cohn/Atlas/actions/runs/39196142502/artifacts/12162317075)
(about 1.28 GB download; 1.64 GB model files before engine/helper overhead).
Archive SHA-256: `57904b50df72a7133fdb5bcd3fb600cfb809f835b35b58e1d3aba7fe24dca6d4`.
Executable SHA-256: `c662f7c2c5338d3b61354c88c228f9f7b4f84b35bacfa5a780727df50b219543`.
The Actions artifact expires 2026-11-02 UTC; rebuild the pinned workflow afterward.
The ordinary Windows helper still uses the legacy models. A Git checkout or an
extension-only reload does not replace the installed AI engine.

1. Extract the complete candidate archive. Keep the EXEs, `tagging-engine/`,
   `tagging-models/`, notices and receipt together. Check the executable against
   `SHA256SUMS` and `BUILD_RECEIPT.json` from the same successful run.
2. Extract its extension ZIP into the existing unpacked extension directory and
   Reload in Chrome, keeping the same extension ID. Existing Chrome-local card
   data stays with that identity.
3. Open the candidate `debug.exe`, repair/upgrade the existing installation for
   that exact ID, or use CMD from the extracted candidate folder:

   ```bat
   atlas-companion.exe install --extension-id YOUR_EXACT_EXTENSION_ID --consent --upgrade
   ```

4. Reconnect the installed companion in Atlas. Choose a photograph and explicitly
   Generate Tags. Things now uses RAM++; People uses the face/person detector and
   MiVOLO v2. Existing Faces selection aliases that People pass in this candidate.
   Anime stays absent until JoyTag is activated in Settings; its model is unchanged.
5. Confirm results persist after reopening the card and restarting Chrome. Check
   independently selected Things and People, Run All with Anime disabled, optional
   Anime after activation, a second image entry, and unchanged human tags/notes.
   Test a small set first; generation is sequential and CPU inference can take
   several seconds. Earlier source measurements used roughly 1.5–1.6 GiB peak RAM
   for Things, not including Chrome or the rest of the system.

This is an unsigned evaluation candidate, not a promoted production default.
Read the same run's `PHOTO_BENCHMARK.json` for executed installed-EXE photo output,
and `docs/forever-works/RICH_TAGGING_IMPLEMENTATION.md` for accuracy and distribution
gates. Model scores and age/appearance estimates are not verified annotations.

To roll back, extract a verified normal legacy bundle and explicitly upgrade the
existing installation with that bundle using the same extension ID. Restore the
normal extension files in the same unpacked directory if needed. Do not delete
`%LOCALAPPDATA%\Atlas`, browser storage, or cached models to switch profiles;
existing evidence and user content remain preserved.
