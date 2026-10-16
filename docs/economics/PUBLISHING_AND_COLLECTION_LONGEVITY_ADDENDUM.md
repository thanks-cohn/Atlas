# Addendum — creative scope, Cloudflare publishing and collections that outlive membership

Date: 2026-10-15 (America/Chicago).
Status: owner-directed additions to the economic proposal; product contracts to implement and verify, not a claim that these features are shipped.
Parent: [Free and Premium proposal](FREE_AND_PREMIUM_PROPOSAL.md).

## 1. Plan the complete vision and the limits together

Design the complete Atlas experience and define Free/Premium boundaries early, before implementation. Shared core operations remain dependable; restricted operations check one explicit capability policy at their execution boundaries. Avoid accidental Premium access through imports, API calls or alternate interfaces. Do not implement everything unrestricted and attempt to remove capabilities afterward.

Free includes **three boards and three templates**. Users can mix and match templates to display groupings, move and position items, toggle visibility, change text size and choose heading styles using bundled fonts. Premium expands boards, layouts, components and presentation options, including user-added Google Fonts. The main product must be useful and attractive before anyone connects a cloud account.

Free should also demonstrate whole-folder and grouping transfers. The current allowance to test is **two successful bulk transfer jobs per day**, rather than blocking the capability entirely. Count a folder/grouping transfer as a job, not each contained file. Show the remaining allowance before submission. Failed attempts and retries/resumption of that same interrupted job must not consume another use. Partial completion and the day/reset definition need explicit contracts before shipping. Do not add an arbitrary size restriction merely to make the demonstration frustrating; retain documented technical/resource limits.

Premium has no artificial daily limit on those customer-owned-storage transfer jobs, subject to technical safety limits. This is not unlimited Atlas-funded storage or cloud execution. Individual-file transfers remain available in Free. Pricing remains the parent proposal's hypothesis: $5/month or $39/year, with personal API/automation access included in Premium.

## 2. A simple publishing experience backed by R2

The desired experience is **edit → publish → receive a live URL**, then a simple update action after further edits. On first use, Atlas guides the user through authorizing their Cloudflare account and activating any required service. Atlas then performs the supported technical setup: selecting/creating an authorized dedicated bucket, uploading approved files, generating JSON references and the site, preparing delivery URLs, configuring the connection and deploying to Pages.

R2 is the intended shared cloud storage for collections and media. Pages hosts the generated site. A Pages-only static export can also exist: R2 is not a universal technical prerequisite for Pages. A private R2 upload does not automatically produce a public URL. Choose and verify an appropriate public media domain or controlled delivery endpoint for explicitly published assets.

Authorization and billing activation are separate. A Cloudflare OAuth connection does not itself enroll the account in R2 billing. Where Cloudflare requires checkout/payment setup, guide the user to Cloudflare and continue after verification; Atlas does not silently accept financial commitments for them. Confirm exact OAuth permissions and any data-plane credentials in implementation; do not promise that one grant covers every API.

User-facing message: “Connect your Cloudflare account. Atlas handles the storage setup, files, connections and deployment.” Users retain ownership of that account and are responsible for its provider charges, separately from Atlas membership.

## 3. Website connection and honest, encouraging allowances

“Have a website? Add it in Settings, connect your R2 bucket, and Atlas handles the connection setup for you.”

With the necessary authorization, Atlas can configure the exact site's allowed origins and relevant methods/headers, preserve unrelated bucket rules, and verify the result. Prefer “No manual CORS configuration” to an absolute promise that browser/network errors can never occur. CORS is not authentication and must not be treated as permission to expose a private bucket. Adding a website does not itself publish private project data.

Lead with the provider benefits. As checked for this discussion, R2 Standard includes 10 GB-month of storage, 1 million Class A operations and 10 million Class B operations per month, with no direct R2 egress bandwidth charge. Describe Class A as including uploads/listings and Class B as including reads; one user action may generate several operations. These are account-wide provider allowances, shared with other R2 use, not extra allowances for each Atlas board or bucket. Existing account usage may already consume them. The free tier does not apply to Infrequent Access. Pricing and usage links must accompany the offer and be checked before publishing numeric marketing claims.

D1 is optional for features that need a live database; ordinary static boards should not require it. Before enabling it, show a separate readable cost disclosure, the account's plan and applicable rates, and require explicit acknowledgment. Store the accepted disclosure version and timestamp; an acknowledgment is not evidence that someone actually read or understood every word. Do not silently upgrade a provider plan.

Explain that D1 counts rows scanned/written: a single action may touch many rows. On Workers Free, exhausted daily read/write allowances cause queries to fail; on Workers Paid, usage beyond included allowances is billed. Provide usage visibility and implement bounded/indexed queries, caching where appropriate, abuse controls and a disable path. Warnings and Atlas-side thresholds must not be advertised as a guaranteed provider-wide spending cap.

## 4. Shared collection format and Redown interoperability

R2 is the shared storage layer. Redown can collect content into it; Atlas can explore, annotate, connect, arrange and publish selected material. The intended Premium Redown/Premium Atlas experience supports larger reciprocal folder, grouping and project operations without repetitive setup. Define each app's entitlement requirements before implementation; do not require a second subscription merely to read or recover an open export.

Use a shared, versioned, documented collection format. Preserve stable resource IDs, group membership, notes/tags, typed relationships and relevant presentation information as files change location. Define copy versus move, conflicts, missing media, checksums, interrupted jobs and retries. Do not assume the two apps already implement the same schema or that interoperability has been verified.

The private project JSON is the blueprint: resources, relationships, grouping, layout, typography and references to associated objects. Store media separately and refer to stable object keys/relative references. Avoid embedding expiring signed URLs as the permanent identity of an object. Export/import resolves provider references into usable locations. Credentials, bearer tokens and private secrets never belong in export JSON.

A public website receives a deliberately selected public projection. Saving a project to R2 is not publication. Membership, relationships, presentation and publication remain distinct; private notes and local paths do not leak into a public build.

## 5. Keeping collections after cancellation

The collection belongs to its creator. Ending membership must not erase content or make its exported viewer or already-published static site demand an Atlas subscription.

Provide **Download my collection**. ZIP is a convenient transport container; inside is a documented folder structure with:

- Versioned project JSON preserving resources, grouping, notes, tags, relationships and presentation.
- Included media and a manifest that distinguishes included, referenced and missing content.
- A standalone HTML/CSS/JavaScript viewer, instructions and the format/schema version.

The archive must be importable into a compatible Atlas version and useful to independent programs. A basic recovery/export path remains available after cancellation; Premium managed project transfer adds planning, content resolution, conflict handling and recovery beyond that basic export.

Prefer standard browser APIs, modest JavaScript, relative references and included assets. Avoid account/license calls in the standalone viewer, required remote scripts, expiring asset URLs and subscription-gated runtime dependencies. An unpacked export should have a documented way to view it locally and to host it; if file-URL restrictions apply, either provide an offline-compatible package/viewer or clearly document the simple local-serving requirement. Do not claim a double-click experience without testing it.

A collection saved for offline viewing should include the selected media; cloud references alone are not an offline backup. A public deployment must contain or deliberately retain access to everything its viewer needs. Test previously generated exports periodically with supported browsers and maintain import migrations.

The owner asks for at least one or two years of usefulness. Treat 12–24 months as an initial compatibility target to verify, with a longer-lived design goal. JavaScript alone does not guarantee longevity, and future browser/provider behavior cannot be guaranteed.

Atlas cancellation itself should not disable an existing static publication. Cloudflare account status, usage charges, domains and service availability remain external dependencies. Features requiring a running backend, D1, remote scripts or other services have those separate dependencies and must be described honestly. New paid editing/creation/automation can be restricted after the membership term according to the plan, while existing work stays readable and recoverable.

## 6. Evidence and next implementation work

These are design requirements, not deployed Cloudflare integration, billing enforcement or Redown interoperability. Extension 0.1.5 has an initial native-bookmark shelf implementation; it does not implement boards, Cloudflare publishing or this commercial system.

Next contracts: capability policy and quota job accounting; portable collection/export schema; public projection rules; Cloudflare authorization/onboarding; deployment lifecycle and returned URL; consent/usage reporting; standalone export compatibility checks. Record those contracts and actual evidence in Forever Works as implemented.

Primary provider references checked during the discussion:
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/r2/buckets/cors/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/fundamentals/oauth/create-an-oauth-client/
- https://developers.cloudflare.com/d1/platform/pricing/
