# Laboratory comparisons in the prototype

Reviewed against sources on 6 November 2026. Catalogue `abim-2026-01-v1` uses the [ABIM January 2026 reference sheet](https://www.abim.org/media/e2wdwdqu/laboratory-reference-ranges.pdf). This is an educational adult guide, not a locally validated diagnostic service. The [FDA recognition of CLSI EP28-A3c](https://www.accessdata.fda.gov/scrIpts/cdrh/cfdocs/cfStandards/detail.cfm?standard__identification_no=31787) concerns how intervals are established and verified; it does not approve one universal set of numerical ranges. [MedlinePlus](https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/) explains why the reporting laboratory’s interval and clinical context matter.

## Precedence and missing information

1. Any user-entered laboratory bound takes precedence, in the entry’s unit. A one-sided limit is complete as entered; do not supply its missing side from a guide. Invalid bounds require correction and cannot trigger fallback. Inclusive/exclusive limits are explicit.
2. New drafts default to the published guide, with an option to use laboratory limits only. An old saved record lacking this metadata remains lab-only. Guide values are never written into user-entered bound fields.
3. Published comparisons require a known adult age and confirmation of the historical collection context. Current questionnaire circumstances do not override that history. A withheld collection context leaves guide comparisons unassigned; supplied lab intervals can still be displayed separately from the withheld age.
4. Creatinine requires the female or male reference group. The entry step can prefill the group from a user's explicit health-profile answer and lets the user match it to the lab report. Fasting glucose requires confirmed fasting. The CRP entry step asks which assay the lab used. Standard CRP uses the ABIM interval. The November 2026 guide adds the adult hs-CRP cardiovascular comparison at 2 mg/L from Mayo Clinic Laboratories, separate from the standard CRP interval. [Mayo Clinic Laboratories hs-CRP reference](https://www.mayocliniclabs.com/test-catalog/Overview/800024)

## Units, presentation and snapshots

Compare in the guide’s original units using the existing model conversion factors, retaining 12 significant digits for floating-point boundary comparison. Show that original interval and, when the input unit differs, the converted measurement. Rounded display values must not replace comparison inputs. Custom limits use the selected measurement unit; changing that selector converts existing limits and asks the user to verify them.

Every row distinguishes “your lab interval”, “published guide” and “no reference comparison”. Expanded guide rows link to the source page. The summary keeps supplied-lab and published-guide results separate. A position rail is decorative and bounded, not a risk score or confidence interval. Being inside an interval does not establish health; being outside does not diagnose illness. These comparisons do not change the published PhenoAge formula, eligibility rules or reported age, and do not prescribe a target or assign years to individual markers.

The encrypted assessment snapshot stores the mode, catalogue version, optional reference group, CRP assay and custom bounds/operators. A future catalogue update must add a version and keep existing versions available. Old clinical values and stored priorities are never regenerated on read. No additional database schema or browser health-data persistence is introduced.

Before beta/production, the responsible clinical laboratory reviewer must approve applicability to the intended population and testing methods. This implementation and its regression tests do not provide that approval.

## Independent entry and critical checks

Reference direction now appears after leaving a field: yellow below, green within, red above, each with a symbol/text label. Input errors use a separate question mark and violet/dashed treatment. Independent critical and prototype-coverage checks can withhold a new age even when a custom interval says “within”; this does not modify the reference interval or formula. Collection context is asked before the measurements so the published guide can work during entry without assumed eligibility. See [entry safety policy](LAB_SAFETY_POLICY.md).
