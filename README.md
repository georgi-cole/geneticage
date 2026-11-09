# GeneticAge by KoleQuant

The product owner selected **GeneticAge** on 6 November 2026. KoleQuant remains the publisher and the opening brand signature.

Mobile-friendly full-stack Site with email-code accounts, per-user managed D1 storage and application-encrypted health records. The existing Site is owner-private.

Current priority: scientific content, design and core functionality. Payment activation is deferred. The private review release enables full report reading without payment through the server setting `REPORT_REVIEW_MODE=true`; this does not create orders or purchased entitlements, and is disabled whenever `PAYMENTS_ENABLED=true`.

## Scientific and editorial revision: 4 November 2026

Content version `2026-11-04-science-v2` distinguishes two working assessments: a guidance-based health/lifestyle profile and blood-based clinical PhenoAge. Horvath, DNAm PhenoAge, GrimAge and DunedinPACE are explained as laboratory methods, with their different inputs and purposes. No questionnaire substitutes for methylation data. No clock is presented as an exact genetic age. The health questionnaire is not a validated age or disease-risk model.

The published clinical PhenoAge formula and unit conversions are unchanged. A shared `assessClinical()` function now determines both browser and saved-server interpretation. New records include content and collection-protocol versions and fasting status. Current questionnaire health is kept separate from the health context at a historical blood draw. In particular, a current illness is not automatically projected onto older blood results.

The current numerical-display policy requires age 20–84, all nine exact numerical blood results from one draw, confirmation of fasting for at least eight hours, and confirmation that the listed collection circumstances requiring individual review did not apply. The age/fasting choices are informed by Liu et al. (2018), which analysed fasting US NHANES samples. Pregnancy/postpartum recovery, dialysis, acute illness, surgery recovery and cancer/immune-suppressing treatment are conservative **application review rules**, not a published set of PhenoAge contraindications or universally validated thresholds. A qualified clinician still needs to approve the collection policy and user-facing interpretations before a public clinical service.

The age difference is explicitly a simple subtraction, not an age-adjusted PhenoAgeAccel residual, a mortality probability, or an aging-rate estimate. Numerical results are rounded to whole years without an invented confidence interval. Estimates rounding outside the current 1–99 reporting window are withheld for entry/professional review rather than clamped; that window is an application choice, not a published biological validity limit. Missing biomarkers are not imputed; below-detection-limit CRP is not replaced with zero or the limit. Health habits do not add arbitrary years to the clinical formula.

Profile refinements include separate strength-training feedback, fruit/vegetable feedback covering the 3–4-portion response, age-specific sleep guidance, no adverse interpretation of long sleep alone, and adapted activity advice for reported limitations/recovery. Optional unanswered information stays unknown. Activity totals, smoking start age, smoking frequency and mutually exclusive choices receive consistency checks. A large self-reported weight loss over the past year prompts a brief health-context note only; weight does not change the blood-based age calculation. Advice is educational, with source links, not prescribed treatment or a promise of age reversal.

Sources and the clock comparison are maintained in `public/evidence.mjs`. Key evidence: Levine et al. (2018), https://www.aging-us.com/article/101414/text; Liu et al. (2018), https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718; Lu et al. (2019), https://pmc.ncbi.nlm.nih.gov/articles/PMC6366976/; Belsky et al. (2022), https://elifesciences.org/articles/73420. Lifestyle sources are WHO, CDC and AHA guidance linked by topic. An ENABL Age-Q or another questionnaire-age model remains a research candidate, requiring implementation/licensing and external-validation review before use.

Saved historical report snapshots retain their original interpretation, priorities and computed values; the app labels an earlier report protocol. The current report layout and general explanatory text can change. Older records without fasting information remain in history but are excluded from the updated trend chart. Re-entering old data creates a new assessment under the current collection policy. Serial scores are not described as DunedinPACE or evidence of an intervention’s causal effect.

Editorial standard: use concrete headings, ordinary English and defined terms; ask one clear question at a time; place the relevant limitation beside the result and leave technical detail in the methods section. Avoid motivational slogans, causal claims, repeated sales copy and interchangeable labels for biological, clinical and epigenetic age. Clinical review, population applicability and uncertainty calibration remain outstanding; an editorial review is not clinical validation.

## Assessment and report revision: 6 November 2026

Content version `2026-11-06-report-v3` retains questionnaire answers and blood entries when switching routes. Reports opens the current draft, with Summary, Findings, Blood results and Details instead of a long chapter dropdown. Sample exploration keeps a temporary copy of the current draft so the user can return to it. Only explicit reset/new-assessment actions clear entries; reloading still clears unsaved data.

Users can enter their own reference limits in the measurement’s selected unit, including one-sided and exclusive limits. These take precedence. Published comparisons require adult collection context. The creatinine group and CRP test type appear beside their readings. Standard CRP uses the ABIM guide. High-sensitivity CRP uses the Mayo Clinic Laboratories cardiovascular threshold when selected. The encrypted record stores the guide version used. [Reference policy and sources](docs/LAB_REFERENCE_POLICY.md).

## Laboratory entry safeguards: 6 November 2026

Content version `2026-11-06-lab-safety-v4` adds feedback after leaving a measurement field. Yellow/green/red indicate below/within/above the actual reference used; a separate question mark denotes an input or coverage check, and a triangular warning denotes selected published critical thresholds. New estimates are withheld for critical values, unsupported input coverage or a rounded output outside 1–99. The pure formula and conversions are unchanged. Valid extreme entries remain saveable with no numeric age. Old snapshots stay immutable, and out-of-window historical numbers are hidden only in current presentation. [Scientific policy, exact rules, sources and limitations](docs/LAB_SAFETY_POLICY.md).

The hosted Sites app and static Pages preview are separate publications. Both now include the 3-second KoleQuant launch signature on every full opening, with one additional second of brand hold and the original code-to-clock handoff speed. Empty instruments use the paired-form emblem with a clear unmeasured status.

## Heart & Vascular

This separate assessment estimates the 10-year risk of a first heart attack, stroke or cardiovascular death for eligible adults using SCORE2 at ages 40–69 and SCORE2-OP at ages 70–89. The country of residence selects the ESC region. The models use current cigarette smoking, age, sex, systolic blood pressure, and total and HDL cholesterol. Health history determines eligibility. The app’s calculation range is 100 to under 180 mmHg systolic, 2.5–8 mmol/L total cholesterol and 0.5–3 mmol/L HDL cholesterol. Outside the supported scope, the report shows the reason, the entered measurements and a next step. [SCORE2 study](https://doi.org/10.1093/eurheartj/ehab309), [SCORE2-OP study](https://doi.org/10.1093/eurheartj/ehab312), [regional assignments](https://www.heartscore.org/en_GB/faq), [ESC/EAS scope](https://doi.org/10.1093/eurheartj/ehaf190).

Eligible adults aged 40–69 with type 2 diabetes use SCORE2-Diabetes. The flow asks for age at diagnosis and exact HbA1c and eGFR after checking eligibility and the routine measurements. It lists any missing values in the report and opens the fields to complete the estimate. The app covers HbA1c of 20–140 mmol/mol and eGFR of 60–150 mL/min/1.73 m², and directs reported complications or lipid-lowering treatment to clinical review. [SCORE2-Diabetes study](https://doi.org/10.1093/eurheartj/ehad260), [ESC diabetes guidance](https://doi.org/10.1093/eurheartj/ehad192).

At ages 18–29, the app uses the coronary PDAY score as applied to living participants in CARDIA. It uses both blood pressure numbers, blood pressure treatment, total and HDL cholesterol, smoking, fasting glucose or diabetes treatment, and BMI for male participants. It shifts the published five-year age band by the risk-factor points. The midpoint leads when the full band falls within the study's ages 15–34. The band or supported bound remains visible. [PDAY derivation](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/486517), [CARDIA inputs](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/411303), [long-term follow-up](https://doi.org/10.1093/eurheartj/ehac009).

At ages 30–39, the assessment uses the Framingham general cardiovascular model with total and HDL cholesterol, systolic blood pressure, blood pressure medicine, smoking and diabetes history. It supports eligible adults with no known cardiovascular disease and either no diabetes or type 2 diabetes. The comparison matches the modeled risk to the study's same-sex reference with untreated systolic pressure of 125 mmHg, total cholesterol of 180 mg/dL, HDL cholesterol of 45 mg/dL, no current smoking and no diabetes. The app shows the U.S. reference age within 30–74 or a bound, and lists any remaining inputs with a direct link to complete them. [Framingham study](https://pubmed.ncbi.nlm.nih.gov/18212285/), [published equation](https://www.framinghamheartstudy.org/fhs-for-researchers/fhs-risk-functions/cardiovascular-disease-10-year-risk/).

The SCORE2 vascular risk age compares the estimated risk with that of a nonsmoker of the same sex and region with systolic pressure of 110 mmHg, total cholesterol of 4.75 mmol/L and HDL cholesterol of 1.3 mmol/L. SCORE2-Diabetes uses the standard SCORE2 reference for that comparison. Each reference curve shows a bound for risks outside its modeled ages. [Published reference-profile approach](https://pubmed.ncbi.nlm.nih.gov/40753001/).

When the routine models have no coverage, the prevention review summarizes the entered measurements and what to do next. Eligible adults under 40 can optionally add a clinical carotid–femoral pulse wave velocity in m/s using 80% of the direct distance. The separate arterial stiffness age matches that reading with the median for the selected sex in the Austrian LEAD study, bounded to the app's reference range of 18–80. [LEAD reference equations, Table 3](https://doi.org/10.1038/s41598-024-74162-5).

Adults can review health history and measurements at any supported entry age. A new Heart & Vascular draft offers to review matching answers from the current Health & lifestyle draft, or the latest personal saved profile when there is no current draft with answers. The user confirms or edits those answers and fills in the remaining questions.

Blood pressure and the lipid panel have separate steps. Leaving a field reveals an input check or a comparison with the user's lab interval, with a clearly labeled adult lipid guide where applicable. Lp(a) comparisons use the reported unit. A reading of at least 180 mmHg systolic or 110 mmHg diastolic gets a separate alert and withholds the risk estimate. [ABIM adult lipid guide](https://www.abim.org/media/e2wdwdqu/laboratory-reference-ranges.pdf) · [ESC blood-pressure guidance](https://doi.org/10.1093/eurheartj/ehae178) · [EAS Lp(a) consensus](https://doi.org/10.1093/eurheartj/ehac361)

The report includes optional smoking history, diastolic blood pressure, ApoB and Lp(a) when entered. The browser and server share the versioned calculation and checks. The server calculates and encrypts the inputs, results and measurement review in a separate saved snapshot.

## System assessments

Metabolic, Kidney and Fitness each have a guided intake and a report with Summary, Measurements and Methods. They reuse matching answers for review and link to missing fields. A specialist result opens its own step with a short explanation, a route back to the current result and a link for help finding the test. Each system keeps its own versioned report and age reference. [Model inputs, references and research review](docs/SYSTEM_AGE_METHODS.md).

## Phone preview on GitHub Pages

The public [phone preview](https://georgi-cole.github.io/geneticage/) uses the same interface, themes, English/Bulgarian copy, questionnaire and clinical calculator as the hosted app. It starts without a profile or invented personal result. Reports can be explored locally without creating a purchase. Answers remain in page memory and disappear on reload; only theme/language preferences are stored on the device. The Account tab explains the distinction and links to the separately hosted app for cloud features.

GitHub Pages serves static files: sign-in, cloud history, encrypted storage and purchases require the existing hosted app and are not connected to this preview. Its content policy blocks network API requests and form submissions. Hosted identity, ownership rules, immutable saved records, encryption keys, payment entitlements and the Sites audience retain their existing behavior.

Run `npm run build:pages`, then `npm run serve:pages` to inspect `http://127.0.0.1:4173/geneticage/`. The build bundles browser code and copies public media/styles into ignored `dist-pages/`; it excludes server code, credentials and databases. It uses the shared app shell, so layout changes apply to both editions. The default project path is `/geneticage/`.

The **App checks** workflow builds both editions. A maintainer can run it manually with **publish_pages** enabled; deployment runs only after all checks succeed, with Pages-only write permissions in the deployment job. Ordinary PRs and pushes validate without publishing. The `github-pages` environment restricts which branches may deploy.

## Included features

- A 31-question, six-section questionnaire with conditional questions, optional answers and validation.
- A health profile, manual blood-entry route, and demo clinical PhenoAge calculation with unit conversions and explicit withholding states.
- A separate Heart & Vascular assessment with regional SCORE2, SCORE2-OP and SCORE2-Diabetes, age comparisons, and optional ApoB and Lp(a) results.
- Report preview, Stripe hosted Checkout integration, verified purchased-report access and browser print/save-PDF layout. Charging stays disabled until merchant configuration and webhook delivery are ready.
- Consultation enquiry preview with selectable sharing categories. No enquiry is transmitted.
- Sign in with Apple or Google when configured, or use a one-time email code. New accounts confirm adult eligibility and health-storage consent. The health profile then collects age, height and weight, and calculates BMI from those measurements. An explicitly saved personal assessment with these details completes the profile across devices.
- Explicit cloud saving, immutable assessment/report snapshots, cross-device history, a reports tab, same-method progress charts, JSON export and live-record deletion.
- Sample and personal progress are separated. Optional explicit import of old browser-local demo history; original copies are retained.
- Responsive layouts, labeled controls, keyboard focus, dialog focus containment and sample data.

## Prototype boundaries

Account storage is real. Unsaved questionnaire/lab entries remain in page memory. Users explicitly choose to save; no new health records or sign-in tokens are written to browser storage. Legacy demo data is read only for opt-in import. Stripe payment code is implemented but live payments are not configured. No research, marketing or live consultation-submission service is connected. No analytics SDK is installed.

Health payloads and report snapshots use AES-256-GCM with a fresh nonce, bound to their owner, record ID and record kind. The encryption key is a hosted runtime secret, separate from the database and source. This is application encryption, not end-to-end encryption. Site operators with runtime administration access can administer stored data.

Account data APIs require a verified app session. The Sites audience gate applies separately at the hosting layer. Every record query uses the server-derived owner ID. Mutations require same-origin requests, JSON and an account-bound HMAC CSRF token. Writes are rate-limited (120/hour per identity), request size is capped at 48 KiB, and account history is capped at 500 snapshots. SQL uses parameter binding. Account responses are private/no-store. The app stores keyed digests of one-time codes and session tokens, limits delivery requests and verification attempts, and uses HttpOnly session cookies.

### Enable Apple and Google sign-in on Sites

Use the hosted HTTPS address as `PUBLIC_SITE_ORIGIN`. Each button appears when its provider settings are present. Configure them in the Site’s runtime settings and store the Google secret and Apple private key as secrets.

- **Apple.** Register the hosted domain and the return URL `<PUBLIC_SITE_ORIGIN>/api/auth/oauth/apple/callback` on a Services ID associated with a Sign in with Apple-enabled primary App ID. Set `APPLE_SERVICES_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY` (the complete PKCS#8 `.p8` key). [Apple web setup](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web)
- **Google.** Create a Web application OAuth client with the authorized redirect URI `<PUBLIC_SITE_ORIGIN>/api/auth/oauth/google/callback`. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. [Google OpenID Connect setup](https://developers.google.com/identity/openid-connect/openid-connect)

Publish with the OAuth D1 migration and test first-time registration, returning sign-in, cancellation and account deletion on the hosted URL. The app requests an opaque identity from each provider and keeps a keyed digest of its identifier. Each sign-in method has its own account identity. Use the same method to reopen saved history. The app sends no assessment inputs to sign-in providers. Separate assessment consent and explicit saving still apply.

### Enable email sign-in on Sites

1. Verify the sending domain in Resend and use a sending-only key for that domain. The default sender is `KoleQuant <support@kolequant.xyz>`. Set `AUTH_EMAIL_FROM` if the verified sender is different. [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction)
2. Set `RESEND_API_KEY` as a Sites secret. Keep the existing `ASSESSMENT_ENCRYPTION_KEY` so existing encrypted data remains readable.
3. Publish the verified build through Sites so the email-auth D1 migration is applied. Check delivery, registration, re-entry and account deletion in the hosted app.

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

The blood-based age calculation uses the published clinical PhenoAge formula with a stable log-space transformation. The current age scope (20–84) and collection-review rules are described above and require clinical approval. The health profile supplies educational guidance. Heart & Vascular reports its own defined cardiovascular endpoint and reference comparison.

Before a public health service, review the privacy notice, provider agreements, retention/backups, applicable consent and regulatory scope, payment verification, clinical method approval and a staffed consultation workflow. Account deletion removes live profile, assessment, report and rate-limit rows; provider backups and downloads have separate lifecycles. Preserve the existing private Site audience unless explicitly authorized to change it. This release is not an independent security audit or clinical validation.

## Run and maintain

Use Node.js 24.15+ in the 24.x line (see `.nvmrc`), or Node.js 26+, and install the locked dependencies with `npm ci`. Start the local preview with `npm run dev` on loopback port 5173. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor workflow and [GITHUB_DEVELOPMENT.md](GITHUB_DEVELOPMENT.md) for repository provenance.

Source assets are in `public/`, the app shell in `app/`, account routes in `app/api/[...path]/route.ts`, the backend in `lib/account-api.mjs`, and migrations in `db/` and `drizzle/`. `dist/` is generated output.

For local saved-record testing, use an isolated D1 database with all migrations and a separate 32-byte base64 `ASSESSMENT_ENCRYPTION_KEY` in ignored `.dev.vars`. The email-auth test uses an isolated SQLite store and a simulated sender. Use a verified delivery setup to test actual email delivery.

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
