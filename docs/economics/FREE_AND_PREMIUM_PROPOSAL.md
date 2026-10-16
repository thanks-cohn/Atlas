# Atlas Free and Premium — economic and product proposal

Date: 2026-10-15, America/Chicago.
Status: proposal requested by the owner for preservation and evaluation. Prices, quotas and plan boundaries below are hypotheses, not a published offer or implemented entitlement system.

## 1. Purpose and owner direction

Atlas should feel like one dependable explorer connecting bookmarks, local files, cloud objects and personally meaningful collections. Its fundamental operations should be understandable and reliable even as the scope grows. The free product should introduce the pleasure of collecting, describing, connecting and presenting things; Premium should make the owner's full vision possible at larger scale.

Explicit owner direction from the discussion:

- Free Atlas must be useful, attractive and capable of selling the concept through actual use.
- Free workflows primarily operate on one item at a time. Premium should handle whole directories, clusters, groupings and projects between local storage and R2.
- Free users should experience immersive features such as pinboards in a bounded but satisfying form.
- Premium should unlock in the same extension through a straightforward purchase flow.
- Separate entitlements reliably so Free does not accidentally receive paid capabilities.
- Consider recurring payment for API access and automation; compare successful-looking established product patterns rather than inventing arbitrary restrictions.
- Preserve dependable primitives and coherent exploration across resource types.

Owner examples included ten tags per bookmark and a purchase plus roughly $1/month. These were exploratory ideas. The owner later clarified that Free pinboards should offer three templates users can freely mix and match to display their groupings; Premium offers substantially more. This proposal recommends a simpler initial subscription, with prices and boundaries to be validated. Requesting this document is not approval to begin charging users, impose limits, or change the repository's software license.

Product thesis: **Free helps a person work with individual things. Premium helps them work with their whole world.**

## 2. Recommended initial commercial structure

Offer two editions and two billing intervals:

| Edition | Proposed price in USD | Role |
| --- | ---: | --- |
| Free | $0 | Adoption, everyday individual-item workflows and a satisfying introduction |
| Premium monthly | $5/month | Low-commitment access to the complete paid feature set |
| Premium annual | $39/year | Preferred value and more predictable funding; equivalent to $3.25/month, billed yearly |

A possible founding promotion is $29 for the first year, with the $39 renewal price displayed before purchase. Neither this promotion nor the prices are established as commercially optimal.

Personal external API access and supported automation belong within Premium initially. Avoid making ordinary users choose between a local purchase, an API subscription and several overlapping feature subscriptions at launch. Teams, resale, embedded commercial API use and high-volume hosted execution need separate terms and economics before being offered.

Defer lifetime licensing. Browser compatibility, native helper maintenance, integrations and support continue after the initial purchase. If demand later supports a perpetual local edition, define its included version/update rights separately from recurring hosted services; never imply that one payment funds unlimited future hosting or AI processing.

## 3. Proposed Free/Premium boundary

This is the intended commercial design, not the present feature inventory.

| Capability | Free | Premium |
| --- | --- | --- |
| Browse native bookmarks, local folders and connected R2 | Fully useful, with normal navigation and search | Same dependable foundation |
| Standard previews and bookmark management | Included | Included |
| Transfer individual files | Included | Included |
| Basic notes and tags | Useful personal organization | Bulk editing, advanced filters and rules |
| Pinboards | Three polished starting templates; freely mix and match them to display groupings | A much broader template and layout library, with more ways to arrange and present groupings |
| Directories and projects | Individual-file transfer workflow | Recursive transfers, queues and portable project packages |
| Groupings and relationships | Experience basic connections | Operate on whole groups while preserving meaning and structure |
| Automation | Manual workflows | Saved workflows, scheduling and supported agent/API integrations |
| Data ownership | Read and export owned data | Read and export owned data |

The three Free pinboard options are **templates**, not a cap on how many boards or groupings a person may create. Free users can mix and match those templates to present their groupings. Premium expands creative choice with many more layouts and presentation options. Do not make the Free experience feel like a tiny trial. The earlier ten-tags-per-bookmark idea is not the recommended main conversion boundary; revisit any limits only with observed usage and user feedback.

Ordinary selection, navigation, error clarity, accessibility, repair, diagnostics, safe cancellation, security and data integrity should be high quality in both editions. Premium may improve workflow power and presentation options; Free should feel finished.

"Unlimited" means no artificial count restriction on specified local features, subject to device resources and explicit technical constraints. It must not imply unlimited hosted storage, AI inference, remote execution or API traffic.

Free users may manually repeat individual actions. Premium sells reliable bulk planning, execution, recovery and saved effort. Preventing all repeated manual actions would damage the product and is not a practical licensing objective.

## 4. Portable projects are the main paid value

A Premium project transfer should carry enough information to reconstruct the collection: resources and locators, hierarchy and membership, notes, tags, typed relationships, relevant presentation information and versioned metadata. Define whether each external resource is copied, referenced or unavailable; never imply all linked content has been captured.

Membership remains availability; explicit relationships carry meaning; presentation determines appearance; publication requires its own explicit action. A transfer must not silently publish a collection or reinterpret membership as a relationship.

The documented export format remains accessible to users and agents. Distinguish a basic portability export from a managed Premium project operation that resolves content, plans a transfer, checks integrity, handles conflicts and recovers interruptions. Commercial limits must not make existing data unrecoverable.

## 5. Operating costs and storage strategy

Initially, customers connect their own R2 accounts and pay their provider directly. Prefer direct authorized transfers between their machine and storage, where the architecture permits it. Atlas supplies the interface, organization, transfer machinery and automation. Do not route every file byte through Atlas-hosted infrastructure without a measured reason.

This shifts storage and object-operation bills away from Atlas, but not all costs: Atlas still incurs software development, support, account/licensing infrastructure, monitoring, distribution, payment administration and any optional hosted execution. Customer-owned R2 also adds setup friction, which onboarding must address clearly.

At the official R2 Standard rate checked for this proposal, storage is $0.015 per GB-month before applicable allowances. 100 GB therefore represents $1.50/month or $18/year in storage alone before operations and other services. Free allowances apply according to the provider account's rules and must not be assumed separately for every Atlas subscriber sharing one account. R2 has no direct egress charge, but storage and operations are billed, and other infrastructure can introduce separate costs. Infrequent Access has different charges, including retrieval fees. See sources below.

Therefore, a $1/month plan must not casually include substantial Atlas-paid storage. Offer Atlas-managed storage, AI credits or remote execution later as explicitly priced add-ons with measured allowances. Local scheduling also needs the user's machine awake and connected; cloud scheduling cannot reach an offline machine merely because it is paid.

## 6. Unit economics and validation

Illustrative gross annual receipts if every paying customer uses the stated annual price:

| Paying customers | At $12/year | At $39/year |
| ---: | ---: | ---: |
| 100 | $1,200 | $3,900 |
| 1,000 | $12,000 | $39,000 |
| 5,000 | $60,000 | $195,000 |

These are arithmetic scenarios, not revenue forecasts or profit estimates. They exclude fees, taxes, discounts, refunds, chargebacks, acquisition costs, support, infrastructure and development. Subscription cash collected annually is also distinct from accounting revenue recognition.

Track contribution per subscriber as: receipts less payment costs, refunds, variable hosted costs and attributable support cost. Business sustainability additionally requires this contribution to cover fixed engineering/operations costs. Break-even paid-customer count is fixed annual cost divided by positive annual contribution per customer. No defensible break-even count exists until those costs are measured.

Annual billing reduces the frequency of fixed per-transaction fees and provides earlier cash, while creating a year-long service obligation. Select the actual billing provider and tax/refund arrangements separately; no processor or fee schedule is assumed here.

Validate pricing through real paid usage. Track activation (first useful organization/transfer), return usage, voluntary Premium trials, upgrade reasons, conversion, cancellations, refunds, support time and cost per payer. Inspect aggregate metrics without collecting bookmark URLs, filenames, notes or private collection content for pricing analytics. Start with the simple offer; change one major price or boundary at a time. Avoid treating stated interest or downloads as evidence of willingness to pay.

## 7. Entitlement architecture and accidental-access prevention

Maintain one shared product and core implementation. Purchase changes capabilities inside the installed product. Do not fork the entire application into independently maintained Free and Premium copies.

Proposed architecture:

1. A versioned capability registry defines named operations such as project.transfer, directory.transfer, workflow.schedule and external_api.write. Each records plan eligibility, applicable quotas, execution owner and downgrade behavior.
2. The interface communicates availability, but execution boundaries enforce it. The extension worker, companion and hosted services check the relevant capability before starting a restricted action. Alternate routes must use the same policy. A hidden button or local isPremium flag is insufficient.
3. A trusted billing backend processes verified, idempotent payment events and records account entitlements. A checkout success redirect alone cannot grant Premium. Handle renewal, cancellation-at-period-end, failed payment, refund and replayed events explicitly.
4. The backend issues signed entitlements. Signing keys remain server-side. Local software verifies signatures, account binding, capability version and validity before paid operations. Define secure token storage and minimize data sent to licensing services.
5. Cache valid signed entitlements with a documented offline/grace policy. Distinguish expiry from temporary network or licensing-service failure. Avoid online validation on every click. Exact lease durations and refund/revocation behavior require a concrete implementation contract.
6. Hosted APIs independently authenticate callers, check entitlements, enforce scopes and apply explicit rate/usage limits. Personal API access is not permission to resell unlimited hosted workloads.
7. Test entitlement decisions at all entry points: Free, paid, expired, offline, malformed token, duplicate billing events and direct API calls. Do not rely on interface-only tests.

An entitlement is separate from authority to access data. Premium never grants unapproved local directories, cloud accounts or broader agent permissions. Existing identity-bound credentials, explicit grants and recovery invariants remain mandatory.

Public documentation and agent-readable formats are compatible with commercial licensing, but the current repository license must be inspected before choosing proprietary or open-core distribution. Do not assume publicly visible code grants or restricts particular reuse rights. No software license is changed by this proposal.

Locally executable software cannot be made completely immune to patching, particularly where source is available. Signed entitlements prevent forgery within an unmodified implementation; they cannot stop someone replacing local checks. Hosted services can enforce their own boundaries more strongly. Target accidental leakage and ordinary unauthorized use, not an impossible promise of unbreakable DRM.

## 8. Cancellation, outages and ownership

Existing files, boards, notes, tags and relationships remain readable and exportable after cancellation. Never delete or corrupt user content to enforce a plan limit. Restrict new paid operations after the paid term and stated grace period; define safe handling for operations already underway.

Do not silently truncate data above a Free limit. Explain which creation or advanced editing actions are unavailable. Preserve normal access to the customer's own storage even when a Premium workflow becomes unavailable. Discontinuing a hosted service requires an explicit export/recovery policy.

Licensing failures need stable error codes and understandable repair guidance, consistent with Atlas's diagnostics philosophy. Avoid repeating the unexplained-offline experience in a payment subsystem.

## 9. Launch gates and implementation status

This proposal introduces no checkout, subscription, license check, paid API or feature limit. Existing implementation evidence remains in the Forever Works status ledger. The delivered native bookmark slice is an early foundation and does not prove the paid product described here.

Before selling Premium as this offer, verify at least one complete valuable workflow: transfer a whole project to R2, restore it locally with organization and metadata intact, and recover from an interrupted transfer without unexplained loss or duplication. Also verify the upgrade/downgrade path, offline licensing behavior, purchase recovery, clear installation instructions and realistic cost measurements.

Implement the accepted capability policy in canonical Forever Works records before coding entitlement boundaries. Preserve owner intent, constraints, design decisions, evidence and replacement obligations. Prices should be configuration backed by an explicit product decision, not scattered constants.

## 10. Reference patterns and sources

Checked during the proposal discussion on 2026-10-15 (America/Chicago; 2026-10-16 UTC). Provider offerings can change. Primary pages establish advertised features and prices, not audited profitability or a guarantee of Atlas's success.

- Raindrop pricing: https://raindrop.io/pro/buy — free unlimited bookmarks/collections; paid deeper capabilities. Borrow the useful free foundation and understandable upgrade value.
- Obsidian pricing: https://obsidian.md/pricing — free local app with optional recurring Sync/Publish services. Borrow the separation between locally owned content and continuing service value.
- R2 pricing: https://developers.cloudflare.com/r2/pricing/ — storage and operation pricing, allowances, storage-class differences and egress policy.
- R2 product pricing: https://www.cloudflare.com/products/r2/ — corroborating published Standard storage rate.
- Feedly API authorization: https://developers.feedly.com/reference/authorization — example of API tokens tied to a paid Enterprise offering; not the recommended consumer pricing tier for Atlas.
- Readwise Reader API: https://readwise.io/reader_api and pricing https://readwise.io/pricing/reader — an API alongside a subscription workflow; useful precedent for bundling integrations with a broader product.

Recommendation to validate: **Atlas Free plus one Premium subscription at $5/month or $39/year, customer-owned storage initially, and personal API/automation included in Premium.** Make the complete workflow valuable enough that upgrading feels like gaining scope and freedom.
