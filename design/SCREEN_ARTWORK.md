# Distinct screen artwork / 5 November 2026

Generated with the built-in `image_gen` tool. No CLI/API fallback was used. Existing selected Assessment artwork is retained. New artwork replaces the generic large document symbol on Reports while preserving the shared cover layout.

| Screen / theme | App resource | Original |
| --- | --- | --- |
| Overview / Blood Moon | `public/assets/blood-moon-overview-v1.webp` | `design/assets/blood-moon-overview-v1-original.png` |
| Reports / Blood Moon | `public/assets/blood-moon-report-v1.webp` | `design/assets/blood-moon-report-v1-original.png` |
| Reports / Black Metal | `public/assets/black-metal-report-v1.webp` | `design/assets/black-metal-report-v1-original.png` |
| Reports / Bionic | `public/assets/bionic-report-v2.webp` | `design/assets/bionic-report-v2-original.png` |

Each app resource is 512 px with a corresponding `-small.webp` 256 px variant. Sharp performs size/format conversion only; the generated alpha is preserved. All source images have alpha; the Overview source corners measure 0, 0, 1, 0 out of 255 and the other selected source corners are zero. The original generated files also remain in the Codex generated-images folder.

The first Bionic shell study is retained in `design/assets/bionic-report-v1-original.png`, with its WebPs in the theme archive. The selected v2 edit uses that study as the target. The user's supplied Bionic cover is a mood reference for a pristine exterior revealing intricate machinery, not an app asset or a copied portrait/cover composition. No text or identifiable person from that reference is used.

Overview's complete moon sits inside the existing dial, with no clipping mask across the disc. Assessments keeps the approved v2 shadowed moon. Reports shows a separate occultation. Generated material specimens occupy the same fixed report art well in all themes. Artwork remains decorative, labelled controls remain native, and transition capture includes each image inside its containing surface.

## Exact prompt set

### black-metal-report

Use case: stylized-concept.
Asset type: transparent editorial sculpture for the Reports cover of a premium life-science mobile app, Black Metal theme.
Primary request: one distinctive precision-cut obsidian section specimen, like a sculptural black diamond core seen in three-quarter view. A compact asymmetric vertical monolith with a few broad, highly polished graphite faces, a deep black concave cut revealing fine parallel strata, and one restrained fiery copper-orange bevel. Architectural, materially convincing, elegant scientific luxury.
Composition: the entire object centered, upright but gently tilted, occupying 76% of a square canvas, generous real transparent padding. Strong clear silhouette that reads at 105–140 px. The object must stay dark yet readable on charcoal #141315.
Lighting: controlled softbox white reflections, one subtle warm edge reflection, no neon glow.
Materials: polished black diamond and satin graphite, crisp machined bevels, delicate physical microtexture.
Constraints: actual alpha transparency, no backdrop, no ground plane or floor shadow; no document, paper, page, pictogram, logo, UI, text, letters, numbers, chrome blobs, orbital circles, stars, plant or DNA helix. Not flat clipart. One object, no extra props, no watermark.

### bionic-report

Use case: stylized-concept.
Asset type: transparent editorial sculpture for the Reports cover of a premium life-science mobile app, Bionic theme on warm porcelain #efeeea.
Primary request: one abstract bionic specimen, a beautifully engineered asymmetric open shell where a smooth ivory porcelain outer skin peels into six fine curved titanium lamellae around a smoky hollow core. The interior has a delicate bone-like trabecular structure, designed as a coherent anatomical material rather than decoration. A small muted terracotta reflection inside the cavity ties it to the theme.
Composition: complete compact sculpture centered in a square image, three-quarter macro view, oblique oval silhouette, 75% canvas coverage with truly transparent padding. It needs an understandable strong material silhouette at 105–140 px; keep spaces between ribs clear and avoid fussy mesh.
Lighting: soft museum-quality product lighting, porcelain highlights, satin titanium and deep warm shadows. Sculptural, quiet, precise, elite editorial life-science aesthetic.
Constraints: actual alpha transparency; no backdrop, floor, shadow plane, document, paper, page, pictogram, logo, interface, text, circles drawn behind it, leaves, flowers, garden, robot head, literal DNA spiral, wires, neon effects, random chrome blob or watermark. One coherent object, not flat illustration.

### blood-moon-report

Use case: stylized-concept.
Asset type: transparent lunar editorial artwork for the Reports cover of a premium life-science mobile app, Blood Moon theme.
Primary request: a refined near-total lunar occultation, visually distinct from an ordinary full red moon. One quiet charcoal-garnet spherical silhouette, with a very slender, beautifully illuminated warm copper crescent along its upper-left edge and a tiny soft red reflected limb below. Subtle lunar regolith on the lit sliver, the rest velvety and almost black. A luxury astronomical portrait, restrained and natural.
Composition: one complete circular silhouette centered in a square canvas, 80% canvas coverage, generous genuinely transparent margin. Let the lit crescent read clearly at 105–140 px. The silhouette is complete, never cut off.
Lighting: a fine copper grazing light, no blazing corona or lens flare. Copper, oxblood and charcoal only.
Constraints: actual alpha transparency outside the disc; no black rectangle, background, baked checkerboard, stars, planets, orbit lines, document, paper, logo, text, interface, extra props or watermark. Do not make a bright orange neon ring or a second normal full moon.

### blood-moon-overview

Use case: photorealistic-natural.
Asset type: transparent full lunar disc for the Overview result instrument of an elegant Blood Moon life-science application.
Primary request: a fully visible luminous blood moon, a complete circular disc photographed almost frontally, with at least 90% of its face lit. Rich matte red-copper surface with natural, fine lunar maria and subtle crater geology; a gentle copper highlight in the upper-left and velvety dark garnet on the lower-right. More luminous and frontal than a half-shadow assessment moon, still quiet and premium. Physically grounded astronomy with editorial restraint.
Composition: one full centered circular disc occupying 84% of a square canvas, real transparent breathing space on all sides. Its full silhouette should read as a beautiful whole moon at 90–160 px on a near-black surface.
Lighting: softly even frontal astronomical illumination, no harsh metallic sheen, neon halo, overdone crater holes, exaggerated bumpiness or cheap fantasy glow.
Constraints: actual alpha transparency outside the disc; no black background, checkerboard, stars, orbit lines, text, graphics, UI, extra objects or watermark. Only one natural moon.

### bionic-report-v2 / reference-led edit

Use case: precise-object-edit.
Asset type: a distinctive transparent bionic material specimen for a premium life-science mobile app, displayed at 110–150 px on a warm ivory Reports cover.
Input image 1: edit target, the generated porcelain/titanium open shell. Preserve the compact sculptural silhouette, ivory outer skin, fine curved structural lamellae and genuine alpha transparency.
Input image 2: mood/reference only. Take the idea of a pristine outer surface revealing an intricate biomechanical interior, and restrained cool jewel accents inside dark precision machinery. Do not copy the person, face, pose, cover composition, lettering or identifiable artwork.
Primary edit: transform the spongy bone interior of image 1 into an elegant, intentionally engineered biomechanical core. Inside the shell reveal one clearly legible recessed circular titanium actuator, a few interlocking graphite micro-components, fine articulated ribs and a small number of clean routing channels. Integrate this core into the organic form, rather than covering it with random machinery.
Materials: smooth ivory ceramic outside, brushed platinum/titanium ribs, dark graphite inner surfaces, extremely restrained amethyst enamel and a tiny warm copper glint deep inside. Mechanical precision meets living structure. Crisp, sculptural, quiet and luxurious; a convincing macro product photograph.
Composition: one complete compact three-quarter sculpture, centered with transparent breathing room on every edge. Clarify the core enough to read at small UI size; avoid a tangled heap of tiny details.
Constraints: actual alpha transparency; no background or floor shadow, human, portrait, face, eye, lips, text, logo, document/page icon, garden, leaves, literal DNA helix, chrome blob, neon lighting, random wires, additional props or watermark. Keep only one coherent abstract bionic specimen.

