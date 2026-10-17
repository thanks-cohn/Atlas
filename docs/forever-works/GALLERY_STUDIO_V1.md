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

## Reproducible sample collection in the extension — 2026-10-17, 0.1.15

Owner expected git pull to include the hosted preview's 24 URL images and authored text. The preceding showcase update was Site-only, so main correctly had no matching content. Add first-party gallery-demo.js with the same 24 public Unsplash URLs and title/caption set. Collection Studio's Try 24 sample images button loads a draft for either Nocturne or Solstice, explicitly asks before replacing a nonempty editor draft, and switches to preview. No local originals are uploaded for samples. Loading performs no browser/native save; Cancel preserves prior gallery; explicit Save uses normal revision-checked native persistence and records URL sources. Sample content is never injected automatically into an existing user page. Demo is version-controlled and travels with git pull/package. Tests PASS for draft-only load, Cancel preservation and explicit 24-URL save/style roundtrip (DOM/API doubles). Actual Chrome rendering NOT_RUN. No helper changes.

## Expandable five-paragraph articles and open gallery — 2026-10-17, 0.1.16

Explicit owner direction: images should sit directly on the page with horizontally browsable thumbnails underneath. The prior enclosing card and side-rail treatment were rejected. Article slots initially show only the first sentence; expand to read a full short article. Original five-paragraph essays now accompany all 24 sample works. Text is newly authored illustrative prose, not borrowed or attributed to photographers.

Add optional image.article (string, maximum 20,000 characters); short caption remains independent and bounded to 300. Existing documents without article remain valid. Native library already preserves optional fields under its existing document-size bound; real HTTP/restart test proves article roundtrip. No helper protocol or schema-version change required. Editor has per-work Article textarea. Nocturne shows first sentence as deck, followed by Read full article native details/summary with five actual paragraph elements. Changing work resets disclosure to collapsed. Solstice also has expandable article below each work. Rendering uses textContent only; no authored markup executes. Collection data still has total 4MB serialized bound.

Removed Nocturne outer card surface/border/shadow and returned sequence thumbnails to horizontal flow below intrinsic uncropped image. Work title/deck/reading slot follows below. Typography for work/reading uses system sans rather than repeated faux-luxury serif; Solstice unchanged apart from article disclosure. Existing image/library IDs and originals unchanged. New samples must be reloaded explicitly; saved owner galleries are never silently seeded or overwritten.

PASS: 24 samples each exactly five paragraphs; article bounds; first-sentence collapsed deck, 5 paragraph DOM disclosure, reset on image navigation; saved sample/style roundtrip; native article restart persistence. DOM/API/browser primitives doubled for client tests; native HTTP/SQLite tests real. Updated Chrome visual/accessibility acceptance NOT_RUN. Screenshot history is before evidence, not after proof.

## Expanded image is the reading view — 2026-10-17, 0.1.17

Owner screenshot clarified “expand the slot” meant clicking the gallery image to open its existing expanded viewer, not a Read full article disclosure on the main page. Supersede the 0.1.16 disclosure interaction. Main Nocturne/Solstice shows first sentence only; remove all article details/summary controls there. Image click opens viewer with full article rendered as actual text paragraphs in a dedicated focusable, independently scrollable reading region. Image and toolbar remain visible; previous/next changes article with image and resets reading scroll to top. Missing article continues to show saved caption without fabricating prose. Explicit editor Article input and persistence unchanged.

Reduce main image height ceiling to 57svh/570px; expanded image occupies 39svh (33svh mobile) and article gets remaining dialog height. Viewer uses neutral graphite instead of inherited green-black. Main scrollbar follows dark/light theme with thin rounded thumb; thumbnail strip and reading region have narrow theme-matched scrollbars. No scroll hiding or hover-only access. CSS Grid applied only when dialog[open] so closed modal stays hidden. No native/data/helper change.

Gallery/viewer and bookmark checks PASS (DOM/API doubles), including five paragraphs only after image open, correct article/image navigation and reading scroll reset. Package 0.1.17 PASS. Actual Chrome visual/scroll-wheel/screen-reader verification NOT_RUN. This source change concerns the extension screenshot; hosted design study is separate and remains at its previous interaction until updated explicitly.

## One complete scrolling article page — 2026-10-17, 0.1.18

Owner's corrected screenshot showed two scrollbars: inner reading pane and background document. Up/down moved background instead of article. Supersede 0.1.17's fixed-image plus inner scroller. Expanded viewer is now a complete editorial article in one scrolling dialog: sticky story toolbar, collection label, headline, caption/deck, estimated reading time, whole contained image, all paragraphs and story navigation footer. No nested scroll region. Root/body are explicitly scroll-locked while reader is open; close/Escape removes lock and restores original gallery position. Up/down/Page/Home/End explicitly scroll the dialog; Left/Right continues switching stories. Each new story resets reader scroll. Main gallery remains first-sentence-only.

Bundle Newsreader regular and semibold (Google Fonts, SIL OFL1.1) for editorial headline/deck/body. Files and complete OFL text are shipped under extension/fonts; there are no runtime Google Fonts requests. Packaging accepts explicit .ttf in addition to existing formats. Large readable type, narrow measure, distinct lead paragraph and ordinary full article flow replace the small text box. Estimated reading time is word count /220 rounded up, not a measured reading duration. No user text changed; no helper update.

PASS: gallery/editor/bookmark DOM/API doubles, background lock attribute, close restores scroll, keyboard up/down targets reader, story navigation resets reader, full paragraphs remain available; reproducible 0.1.18 package includes fonts/license. Corrected owner screenshot inspected. Actual Chromium wheel/focus/font rendering and screen-reader testing NOT_RUN; do not claim mocked checks establish visual quality. Hosted Site unchanged in this extension-only revision.


### 0.1.19 — Gallery / Story template and deletion
Owner direction: keep Gallery as the object type; name its image-to-article template Story. Nocturne and Solstice remain visual styles. The existing wire representation kind=page/template=gallery is retained for companion compatibility; these UI terms do not promise a new general page composer.

Delete beside each gallery under Associated Items records a versioned deletion marker. Native-backed galleries require a successful companion save before the browser copy is marked deleted. Imported originals and Chrome bookmarks remain. The deletion marker is stored through the existing save-page contract (no helper upgrade required); linked-page lists and direct readers hide it, and stale editors cannot save over a locally deleted page. Refresh reconciles newer disk revisions, including deletions. This is logical deletion, not physical erasure or a trash/restore interface; retained markers can be recovered manually. Old extension versions do not recognize markers. Offline devices or already-open readers can display stale state until refresh.

Sample loading preserves the draft gallery title and introduction; it replaces image/story entries only, and still requires Save. No automatic guesses are made about names already overwritten.

Verification: focused page/bookmark DOM and API-double tests, project checker, extension package. Actual Chrome visual/runtime verification NOT_RUN.

0.1.19 evidence: page and bookmark scripts PASS; four real authenticated HTTP/SQLite library tests PASS including marker persistence across restart and retained image assets. Project checker: 22 linked records valid; broader 141-test run has 3 failures, 3 errors, 32 skips in existing native startup/supervisor areas. Thus full suite is not green. Extension ZIP packages successfully; Chrome/Windows UI verification NOT_RUN.


### 0.1.20 — Ready-made gallery showcase
Owner rationale: visitors may never create a gallery; provide immediate access to a complete example before asking them to compose anything. A Gallery showcase entry in the existing shelf sidebar opens the default page route with 24 hosted sample images, titles, captions and full articles, using Story / Nocturne. No bookmark creation, upload or companion pairing is required to browse. The first visit seeds a separate browser-local page under a reserved ID; subsequent visits preserve edits and do not overwrite existing galleries or names. Editing and durable saving use the existing editor/companion behavior. This entry opens a new extension tab; it does not replace the shelf's initial file-explorer view. Sample image loading needs internet access.

Cloudflare authorization, R2 and deployment are future context only and unchanged by this addition. Evidence: page route initialization and repeat-visit preservation tests plus existing bookmark tests and extension packaging PASS (DOM/API doubles); actual Chrome UI NOT_RUN. Prior broader native startup/supervisor failures remain unresolved as recorded above.


### 0.1.21 — Current story heading above the focused image
Owner correction: each image should show the same title as its associated article, rather than repeating a generic collection title. Nocturne's primary heading and browser tab now follow the focused image.title (the same field used by the article reader) on initial load, thumbnail selection and arrow navigation. The smaller collection label retains page.title. Missing image titles fall back to the collection title. Solstice retains its collection heading and individual image titles. Saved titles/content are not rewritten. Thumbnail accessible names use story titles too. Focused page and bookmark tests and package PASS; actual Chrome visual verification NOT_RUN.


### 0.1.22 — Uncluttered Nocturne filmstrip
Owner correction from screenshot: remove the repeated story title, count and sentence below the thumbnail strip; the focused story title already appears above the main image. The stage now contains the image alone. Hide the filmstrip's horizontal scrollbar while retaining horizontal overflow, thumbnail clicks and previous/next controls plus left/right keyboard navigation. This applies to the draft preview too. Full articles remain accessible by clicking the main image. Article reader scrolling and the main document's vertical scrolling are preserved. Page/bookmark checks and packaging PASS; actual browser visual verification NOT_RUN.


### 0.1.23 — Gallery masthead and story terminology
Owner requests a larger, more deliberate ATLAS / GALLERY identity and Stories rather than images in the gallery count. Masthead now separates prominent ATLAS lettering from the smaller tracked GALLERY designation, with responsive sizing. Legacy saved collection names exactly equal to Title (case insensitive) receive a display fallback: the sample collection title when all images match bundled sample URLs, otherwise Collected Stories. Real custom names and saved records remain untouched; this is presentation, not an inferred rename. Nocturne still shows the focused article title above its image, while Solstice retains a collection heading. Page/bookmark tests and packaging PASS; actual Chrome rendering NOT_RUN.


### 0.1.24 — Presentation preview
Owner requests removal of the visible Story template label and a Preview action exited with Escape. Header now omits that label. Preview hides authoring/storage actions and status while preserving the brand, gallery, navigation and article interactions. Escape restores authoring controls and focus to Preview; an open article reader or publication dialog handles its own Escape first. This is presentation state only, not fullscreen browser mode, deployment, or saving; Chrome's own side panel is outside this page's control. Editor draft preview remains a separate existing function. Focused page/bookmark tests and extension package PASS; actual Chrome focus/Escape/visual verification NOT_RUN.


### 0.1.25 — New Story galleries start complete
Owner clarification: a separate showcase is insufficient. Creating a Gallery with the Story template must immediately produce the 24-image collection, with titles, captions and five-paragraph articles; no extra editor/sample-loading step. The existing Add Item creation path now seeds those records atomically with the new gallery and bookmark association, retaining the entered collection title and selected visual style. Creation tells users these are replaceable sample stories. Existing galleries are not migrated or overwritten. Browser-local creation remains usable without the companion; durable saving still follows existing explicit Save behavior. Focused page/bookmark tests and extension packaging PASS; Chrome UI NOT_RUN. Cloudflare/R2 unchanged.


### 0.1.26 — Structured collection description
Owner requests better padding and hierarchy for the description beside the Nocturne heading. Blank-line paragraphs now render as separate text-only paragraph elements in the gallery and draft preview. Nocturne uses a wider editorial aside, subtle left divider, inset padding, more legible opening paragraph and smaller subdued subsequent paragraphs separated by spacing and a fine rule. Mobile stacks the aside beneath the heading. Text content and saved records are unchanged; subsequent paragraphs are styled as supporting text, not semantically reclassified as credits. Page/bookmark tests and packaging PASS; browser visual verification NOT_RUN.


### 0.1.27 — Solstice editorial hierarchy and wider article canvas
Owner feedback: light gallery reads as pale panels with dropped-in text; number/title/caption lack differentiation. Owner clarified that the overall structure is fine: refine the individual card layout. Solstice preserves the existing grid and image framing while giving each card an outer fine border, consistent inset padding, a separated caption area, numbered gutter, bundled Newsreader serif story headings and softer sans-serif captions. Responsive grid and article-opening behavior remain. Reader width increases to a 1320px outer canvas / 980px aligned heading, body and footer, with a larger uncropped hero image; mobile remains a single column. Purpose is publication-like hierarchy across screen sizes, not blanket enlargement of all text. No data, helper or Cloudflare changes. Page/bookmark behavior tests and packaging PASS; actual browser visual QA NOT_RUN, so aesthetic success remains for owner review.


### 0.1.28 — Solstice image-to-story opening motion
Owner requests image growth followed by a changing background. Solstice image clicks now measure the source photograph and animate the reader hero from that rectangle into its expanded position using the native Web Animations API (520ms eased transform). The reader background transitions from warm paper to dark, with staggered heading/article fades. Reduced-motion preferences bypass this transition. Navigation and closing cancel active opening animations; data, scrolling and Escape behavior remain unchanged. No framework/dependency added. Existing page/bookmark behavior tests and packaging PASS; actual Chrome motion/visual verification NOT_RUN.

0.1.28 continuation: base-1.1 verified at commit 4bc2a144be9d613b5a878c5190369da81e7f1e0e before publishing. Owner also requests a larger STORIES masthead in the expanded reader: bundled Newsreader serif, smaller ATLAS and muted separator, responsive wrapping for controls. Motion preserves image aspect ratio and ignores stale image-load callbacks after navigation/close. Focused animation-branch tests cover interpolation, cancellation and reduced motion using DOM/API doubles; actual Chrome motion remains NOT_RUN.


### 0.1.29 — Restrained reader masthead
Owner rejects the serif STORIES treatment as Halloween-like. The shared reader masthead now uses a clean system sans-serif at semibold weight, moderate uppercase tracking and slightly reduced scale. ATLAS remains the smaller companion label. Article typography and motion unchanged. Existing page/bookmark tests and packaging PASS; owner visual review still required.


### 0.1.30 — Nocturne darkroom reveal
Owner requests distinct but equally considered image-opening motion for Nocturne. Its reader now fades out of the dark gallery, with a subtle 1.025-to-1 hero settle and brief 2px-to-zero focus treatment, followed by staggered heading and article arrival. Solstice retains its expanding source-image transition. Both use the native animation API, reduced-motion bypass, navigation/close cancellation and stale-load guards. No new dependencies or storage changes. Focused DOM/API motion branch tests (both styles, cancellation and reduced motion) and existing bookmark checks plus packaging PASS. Actual Chrome visual/motion verification NOT_RUN; premium aesthetic quality remains for owner review.


### 0.1.31 — Distinct light Solstice reader
Owner asks Solstice expanded articles to contrast with Nocturne using grey and white. Solstice now has a soft grey reader canvas, white article surface, pale translucent masthead, charcoal typography and subdued grey-green metadata/dividers. Buttons and scrollbar receive matching light styling; the opening animation resolves to the same grey canvas rather than dark. Nocturne's dark styling and newly introduced darkroom motion remain. Shared reader dimensions, single-scroll behavior and Escape retained. Both motion paths and existing page/bookmark checks plus packaging PASS with DOM/API doubles; actual Chrome visual/motion verification NOT_RUN.


### 0.1.32 — Nocturne reliability over effects
Owner reports the Nocturne transition as choppy and explicitly prioritizes restrained, dependable presentation on constrained hardware. Source inspection found the dialog was visible before image load, then the load callback started opacity-zero/backwards-fill animations, potentially hiding and re-revealing already visible content. Large-image blur/scale plus four staggered effects and toolbar backdrop filtering added avoidable rendering work; hardware frame-time profiling has NOT_RUN.

Replace Nocturne opening with one immediate 180ms opacity .92-to-1 fade on reading content. No blur, geometry animation, background animation, staggered delays or image-load-triggered reveal. Pass the already displayed source image into opening and reserve its intrinsic dimensions on the reader hero to prevent initial load-driven layout shifts. Nocturne toolbar uses an opaque background without backdrop blur. Reduced motion skips animation and close/navigation cancels it. Solstice motion remains unchanged apart from image dimension reservation. Focused tests cover cold-image immediate opening, stale callbacks, dimension reservation, cancellation and reduced motion; page/bookmark checks and package PASS. Actual Chrome frame-time / constrained-device / visual testing NOT_RUN.


### 0.1.33 — Sequential image then text
Owner accepts distinct image-first rhythms: Solstice expands/settles, then text fades; Nocturne image emerges from darkness, then text fades. Opening now has explicit waiting/image/text phases set before the dialog is displayed. Nocturne uses only a 280ms image opacity fade; Solstice uses 440ms geometry/background motion. Text starts after the image animation's finished promise, fading heading and body together for 220ms with no translation, blur or stagger. Image errors/cancellation clear visibility gates; generation guards discard stale loads/completions. Reduced-motion bypass remains. Tests verify actual promise ordering, cold image waiting, cancellation, stale callbacks, error release and reduced motion using DOM/API doubles. Page/bookmark checks and packaging PASS; real Chrome motion / constrained hardware frame-time validation NOT_RUN.


### 0.1.34 — Unhurried Nocturne pacing
Owner asks for slower, more elegant timing. Nocturne image opacity reveal increases from 280ms to 520ms with a gentle ease-in/out curve; the subsequent text fade increases from 220ms to 380ms. No additional effects or idle pause. Solstice timing remains 440ms image / 220ms text. Sequencing, cancellation and reduced-motion behavior retained. Focused page/bookmark tests and package PASS; actual Chrome aesthetic/performance verification NOT_RUN.
