# KoleQuant Age / App design system

Revised 5 November 2026. A mobile application prototype with a consistent interface, three material themes and one focal result. Black Metal remains the default. This revision implements the app interaction model in the existing Sites prototype; it does not package a native iOS or Android binary.

## Research translated into this project

| Primary reference | Observed pattern | Application |
| --- | --- | --- |
| [Oura: new app design](https://ouraring.com/blog/new-app-design/) | One primary insight on the opening screen; core measures and longer-term history have their own destinations | Overview concentrates on the result; assessment entry and report reading are separate screens |
| [Oura: app structure](https://support.ouraring.com/hc/en-us/articles/360058599753-How-to-Use-the-Oura-App) | Summary cards open dedicated detail and trend views | Result, Insights and Details are sibling views; saved history opens its own progress view |
| [Apple: tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | A stable set of top-level destinations; tab bars navigate rather than perform actions | Persistent labelled Overview, Assessments, Reports and Account navigation; New assessment is an in-screen action |
| [Ultrahuman Blood Vision](https://www.ultrahuman.com/my/blood-vision/) | Blood data, its interpretation and subsequent actions are distinct parts of the journey | Guided input, a focal estimate and a chapter-based report, without importing health claims or scores |

The user no longer requires a visual match to kolequant.xyz. Reference applications inform the information hierarchy, not copied artwork, clinical claims or data.

## Screen contract

The application shell occupies `100dvh`, including safe-area insets. The header and four destination tabs stay outside the content area. Desktop uses the same destinations in a sidebar. There is no website footer in the app canvas; methods, privacy, support, reset and prototype information are reachable from Account.

Primary screens are composed to fit normal phone viewports, including a compact 320 × 667 layout. They do not form a long scrolling homepage. Dynamic viewport units respond to browser chrome and keyboard resizing. Internal overflow remains available for unusually small windows, larger accessibility text, exceptionally long content and report chapters; content must never be silently clipped to satisfy a height target.

- **Overview:** guests with no assessment see a welcome instrument with an em dash, “No assessment yet”, Start assessment and an optional sample preview. Creating a profile is optional. A current assessment takes precedence; returning profiles can reopen their latest immutable saved result. Sample results stay explicitly labelled.
- **My assessments:** a secondary theme motif, two entry routes, a short saved-history page and optional sign-in. Saved records paginate.
- **Questionnaire:** one question at a time, section progress, Back and Continue. Conditional follow-ups retain their original model rules. Long multiple-choice sets show up to six choices per page and preserve selections between pages. Numeric choices use a compact three-column group.
- **Blood entry:** five steps: collection details, three groups of three measurements, and collection confirmation. Validation occurs at each relevant step. Returning to a step retains its values and units.
- **Result:** Result, Insights and Details tabs. The scientific estimate is separate from guidance-based questionnaire findings. Each insight is a short page.
- **Reports:** a useful sample/current-report entry even before saving or registering. Saved reports have their own library. Reading uses one chapter at a time; all chapters remain in print/PDF output. Longer chapters can scroll within their reading surface.
- **Account:** connection/profile status, registration, privacy, methods, purchases, data management and About. Entering the screen does not wait for a network round trip. Loading, retry and empty states are explicit. History and purchase requests cannot blank the entire account when one collection fails.
- **Consultation:** three short input steps; the existing preview-only/no-transmission boundary remains explicit.

## Shared hierarchy and themes

### Launch signature

On a full app opening, a 2.2-second introduction shows the real KoleQuant mark and releases twelve illustrative DNA triplets into the actual Overview dial. The original `.instrument-dial` element is temporarily placed in the launch layer, then smoothly travels into its measured position in the result card and is returned to its original parent. A placeholder preserves layout; no second dial or invented result is created. Calibration and readout remain the actual component, and result counters begin after it lands. The mark's original colours remain intact; surrounding titanium, copper or platinum details follow the selected theme while preserving the same composition.

The introduction is native SVG/JavaScript, without a video download, generated substitute logo or new dependency. It appears on every full app opening/reload, with no skip or replay controls. Theme changes and navigation do not restart it. Reduced-motion users see the static brand for the same 2.2 seconds. Backgrounding, printing and a bounded timeout release the workspace safely. No completion flag or health data is saved. Result counters begin after the introduction releases the app; printing settles them without restarting the animation.

In a future native package, use the first still for the operating system launch screen and start this brand animation inside the app. The prototype does not create an iOS/Android binary. Naming candidates and dated store checks are recorded in `design/naming-research.json`; the app retains its current name pending the owner's selection.

All themes share their DOM, screen order, typography, controls, spacing and navigation. Theme changes do not rerender the interface or recalculate an assessment. User inputs remain in their original elements. Theme-specific nuances stay decorative and within fixed component bounds.

| Theme | Canvas | Accent | Material identity |
| --- | --- | --- | --- |
| Black Metal (default) | `#09090b` | Platinum silver `#cbd1dc` | Black-diamond facets, black polished controls and a cool silver sheen |
| Blood Moon | `#100d0e` | Copper `#e7a18e` | Garnet atmosphere, a cropped upper-right moon and restrained fine branches |
| Bionic | `#efeeea` | Metallic blue `#2f6494` | Porcelain canvas, smoky result glass, titanium ribs and steel-blue mechanical details |

Royal Purple, Silverbolt, Moonshine and earlier alternative layouts remain in `design/theme-archive/`. They are not offered in the active selector. Legacy Futuristic preferences migrate to Bionic. Invalid, archived or unavailable preferences resolve to Black Metal.

## Result instrument

`resultInstrument()` is shared by the sample and a valid personal estimate. Its centre is the real rounded clinical PhenoAge, supported by the age at blood draw and the explicitly labelled simple difference. The sample remains visibly labelled as illustrative, not personal.

The result uses a contrasting scoped material, fine illuminated edge, restrained atmospheric depth and engraved circular calibration. Rings, ticks, crosshair and orbit highlights are decorative, `aria-hidden` and never presented as a measured score, confidence interval, risk band or aging speed. Accent colour communicates the selected theme, not a medical severity.

The decorative DNA sculpture is removed from the active interface. The brand mark is retained. Black Metal reuses its original small WebP material in Overview and Assessments. Blood Moon has three related portraits: a partially cropped upper-right moon with restrained bare branches in Overview, the approved shadowed disc in Assessments, and a dark copper-edged occultation in Reports. The Overview dial remains clear of imagery. Its 256/512 px WebP variants have real alpha transparency. Reserved art wells keep secondary artwork beside the title and copy; decorative artwork is never an independent transition capture. Bionic's Overview ribs remain native geometry. Reports uses original generated sculptures: a silver-edged obsidian core for Black Metal and a porcelain/titanium shell with a metallic-blue mechanical core for Bionic. All themes share the same reserved title space and component bounds. The oversized document pictogram, report-cover orbit rings and unlabelled decorative assessment dot are removed.

## Typography and controls

The original [Paired icon system](design/ICON_SYSTEM.md), version 3, uses continuous silhouettes and a 1.65-unit stroke. Bottom navigation icons are 22 px, header theme symbols 20 px and action arrows 20–22 px. Paired cells, bonded read tracks, an evidence folio and complementary arrow tails make the family specific to this app without obscuring function. Black Metal controls have a glossy graphite interior and silver contour; its New assessment action adds brighter obsidian facets within the same 44 px height. Bionic uses polished steel-blue accents. The overview actions share one aligned row, and support/reset actions share one settings surface.

One system sans-serif stack across every theme; monospaced micro-labels identify metadata. Archived fonts and their licenses remain stored for future revisions, without changing active type hierarchy.

- Screen titles: 24–30 px; question prompts: 19–22 px.
- Primary result: 62–84 px, tabular numerals. Valid ages count from 00 to their rounded display value over 1,200 ms, coordinated with a decorative pointer and arc. Missing, withheld and questionnaire-only ages remain em dashes.
- Body and actions: 11–13 px, with explicit instructions and readable error text.
- Tiny engraved metadata is decorative/redundant; essential values, warnings and instructions are never communicated only in tiny type.
- Spacing: 4, 8, 12, 16, 24 and 32 px.
- App surfaces: 12–22 px radius; inputs and compact options: 8–9 px.
- Primary mobile actions: 42–44 px high; tabs retain compact labels and generous hit areas.
- Theme picker: original minimal icon/name/check format, three rows, no swatches or subtitles. The header icon reflects the selection.
- Header language control: compact EN/БГ text within a 40 px hit area. It replaces the duplicated Account shortcut, while Account stays in the main navigation.

`public/styles.css` retains the base palette and existing controls. `public/themes.css` defines named palettes and the transition boundary. `public/app-screens.css` supplies the shared app canvas and screen components. `public/ui-components.mjs` provides result, library and account templates. `public/flow-ui.mjs` owns guided question and lab presentation without changing the scientific model.

## Liquid paint transition

Theme transitions reveal incoming material at full opacity along a gently curved liquid edge on each visible atomic component. The old and new material share complementary, slightly overlapping masks so the page is covered throughout the transition. Duration is 980 ms, with bounded 0–72 ms component timing differences. Layout, bounds, text and controls do not translate, scale, bounce, skew, blur or flash-fade.

Captures include each surface together with its decorative art; images never get an independent transition snapshot or SVG displacement filter. That avoids the opaque black squares seen around the former moon/DNA image captures. Snapshot groups keep fixed bounds, and each component's mask has a small independent contour. Root paint handles the canvas between components.

`public/theme-motion.mjs` provides pure polygon/keyframe helpers and visible component capture. `public/theme-system.mjs` owns saved preferences, initial paint, serial selection and cleanup. The latest rapid selection wins. A deadline releases stalled transitions. Reduced motion applies immediately; browsers without View Transitions use the normal palette update. All temporary names and animations are removed after completion.

`public/result-motion.mjs` animates only visual number copies and the calibration pointer. Accessible text retains the final age throughout. Incoming theme captures hold 00 until paint finishes, then the readout animates; repeated/rapid selections always release that hold. Initial rendering and app visibility restoration replay valid results. Reduced motion, backgrounding and printing settle immediately to the exact final display values. Animation never recalculates, changes, stores or transmits an assessment. Unsaved data remains in memory only. A returning profile's latest saved snapshot is fetched read-only after authentication; it never overwrites a current assessment or form entries.

## Accessibility, data and release wording

English and Bulgarian share the same layouts and canonical data. Bulgarian is edited as independent product copy, with natural, polite phrasing: “Начало”, “Моите анализи”, “Здравето ви отблизо” and “Какво означава резултатът”. “Анализ” names an app assessment; “оценка на възрастта” keeps its scientific meaning. [Localization guidance](design/LOCALIZATION.md) records the copy sources and checks. Switching language updates text and accessible labels in place, preserves entered values, choices, units and the current screen, and does not recalculate or transmit an assessment. Brand names, scientific identifiers and laboratory units remain canonical.

Labelled navigation is always available. State has text and symbols in addition to colour. Inputs have explicit labels and persistent values. Errors explain the relevant field and remain on the appropriate step. Consultation feedback appears only after Continue/Preview. Typing clears existing inline feedback without opening a native validation bubble; Enter advances the current step. The appearance menu supports keyboard navigation and Escape; dialogs retain focus containment. Long text can remain accessible through internal overflow rather than hard clipping.

The header holds the visible brand. The Overview eyebrow reads “Your health”; Account ends with “You choose what to save.” and a privacy glyph. Redundant lower brand labels and “Private prototype” are removed from the interface. Sample-result labels, educational limitations, private-library status and the beta/production copy review remain meaningful and explicit.

Clinical formulae, eligibility and collection gates, saved snapshot semantics, account ownership checks, encryption, consent and payment activation retain their existing contracts. This revision adds no personal-data transmission or account auto-creation.

Before beta and production, review prototype/test wording, claims, report explanation, privacy and native-app authentication copy using [PRODUCT_RELEASE_NOTES.md](PRODUCT_RELEASE_NOTES.md). Sample-data labels and scientific limitations remain explicit until there is a justified, reviewed replacement.

## Artwork provenance and archive

The original generated black-diamond material is documented in [design/BLACK_DIAMOND_ARTWORK.md](design/BLACK_DIAMOND_ARTWORK.md). Lunar/Bionic and archived assets retain their prompts and provenance in [design/THEME_ARTWORK.md](design/THEME_ARTWORK.md) and [design/ARTWORK.md](design/ARTWORK.md). The approved Assessment moon is recorded in [design/BLOOD_MOON_V2.md](design/BLOOD_MOON_V2.md). Earlier screen artwork is recorded in [design/SCREEN_ARTWORK.md](design/SCREEN_ARTWORK.md). Current silver, blue and branch edits are recorded with exact prompts in [design/SILVER_BLUE_AND_MOON.md](design/SILVER_BLUE_AND_MOON.md). Icons and layout remain code-native.

## Verification

Run `test-language.mjs` for copy-source/runtime parity, questionnaire and conditional finding coverage, numerical sentences, Bulgarian counts, preserved scientific identifiers and language preference startup; `test-app-flows.mjs` for forward/back conditional traversal, choice paging, lab error routing, record pagination and distinct guest/account/report states; `test-themes.mjs` for the default, migration, stable shared markup and full-opacity liquid masks; and `test-result-motion.mjs` for truthful empty/saved/sample/withheld states, immutable values, cancellation, repeated theme selection, reduced motion, reopening and print completion. Existing model, account and payment checks protect scientific calculations, consent, ownership and entitlements. TypeScript and a production build are required before publication. Browser checks cover phone viewport fit, retained field values across language changes, all three themes, report reading/printing, navigation and result animation.
