# KoleQuant Age prototype

Mobile-friendly full-stack Site with ChatGPT sign-in, per-user managed D1 storage and application-encrypted health records. The existing Site identity and owner-private audience are preserved.

Current priority: scientific content, design and core functionality. Payment activation is deferred. The private review release enables full report reading without payment through the server setting `REPORT_REVIEW_MODE=true`; this does not create orders or purchased entitlements, and is disabled whenever `PAYMENTS_ENABLED=true`.

## Scientific and editorial revision: 4 November 2026

Content version `2026-11-04-science-v2` distinguishes two working assessments: a guidance-based health/lifestyle profile and blood-based clinical PhenoAge. Horvath, DNAm PhenoAge, GrimAge and DunedinPACE are explained as laboratory methods, with their different inputs and purposes. No questionnaire substitutes for methylation data. No clock is presented as an exact genetic age. The health questionnaire is not a validated age or disease-risk model.

The published clinical PhenoAge formula and unit conversions are unchanged. A shared `assessClinical()` function now determines both browser and saved-server interpretation. New records include content and collection-protocol versions and fasting status. Current questionnaire health is kept separate from the health context at a historical blood draw. In particular, a current illness is not automatically projected onto older blood results.

The current numerical-display policy requires age 20–84, all nine exact numerical blood results from one draw, confirmation of fasting for at least eight hours, and confirmation that the listed collection circumstances requiring individual review did not apply. The age/fasting choices are informed by Liu et al. (2018), which analysed fasting US NHANES samples. Pregnancy/postpartum recovery, dialysis, acute illness, surgery recovery and cancer/immune-suppressing treatment are conservative **application review rules**, not a published set of PhenoAge contraindications or universally validated thresholds. A qualified clinician still needs to approve the collection policy and user-facing interpretations before a public clinical service.

The age difference is explicitly a simple subtraction, not an age-adjusted PhenoAgeAccel residual, a mortality probability, or an aging-rate estimate. Numerical results are rounded to whole years without an invented confidence interval. Values outside the current 0–120 display range are withheld for entry/professional review rather than clamped; that display range is an application choice. Missing biomarkers are not imputed; below-detection-limit CRP is not replaced with zero or the limit. Health habits do not add arbitrary years to the clinical formula.

Profile refinements include separate strength-training feedback, fruit/vegetable feedback covering the 3–4-portion response, age-specific sleep guidance, no adverse interpretation of long sleep alone, and adapted activity advice for reported limitations/recovery. Optional unanswered information stays unknown. Activity totals, smoking duration and mutually exclusive choices receive consistency checks. Advice is educational, with source links, not prescribed treatment or a promise of age reversal.

Sources and the clock comparison are maintained in `public/evidence.mjs`. Key evidence: Levine et al. (2018), https://www.aging-us.com/article/101414/text; Liu et al. (2018), https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718; Lu et al. (2019), https://pmc.ncbi.nlm.nih.gov/articles/PMC6366976/; Belsky et al. (2022), https://elifesciences.org/articles/73420. Lifestyle sources are WHO, CDC and AHA guidance linked by topic. An ENABL Age-Q or another questionnaire-age model remains a research candidate, requiring implementation/licensing and external-validation review before use.

Saved historical report snapshots retain their original interpretation, priorities and computed values; the app labels an earlier report protocol. The current report layout and general explanatory text can change. Older records without fasting information remain in history but are excluded from the updated trend chart. Re-entering old data creates a new assessment under the current collection policy. Serial scores are not described as DunedinPACE or evidence of an intervention’s causal effect.

Editorial standard: use concrete headings, ordinary English and defined terms; ask one clear question at a time; place the relevant limitation beside the result and leave technical detail in the methods section. Avoid motivational slogans, causal claims, repeated sales copy and interchangeable labels for biological, clinical and epigenetic age. Clinical review, population applicability and uncertainty calibration remain outstanding; an editorial review is not clinical validation.

## Assessment and report revision: 6 November 2026

Content version `2026-11-06-report-v3` retains questionnaire answers and blood entries when switching routes. Reports opens the current draft, with Summary, Findings, Blood results and Details instead of a long chapter dropdown. Sample exploration keeps a temporary copy of the current draft so the user can return to it. Only explicit reset/new-assessment actions clear entries; reloading still clears unsaved data.

Users can enter their own reference limits in the measurement’s selected unit, including one-sided and exclusive limits. These take precedence. New assessments can use a source-pinned ABIM adult guide for missing intervals, or leave comparisons unassigned. The fallback requires known adult collection context; creatinine needs the report’s reference group, fasting glucose needs confirmed fasting, and CRP needs an identified standard assay. hs-CRP risk bands are not used as laboratory intervals. Earlier saved records without guide metadata remain lab-only. Reference settings never alter PhenoAge or overwrite saved results. [Reference policy and sources](docs/LAB_REFERENCE_POLICY.md).

## Phone preview on GitHub Pages

The public [phone preview](https://georgi-cole.github.io/geneticage/) uses the same interface, themes, English/Bulgarian copy, questionnaire and clinical calculator as the hosted app. It starts without a profile or invented personal result. Reports can be explored locally without creating a purchase. Answers remain in page memory and disappear on reload; only theme/language preferences are stored on the device. The Account tab explains the distinction and links to the separately hosted app for cloud features.

GitHub Pages serves static files: sign-in, cloud history, encrypted storage and purchases require the existing hosted app and are not connected to this preview. Its content policy blocks network API requests and form submissions. Hosted identity, ownership rules, immutable saved records, encryption keys, payment entitlements and the Sites audience retain their existing behavior.

Run `npm run build:pages`, then `npm run serve:pages` to inspect `http://127.0.0.1:4173/geneticage/`. The build bundles browser code and copies public media/styles into ignored `dist-pages/`; it excludes server code, credentials and databases. It uses the shared app shell, so layout changes apply to both editions. The default project path is `/geneticage/`.

The **App checks** workflow builds both editions. A maintainer can run it manually with **publish_pages** enabled; deployment runs only after all checks succeed, with Pages-only write permissions in the deployment job. Ordinary PRs and pushes validate without publishing. The `github-pages` environment restricts which branches may deploy.

## Included features

- A 26-question, six-section questionnaire with conditional questions, optional answers and validation.
- A health profile, manual blood-entry route, and demo clinical PhenoAge calculation with unit conversions and explicit withholding states.
- Report preview, Stripe hosted Checkout integration, verified purchased-report access and browser print/save-PDF layout. Charging stays disabled until merchant configuration and webhook delivery are ready.
- Consultation enquiry preview with selectable sharing categories. No enquiry is transmitted.
- Real sign-in via ChatGPT; separate adult account registration and versioned health-storage consent. The application stores a site-specific user ID and nickname, without persisting a sign-in email or full name.
- Explicit cloud saving, immutable assessment/report snapshots, cross-device history, a reports tab, same-method progress charts, JSON export and live-record deletion.
- Sample and personal progress are separated. Optional explicit import of old browser-local demo history; original copies are retained.
- Responsive layouts, labeled controls, keyboard focus, dialog focus containment and sample data.

## Prototype boundaries

Account storage is real. Unsaved questionnaire/lab entries remain in page memory. Users explicitly choose to save; no new health records or sign-in tokens are written to browser storage. Legacy demo data is read only for opt-in import. Stripe payment code is implemented but live payments are not configured. No research, marketing or live consultation-submission service is connected. No analytics SDK is installed.

Health payloads and report snapshots use AES-256-GCM with a fresh nonce, bound to their owner, record ID and record kind. The encryption key is a hosted runtime secret, separate from the database and source. This is application encryption, not end-to-end encryption. Site operators with runtime administration access can administer stored data.

All API access requires platform-verified identity. Every record query includes the server-derived owner ID; supplied owner/result/report fields are ignored. Mutations require same-origin requests, JSON and an account-bound HMAC CSRF token. Writes are rate-limited (120/hour per identity), request size is capped at 48 KiB, and account history is capped at 500 snapshots. SQL uses parameter binding. Account responses are private/no-store. Application code does not log health bodies, identities or decrypted records.

The server validates questionnaire/lab inputs and recomputes clinical results and report content before encrypting a snapshot. Saved reports retain their generated clinical interpretation and priorities. Full-report access is derived from a verified server-side order, or the explicitly enabled private review mode described above. Client-supplied unlock flags and old simulated unlocks are ignored. Outside private review mode, unpurchased report responses and exports include a preview; user-entered health records remain exportable.

## Payments: current state and activation

The agreed price is **US$7.99 per saved report**, one time, with applicable taxes and final total shown by Stripe. Current deployment configuration sets `PAYMENTS_ENABLED=false` and `PAYMENT_WEBHOOK_READY=false`. No Stripe merchant account, live/test API key, price or webhook signing secret has been provided. No real payment or Stripe-hosted sandbox checkout has been tested. Automated tests use a local provider mock, not a merchant account.

The current Site remains owner-private. Stripe cannot deliver a webhook through that sign-in boundary. Before live activation, explicitly choose either public access for the calculator (all account/health/report APIs remain authenticated and owner-scoped) or a separately hosted public notification relay that authenticates to this private Site. No audience change or relay is provisioned by this release. Do not mark webhook delivery ready until an actual provider event has reached the final handler successfully. Return-page verification and a manual Purchases refresh are recovery paths, not a substitute for reliable notification delivery.

Activation steps:

1. Create the KoleQuant merchant account at https://dashboard.stripe.com/register and complete Stripe's business, payout and account-activation steps. Install/connect the Stripe integration if assistance managing it is wanted. Business identity and bank details belong in Stripe, not this chat or the application source.
2. Set business/support information, receipt settings and the merchant's terms/refund/privacy policies in Stripe. Confirm the tax treatment and configure Stripe Tax or deliberately configure another tax approach. Automatic Tax defaults to enabled in code; an explicit `STRIPE_AUTOMATIC_TAX=false` disables it. The app does not determine tax registrations or submit returns.
3. In the Stripe sandbox, create a non-recurring price for 799 USD cents. Use its exact `price_...` ID. The server validates its amount, currency, active state, one-time type and test/live mode. Do not put health information in product names, metadata or receipts. The only custom metadata sent is an opaque order ID.
4. Configure a publicly reachable **snapshot** webhook endpoint at `/api/payments/webhook` with the pinned API version `2026-10-28.endive`. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated` and `charge.dispute.closed`. Choose the delivery architecture above first; the current private URL is not reachable by Stripe.
5. Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_REPORT_PRICE_ID`, `PUBLIC_SITE_ORIGIN` and `STRIPE_MODE=test` as server runtime settings. Mark both Stripe keys as secrets. Do not change `ASSESSMENT_ENCRYPTION_KEY`. Never paste keys into chat, commits or browser code.
6. After a signed sandbox test event reaches the handler successfully, set `PAYMENT_WEBHOOK_READY=true` and `PAYMENTS_ENABLED=true` with `STRIPE_MODE=test`, then deploy. Verify actual sandbox Checkout, signed payment notifications, successful/declined/cancelled checkout, connection loss after payment, refund/dispute handling and report access from a second device. Use Stripe's sandbox card details only; do not make an unsolicited live charge.
7. Repeat price and webhook configuration in live mode with live keys and `STRIPE_MODE=live`. Test purchases cannot grant live entitlements. Set `PAYMENTS_ENABLED=true` only after the live merchant setup and notification delivery are confirmed. Deploy to apply the runtime settings.

Implementation details: `lib/payments.mjs` creates server-priced card Checkout sessions with an order-specific idempotency key; no card data passes through this application. Database orders are owner-scoped and linked to an immutable assessment. An active-order unique index prevents concurrent duplicate checkouts. A returned success URL grants nothing by itself. Fulfillment retrieves the session and expanded line items/payment/charge directly from Stripe, verifies the order, price, amount, currency and mode, and grants access only for a captured, paid transaction. The raw-body webhook verifies HMAC signatures and a five-minute timestamp tolerance; repeated/out-of-order notifications reconcile current provider state. A verification counter prevents older concurrent results overwriting newer checks. Webhooks retry failures.

Purchases shows payment state, paid report links and Stripe receipts. Account refresh retrieves stored entitlements across devices. Full refunds revoke access; partial refunds retain it. Disputes suspend access, with access restored for a won/closed warning outcome. Payments under review cannot be bought again. Open sessions can be cancelled; pending checkouts block destructive deletion until checked/cancelled. Deleting a paid assessment/account removes its live report/order data and access, without initiating a refund. Stripe keeps its own financial records. The app does not issue refunds or send receipt emails itself.

References: https://docs.stripe.com/checkout/fulfillment, https://docs.stripe.com/webhooks, https://docs.stripe.com/api/checkout/sessions/create, https://docs.stripe.com/api/disputes/list.

The clinical calculation uses the published clinical PhenoAge formula with a stable log-space transformation. The current age scope (20–84) and collection-review rules are described above and require clinical approval; they are not proof of universal model applicability. No questionnaire age, molecular clock, mortality probability, organ age or causal marker-contribution values are generated.

Before a public health service, review the privacy notice, provider agreements, retention/backups, applicable consent and regulatory scope, payment verification, clinical method approval and a staffed consultation workflow. Account deletion removes live profile, assessment, report and rate-limit rows; provider backups and downloads have separate lifecycles. Preserve the existing private Site audience unless explicitly authorized to change it. This release is not an independent security audit or clinical validation.

## Run and maintain

Use Node.js 24.15+ in the 24.x line (see `.nvmrc`), or Node.js 26+, and install the locked dependencies with `npm ci`. Start the local preview with `npm run dev` on loopback port 5173. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor workflow and [GITHUB_DEVELOPMENT.md](GITHUB_DEVELOPMENT.md) for repository provenance.

Source assets are in `public/`, the app shell in `app/`, account routes in `app/api/[...path]/route.ts`, the backend in `lib/account-api.mjs`, and migrations in `db/` and `drizzle/`. `dist/` is generated output.

For local saved-record testing, generate a separate 32-byte base64 key in ignored `.dev.vars` as `ASSESSMENT_ENCRYPTION_KEY`. Hosted keys remain Sites runtime secrets. A key used for existing records requires a re-encryption/rotation plan before replacement. The local preview simulates platform sign-in; hosted identity must be verified separately.

Build with `npm run build`; stop a running local preview before building on Windows. Follow the Sites helper workflow for actual publication, preserving the existing project ID and bindings. GitHub checks and merges do not deploy the hosted app. Append migrations instead of editing applied migrations.

## Checks

Run `npm run check` to verify generated translations without writing them, lint with zero warnings, check TypeScript and run the complete automated suite. `npm test` can be run independently. CI also builds the app and checks high/critical npm advisories.

The suite covers formula equivalence, units, eligibility/collection rules, questionnaire traversal, theme defaults and transitions, truthful readout states and animation, and English/Bulgarian copy. DOM integration tests cover in-place language switching, retained answers and canonical units/options, dynamic content, accessible labels, preference events and validation timing.

Backend tests use isolated in-memory SQLite: consent, CSRF/origin enforcement, two-user isolation, encrypted storage, validation, server recomputation, idempotency, export, tamper rejection, rate limits and deletion. Payment tests use a mocked provider to exercise price/ownership checks, notifications, access, refunds/disputes and test/live separation. No real account, database, provider or card is used.

Actual browser layout, printing, hosted identity and View Transitions remain separate checks; see [design/MOBILE_APP_QA.md](design/MOBILE_APP_QA.md). The old Windows-specific browser scripts are archived as inactive text in `design/test-archive/`. [Repository readiness](docs/REPOSITORY_SETUP.md) records applied settings and remaining development-tool advisories.

## Evidence

- Clinical PhenoAge: https://pmc.ncbi.nlm.nih.gov/articles/PMC5940111/
- Formula transcription cross-check: https://heart.bmj.com/content/heartjnl/112/11/606/DC1/embed/inline-supplementary-material-1.pdf
- Lifestyle guidance: https://www.heart.org/en/healthy-living/healthy-lifestyle/lifes-essential-8
- Alcohol context: https://www.who.int/news-room/fact-sheets/detail/alcohol

Clinical scores, interpretation rules, attribution and terminology require independent scientific and clinical approval before real-world use.

## Current interface

The shared app canvas has four destinations: Overview, Assessments, Reports and Account. Guided entry uses one question at a time and five blood-entry steps; reports are read by chapter. The first-open screen has no invented personal age. Samples are explicitly labelled, and saved results remain immutable snapshots.

Black Metal is the default, with silver accents and a polished graphite action. Blood Moon has distinct cropped lunar portraits; Bionic uses porcelain, titanium and metallic blue. The three themes share geometry, controls and typography. Fine custom navigation/arrow symbols use the Paired icon family; the oversized decorative DNA spiral is retired.

EN/БГ switches copy in place, preserving answers and the current screen, and persists only the language preference. The theme preference is also local. No health records are written to browser storage. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [design/ICON_SYSTEM.md](design/ICON_SYSTEM.md) and [design/LOCALIZATION.md](design/LOCALIZATION.md).
