# Personal science reports — editorial v2

The report now teaches from a person's recorded information rather than merely listing reference flags. This is implemented code, not the earlier manually assembled design prototype. The knowledge base still requires qualified clinical review before a public paid clinical service. It is educational content, not a diagnosis, treatment prescription or a validated new aging model.

## What the customer receives

A full-access assessment opens the personal report, the original data view and method/evidence view. New editorial editions have two actual downloadable PDFs: the personal science report and the complete data/methods companion. The same frozen document supplies the app and both PDF definitions. The downloadable sample HTML and assessment-signature design sheet used during design are not extra customer products.

PDFs are generated locally from a lazy, repository-built pdfmake runtime. Export sends no measurements to a PDF service, CDN or LLM. English uses a standard serif feature face and a bundled sans-serif body face; Bulgarian uses embedded Cyrillic-capable text. Page numbers, the real KoleQuant mark, source links and distinct assessment signatures are part of the renderer. No fixed page quota is imposed.

Older saved reports without editorial v2 retain their original interpretation and legacy browser-print exports. They are not silently upgraded. Ctrl+P remains a separate browser-print fallback; the two export buttons create finished PDF files for v2.

## Architecture

| Component | Responsibility |
|---|---|
| `public/report-composer.mjs` | Existing deterministic v1 result/fact adapter; attaches v2 only when composing a new edition. |
| `public/report-editorial.mjs` | Selects substantial educational chapters, creates traceable derived context, gates interventions and builds the complete supporting record. |
| `public/report-knowledge/modules.mjs` | Eighteen curated educational modules: physiology, wellbeing, companion information, evidence, interventions and timing. |
| `public/report-knowledge/sources.mjs` | Versioned primary-source registry. Unknown source IDs and unsafe source URLs fail composition. |
| `public/report-knowledge/copy.mjs` | Strictly bound personal narrative and presentation templates. |
| `design/localization/editorial/*.tsv` | Authored English/Bulgarian pairs; generated `bg.mjs` is verified by the normal locale check. |
| `public/report-editorial-ui.mjs`, `.css` | Escaped, responsive editorial surface and six decorative signatures. No medical data is invented by artwork. |
| `public/report-pdf.mjs` | Pure PDF document definitions using the same frozen narrative, evidence and data. |
| `public/report-export.mjs`, `report-download.mjs` | Access-gated export dispatch, visible errors, stale-document protection and web/native delivery. |
| `public/report-native-share.mjs`, `native/report-sharing.mjs` | Private-cache PDF sharing through the official Capacitor APIs. |
| `report-engine/`, `scripts/report-assets.mjs` | Isolated pinned PDF engine and generated local runtime; dependencies and generated binaries stay out of Git. |
| `lib/account-api.mjs` | Existing server input validation, calculations, immutable encrypted snapshots and purchase/ownership boundaries. |

No new database service is required: the knowledge bank is version-controlled source, and the accepted editorial document is stored inside the existing encrypted report. There is no clinical content-editing admin UI or live literature-search service in this change.

## Selection and personalization

The top-level `personal-report-v1` contract remains compatible with earlier consumers. Newly composed documents also carry `editorial.version = personal-science-v2`, independent knowledge/evidence/layout versions, clinical-review status, six-family signature, chapters, source snapshots, a complete input record, derived facts and frozen Bulgarian translations.

The composer covers entered markers through connected features, not a three-priority cap. It distinguishes normal/maintenance information, missing context, confirmation needs and safety alerts. The original model's withholding and critical-result logic stays authoritative. Ordinary optimization modules are suppressed for critical alerts; an estimate is not fabricated for a sparse or withheld result.

Personal examples include explicit fasting-glucose context, known-diabetes/pregnancy exclusions for prevention discussions, separate conventional mmol/L and mg/dL boundaries, actual weekly activity, existing strength sessions, disrupted sleep and estimated absolute lymphocytes from the supplied same-panel WBC and percentage. A calculated value is labelled calculated and retains its input IDs and formula. No missing HbA1c, clinical history, laboratory result, personal treatment response or study eligibility is inferred.

The illustrative activity progression is an editorial implementation example, not a guideline prescription. Research duration, practical habit-review windows and laboratory follow-up remain distinct. A clinician-discussion treatment paragraph is not a claim that a medication is approved for age reversal or that the individual is eligible.

## Extending the databank

1. Add a stable module ID and reviewed physiology/context/evidence blocks to `modules.mjs`. Every substantive clinical block must reference an applicable primary source.
2. Register sources with publication identity, evidence kind, exact URL and review status. Do not repurpose an existing source ID for a different claim.
3. Add explicit eligibility and suppression rules in the composer. Missing prerequisites must result in a conditional explanation, not invented suitability.
4. Add paired Bulgarian text with identical placeholder names. Run `npm run locale:build`; commit source and generated dictionaries.
5. Test a relevant result, an established/normal pattern, missing information, conflicting/unsupported context, critical/withheld results and alternative units. Add a fictional fixture for material layout changes.
6. Bump the relevant knowledge, evidence or layout version. Preserve stored editions and their frozen translations/citations.

Each module currently carries `reviewStatus: clinical-review-required`. Source checking and editorial tests do not constitute clinician review. Review owners, clinical sign-off and evidence refresh governance remain operational release requirements, not properties the code falsely assigns to itself.

## Persistence, access and privacy

New server saves compose from validated server-calculated facts only. Client prose, claimed versions and unlock flags are not authoritative. The existing AES-GCM owner/record/kind binding and idempotent UUID insertion remain unchanged. Reads do not regenerate reports. The locked base-report allowlist excludes the full document, including in account exports. Existing included Heart & Vascular and system-assessment access remains unchanged; this work does not introduce new prices or activate payments.

Only an explicit export creates a plaintext downloadable PDF. In a native app the PDF is written to the private application cache and passed to the operating-system share sheet. A cancelled share removes that temporary file. Later exports remove owned cached PDFs older than 24 hours; the OS may purge them sooner. This is not a guarantee of immediate deletion after a successful share. User-selected exported copies are outside the application's encrypted record store. The iOS privacy manifest declares the file-timestamp reason used for cleanup.

The renderer accepts escaped text and safe HTTP(S) citations, not user HTML. The PDF runtime denies external resource loading. Navigating to a different report or a locked view while generation is running prevents delivery of the stale report.

## Build and verification

`npm ci` installs the isolated, lockfile-pinned PDF engine through the root postinstall hook. Environments intentionally skipping install scripts must run `npm run report:install`. Framework, Pages and native builds generate the lazy runtime before publication. Do not commit that generated runtime or dependency directories.

Run `npm run check`, `npm run build`, `npm run build:pages`, and `npm run build:native` for applicable changes. Run `npm run report:qa` for 32 real PDFs from eight fictional profiles across English/Bulgarian and both export scopes. The `Editorial report review` workflow also exercises the actual Pages app in Chromium, checks 320/390/1280 layouts in all themes/languages, downloads six actual PDFs and publishes review artifacts. It does not deploy either hosting surface.

Inspect rendered PDF pages for headings separated from their first content, clipped glyphs, footer collisions, unsupported numbers and incomplete records. Automated composition and DOM checks are not visual or clinical validation. Native share behavior has isolated tests; physical-device acceptance is still required before shipping the native experience.

## Clinical PhenoAge folio

New Clinical PhenoAge reports freeze a `clinical-folio-v2` layout with the accepted narrative. The report groups related measurements, promotes the case-specific decision to the first page of the narrative, and separates habit review from clinical follow-up. The app and both PDF exports read the frozen facts and reference comparisons. Earlier folios and editions keep their stored prose and original rendering path.

The Clinical cover and PDF use locally bundled [Source Serif 4](https://github.com/adobe-fonts/source-serif/releases/tag/4.005R) under the SIL Open Font License. The moon artwork is decorative. The clinical note appears on both PDFs and in the app reader. The underlying calculation, safety policy and access checks run through the existing assessment path.

The browser QA downloads both PDFs in English and Bulgarian from the fictional reference case. It then edits the questionnaire and blood measurements through the app, verifies that the report leads with the established routine, and downloads both English PDFs for that comparison case.
