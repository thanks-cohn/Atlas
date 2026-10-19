# Rich photo tagging Windows trial

Use the **atlas-rich-tagging-CANDIDATE-windows-x86_64** artifact from a successful
`Qualify rich tagging Windows candidate` run on `implement/rich-photo-tagging`.
[Download the tested archive](https://github.com/thanks-cohn/Atlas/actions/runs/39221439574/artifacts/12171179764)
(922,962,062 bytes download, about 923 MB; approximately 1.48 GB unpacked
before filesystem overhead, including 1,239,072,821 model bytes and a
215,809,386-byte engine). This is about 28% smaller than the previous download.
Archive SHA-256: `5909e0f739c92925a816081696148b05968457873ab501efe3dc7c6c8ca73dce`.
Executable SHA-256: `ee6af8134b390c44faa8497864f79d9b8d51882d3ccd5518de656bcc828c1925`.
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

4. Reconnect the installed companion. General generation now says **Generate tags?**
   and starts unchecked. RAM++ handles general image tags. People/Faces and their
   weights are excluded. Anime appears only after JoyTag activation in Settings;
   JoyTag is unchanged.
5. Test general tags, optional Anime, a second image entry, and unchanged human
   tags/notes. Check completed results after reopening. Background completion
   after leaving a card is still unresolved (backlog 007); model retirement does
   not fix that lifecycle issue. Owner low-memory hardware acceptance remains pending.

The reduced Windows qualification passed frozen inference, installed authenticated
HTTP inference on six photos with both retained models, recovery, upgrades and GUI
smoke checks. Reports are saved in `docs/evidence/reduced-tagging-2026-10-19/`.
After extraction completes and the helper hash matches, the downloaded ZIP can be
deleted before installation. Existing installed obsolete model files are not
removed automatically; preserve private state and inspect exact files separately.

This is an unsigned evaluation candidate, not a promoted production default.
Read the same run's `PHOTO_BENCHMARK.json` for executed installed-EXE photo output,
and `docs/forever-works/RICH_TAGGING_IMPLEMENTATION.md` for accuracy and distribution
gates. Model scores are not verified annotations.

To roll back, extract a verified normal legacy bundle and explicitly upgrade the
existing installation with that bundle using the same extension ID. Restore the
normal extension files in the same unpacked directory if needed. Do not delete
`%LOCALAPPDATA%\Atlas`, browser storage, or cached models to switch profiles;
existing evidence and user content remain preserved.
