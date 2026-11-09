# Personal report generation

The report layer turns an existing assessment into a selected, connected explanation. It does not replace the scientific calculators, eligibility rules or measurement reviews. The output is an automated educational report; `clinicalReview` remains `false`.

## Components

| File | Responsibility |
| --- | --- |
| `public/report-composer.mjs` | Deterministic selection, family adapters, facts, provenance and report-document construction. |
| `public/report-content.mjs` | Curated English paragraph templates and required placeholder binding. |
| `public/report-document-ui.mjs` | Escape and render supplied sections without recomposing saved prose. |
| `public/report-ui.mjs` | Base assessment tabs, result panel, recorded inputs and methods. |
| `public/heart-vascular-ui.mjs`, `public/system-assessment-ui.mjs` | The same reading structure around each family's existing result. |
| `public/report-export.mjs`, `public/assessment-report.css` | Personal/technical browser-print scopes and restoration of the screen's disclosure state. |
| `lib/account-api.mjs` | Validate inputs, calculate server results, compose new documents, encrypt snapshots and enforce access. |
| `public/evidence.mjs` | Approved source identifiers and links. |

## Composer contract

```js
import {composeReportDocument} from './report-composer.mjs';

const document = composeReportDocument({
  state,                // validated assessment state
  clinical: null,       // supplied Clinical PhenoAge result when applicable
  priorities,           // supplied approved base-model findings, if available
  generatedAt: null,    // caller-provided ISO timestamp for a saved document
});
```

`REPORT_DOCUMENT_VERSION` is `personal-report-v1`. Identical supplied inputs and versions produce the same plain JSON document. The composer does not read the clock, call a network service or run an age/risk calculation. A missing timestamp remains `null` for an unsaved report.

The base adapter uses `state.answers`, laboratory entries and collection/reference metadata. It takes the supplied clinical result, then the result already present in state. Heart and system adapters use `state.assessmentType` and `state.heart` or `state.system`, each containing `{inputs, result, review}`.

| Output | Meaning |
| --- | --- |
| `version`, `type`, `generatedAt` | Document contract, assessment family and creation time. |
| `modelVersion`, `contentVersion`, `assessmentContentVersion`, `questionnaireVersion` | Calculation, report-editorial, assessment-content and questionnaire provenance. Report content uses the independent `REPORT_CONTENT_VERSION` from `report-content.mjs`. A family without the base questionnaire has no questionnaire version. |
| `resultState` | `ready`, `withheld`, `missing` or the questionnaire-only `profile` state. |
| `sections` | Ordered `{id, kind, title, paragraphs, sources, factIds}` objects. Kinds are `intro`, `priority`, `strength`, `context` and `plan`. |
| `facts` | `{id, value, unit, provenance}` records identifying supplied answers, measurements, comparisons and results. |
| `coverage` | Questionnaire totals/groups, measurement counts and, for families, missing inputs. |
| `sourceIds` | Deduplicated identifiers used by the selected sections. |
| `citations` | Frozen `{id, label, url}` source records, in the selected source-ID order. |
| `clinicalReview` | Always `false`; composition is not clinician review. |

Base reference facts retain comparison values/units, bounds and exclusivity, reference source/version, assay and reference-group provenance. Original assessment inputs remain in the separately encrypted assessment record. Facts are a traceability layer, not a new clinical model.

Questionnaire group and overall counts come from the same applicable schema. Family reports use `0/0` for the unused base questionnaire; this is not a completion score. Their measurement requirement is derived where supported, and is `null` for Heart & Vascular rather than inventing a fixed denominator.

## Selection in v1

The base report uses the existing approved profile findings and applicable laboratory comparisons. Its ordering is an editorial policy, not a calculated risk or expected-benefit score. It selects at most three priority themes and two foundation paragraphs. Related activity and strength findings can be combined into one theme. For the supplied sample, the selected story connects glucose clarification, existing activity and sleep; a generic heavy-drinking paragraph does not displace those topics.

Missing context and reference limitations stay explicit. A lymphocyte percentage does not become a diagnosis of low absolute lymphocytes. Unknown CRP context is not interpreted as hs-CRP. Dedicated hs-CRP cardiovascular thresholds remain in the measurement review rather than being recast as a generic laboratory-interval priority. Critical-result alerts suppress ordinary lifestyle priorities. Missing and withheld results do not receive a successful-age narrative.

Family adapters preserve their own meaning: cardiovascular risk/reference comparisons, modeled diabetes-risk comparison, kidney filtration/reference comparison, and estimated or measured fitness. They reuse supplied results and review states. They do not combine the outputs into an overall age.

## Saving and access

Creation follows the existing server boundary:

1. `validateSnapshot()` keeps recognized input fields and recalculates the selected assessment. Client-supplied prose, model versions, results, priorities and unlock flags cannot determine the saved report.
2. The server builds the existing report metadata and attaches `report.document`, using the clean state, server clinical result/priorities and server timestamp.
3. Both assessment and report are encrypted with the existing AES-GCM owner/record/kind binding.
4. The existing UUID insert remains idempotent. Retrying an ID cannot replace its ciphertext or interpretation.

Reads do not regenerate a document or its citations. Earlier reports without `document` keep their stored result/findings and use the legacy presentation path. The document renderer uses frozen citation labels and safe HTTP(S) URLs; live-catalogue fallback is limited to older documents with no citation snapshot. There is no backfill or silent migration.

The locked base-report response uses an explicit field allowlist and the original one-insight preview. It never includes `document`, including in account exports. Purchased access and the existing private review mode expose the saved document. Review mode remains disabled when payments are enabled. Heart and system reports retain their existing included access. The report layer does not alter purchase, refund, ownership or encryption rules.

## Reading and PDF export

All report families use **Your report**, **Your data** and **Method & evidence**. The selected narrative keeps its supporting values and relevant limitations. Full measurements, input answers and detailed methods remain separately inspectable.

**Report PDF** prints the personal narrative. **Data & methods PDF** prints the supporting record. These use browser print/save-PDF, not a separate document-generation service. Browser-menu printing and Ctrl+P default to the personal report, even when another tab is selected. Explicit technical export selects its own scope. The export controller opens relevant details for printing and restores the previous screen state afterward.

Use `data-export-scope="report"` or `data-export-scope="technical"` for new blocks. Keep headings with paragraphs and measurement rows intact in print CSS. Verify actual generated PDFs; DOM tests cannot establish pagination or typography.

## English and Bulgarian maintenance

Stored paragraphs use canonical English. The language layer translates complete approved templates for display while preserving bound numbers, units and identifiers. Switching language does not change the saved document or rerun the calculation.

Edit English templates in `public/report-content.mjs`; add matching Bulgarian entries to `design/localization/*.tsv` with the same placeholder names. Presentation labels also have TSV entries. Run `npm run locale:build` to regenerate `public/locales/bg.mjs`; do not hand-edit the generated dictionary. See `design/LOCALIZATION.md` for voice and preservation rules.

## Extending the report

For a new topic, define an approved template, its input/context requirements and sources, then add a deterministic selection rule. Bind values from traceable facts. Do not promote missing answers to healthy findings or add personal effect forecasts. Add cases that demonstrate both eligibility and suppression.

For a new family, first provide its validated `{inputs, result, review}` contract and scientific meaning. Add an explicit family adapter and render it through the shared report-document view. Preserve the family's missing, review, bounded and ready states, and its entitlement policy. Do not fall back to Clinical PhenoAge language.

Use fictional fixtures for a typical profile, sparse/uncertain answers, established habits, critical/withheld results, non-default units, reference-boundary cases and each family/method branch. Account tests must cover server-generated content, immutable old snapshots, preview/export leakage, owner isolation and included or purchased access. The payment suite uses a local mock provider.

Run the applicable focused tests, then `npm run check` and `npm run build`. For layout changes, inspect a phone and wider viewport, English/Bulgarian, all active themes and both actual PDF exports. The test runner discovers `tests/*.test.mjs`; account-document coverage is in `tests/report-document-account.test.mjs`, and verified payment access is exercised in `test-payments.mjs`.

## Current boundaries

This release uses curated templates and fixed selection rules. It has no LLM writer, live research retrieval, clinical review, individualized treatment prediction or newly validated age model. Longitudinal interpretation and richer goal/constraint matching require separate contracts and evidence review.

Version meaningful editorial changes with `REPORT_CONTENT_VERSION`; version document-contract changes with `REPORT_DOCUMENT_VERSION`. Preserve source-ID meanings and capture their labels/URLs when composing a new document. Older saved prose and citations remain unchanged. Keep earlier template translations available so historical prose remains readable in Bulgarian.
