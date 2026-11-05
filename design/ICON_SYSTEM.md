# KoleQuant / Paired

Original code-native vector icon family, 5 November 2026. The authoritative geometry is `public/icons.mjs`, shared by the application shell, content, theme picker, dialogs and directional actions. No raster icon, external font, third-party icon library or superimposed DNA badge is used.

## Visual grammar

The revised family prioritizes complete silhouettes and continuous strokes at phone size. Complementary curves, paired inner readouts and the method glyph provide a restrained connection to genetics. Functional recognition takes precedence over a repeated decorative motif: arrows have a single stem and clear head, and familiar destinations retain their familiar outlines.

| Destination / role | Construction |
| --- | --- |
| Overview | Four complete rounded tiles forming a clear overview grid |
| Assessments | A complete clipboard with two readout lines |
| Reports | A continuous folded-corner document with paired inner lines |
| Account | A complete circular head and continuous shoulder arc |
| Health & lifestyle | A continuous pulse trace, without implying that genetics was measured |
| Blood entry | One complete droplet contour with a small reflection arc |
| Methods | Two complementary continuous curves connected by rungs |
| Consultation | A complete speech bubble with two response lines |
| Privacy | A complete shield and a clear check |
| Theme symbols | Complete diamond facets for Black Metal, a continuous crescent for Blood Moon and two bonded circles for Bionic |
| Forward / back / external | One uninterrupted stem and head. Back mirrors it; external rotates it. Dropdown uses a simple chevron |
| Reset | A continuous return arrow with one clear direction |
| About | A complete information circle |

These are interface symbols, not results or measured biological structures. Text labels remain the source of meaning.

## Construction and accessibility

- 24 × 24 view box; 2-unit stroke; round caps and joins.
- Bottom navigation uses 24 px icons, route glyphs 28 px, primary action arrows 22 px, secondary arrows 20 px, header symbols 22 px and picker symbols 21 px. Picker checks and chevrons are 14 px.
- Labels remain alongside navigation icons. The header account control is 40 × 40 px, picker rows at least 44 px high, and larger optical sizes do not change control ordering or theme geometry.
- `currentColor` follows theme tokens. Directional SVGs have a fixed box and cannot wrap below a label as the former Unicode arrows did.
- Icons are decorative (`aria-hidden`, non-focusable) inside labelled controls. An icon-only control has its own explicit accessible label.
- Legacy button/link strings are normalized to this same vector system after rendering. Body text, report values and scientific notation remain text.

## Black Metal / silver revision

The accent is platinum silver (`--accent: #cbd1dc`), with an illuminated result accent `#d9e1ee`. Black Metal primary controls use a polished charcoal gradient, cool white text, a silver contour and a restrained inset highlight. Result material stays black/graphite. Bionic uses metallic blue (`#2f6494`, result `#a5cbea`). Color remains a theme accent rather than a clinical severity.

The overview has a single aligned action row with a compact method link. Contact and Reset share one grouped settings surface with identical row height, icon placement and directional alignment.

The isolated decorative dot in the Assessment introduction is removed from the markup. The result dial uses a small solid calibration arrow in place of its former endpoint dot; it moves with the decorative arc during the counter reveal and does not encode a health score.

## Form feedback

Consultation uses inline, described errors on explicit Continue/Preview. Native validity flags remain authoritative for email syntax and required fields, but browser popovers are suppressed for this form. Typing/change clears that field's existing feedback without revalidating. Enter advances the current step; it does not jump directly to the final preview. Values remain in their original inputs when navigating back.
