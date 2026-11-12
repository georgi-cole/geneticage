# Editorial v2 integration verification

Fictional fixtures only; no production account, payment or personal health record was used.

## Reproducible checks

- `node scripts/report-locale.mjs --check`: template/placeholder parity and generated dictionary freshness.
- `node --test tests/report-editorial.test.mjs`: source completeness, six-family selection, conventional glucose-unit boundaries, suppression for critical/known-disease contexts, activity constraints, missing derived inputs, snapshot translations, safe rendering, PDF scopes, stale export protection and native cache/cancellation.
- `node --test tests/pages-app.test.mjs`: actual app event flow now expects downloadable editorial PDFs rather than a browser print dialog. The DOM environment cannot load the runtime, so it must show a visible export error rather than claim success.
- Existing composer, family UI, account ownership/encryption, legacy export and payment tests remain in the standard suite.
- `node scripts/report-qa.mjs`: 32 actual PDF files across eight fictional profiles, two languages and two export scopes.
- `node scripts/report-browser-qa.mjs` after the Pages build: actual Chromium rendering and download events, 18 viewport/language/theme combinations, four completed PDF downloads, three report tabs and no uncaught browser exceptions.

## Local review

The generated PDFs were rendered with MuPDF; all pages were checked for empty pages, invalid text glyphs and text outside the page bounds. The clinical feature pages, Bulgarian typography, covers, data tables and other assessment layouts were also inspected visually. A chapter heading is kept with its first complete content row rather than only its introductory deck.

The managed local browser blocks navigation to a loopback preview. No browser policy was disabled to bypass that restriction. Offline component rendering is a separate layout check, not evidence that an app download works. Full-app browser checks run in the isolated GitHub Actions environment and their real artifacts are the acceptance evidence for download behavior.

## Remaining release acceptance

Qualified clinical review of interpretation/treatment/timing modules, representative user comprehension testing, and physical-device iOS/Android share-sheet acceptance are required before a public paid clinical/native release. Successful automated tests are not clinical sign-off. No merge, hosted publication or payment activation is performed by this workflow.
