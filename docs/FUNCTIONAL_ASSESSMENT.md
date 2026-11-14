# Functional assessment: local research preview

## Unified Fitness assessment

Fitness is now the single entry point and sample in the assessment/report library. It collects shared profile details once, offers existing aerobic routes and optional physical tasks, and composes a shared Fitness folio. The older `functional` type remains readable for historical snapshots but has no new-assessment card.

Selection is deterministic: a complete compatible physical battery supplies the headline age; otherwise the supported aerobic result supplies it. Missing routine predictors can be left blank while completing physical tests. A measured oxygen-uptake result retains its aerobic meaning when physical testing supplies the headline. These ages are never averaged. The report connects task demands, everyday limitations, aerobic context and body composition, distinguishes concordant from discordant age comparisons without claiming validation, and provides one combined plan. Unsupported domain norms are not invented.

All selection and context are recomputed server-side before new encrypted saves. Existing snapshots stay immutable. Oxygen-uptake trends retain their original aerobic model/reference key even when a physical battery supplies the headline; a model switch cannot become an oxygen-uptake trend point under the wrong method.

## Original functional implementation

The legacy Functional model remains internally available for historical records and equation regression checks. The unified Fitness entry uses the existing shared consent, draft, guided-question, full folio, report/export and encrypted-save paths. Earlier assessment equations are unchanged. The unified sample demonstrates an aerobic estimate with partial physical testing.

The scored battery is selected by age; every measurement required by that branch contributes to its age equation. Missing, symptom-limited, adapted or incompatible measurements withhold the estimate; they are never zero-filled or silently omitted. Coefficients and individual equation terms appear in the report, and rounding happens after summation. Equation terms are neither independent domain ages nor causal intervention effects.

## Ages 20–64: Oak et al. (2012)

DOI 10.15758/jkak.2012.14.3.81; source: https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART001684777

Original variables: BMI (derived from height and weight), PACER shuttle count, Sargent vertical jump cm, sit-and-reach cm and sit-up repetitions. Original sex-specific under-40 and 40-plus coefficients are retained. Korean indexing confirms the female under-40 sit-up coefficient is minus 0.144; the English abstract contains a punctuation error. Abstracts disagree about sample size (646/645) and upper age (69/65); this app conservatively stops the younger model at 64.

The study split participants into development and holdout groups. Its high reported R-squared concerns a PCA-derived fitness target, not independently established personal biological-age accuracy. This is not external validation in Bulgarian adults or unsupervised home users.

A 20-metre running course and screened vigorous running/jumping are necessary. This is a field assessment, not an indoor no-space battery. A qualified readiness/protocol check is required. The complete paper methods could not be retrieved: PACER cadence, sit-up timing, jump scoring and reach zero must be verified before public release. The indexed abstracts establish coefficients but cannot establish all protocol details. No treadmill value, marching count or plank is substituted.

## Ages 65–94: Yoon et al. (2024)

https://doi.org/10.1186/s12889-024-19922-8 (CC BY 4.0).

Original five physical measurements: grip kg, 30-second chair count, two-minute march count, floor sit-and-reach cm and three-metre TUG seconds. Original equation: 79.807 - 0.017*steps - 0.203*grip - 0.031*chair - 0.052*reach + 0.985*TUG - 3.468*sex, male=1/female=2.

Reported older cohort: 142,471 Korean participants; adjusted R-squared 0.243; SEE 4.793 years. These are study statistics, not personal uncertainty bounds. Age 94 is an application restriction, not a validated study boundary. The source describes standing Takei grip, two attempts per hand, and maximum of two TUG times; this differs from common clinical TUG conventions and is retained explicitly. Equipment compatibility, reach zero, home reproducibility and transfer to other populations require verification.

## Interpretation and outstanding work

### Entry and report refinements

Matching age, sex, height, weight and available composition readings prefill from the health profile, including when a functional draft was opened before profile age was supplied. Optional birth year appears beside the profile age field and suggests an age. Birth year cannot determine whether a birthday has passed: users confirm or adjust the age, and a new year's suggestion remains editable. The confirmation year is saved with the profile; historical report ages remain fixed.

Physical tasks now have a result field and a skip button, without a separate completion questionnaire. Blank/skipped results stay unknown and cannot produce a full age. Metric and imperial units normalize to the unchanged published equations. Optional measured body-fat and skeletal-muscle percentages contextualize BMI without altering coefficients. Main report results are rounded and written in plain language; equation terms appear only in the methods tab.

The initially proposed arbitrary two-domain reference-profile age was removed. The current published-model implementation is not a reliable universal medical aging clock. The wider eight-domain proposal is not scientifically established by these equations. MAPS (https://doi.org/10.1007/s11357-025-01803-6) supports a 13-test five-domain composite but studied only 112 adults aged 42–46 and does not validate a universal age conversion.

Do not invent expected healthy intervals where compatible age/sex norms have not been verified. Do not call a regression term a healthy target. Model changes at 40 and 65 can produce discontinuities and must not be called accelerated aging or training progress. Versions stay distinct; no functional-age trend series is created across models.

## Verification

Formula and contribution tests cover both sexes, age branches, every younger input and every older metric, invalid units, negative reach, missing/skipped inputs, readiness/protocol restrictions, reports and source snapshots. The actual Pages DOM flow opens the Functional sample. Build, locale verification, lint and typecheck pass. Two HTTP-dependent suite checks are blocked by environment EACCES loopback access. Visual browser verification is blocked by the dev server's inability to write its Cloudflare registry outside the workspace. No deployment, main merge, or public clinical validation has occurred.
