# English / Bulgarian product copy

Implemented 5 November 2026. The header EN/БГ button replaces the duplicated Account shortcut; Account remains in the main navigation. English is the initial language. A selected language persists locally under `kq-language-v1`; the boot script sets the document language before the app initializes. The setting adds no account or health-data transmission.

## Bulgarian voice

Write Bulgarian as product copy in its own right, not as a word-for-word reconstruction of English. Use short, grammatical sentences and a calm, approachable, polite plural voice. Pronouns remain lowercase in running interface copy. Use direct verbs for actions, plain explanations for errors and established terminology where precision matters.

| Meaning | Preferred Bulgarian |
| --- | --- |
| Overview | Начало |
| Assessment as an app record/flow | Анализ |
| Estimated age in scientific discussion | Оценка на възрастта |
| Result interpretation | Какво означава резултатът |
| Your age, in context | Здравето ви отблизо |
| Your input summary | Въведените от вас данни |
| Not sure | Не мога да преценя |
| Prefer not to say | Предпочитам да не отговарям |

Keep sample labels and scientific uncertainty explicit. Privacy, consent, deletion and purchase copy must retain the meaning of the English source. Avoid implying clinical validation or promising an exact biological age. Do not translate brand names, named clocks, scientific identifiers, author names, unit symbols, currency identifiers or the literal DELETE confirmation keyword. Preserve user-entered text and profile names.

## Sources and behavior

Editable copy is in `design/localization/*.tsv`, with English source and Bulgarian display text separated by one tab. Files cover shared screens, questions/options/hints, methods, reports, consent/privacy, account/purchase feedback and dynamically composed labels. Run `node scripts/build-locale.mjs` to rebuild `public/locales/bg.mjs`. The builder rejects missing and conflicting entries. The runtime currently contains 900 source phrases and arrow-free aliases.

`public/language-system.mjs` stores the original text and accessible attributes separately from translated display text. Switching back restores English; it does not rerender forms or call the scientific model. Native select values are fixed to their canonical source before option captions are translated. Input values, answer identifiers, saved records, units, prices and calculation inputs remain unchanged. Counter ticks are excluded from translation observation.

Consultation feedback remains inline and appears after Continue/Preview. Language switching and typing never trigger validation. Native form feedback is localized only after an explicit validation attempt, and is cleared on editing. Existing preview-only consultation behavior remains in place.

## Verification

`node test-language.mjs` checks copy-source/runtime parity, every model question/option/hint, laboratory labels, conditional findings and errors, composed age sentences, singular/plural saved counts, untouched scientific identifiers and persisted/blocked language preference startup. Native browser checks also cover English restoration, Bulgarian report chapters, selected questionnaire answers, Unicode input, numerical values and non-default measurement units across EN/БГ changes. Release review requirements remain in `PRODUCT_RELEASE_NOTES.md`.
