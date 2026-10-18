# Proposal Addendum — Atlas Remote-Locked Private Library

**Status:** Owner-directed proposal; not implemented or security-verified.
**Date:** 2026-10-17
**Related:** PROPOSAL_CAPTURE_CLIPBOARD_AND_VERIFIED_R2_ARCHIVE.md; PROPOSAL_ADAPTIVE_PUBLISHING_AND_PRESENTATION_SYSTEM.md; SECURITY_AND_DISTRIBUTION.md.

## Owner intent

Private Mode is not merely a hidden UI section or a local set of hidden Chrome bookmarks. The private collection can reside wholly in private Cloudflare R2 objects, including images, bookmark records, notes, tags, attachments, relationships, private resource locators and manifests. Atlas starts without the authorization material or private manifest needed to request those objects. Entering the password unlocks the access capability; bypassing the password dialog alone must not enable private object retrieval.

Objects have stable URL-addressable identities and can be fetched selectively, without downloading the whole bucket at unlock. Public mode, local mode and hybrid mode remain distinct user choices.

## Password → secret → accessible URL-addressed library

1. Opening Private Mode presents the locked UI. No private index, thumbnail, object URL, signed URL, or asset content is pre-fetched or embedded in publicly readable client bundles, local persisted state, logs, or publication artifacts.
2. The user provides a password. A securely designed password-verification or password-based key-unwrapping process produces/authorizes a *scoped, temporary capability* required to retrieve the private library. Merely changing local UI state, intercepting a handler, or skipping the prompt never produces this capability.
3. The authorized capability allows Atlas to request a private library manifest/index of object identities, URLs or request paths, metadata and relationships. The complete library need not be transferred.
4. Atlas fetches content lazily using private URL-addressable routes: visible thumbnails first, originals and large attachments only on demand, with paging and configurable preview limits. R2 is the canonical remote store.
5. Locking clears private UI state, decrypted indexes and available session material; subsequent reads fail authorization. Browser caches, download copies, clipboard and in-flight/signed URL expiry need separate controls and explicit disclosure.

**Technical boundary:** An R2 object URL is an address, not a password. R2 does not natively authorize arbitrary end-user passwords. A small Cloudflare Worker can validate/unlock a session, mediate per-request private R2 reads with an R2 binding, and never expose permanent R2 account/bucket API credentials to an extension or website. A password can alternatively derive a cryptographic decryption/unwrapping key for encrypted objects; this is a stronger *content confidentiality* model, but client-side key loss/recovery, metadata leakage, and authenticated transport must be addressed separately. Do not mistake password-derived bytes for an R2 API credential. Do not expose a reusable bucket-wide secret to the client.

## Additional privacy and publishing constraints

- Private records may be Atlas-native rather than Chrome bookmarks. An opt-in **Transfer to Atlas Private Library** action can migrate records and related assets; only remove originals from Chrome or local durable storage after manifest/object completeness, integrity and successful recovery have been independently verified, with clear confirmation and recoverable failure states.
- Existing private libraries and projects may explicitly convert selected or entire projects to public/publishable projects with a simple review-and-publish workflow. Publishing is a separate authorization decision, never triggered by unlocking, previewing, importing, sharing a private URL, or including private objects as references in otherwise public pages.
- A public export must materialize **only** approved public objects, asset copies, annotations and relationships into its output. No secret credentials, private manifest, private URLs, signed URLs or hidden private records may be included in a published bundle.
- If a private object is referenced by a public card/page, show an appropriate unavailable placeholder until explicitly promoted. Do not expose private resource identity/metadata through broken-link errors.
- Locking should stop new authorized fetches and clear application-held session state; immediate revocation needs a server-validated session on each request. Short-lived signed URLs remain reusable until their expiry, so prefer proxied, session-checked reads if immediate locking matters. Already displayed content and screenshots cannot be made unseen.
- Restrict login attempts, use appropriate password handling, TLS, scoped revocable sessions, object-level authorization, low-information error responses, and deny direct public R2 bucket access. Incognito/private browser windows are not themselves security boundaries or substitutes for this design.

## Acceptance criteria (future implementation)

1. Without unlock, network inspection shows **zero** private-manifest or asset reads and no locally persisted private catalog.
2. Removing the password overlay or invoking internal UI methods cannot read the manifest or individual private object URLs.
3. Wrong passwords, expired capabilities, revoked sessions and direct requests to protected routes are denied server-side.
4. After unlock, a small initial manifest/page is fetched; scrolling requests only visible resources and opening an asset requests its original.
5. Lock then attempt an old private URL: session-checked routes reject it. Any short-lived links' residual validity is measured and disclosed.
6. Verify remote-only restart/reinstall restoration of bookmarks, tags, notes, asset relationships and privacy flags on a clean device.
7. Verified transfer out of Chrome never deletes an original before remote completeness, integrity and restore proof.
8. Publishing explicitly selected private material works through a separate approval step; unselected private material, URLs, indexes, and credentials are absent from static site artifacts.
9. Automated tests cover network interruption, wrong password, stale manifest, expired session, browser restart, background-worker wake, storage/cache behavior, and publication leakage.

## Delivery / implementation status

Proposal only; no claim of a working authentication service, encryption implementation, remote-only mode, or publication isolation. Preserve this as an addendum to existing R2 archival and publishing plans rather than replacing those contracts. An implementation must prove both: **UI bypass does not imply server access** and **unlock does not imply public visibility**.
