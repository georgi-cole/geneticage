# Prototype → beta → production copy review

Recorded 5 November 2026 at the product owner's request. This is an explicit release gate, not a statement that the current prototype wording is production-ready.

## Before beta

Review every user-facing string in navigation, onboarding, questions, results, report previews/full reports, account/profile creation, saving/export/deletion, purchases, consultations, loading, errors, empty states and notifications. The current language contains review/demo/prototype terms and should be revised as a coherent product voice, not through isolated find-and-replace.

- Decide the final names for clinical PhenoAge, blood-based age, health profile, simple difference and the report. Use each term consistently and explain what is actually measured.
- Review results, methods, eligibility/collection messages, limitations and suggested actions with the responsible scientific/clinical reviewer. Claims must match the validated implementation and target population. Changing the release label does not establish clinical validation.
- Replace internal wording such as Private review, Review copy, Purchases deferred and prototype-specific instructions with copy that accurately reflects the beta's enabled features and entitlements.
- The hosted app offers Apple, Google and email-code sign-in. Verify all enabled methods, including email delivery, on the release build. The Sites preview has its own access gate.
- Review privacy, health-storage consent, export/deletion, payment and consultation copy against the actual beta data flows. Do not remove an acknowledgement simply to shorten a screen.
- Keep illustrative/sample labels where sample data remains. Separate a current unsaved assessment from a saved personal record. Do not silently turn samples into apparent personal results.
- Review the English and Bulgarian product language against enabled release behavior. The prototype now includes an editorial Bulgarian localization, documented in `design/LOCALIZATION.md`; this does not replace scientific/clinical and privacy/legal sign-off for both languages. Check longer copy, numerical sentences and larger accessibility text in the mobile screen layout.

## Before production

Repeat the complete string review against production behavior, not just beta screenshots. Confirm final product terminology, support/contact routes, clinical/service claims, report access and pricing, consent versions and failure messages. Remove temporary review access and test purchase wording only when the underlying release configuration changes. Preserve explicit uncertainty, sample labels and the distinction between an educational estimate and clinical care.

Review and sign-off owners are to be assigned for product/editorial, scientific/clinical, privacy/legal and localization. Neither beta nor production copy is signed off by this prototype design update.

## Native store submission

The separate mobile build and account service are described in [GeneticAge store beta](docs/STORE_BETA.md).

On 9 November 2026, first-time Apple and Google sign-ins on hosted version 43 led through account registration to the separate Health & lifestyle questionnaire. Missing age, height and weight each blocked progress. The test measurements were fictional and remained unsaved.

The iOS 1.0 record is in **Prepare for Submission** with manual release selected. Its first build and App Privacy answers are pending. Google Play's first internal release and App content setup are pending.

### Both stores

- Test guest assessment, new and returning sign-in, cancellation, the required health details, cloud saving and account deletion on the signed iOS and Android builds. Use the system browser for browser-based OAuth and verify the return to the app. Configure platform-specific credentials for native provider SDKs. [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies)
- Provide reusable review access for any gated features and instructions for reaching the guest assessments and cloud account. Verify that a reviewer can use it independently of the owner's Sites session and time-limited sign-in codes. Use fictional health data and credentials reserved for review. [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/#app-completeness) · [Google Play sign-in details](https://support.google.com/googleplay/android-developer/answer/15748846)
- Publish a public GeneticAge privacy policy and link it in the app and both store records. Compare the signed builds and their SDKs with the actual data flows before completing either store's privacy answers. The web inventory includes account IDs and nicknames, email addresses for email-code users, keyed provider identifiers for Apple and Google, storage consent, and health or fitness inputs and reports when users save. Review retention, deletion, service providers and any enabled purchase or diagnostic features. [Apple App Privacy details](https://developer.apple.com/app-store/app-privacy-details/) · [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)

### App Store Connect

- Attach the iOS build, complete **App Privacy**, and verify the access instructions in **App Review Information**, where **Sign-in required** is currently selected. If the iOS build offers Google for the primary account, offer Sign in with Apple as an equivalent option. [Apple login services guideline](https://developer.apple.com/app-store/review/guidelines/#login-services)
- Verify **Account → Manage saved data → Delete KoleQuant account** in the submitted build. The hosted preview retains a keyed provider identifier while a GeneticAge account is active and removes it with the account's live records. Add Apple token revocation for new accounts before iOS submission. For accounts without revocation tokens, honor deletion and present Apple's manual revocation steps. Clear the app session when credentials are revoked. [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/) · [Apple token-revocation guidance](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple)

### Google Play Console

- Attach the Android App Bundle to the test release. Complete **Sign-in details**, **Privacy policy**, **Data safety** and **Health** from the signed build, including any data collected by its controlled web views and SDKs. [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469) · [Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291)
- If the Android build supports creating an account, verify in-app deletion and publish a working GeneticAge web link where users can request account and data deletion after uninstalling. Enter that link in **Data safety**. [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

## Reference comparison review gate — 6 November 2026

The prototype offers the ABIM January 2026 adult reference guide as a labelled educational fallback, with per-marker provenance and user-supplied laboratory overrides. This is not a set of FDA/EU-approved universal normal values, nor a validated personal diagnostic rule. Before beta, a qualified laboratory/clinical reviewer must approve the source selection, intended population, assay/specimen applicability, age/sex partitions, conversion precision, missing-context behavior and EN/BG interpretation. Clinical decision limits and hs-CRP cardiovascular risk categories must remain separate. Catalogue revisions must retain prior versions for immutable saved records. See `docs/LAB_REFERENCE_POLICY.md`.

## Laboratory safeguards added 6 November 2026

Before beta/production, a qualified clinical laboratory reviewer must approve the selected Mayo/Crouse critical thresholds, intended population and methods, conservative input coverage derived from the pinned cleaned BioAge NHANES III dataset, and the product reporting window of 1–99 rounded years. Neither the coverage nor that reporting window is a published universal validity boundary; normal reference intervals are separate. Review alert wording for historical/recent results, source maintenance, accessibility and Bulgarian copy. Formula/conversion regression and automated checks do not supply clinical validation. Existing snapshots and exports retain their original content. See `docs/LAB_SAFETY_POLICY.md`.
