# Silver, metallic blue and the corner moon

5 November 2026. All edits use the built-in `image_gen` tool, with actual alpha transparency. No CLI/API fallback was used. The previous assets remain in the repository. Sharp performs size/format conversion only, preserving generated alpha.

| Resource | Source | Delivery |
| --- | --- | --- |
| Black Metal / Reports | `design/assets/black-metal-report-v2-original.png` | `public/assets/black-metal-report-v2.webp` (512 px), `public/assets/black-metal-report-v2-small.webp` (256 px) |
| Bionic / Reports | `design/assets/bionic-report-v3-original.png` | `public/assets/bionic-report-v3.webp` (512 px), `public/assets/bionic-report-v3-small.webp` (256 px) |
| Blood Moon / Overview | `design/assets/blood-moon-overview-v2-original.png` | `public/assets/blood-moon-overview-v2.webp` (512 px), `public/assets/blood-moon-overview-v2-small.webp` (256 px) |

Black Metal changes the warm bevel to platinum silver. Bionic preserves the mechanical sculpture and replaces warm/purple details with metallic steel blue. Blood Moon preserves the lunar geology and adds a few fine bare branches, inspired by the user's supplied moon photograph. That photograph is a reference only and is not bundled into the app.

The Overview moon is intentionally cropped by the result card's upper-right corner. The central readout remains clear. Assessments and Reports retain their distinct lunar portraits. Images remain inside their parent surface during the liquid transition; no isolated image snapshots or opaque backdrops are introduced.

## Exact final prompt set

### black-metal-report-v2

Use case: precise-object-edit.
Asset type: transparent Black Metal editorial specimen for an elegant life-science application.
Input image 1 is the edit target. Preserve its exact dark sculptural silhouette, polished obsidian faces, exposed fine strata, orientation and transparent background.
Change only the warm copper/orange bevel and warm reflections into a cool platinum-silver sheen. A sharply defined silver-white edge, nuanced graphite, dark polished metal and physically convincing white softbox reflections. No orange, copper, gold or warm accent remains. Keep the object dark, sculptural, subtle and luxurious, not chrome all over.
Preserve the complete object and clear alpha padding. Clean anti-aliased edges. No backdrop, floor, shadow plane, text, logo, extra objects, UI or watermark.

### bionic-report-v3

Use case: precise-object-edit.
Asset type: transparent Bionic editorial specimen for a premium life-science application, now with metallic blue accents.
Input image 1 is the edit target. Preserve the ivory porcelain outer skin, sculptural silhouette, titanium lamellae, visible circular mechanical actuator, engineered inner core and transparent background.
Replace the purple enamel channels and copper/orange reflections with refined metallic steel-blue and cool cobalt-blue details. Titanium ribs stay platinum. Inner machinery stays dark graphite with small cold-blue reflections. Keep a quiet, luxurious engineered material finish; no neon, electric glow or saturated plastic.
Remove any disconnected stray specks around the exterior edge. Keep one complete coherent object with transparent breathing room and actual alpha. No human, face, text, logo, backdrop, floor shadow, extra props, UI or watermark.

### blood-moon-overview-v2

Use case: precise-object-edit.
Asset type: transparent Blood Moon corner artwork for an elegant life-science mobile application's result card.
Input image 1 is the edit target: preserve the refined copper/garnet lunar portrait and delicate natural geology.
Input image 2 is a composition/mood reference only: a red moon seen through bare fine branches. Do not copy its sky or crowded foreground.
Primary edit: add just three or four beautifully fine dark charcoal bare twigs, with a few delicate secondary forks, crossing the lower-left quarter of the moon. They should feel like a restrained natural silhouette, elegant and airy, not a forest. Let one slender twig extend slightly outside the lower-left lunar silhouette into the transparent margin.
Composition: a complete large moon occupying about 78% of a square canvas, its top-right quadrant clear. The app will intentionally crop the moon against the upper-right corner of a card, while the fine branches should remain visible across its lower-left rim. Maintain ample genuine transparent margin outside the artwork, no baked background.
Lighting/palette: a muted copper highlight, rich oxblood lunar face, subtle garnet shadow, graphite-black twig silhouettes. Quiet premium editorial astronomy, no fantasy effects.
Constraints: actual alpha transparency; no sky, purple backdrop, checkerboard, stars, fog, dense tree, leaves, flowers, neon halo, drawn orbit circles, text, interface, logos, extra objects or watermark.

