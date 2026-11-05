# Blood Moon / lunar portrait v2

Generated with the built-in `image_gen` tool on 5 November 2026, using `public/assets/blood-moon.webp` as the edit target. No CLI/API fallback was used. The original asset is retained.

- Generated source: `design/assets/blood-moon-v2-original.png`.
- App asset: `public/assets/blood-moon-v2.webp` (512 px, 35,726 bytes).
- Small app asset: `public/assets/blood-moon-v2-small.webp` (256 px, 12,222 bytes).
- The original generated PNG remains in the Codex generated-images folder. App resources are stored in this repository.

Generated alpha is preserved. Sharp performs only size/format conversion for WebP delivery; no creative retouching, compositing or background flattening is applied. All four outer-corner alpha values were verified as zero.

A bounded full disc beside the Assessment introduction and Report cover replaces Blood Moon's oversized/dashed CSS rings. Text has a reserved area, preventing artwork from covering labels. Screen geometry is shared across themes. The result atmosphere uses the same resource. Artwork stays inside its containing surface during theme paint, without isolated image snapshots.

Later screen-specific revision: this approved resource remains in Assessments. Overview and Reports now use distinct portraits documented in [SCREEN_ARTWORK.md](SCREEN_ARTWORK.md).

## Exact final prompt

Use case: precise-object-edit.
Asset type: a refined lunar cutout for the Blood Moon theme of an elegant life-science mobile application.
Input image 1 is the edit target: the existing red moon. Preserve one perfectly circular lunar disc, its copper-to-deep-garnet palette, and a transparent background.
Primary request: make the moon calmer, more natural and more premium. Refine the geological texture into delicate, physically plausible lunar maria and subtle regolith detail. Remove the impression of exaggerated lumpy crater pits and a harsh glowing edge. Use a restrained soft copper highlight along the upper-left limb, a velvety oxblood illuminated face, and a smooth charcoal-garnet shadow toward the lower-right. The complete circular silhouette must remain readable at 90–130 px.
Composition: one centered full disc with approximately 7% genuinely transparent breathing room around all sides. Crisp naturally anti-aliased outer edge. Photorealistic astronomical texture with editorial restraint, not a glossy metal sphere.
Constraints: only the moon; no orbit lines, rings, dotted circles, stars, flare, clouds, extra objects, text, interface, logos or watermark. Actual alpha transparency outside the disc; no black rectangle or checkerboard pattern baked into the asset.

