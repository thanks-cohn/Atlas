# Gallery Studio v1 — Atelier, Fieldnotes, Nocturne

## Explicit owner purpose

Replace the previous masonry gallery presentation with three original gallery styles. A gallery must be recognizably different from Atlas's Pinterest-inspired discovery pinboard: it gives a deliberately chosen collection a presentation, a sequence and room for attention. Capture durable publishing conventions of this era rather than copy a branded interface. The user should be able to add a few images and have a considered local presentation, with no layout coding. Editing must feel like a professional creative studio, not a bare upload form.

“Premium tier” in this request describes presentation quality. It does not authorize a new paywall, price or entitlement rule. Existing economics proposals remain separate.

## Fixed, constrained and fluid

Fixed: retain page UUIDs, exact bookmark associations, titles/text, image identity/order/sources, local originals, library revisions, permission boundaries and explicit native save. Removing a work from a page does not delete its native asset. Source content is separate from presentation. Local and public URL images have the same layout behavior.

Constrained: current gallery remains version 1, `kind: page`, `template: gallery`. Optional `galleryStyle` accepts `atelier`, `fieldnotes`, `nocturne`; absent means Atelier without rewriting the stored document during read. Unknown styles fail browser validation rather than silently pretending to support a future format. Switching is persisted by the existing revision-checked native-save and browser-cache sequence. The existing helper preserves this optional document field; this release needs no new native API or replacement helper.

Fluid: layout, fonts, colors, sequence rhythm, future presentation profiles and editor structure. Do not confuse these first three templates with the final set of possible Atlas compositions. Horizons remains a distinct planned composition, not renamed as one of these gallery styles.

## Implemented extension experience

- Atelier: sequential exhibition; one large uncropped work with a separate numbered caption/title label. Narrow layouts stack the label below the image. No masonry discovery grid.
- Fieldnotes: warm editorial visual essay; lead work with adjacent text, followed by ordered paired works and periodic full-width works. Whole image proportions are contained, not destructively cropped.
- Nocturne: dark screening room, one contained image with title/caption below rather than overlaying potentially illegible text; looping previous/next, keyboard arrows within the focusable gallery and an accessible thumbnail filmstrip. Expanded viewer retains Left/Right and Escape.
- Add Item → Page also offers all three gallery styles at creation, with Atelier as default.
- Collection Studio: story panel, named style selector with explanation, local import and public URL controls; independently editable image title/caption; earlier/later/remove-from-page actions; sequence and live-preview tabs. Live preview reflects draft title/text/style/images without saving. Save explicitly commits originals and page through the existing native library. Cancel restores saved presentation. Failed save retains the editor/draft. Existing input/size/preview budgets remain in force.
- Operational paths stay in header Storage details, feedback stays in header. No external font, CSS framework, runtime package, image demo or hosted-site script is introduced into the extension.

## Demonstration Site

Three separately addressable styles at https://atlas-gallery-trilogy.officialmahasbiz.chatgpt.site (Atelier root, `/fieldnotes.html`, `/nocturne.html`). First-party buildless HTML/CSS/JS; bundled illustrative Unsplash nature photographs. Hosted Site is a design demonstrator, not the extension or native library. It has its own browser IndexedDB collection and studio; uploaded browser images are not sent to a server and are not a durable backup. Site and extension intentionally have separate persistence adapters. R2, Pages publishing, cross-device sync, marketplace and membership enforcement are not delivered by this change.

## Evidence and limitations

Local PASS: `node scripts/test_pages.mjs` covers all three styles, absent-style legacy documents, invalid style rejection, style save/round-trip with stable identity/images, live preview, cancel, Nocturne wrap/keyboard, existing failure preservation; DOM/API doubles, not Chrome rendering. `node scripts/test_bookmarks.mjs` PASS, worker contract suite 20/20 PASS. `tests/test_library.py` 3 real HTTP/SQLite tests PASS, including optional style surviving native restart and exact image/original recovery. Reproducible unsigned extension package 0.1.9. Site JavaScript syntax and local links/assets checked. Hosted deployment success proves deployment only.

Actual Chrome/screen-reader/touch/visual review NOT_RUN: Sites managed environment has no control-browser capability, so no alternate browser was installed/launched. Full Python suite outcome is in the status ledger; platform-native failure must not be hidden by passing focused tests. Next acceptance: owner opens existing page, edits all styles, saves/reloads each, checks long titles, mixed image proportions and narrow screen, then verifies offline/native recovery. Browser demo uploads remain browser-owned and must not be described as native library saves.


## Owner correction — 2026-10-17, release 0.1.10

The owner rejected Atelier and Fieldnotes as basic/bare, independently of text quantity. Retire both selectable styles. Preserve Nocturne and introduce one deliberate opposite: **Solstice**, a bright architectural contact sheet with modern bold typography, aligned framed whole images and compact numbered labels. It must stand on images alone; text remains optional. This supersedes the initial trilogy's presentation choices, not its content/persistence contract.

Selectable styles are now `nocturne` and `solstice`; new pages default to Nocturne. Existing absent-style gallery documents display Nocturne. Explicit legacy `atelier`/`fieldnotes` documents remain valid and display Solstice without rewriting on read; opening the studio selects Solstice and an explicit save persists the new style. Unknown future style IDs still fail validation. No image/original, title/caption, bookmark association or native revision is deleted by this migration. Earlier proposal/evidence is retained here as history, not as a current menu specification.

Hosted demonstrator root is now Solstice; `/nocturne.html` remains Nocturne. Old `/fieldnotes.html` redirects to Solstice and contains no old gallery. Both use the existing collection studio. Browser-local collection data remains separate from native Atlas Library.

Local PASS: gallery store/editor/viewer tests, legacy normalization and no-content-loss checks, bookmark creation selecting Solstice and defaulting Nocturne. JavaScript syntax checks pass. Actual Chrome visual acceptance remains NOT_RUN; no available control-browser in managed Sites environment. No native API change or helper update required. This is an owner-directed visual revision, not an assertion of universal aesthetic superiority.

## Nocturne composition correction — 2026-10-17, release 0.1.11

Owner screenshot showed a portrait image inside a full-width near-black stage: object-fit containment created heavy side bands. Owner requested deliberate structure and differentiated header/body dark tones. Keep whole images and preserve Nocturne navigation; remove the letterbox surface rather than crop to fill it. Image button now has intrinsic fit-content width, transparent background, contained natural proportions and a viewport-height ceiling. Near-black header (#0d1013) separates from charcoal body (#181c20). Compact collection heading/introduction, side caption rail with fine rule and gold sequence counter, divided navigation area and individually outlined active thumbnails establish hierarchy. At narrow widths, labels stack below the image. Untitled images get a display-only Work NN label; this is not written into user content. Preview reflects the new structure. Solstice and storage unchanged.

Verification: gallery/editor/navigation and bookmark contract tests PASS (DOM/API doubles); reproducible package 0.1.11. Owner's before screenshot inspected. Updated actual Chrome rendering NOT_RUN. This change concerns the extension page shown in the screenshot; the separate hosted design study has not been changed in this revision.

## Nocturne spacing and palette correction — 2026-10-17, release 0.1.12

Owner screenshot/clarification identified missing aesthetic padding, image touching the stage top, flush collection labels/controls, and green-black clash. Inspected screenshot. Root cause: gallery carries the same nocturne class as body; older class background survived body-only overrides, and collection-layout explicitly had padding:0. Replace legacy class surface with neutral graphite and use coordinated header #101014, body #17171d, room #202027 with warm muted champagne accent. Give viewing room 22–44px responsive inset, subtle boundary and 10px corner radius; inset introduction and caption rail; reduce image height ceiling to min(60svh,620px) to retain breathing room. This is real padding around the whole room; image itself retains transparent intrinsic frame and remains uncropped. Save/content/native behavior unchanged. Gallery behavior tests PASS (DOM/API doubles); updated actual Chrome visual review NOT_RUN. Owner's screenshot is before evidence, not after proof.

## Nocturne editorial composition — 2026-10-17, release 0.1.13

Owner rejected 0.1.12 screenshot as basic despite improved padding. Before evidence showed a large collection heading plus wide blank stage, with image/navigation separated and controls below the visible fold. Recompose rather than another surface-only adjustment: compact collection heading; portrait/landscape intrinsic image on the left; one right editorial rail combining sequence number, work title, restrained accent rule, optional caption, arrows and a three-column contact strip. Image spans the rail rows in CSS Grid via neutral stage display:contents; keep DOM order and navigation contract. The previous full-width lower thumbnail row is retired on desktop. Warm paper edit action, low-contrast radial graphite backdrop, restrained image shadow and hover/focus expand affordance complete the hierarchy. Mobile/preview stack image then rail. Short desktop viewports allow ordinary scrolling instead of hiding content. No data/storage or native change.

Gallery/viewer/editor and bookmark contract checks PASS (DOM/API doubles); package 0.1.13 PASS. Owner before screenshot inspected; after Chrome visual review NOT_RUN. Do not label this “world class verified”: aesthetic acceptance remains the owner's. This replaces the earlier Nocturne spacing/composition details while preserving its core focused, dark presentation.

## Twenty-image layout testing — 2026-10-17, release 0.1.14

Owner clarified the immediate need is importing 20 images to test composition, not a 200 MB setting. Previous previews could each reach 700k characters, exhausting the shared 4MB document budget after only a few detailed images. Import now allocates 3.5M encoded characters across all local works (up to 24), recompresses oversized existing draft previews when needed, and adaptively encodes incoming previews to that share. Additional 640/480px and quality steps allow bounded previews without changing originals. Existing image IDs, originalAssetId, caption/title and order are retained; the whole batch replaces draft state only after preparation succeeds. Native original imports and explicit Save remain unchanged. Per-image 10MiB/40MP guard remains. This is a bounded fix for 20-image import, not full lazy-loaded original-quality browsing or a 200MB schema redesign.

PASS: encoder test for 20 shared-budget previews and invalid budget; editor test adding 20 images to an existing four-image collection and saving all 24 (browser primitives/DOM/native API doubled). Existing gallery failure/conflict/style tests pass. Package 0.1.14. Actual owner files/Chrome decoding NOT_RUN. Small previews may visibly lose detail in expanded viewing; unchanged originals remain in native library after successful Save.
