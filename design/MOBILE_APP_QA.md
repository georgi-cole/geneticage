# Mobile app revision verification

5 November 2026.

## Checks completed

- Model/scientific regression: formula and unit conversions, missing/invalid inputs, age/fasting/collection-context gates, questionnaire guidance. The standard age-45 sample remains 50.1816209217 before rounding.
- Account regression: registration/storage consent, CSRF, ownership, encryption, immutable server-calculated snapshots, export and deletion.
- Payment regression: activation, ownership/price, retries, verification, unpaid and paid access, refunds and cancellation. No real card, account or transaction was used.
- Theme tests: three active themes, Black Metal default, old preference migration, shared markup, full-opacity paint masks with no blur or geometry transforms.
- Guided-flow tests: every applicable conditional question is visited in both directions; long choice sets preserve every option; nine blood measurements appear once across the entry steps; lab errors route to their step; record pagination is bounded.
- TypeScript and module syntax checks passed.
- Browser QA in the supported computer-use browser: approximately 320 × 668 CSS pixels for the four primary destinations. Each measured a 548 px content viewport/548 px content height, without overlap. The result screen and report chapters also fit. One blood-chemistry page differed by about 1 px due to browser rounding.
- Optional form answers, age and lab inputs persist across Back/Continue. Multi-select choices persist between pages; selecting None clears earlier-page selections.
- Invalid age/date and zero albumin are rejected. An unconfirmed collection context withholds the estimate. Confirming the synthetic sample gives 50 years.
- Full review report: 17 chapters, including all six questionnaire sections and nine blood marker rows. Exactly one chapter is visible during reading; print media exposes all 17. Automated/unreviewed and earlier-protocol notes remain in the first chapter.
- Reports exposes a sample/current report without requiring a profile. Account has distinct guest and connected-profile controls. Saved libraries were checked against the existing local test profile; no user account or health record was created/deleted for this revision.
- Live transition inspection showed full opacity, no filter, separate curved paint masks and zero isolated image captures. Cleanup removes temporary names/animations. Resize and visibility changes release stale snapshot bounds.
- The three-step consultation flow was exercised with fictional details through its local preview. The final screen explicitly confirms nothing was sent or booked.

## Optional legacy harness

`test-purchase-ui.mjs` requires the optional Playwright package, absent from this checkout. Its initial invocation stopped at module import, before launching a browser. The fixture assertions were updated for chapter-based reading and Print / PDF, but that standalone harness was not executed. Equivalent full-report visibility, nine-marker and print coverage were checked with the supported browser tools above. The account/payment unit suites passed independently. No dependency installation was required.


## Ember / Paired revision — 5 November 2026

- Black Metal's accent is `#ff8a45`; the primary action has an orange border and a polished black gradient, with no mint fill. Its measured height is 44 px.
- The overview primary action and method link share the same top/height at 320 px CSS width. SVG arrows stay inside their control; there are no remaining text-arrow glyphs in rendered actions.
- At an observed 320 × 666 viewport, Overview and About measured 547 px content height and 547 px scroll height. Contact and Reset have matching 64 px rows.
- Overview, assessment, report, account, theme, settings and directional glyphs use the custom shared Paired family. Bionic and Blood Moon retain their palettes and the same component dimensions. Browser zoom/restoration can produce a uniform 1–2 px position rounding difference without changing sizes or hierarchy.
- A real first-character `g` input had native email typeMismatch=true while the form showed no error, no aria-invalid marker and no native popup. Continue produced inline feedback. Editing the incomplete value to `gg` removed its feedback and did not revalidate while typing.
- A complete fictional email, country and topic advanced on Enter to step 2 rather than submitting the final preview. Back retained the entered values. The final preview remained blocked by an unchecked required acknowledgement, using an inline message.
- The valid three-step enquiry preview was also completed with fictional data and the required acknowledgement. The final screen confirmed that nothing was sent or booked.
- The application-flow/theme unit suites, module syntax and TypeScript checks cover the revision. Browser checks use the supported computer-use APIs; no additional browser dependency was installed.

## Continuous icons / lunar v2 revision — 5 November 2026

- Navigation SVGs measured 24 px with a 2-unit stroke. Functional outlines are continuous; action arrows use one clear stem and head. Theme symbols, account settings and arrows use the same shared family.
- Blood Moon's new generated disc loaded in both Assessments and Reports. The complete silhouette sits beside text in a reserved art well, with no crop or text overlap at 320 px width and the normal 385 px viewport. The original PNG has actual alpha transparency, including all four corners; delivery uses 256/512 px WebP.
- At an observed 320 × 666 CSS viewport, Overview, Assessments, Reports and the connected-profile Account screen measured 547 px content height and 547 px scroll height. No horizontal overflow or clipped navigation was observed.
- Reports had identical cover and title bounds in Black Metal, Blood Moon and Bionic. The title measured about 145.8 × 64.8 px and the cover 284 × 220 px at the compact viewport. Theme selection changes material and artwork without moving the layout.
- Account shows “You choose what to save.” in place of the duplicate lower brand. About shows “Understand the assessment”. “Private prototype” and redundant overview branding are absent; the header logo, educational limitations and sample labels remain.
- The app-flow/theme suites, module syntax and TypeScript checks passed. Scientific/account/payment behavior was not changed in this revision. Browser viewport overrides were reset after testing.

## Distinct screen artwork / Bionic core revision — 5 November 2026

- Blood Moon Overview shows a complete, more luminous disc inside the result dial; Assessments retains the approved shadowed portrait; Reports uses a separate copper-edged occultation. These are distinct source images, not one object recolored on every screen.
- The Reports document pictogram and background orbit motif are removed in all themes. Black Metal uses a generated obsidian section; Bionic uses a reference-led porcelain/titanium mechanical specimen. All selected assets loaded successfully, with alpha preserved in 256/512 px delivery variants.
- Browser inspection covered the 385 × 800 phone viewport and a compact 320 × 666 viewport. Overview and each themed Report screen measured 547 px content/scroll height at the compact viewport, with no horizontal overflow. The complete Overview moon stays inside the dial.
- Report covers retained the same 284 × 220 px dimensions and 145.8 × 64.8 px title dimensions at 320 px across all three themes. Text and artwork do not overlap. The small uniform positional rounding variation noted above remains about 1–2 px.
- The app-flow/theme suites and TypeScript checks passed after integration. Viewport overrides were reset. One stale localhost tab showed a cached connection-error page after the server restart; a fresh tab in the same supported browser loaded the healthy server successfully and was used for visual QA.

## Silver / blue / first-open and readout motion — 5 November 2026

- Black Metal's measured accent is `#cbd1dc`; the Report sculpture uses the silver-edged v2 resource. Bionic's measured accent is `#2f6494`, with the blue mechanical v3 resource. Both selected images loaded, and the Assessment motif contains no orphan dot node.
- Blood Moon is cropped against the upper-right corner, with restrained bare branches; its central dial is clear of a full moon. Shorter result screens use a smaller corner portrait. Assessment/Report lunar variations remain distinct.
- In a native browser check, a valid sample age animated through intermediate readouts of 21 and 28 before settling exactly to 50, with its comparisons settling to 45 and +5. The calibration pointer moved with the readout. During a theme paint, the incoming visual age held 00; it returned to the same correct final values after paint. Accessible text retained 50 throughout.
- Native reduced-motion emulation showed 50/45/+5 immediately, with no active counter animation. The temporary emulation was reset.
- At an observed 320 × 666 CSS viewport, Overview, the result screen, Assessments and each themed Report screen measured 547 px content and scroll height, without horizontal overflow. The count span inherits the large readout typography, and the welcome/sample footer is visible on Overview.
- The existing local fixture profile reloaded its latest immutable saved sample through a read-only request. It remained labelled SAMPLE / Not your result. No record was created, changed or deleted.
- Pure/controller checks cover no-profile and empty-profile welcome states, current/saved/sample/withheld provenance, immutable clinical values, counter formatting, motion holds, repeated selections, reduced motion, reopening and printing. Existing app-flow/theme suites, module syntax and TypeScript checks also passed.

## Paired v3, graphite action and EN/БГ — 5 November 2026

- Native phone checks observed 320 × 666 CSS pixels, with 547/547 px content/scroll height and 320/320 px body/scroll width on the main screens. Bulgarian titles, report covers and Account settings remain within the shared layout. Longer report chapters keep their intentional internal reading overflow.
- Black Metal measured `--accent: #cbd1dc`; the New assessment action has a brighter faceted graphite body and silver contour. Navigation SVGs measured 22 px with a 1.65-unit stroke. Theme and EN/БГ symbols are optically smaller while retaining their control hit areas.
- Bulgarian report chapters, sample provenance, laboratory units, age-comparison prose, questionnaire labels/options, Account and contact steps were inspected. An EN→БГ round trip restored the identical selected report chapter, Bulgarian content and document title.
- During a questionnaire language switch, age 52, height 69 with non-default `in` units, Unicode country text and the selected `Good` answer remained intact. The question index/progress remained unchanged. These were fictional local test entries; nothing was saved.
- The consultation select retained canonical `Discuss my blood results` while its caption changed language. Typing the first email character showed no inline or native warning. Explicit Continue produced inline Bulgarian feedback; editing cleared the feedback. The preview form sent no message and booked no appointment.
- The saved language survived a reload. Theme selection retained Bulgarian, and the readout still settled to the same sample 50/45/+5 values. Profile names are protected from translation. A development hot reload can reset the static shell while modules remain cached; a stable full reload was used for final preview checks.
- `test-language.mjs`, `test-app-flows.mjs`, `test-themes.mjs`, `test-result-motion.mjs`, `test-model.mjs`, module syntax and TypeScript checks passed. The translation source/runtime parity check covers 900 phrases and aliases. Publishing also requires the production build.

## Draft continuity and sourced report — 6 November 2026

- In a separate native browser test origin, completed a fictional questionnaire (21 applicable questions), then entered all nine blood values through the other route. The report retained 21/21 answers and 9/9 measurements, with age at draw 52 and its computed estimate. No account or real health record was used.
- At 390 × 844 CSS pixels, the nicotine question displayed all eight options; main content height and scroll height both measured 724 px. At 320 × 666 it displayed two pages of four, retaining the selected None response. Bulgarian long labels were inspected at the small size. Response cards have equal columns and clear selection marks; choice changes preserve the original inputs and keyboard focus.
- The actual report showed one supplied albumin interval and eight source-labelled published comparisons. Glucose used the guide’s original mg/dL limits alongside the converted entered mmol/L result. Own-interval precedence, one-sided/exclusive bounds, demographic/assay/context gaps and precision at boundaries also have automated regressions.
- Summary, Findings, Blood results and Details were opened. The longer chapter selector is absent; topic cards, marker rows and six questionnaire groups expand independently. Black Metal, Blood Moon and Bionic retain the same report structure and sample result, with both EN and BG inspected. The final BG sample disclaimer is translated. Measured body width equals the 390 px viewport; the report has deliberate internal reading overflow.
- Browser print-media inspection displayed all four sections on a white surface, with the report title, date and sample provenance. All 35 disclosures were opened through the UI and 27 answer/collection rows remained present. The print emulation was reset. The PDF control’s native print dialogue blocks further control in the in-app browser; actual OS PDF pagination/output is not claimed. An integration regression verifies that the print action opens all details and restores their prior state after printing.
- `npm run check` passes 39 test entries; the print-action extension also passes its focused integration test. Both the server and Pages production builds succeed. The dependency audit remains at zero findings. Existing upstream server source-map warnings remain.
- The user’s existing two localhost testing tabs were neither reloaded nor navigated. QA used a separate tab and port, so their answers and appearance preferences were preserved. The private Sites app, live records and credentials were not changed.

## GeneticAge naming — 6 November 2026

The product owner selected GeneticAge. Native browser checks at 390 × 844 (BG) and 320 × 666 (EN) show the GeneticAge header with a secondary KoleQuant publisher line. At the small size the brand ends at 119 px and appearance/language controls begin at 210 px, with no horizontal overflow. Black Metal, Blood Moon and Bionic retain the same brand and layout. The reduced-motion opening displays the original KoleQuant mark and wordmark alongside GeneticAge; temporary emulation is reset. Browser titles and generic/iOS application-name metadata read GeneticAge, and the built installation manifest uses GeneticAge for both name and short name. Existing user testing tabs were not reloaded. The 39 checks and both production builds pass.
