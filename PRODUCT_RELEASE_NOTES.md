# Prototype → beta → production copy review

Recorded 5 November 2026 at the product owner's request. This is an explicit release gate, not a statement that the current prototype wording is production-ready.

## Before beta

Review every user-facing string in navigation, onboarding, questions, results, report previews/full reports, account/profile creation, saving/export/deletion, purchases, consultations, loading, errors, empty states and notifications. The current language contains review/demo/prototype terms and should be revised as a coherent product voice, not through isolated find-and-replace.

- Decide the final names for clinical PhenoAge, blood-based age, health profile, simple difference and the report. Use each term consistently and explain what is actually measured.
- Review results, methods, eligibility/collection messages, limitations and suggested actions with the responsible scientific/clinical reviewer. Claims must match the validated implementation and target population. Changing the release label does not establish clinical validation.
- Replace internal wording such as Private review, Review copy, Purchases deferred and prototype-specific instructions with copy that accurately reflects the beta's enabled features and entitlements.
- The app account uses email codes. Verify delivery and account creation on the hosted build before store submission. The private Sites preview still has its own access gate.
- Review privacy, health-storage consent, export/deletion, payment and consultation copy against the actual beta data flows. Do not remove an acknowledgement simply to shorten a screen.
- Keep the first release ad-free and the basic assessment results free. Verify the one-time US$7.99 web purchase, sample PDF, purchase recovery and refunds in a configured Stripe sandbox. Verify App Store and Google Play purchase and restore paths before store builds.
- Keep specialist intake off until qualified reviewers and their supported locations, languages, scope and delivery process are confirmed. Review the separate consent, quote, payment and delivery flow using fictional accounts.
- Keep illustrative/sample labels where sample data remains. Separate a current unsaved assessment from a saved personal record. Do not silently turn samples into apparent personal results.
- Review the English and Bulgarian product language against enabled release behavior. The prototype now includes an editorial Bulgarian localization, documented in `design/LOCALIZATION.md`; this does not replace scientific/clinical and privacy/legal sign-off for both languages. Check longer copy, numerical sentences and larger accessibility text in the mobile screen layout.

## Before production

Repeat the complete string review against production behavior, not just beta screenshots. Confirm final product terminology, support/contact routes, clinical/service claims, report access and pricing, consent versions and failure messages. Remove temporary review access and test purchase wording only when the underlying release configuration changes. Preserve explicit uncertainty, sample labels and the distinction between an educational estimate and clinical care.

Review and sign-off owners are to be assigned for product/editorial, scientific/clinical, privacy/legal and localization. Neither beta nor production copy is signed off by this prototype design update.

## Reference comparison review gate — 6 November 2026

The prototype offers the ABIM January 2026 adult reference guide as a labelled educational fallback, with per-marker provenance and user-supplied laboratory overrides. This is not a set of FDA/EU-approved universal normal values, nor a validated personal diagnostic rule. Before beta, a qualified laboratory/clinical reviewer must approve the source selection, intended population, assay/specimen applicability, age/sex partitions, conversion precision, missing-context behavior and EN/BG interpretation. Clinical decision limits and hs-CRP cardiovascular risk categories must remain separate. Catalogue revisions must retain prior versions for immutable saved records. See `docs/LAB_REFERENCE_POLICY.md`.

## Laboratory safeguards added 6 November 2026

Before beta/production, a qualified clinical laboratory reviewer must approve the selected Mayo/Crouse critical thresholds, intended population and methods, conservative input coverage derived from the pinned cleaned BioAge NHANES III dataset, and the product reporting window of 1–99 rounded years. Neither the coverage nor that reporting window is a published universal validity boundary; normal reference intervals are separate. Review alert wording for historical/recent results, source maintenance, accessibility and Bulgarian copy. Formula/conversion regression and automated checks do not supply clinical validation. Existing snapshots and exports retain their original content. See `docs/LAB_SAFETY_POLICY.md`.
