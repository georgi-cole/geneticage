# Laboratory entry checks and age reporting

Reviewed 6 November 2026. Protocol `clinical-inputs-2026-11-06-v3`; safety rules `lab-review-2026-11-06-v1`. The published formula and conversion factors are unchanged. These prototype safeguards require clinical approval before beta/production use; they do not establish an individual confidence interval, validate the calculator, diagnose illness or identify deliberate manipulation.

## Three independent signals

1. Reference direction: yellow/down arrow below, green/check within, red/up arrow above. Your supplied interval takes precedence over the optional pinned ABIM adult guide. An unassigned comparison stays neutral. Being inside an interval does not prove health; an abnormal result is not necessarily an entry error or an emergency. [Reference policy](LAB_REFERENCE_POLICY.md).
2. Entry checking: a separate violet/neutral circled question mark, explanatory text and, for structurally invalid input, a dashed input border. Reject non-numerical, non-positive or unsupported-unit entries and lymphocyte percentages above 100. Lymphocytes must be relative %, RDW must be RDW-CV %, creatinine must be a blood concentration, and glucose must not be HbA1c. Labels explain these distinctions; numbers alone cannot identify every wrong test or unit.
3. Critical alerts: a separate triangular warning, visible text and a source link. They apply independently of custom reference intervals, guide settings, fasting, age-estimate eligibility and the collection-context gate. No alert does **not** establish safety: only selected published thresholds are implemented.

Feedback appears after leaving a measurement or reference field. Editing clears its stale verdict immediately. Unit, assay and reference changes update reviewed fields in place; no form replacement, focus loss or native validation bubble. The assessment header and Back/Continue actions remain fixed; unusually small screens, expanded reference editors and lengthy alerts scroll within the field area. Collection context is asked before the measurements so an explicitly eligible published comparison can be shown during entry. Unknown circumstances are never assumed normal.

## Selected critical thresholds

| Measurement | Rule | Primary source |
| --- | --- | --- |
| Serum/plasma glucose | ≤50 or ≥400 mg/dL, inclusive | [Mayo Clinic Laboratories, October 2026, p. 2](https://www.mayocliniclabs.com/-/media/it-mmfiles/Special-Instructions/4/2/A/critical-values-semi-urgent-results-list.pdf#page=2) |
| Blood leukocytes | ≥100 × 10⁹/L, inclusive | [Mayo, p. 1](https://www.mayocliniclabs.com/-/media/it-mmfiles/Special-Instructions/4/2/A/critical-values-semi-urgent-results-list.pdf#page=1) |
| Blood leukocytes | <2 × 10⁹/L, strict | [Crouse Health critical chart](https://laboratory.crouse.org/healthcare-providers/laboratory-services/reporting-documents/critical-value-chart/) |

The Mayo glucose age band includes adults. Its creatinine critical limits on that page are paediatric and are not applied to adults. Crouse's high outpatient leukocyte rule is not applied universally because setting is unknown; its adult creatinine rule depends on patient history and is not treated as an unconditional alert. Critical thresholds differ by laboratory/method and are separate from reference intervals. These sources are not EU/FDA approval of this app or universal limits.

Compare glucose in the source's mg/dL and leukocytes in ×10⁹/L, using the existing conversions and 12 significant digits to avoid binary boundary errors. For example, 2 mmol/L glucose triggers the low alert while retaining a yellow “below” comparison. Alert wording asks for value/unit verification and urgent medical advice for a recent or unreviewed result, with emergency care if seriously unwell. Historical results can already have been managed; the app does not infer a current emergency from their date alone. An alert withholds the age; valid numerical entries can still be saved for clinical review.

## Conservative input coverage

The prototype screens against the observed per-marker span in the **cleaned BioAge NHANES III dataset**, ages 20–84, at [commit b1f9fc0](https://github.com/dayoonkwon/BioAge/tree/b1f9fc02f086cd4aa74185f2335ab1366082e7fe). This is a transparent application guard against extrapolation, **not** the original PhenoAge validation domain, a normal range, a physiological possibility limit or an emergency threshold. A correct result outside it is retained, flagged for checking and withheld from age estimation. Values inside it do not prove that their joint pattern is supported or that an individual estimate is reliable.

The BioAge preparation removes sex-specific biomarker outliers beyond five standard deviations. Our policy does not re-estimate those cutoffs from already cleaned data. It extracts available measurements independently from 18,127 rows aged 20–84, without imposing complete cases, pregnancy or fasting filters. This is a different sample from the original model derivation/validation. The current PhenoAge fasting/context gates still apply separately. See [Liu et al.](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718) for the validation study, and [BioAge preparation](https://github.com/dayoonkwon/BioAge/blob/b1f9fc02f086cd4aa74185f2335ab1366082e7fe/data-raw/nhanes_all.R) for data processing.

| Marker | Prototype coverage, normalized units |
| --- | --- |
| Albumin | 22–61 g/L |
| Creatinine | 9–247 µmol/L |
| Glucose | 2–16.8 mmol/L |
| CRP | >0–4.9 mg/dL |
| Relative lymphocytes | 3.2–76.5% |
| MCV | 59.7–117.6 fL |
| RDW-CV | 10.9–19.6% |
| ALP | 17–264 U/L |
| WBC | 2.1–18.6 × 10⁹/L |

Stored floating-point noise is removed at six significant digits, then minima/maxima are rounded outward to 1 unit for albumin/creatinine/ALP or 0.1 for the others. **CRP's historical assay floor is deliberately not a lower gate**; modern exact low values remain admissible, while below-detection-limit substitutions remain disallowed. No participant rows, downloaded third-party implementation or new runtime dependency are shipped. Aggregate counts/extrema, pinned input SHA-256 and independently written derivation are in `design/research/lab-safety-cohort.json` and `scripts/research/derive-lab-coverage.py`.

Converted intervals beside the inputs are explicitly approximate, in the selected input unit. Comparisons still use the unrounded source units; reports show those original intervals and a converted measurement. Rounded display limits never become classification inputs.

## Age display and immutable records

After the existing age 20–84, nine-marker, fasting and historical-context gates, the critical and input-coverage checks must pass. The formula runs unchanged. Only finite estimates rounding to **1–99 whole years** are displayed. A value rounding to 100 never appears as 99 or starts an age counter. An unmeasured paired-form emblem and an explanation replace the number across results, Overview and reports; history says “Needs review” and trends exclude it.

The 1–99 reporting window is an explicit **product policy requested for this prototype**, not a published biological boundary. Clinical PhenoAge is a mortality-equivalent age scale; mathematical values above 100 do not prove false input or an impossible human age. There is no evidence-based universal individual-output cutoff in the cited papers. Clinical review must revisit this conservative policy before public service claims.

The server independently recomputes new snapshots and stores a withheld result with no numerical age when needed. User-supplied ages/unlock flags cannot override it. Existing encrypted assessments and stored findings are never rewritten or silently recalculated. A historic number outside the new reporting window is hidden only in the current display, with an explicit note in its report; the original record/export remains intact. Earlier snapshots do not silently gain the new critical/coverage interpretation on read.
