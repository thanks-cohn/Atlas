# Addendum — the everyday tools suite and ecosystem opportunity

Date: 2026-10-15 (America/Chicago).
Status: owner-requested commercial/product vision and proposed implementation priorities. This is not a launched subscription, a feature-completeness claim or a revenue forecast.

## 1. What this adds to the existing documentation

The [Free/Premium proposal](FREE_AND_PREMIUM_PROPOSAL.md) already records the initial Atlas offer and entitlement architecture. The [publishing and longevity addendum](PUBLISHING_AND_COLLECTION_LONGEVITY_ADDENDUM.md) records three boards/three templates, trial bulk transfers, R2 storage, Cloudflare Pages publishing, D1 disclosure, Redown interoperability and durable exports after cancellation.

This document adds the subsequent discussion: a mobile complementary product, the opportunity despite established companies and AI, the distinction between large audiences and paying customers, and a broader everyday-tools suite at a proposed $20/month.

The source-independent generation principle is documented separately in Forever Works: [Documentation as a Foundation for New Products](https://github.com/thanks-cohn/forever-works/blob/main/docs/VISION/DOCUMENTATION_AS_A_FOUNDATION_FOR_NEW_PRODUCTS.md). That document remains the detailed reference for inheritance packages, current implementation knowledge, agent freedom and independent reconstruction tests; this addendum applies it to the product opportunity.

## 2. Owner direction and the larger customer promise

The owner envisages a product family that handles the ordinary things people repeatedly wish were easier: working with documents, PDFs and images; collecting and connecting resources; managing local/cloud files; making visual presentations; and sharing or publishing the result.

The desired customer reaction is: “Everything I need to do, in one simple, accessible and intuitive workspace, for about $20 a month.”

The intended advantage is continuity of work. A person should not have to gather the same files again, lose their notes or rebuild their organization each time they change task. Resource identity, grouping, annotations and relationships should carry through the workflow. Familiar interaction and clear feedback should make the integrated experience feel simpler as its scope increases.

The ambition is wider than a bookmark manager, yet Atlas's immediate release remains an early product. The larger promise must be earned through verified workflows rather than a menu containing many unfinished tools.

## 3. Proposed offers: a useful product and a larger suite

| Offer | Proposed price | Intended reason to subscribe |
| --- | --- | --- |
| Atlas Free | $0 | A satisfying introduction and useful individual-item workflows, with the previously documented creative and trial allowances |
| Atlas Premium | $5/month or $39/year | Expanded collections, boards, presentation, bulk project operations, publishing and personal API/automation |
| Complete ecosystem suite, working description | Approximately $20/month | Atlas plus connected everyday document, PDF and image tools, with other mature product capabilities as specifically included |

The owner introduced the $20 all-in everyday-work idea. Positioning it as a distinct suite alongside Atlas Premium is a proposal, not a finalized SKU or commitment about every product's inclusion. The suite name, annual price, Redown eligibility, Android rights, device/account limits, existing-subscriber upgrades and exact tool scope need explicit decisions.

A reasonable candidate is that the suite includes Atlas Premium rather than charging the customer $20 plus another $5 for the same Atlas access. Avoid redundant payments for the same capability. Do not silently change existing customer promises when adding a bundle.

One account and a documented entitlement policy could carry supported rights across desktop and mobile. Shared identity does not imply one unrestricted credential: file grants, cloud authorizations and API scopes remain separate.

## 4. Which everyday tools should come first

These are candidate first slices to evaluate, not accepted complete format specifications:

| Tool area | Potential first useful scope | Larger capability that needs separate proof |
| --- | --- | --- |
| Documents | Compose and edit ordinary text documents, headings and basic formatting; save/export through declared formats | Faithful round-tripping of complex Word documents, tracked changes, macros, advanced tables, layout and embedded objects |
| PDF | View, annotate, reorder and remove pages, with correct save/export behavior | Editing arbitrary existing page text/layout, OCR, signatures, redaction and complex forms |
| Images | Crop, resize, rotate and make basic adjustments; save an explicit derivative | Advanced layer editing, color-managed professional workflows and demanding source-format compatibility |
| Collections and boards | Reuse source files, bookmarks, groupings and annotations while arranging a board | Richer presentation tools, larger projects and advanced publication |
| Cloud/file workflows | Browse and transfer explicitly authorized content with understandable outcomes | Cross-product project transfers, resumable queues, saved workflows and automation |

Opening a format, rendering it, editing it and saving it without loss are separate capabilities. “Word support” must state exactly which of those are supported. Do not advertise complete Microsoft Word compatibility without independent evidence. The same rule applies to PDF edits and image formats.

The goal is an excellent set of frequent tasks that connect naturally. Professional-depth replacements can be explored later, using documented capabilities and licensing/dependency review. A shared workspace does not require implementing every editor from scratch or choosing one framework for every engine.

## 5. Why there may be an opportunity despite competition

The owner's intuition is that existing tools leave gaps between collecting, local files, cloud storage, editing, visual organization and publishing. Atlas could make those transitions easier and more pleasurable. AI may assist with production and organization, while the product supplies a durable place to keep, understand and use the result.

This is a market hypothesis. Established providers can compete, and AI also lowers the effort needed for others to attempt similar tools. Forever Works and Any-Shape can support maintainability and faster experiments, but those internal advantages alone do not create consumer willingness to pay.

The customer-facing differentiator should be demonstrable: bring existing material together, perform the common edits, organize it without rebuilding context, and publish or export it simply.

A plausible initial audience is people already collecting visual references and source material—artists, designers, writers and dedicated hobbyists. This is a proposed focus to test, not evidence that every member of those groups wants the product.

At the discussion date, adjacent paid products included Raindrop, Milanote and Are.na. Their public offerings show that paid organization/creative tools are an established product category, not that Atlas has already found demand or that those companies' profitability is known.

## 6. The mobile product as an ecosystem bridge

A likely complementary Android product is a mobile collecting and organizing app:

1. Receive a shared link, image or document.
2. Let the user choose a grouping and add notes or tags.
3. Save a link or transfer supported authorized content to connected storage.
4. Browse and annotate the same logical collection on the phone.
5. Arrange or update a board with touch-appropriate controls.
6. Continue on desktop or publish selected material.

Candidate navigation areas are Collect, Explore and Create. These are an agent/design proposal, not a required fixed UI. The strongest value is continuity between discovering something on a phone and using it in a larger workspace.

The owner is considering Avalonia or React with an appropriate Android runtime. Neither choice is finalized. Mobile platform adapters and real device proof are necessary; a desktop extension API cannot simply be assumed available in Android. Shared data needs explicit offline/conflict behavior, not just the same bucket location.

The broader research request is to let a sufficiently capable agent infer the complementary product from portable Forever Works packages for Atlas and Redown, without reading their source repositories or needing hidden coaching. It should understand user goals, economics, actual implementation contracts and failure states, then propose and independently verify a valuable addition. The Forever Works document linked above describes this as a research objective, not an implemented autonomous guarantee.

## 7. Growth ambition and economic scale

The owner explored both a billion total users and a billion paying members. Those are radically different scenarios. Free users create distribution opportunity and operating/support costs; only a subset may subscribe. A billion paying members would require extraordinary global adoption and broad everyday value. It is an ambition, not a defensible current projection.

Illustrative gross subscription receipts:

| Paying customers | Atlas at $39/year | Suite at $20/month for all 12 months |
| ---: | ---: | ---: |
| 10,000 | $390,000/year | $2.4 million/year |
| 100,000 | $3.9 million/year | $24 million/year |
| 1 million | $39 million/year | $240 million/year |
| 1 billion | $39 billion/year | $240 billion/year |

These columns are alternative full-price scenarios, not additive revenue from the same customers. They exclude taxes, fees, refunds, churn, discounts, regional prices, acquisition, hosting, support and engineering. Total registered users, active users, paid seats and paying individuals are not interchangeable.

For another illustration, one billion total users with 1% paying at $39/year would produce $390 million gross annual receipts under that simplified assumption. Neither the audience nor conversion rate is forecast here.

The ChatGPT comparison in the discussion illustrates the need to distinguish audience from paid subscriptions; do not use large active-user figures as paid-customer counts. A broad everyday suite might address more needs than a specialized tool, but that does not establish that it can reach a global-platform audience.

Commercial planning should remain viable at far smaller scale. Measure recurring use, retention, actual purchases, support effort and contribution after variable costs. Revenue maximization is an objective to investigate under privacy, ownership and cost constraints, not an outcome an agent can guarantee from documentation.

## 8. Design the boundaries early; implement in complete stages

The owner's corrected principle is explicit: **plan the full product and define its Free/Premium/suite boundaries early, then build with those boundaries in place**.

Do not construct every feature unrestricted and cut it apart afterward. That can accidentally expose paid operations through alternate interfaces or destabilize the product when late restrictions are added.

Before each feature ships, define its edition, quota if any, execution owner, import/export behavior, API availability, cancellation policy and test cases. Use shared capability policy rather than disconnected checks in individual screens. Preserve the common dependable engine and use scoped checks for restricted operations.

Candidate implementation order:

1. Freeze the initial capability/edition matrix and the collection/export contracts.
2. Prove a complete Atlas workflow: collect material, arrange a board, reopen it, publish it and recover/export it.
3. Add one useful editing capability at a time, reusing the same collection rather than repeatedly importing unrelated copies.
4. Verify cross-tool save/export integrity, interruption recovery and supported Free/Premium behavior.
5. Introduce the suite offer only when its advertised included capabilities are usable and tested.
6. Develop the Android companion when shared contracts and interfaces can support it; evaluate mobile value without merely shrinking every desktop screen.

These stages are a proposal for execution, not a decision to defer entitlement design until launch.

## 9. Reliability, ownership and manageable costs remain part of the offer

The broader suite inherits existing promises: clear diagnostics, explicit authorization, private/public separation, meaningful exports and readable user content after membership ends. Existing exported viewers and published static artifacts should not acquire a subscription check merely because the suite grows.

Customer-owned Cloudflare storage can make the cost model more predictable, but account/licensing infrastructure, support, app maintenance and optional hosted execution still cost money. Bundling more tools increases compatibility and support obligations. “All the everyday tools” must not imply unlimited Atlas-funded AI, storage or compute.

The main risks identified in the discussion are spreading effort across too many incomplete features and making setup difficult before users experience the product's pleasure. Dependable helper installation, clear Cloudflare onboarding and recovery are commercial requirements as well as technical ones.

Measure whether users repeatedly finish useful work and recommend the result. The opportunity is a coherent system that saves effort and feels good to use; success cannot be inferred from feature count, AI-generated source volume or the size of the long-term ambition.

## 10. State and references

This document records vision and proposals only. It introduces no editor, Android app, payment flow, entitlement enforcement or new production integrations.

- [Initial economics proposal](FREE_AND_PREMIUM_PROPOSAL.md).
- [Publishing, interoperability and collection longevity](PUBLISHING_AND_COLLECTION_LONGEVITY_ADDENDUM.md).
- [Initial native bookmark implementation and proof limits](../forever-works/NATIVE_BOOKMARKS_FIRST_SLICE.md).
- [Documentation as a Foundation for New Products — Forever Works](https://github.com/thanks-cohn/forever-works/blob/main/docs/VISION/DOCUMENTATION_AS_A_FOUNDATION_FOR_NEW_PRODUCTS.md).
- Adjacent product references discussed: https://raindrop.io/pro/buy, https://milanote.com/plans/, https://www.are.na/about.
- Android platform reference used in the discussion: https://developer.android.com/training/data-storage/shared/documents-files and https://developer.android.com/training/sharing/receive.
